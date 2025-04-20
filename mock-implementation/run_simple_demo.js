/**
 * Simple ZK Age Verification Demo
 *
 * This script demonstrates the simplified age verification flow without EdDSA.
 * It runs several test cases to verify different age scenarios.
 */

const fs = require('fs');
const snarkjs = require('snarkjs');
const path = require('path');

// Constants
const CIRCUIT_WASM_PATH = path.join(__dirname, 'simple_age_verification_js', 'simple_age_verification.wasm');
const CIRCUIT_ZKEY_PATH = path.join(__dirname, 'simple_age_verification.zkey');
const VERIFICATION_KEY_PATH = path.join(__dirname, 'simple_age_verification_verification_key.json');

// Mock user database
const USERS = {
    user1: { age: 25, name: 'Alice' },
    user2: { age: 16, name: 'Bob' },
    user3: { age: 18, name: 'Charlie' },
    user4: { age: 65, name: 'David' }
};

/**
 * Generate a ZK proof for age verification
 */
async function generateAgeProof(userId, ageRequirement) {
    console.log(`Generating proof for user ${userId} with age requirement ${ageRequirement}`);

    try {
        // Check if the user exists
        if (!USERS[userId]) {
            throw new Error(`User ${userId} not found`);
        }

        // Check if the circuit files exist
        if (!fs.existsSync(CIRCUIT_WASM_PATH)) {
            throw new Error(`Circuit WASM file not found at ${CIRCUIT_WASM_PATH}`);
        }
        if (!fs.existsSync(CIRCUIT_ZKEY_PATH)) {
            throw new Error(`Circuit zkey file not found at ${CIRCUIT_ZKEY_PATH}`);
        }

        // Prepare inputs for the ZK circuit
        const circuitInputs = {
            ageRequirement,
            userAge: USERS[userId].age
        };

        console.log('Circuit inputs:', circuitInputs);

        // Generate the proof
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            circuitInputs,
            CIRCUIT_WASM_PATH,
            CIRCUIT_ZKEY_PATH
        );

        console.log('Proof generated successfully');
        console.log('Public signals:', publicSignals);

        return {
            proof,
            publicSignals,
            metadata: {
                userId,
                meetsAgeRequirement: USERS[userId].age >= ageRequirement
            }
        };
    } catch (error) {
        console.error('Error generating proof:', error);
        return { error: error.message };
    }
}

/**
 * Verify a ZK proof
 */
async function verifyAgeProof(proof, publicSignals, ageRequirement) {
    console.log('Verifying proof');

    try {
        // Check if verification key exists
        if (!fs.existsSync(VERIFICATION_KEY_PATH)) {
            throw new Error(`Verification key not found at ${VERIFICATION_KEY_PATH}`);
        }

        // Load verification key
        const vkey = JSON.parse(fs.readFileSync(VERIFICATION_KEY_PATH, 'utf8'));

        // Verify the proof
        const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

        // The first public signal is isVerified (1 if valid, 0 if invalid)
        // The second public signal is the age requirement
        const isVerified = publicSignals[0] === '1';
        const providedAgeReq = Number(publicSignals[1]);

        if (!isValid) {
            console.log('Proof verification failed');
            return false;
        }
        if (providedAgeReq !== ageRequirement) {
            console.log(`Age requirement mismatch - Expected ${ageRequirement}, got ${providedAgeReq}`);
            return false;
        }

        console.log(`Verification result: ${isVerified ? 'PASSED' : 'FAILED'}`);
        return isVerified;
    } catch (error) {
        console.error('Error verifying proof:', error);
        return false;
    }
}

/**
 * Run a test case
 */
async function runTestCase(testCase) {
    console.log(`\n--- Test Case: ${testCase.name} ---`);

    try {
        // Generate the proof
        const { proof, publicSignals, metadata, error } = await generateAgeProof(testCase.userId, testCase.ageRequirement);

        if (error) {
            console.log(`Test failed: ${error}`);
            return false;
        }

        // Verify the proof
        const isVerified = await verifyAgeProof(proof, publicSignals, testCase.ageRequirement);

        // Determine if the test passed
        const testPassed = isVerified === testCase.expectedResult;

        console.log(`\nTest result: ${testPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
        console.log(`Expected verification result: ${testCase.expectedResult ? 'PASS' : 'FAIL'}`);
        console.log(`Actual verification result: ${isVerified ? 'PASS' : 'FAIL'}`);

        return testPassed;
    } catch (error) {
        console.error(`Error running test case:`, error);
        return false;
    }
}

/**
 * Run the demo
 */
async function runDemo() {
    console.log('\n=== Simple ZK Age Verification Demo ===\n');
    console.log('This demo demonstrates the simplified age verification flow without EdDSA signatures.');
    console.log('The system verifies that a user meets an age requirement without revealing their actual age.\n');

    // Define test cases
    const testCases = [
        { name: 'User over 18', userId: 'user1', ageRequirement: 18, expectedResult: true },
        { name: 'User under 18', userId: 'user2', ageRequirement: 18, expectedResult: false },
        { name: 'User exactly 18', userId: 'user3', ageRequirement: 18, expectedResult: true },
        { name: 'Custom age requirement (21+)', userId: 'user1', ageRequirement: 21, expectedResult: true },
        { name: 'Senior verification (65+)', userId: 'user4', ageRequirement: 65, expectedResult: true }
    ];

    // Run each test case
    let passedTests = 0;
    let failedTests = 0;

    for (const testCase of testCases) {
        const testPassed = await runTestCase(testCase);
        if (testPassed) {
            passedTests++;
        } else {
            failedTests++;
        }

        // Add a separator between test cases
        console.log('\n' + '='.repeat(50));
    }

    // Print summary
    console.log('\n=== Demo Summary ===');
    console.log(`Total tests: ${testCases.length}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);

    console.log('\n=== Demo Completed ===');
    console.log('The simple ZK age verification system has been demonstrated.');
    console.log('This implementation ensures privacy while maintaining verifiability.');
}

// Run the demo
runDemo().catch(error => {
    console.error('Demo failed with error:', error);
});
