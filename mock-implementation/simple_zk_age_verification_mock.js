/**
 * Simple ZK Age Verification Implementation
 *
 * This file contains functions that simulate the flow between:
 * 1. Service Provider (requesting age verification)
 * 2. User Agent/Extension (generating ZK proof)
 */

const snarkjs = require('snarkjs');
const fs = require('fs');

// Constants
const CIRCUIT_WASM_PATH = './simple_age_verification_js/simple_age_verification.wasm';
const CIRCUIT_ZKEY_PATH = './simple_age_verification.zkey';

// Mock user database (for simulation purposes)
const USERS = {
    'user1': { age: 25 }, // Over 18
    'user2': { age: 16 }, // Under 18
    'user3': { age: 18 }, // Exactly 18
    'user4': { age: 65 }, // Senior
    'user5': { age: 0 },  // Edge case: age 0
    'user6': { age: 120 }, // Edge case: very old
    'nonExistentUser': null // Will be used to test non-existent user
};

/**
 * Simulates a service provider initiating an age verification request
 */
function mockServiceProviderRequest(customAgeRequirement = null) {
    console.log('Service Provider: Initiating age verification request');

    // Set the age requirement
    let ageRequirement = customAgeRequirement !== null ? customAgeRequirement : 18;
    // Clamp negative age requirement
    if (ageRequirement < 0) {
        console.warn('Service Provider: Negative age requirement received, defaulting to 0');
        ageRequirement = 0;
    }

    console.log(`Service Provider: Set age requirement to ${ageRequirement}`);
    return { ageRequirement };
}

/**
 * Simulates the user agent generating a ZK proof
 */
async function mockUserAgentProofGenerator(userId, ageRequirement) {
    console.log('User Agent: Generating ZK proof');

    try {
        if (!USERS[userId] || USERS[userId] === null) {
            console.log(`User Agent: User ${userId} not found or has no data`);
            return { error: 'User not found or has no data' };
        }

        const userAge = USERS[userId].age;

        // Prepare inputs for the ZK circuit
        const circuitInputs = {
            ageRequirement,
            userAge
        };

        console.log('User Agent: Preparing inputs for ZK proof');

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            circuitInputs,
            CIRCUIT_WASM_PATH,
            CIRCUIT_ZKEY_PATH
        );

        console.log('User Agent: Generated ZK proof');
        return {
            proof,
            publicSignals,
            metadata: {
                userId,
                meetsAgeRequirement: userAge >= ageRequirement
            }
        };
    } catch (error) {
        console.error('User Agent: Error generating proof', error);
        return { error: 'Failed to generate proof' };
    }
}

/**
 * Simulates the service provider verifying the ZK proof
 */
async function mockServiceProviderVerifier(proof, publicSignals, ageRequirement) {
    console.log('Service Provider: Verifying ZK proof');

    try {
        // Load verification key
        const vkeyPath = './simple_age_verification_verification_key.json';
        const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));

        // Verify SNARK proof
        let proofValid = false;
        try {
            proofValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
        } catch (e) {
            console.error('Service Provider: Error during SNARK verification', e);
            return false;
        }

        // The public signals are in reverse order from what we expected
        // The first signal is isVerified (1 if valid, 0 if invalid)
        // The second signal is the age requirement
        const isVerified = publicSignals[0] === '1';
        const providedAgeReq = parseInt(publicSignals[1]);

        console.log('Public Signals:', publicSignals);
        console.log('Provided Age Requirement:', providedAgeReq, 'Expected:', ageRequirement);
        console.log('Is Verified:', isVerified);

        if (!proofValid) {
            console.log('Service Provider: Proof verification failed');
            return false;
        }
        if (providedAgeReq !== ageRequirement) {
            console.log('Service Provider: Age requirement mismatch');
            return false;
        }
        if (!isVerified) {
            console.log('Service Provider: Proof valid but requirements not met');
            return false;
        }

        console.log('Service Provider: Verification successful - Age requirement met');
        return true;
    } catch (error) {
        console.error('Service Provider: Error verifying proof', error);
        return false;
    }
}

/**
 * Runs the full verification flow from request to verification
 */
async function runFullVerificationFlow(userId, customAgeRequirement = null) {
    console.log(`\n=== Starting verification flow for user ${userId} ===\n`);

    // Step 1: Service provider initiates a request
    const { ageRequirement } = mockServiceProviderRequest(customAgeRequirement);

    // Step 2: User agent generates a ZK proof
    const { proof, publicSignals, metadata, error: proofError } =
        await mockUserAgentProofGenerator(userId, ageRequirement);
    if (proofError) {
        console.log(`Verification flow failed: ${proofError}`);
        return { success: false, error: proofError };
    }

    // Step 3: Service provider verifies the proof
    const isVerified = await mockServiceProviderVerifier(proof, publicSignals, ageRequirement);

    console.log(`\n=== Verification flow completed for user ${userId} ===`);
    if (USERS[userId] && USERS[userId] !== null) {
        console.log(`Actual age: ${USERS[userId].age}, Required age: ${ageRequirement}`);
        console.log(`Verification result: ${isVerified ? 'PASSED' : 'FAILED'}`);
        console.log(`Expected result: ${metadata.meetsAgeRequirement ? 'PASSED' : 'FAILED'}`);
    }

    return {
        success: isVerified,
        ageRequirement,
        userAge: USERS[userId] && USERS[userId] !== null ? USERS[userId].age : null,
        expectedResult: metadata ? metadata.meetsAgeRequirement : false
    };
}

module.exports = {
    mockServiceProviderRequest,
    mockUserAgentProofGenerator,
    mockServiceProviderVerifier,
    runFullVerificationFlow
};

// Run a test if directly executed
if (require.main === module) {
    runFullVerificationFlow('user1', 18).catch(console.error);
}
