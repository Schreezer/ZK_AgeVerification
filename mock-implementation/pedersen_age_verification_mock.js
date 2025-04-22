/**
 * ZK Age Verification Implementation with Pedersen Commitments
 *
 * This file contains functions that simulate the flow between:
 * 1. Service Provider (requesting age verification)
 * 2. User Agent/Extension (generating ZK proof)
 * 3. Government Identity Provider (issuing credentials)
 */

const jwt = require('jsonwebtoken');
const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const { createPedersenCommitment, verifyPedersenCommitment } = require('./pedersen_utils');

// Constants
// Secret key for JWT signing (in a real system, this would be securely stored)
const GOVERNMENT_SECRET_KEY = 'government-secret-key';

// Use path.join for cross-platform compatibility
const CIRCUIT_WASM_PATH = path.join(__dirname, 'mimc_age_verification_js', 'mimc_age_verification_js', 'mimc_age_verification.wasm');
const CIRCUIT_ZKEY_PATH = path.join(__dirname, 'mimc_age_verification.zkey');
const VERIFICATION_KEY_PATH = path.join(__dirname, 'mimc_age_verification_verification_key.json');

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
 * Simulates the government backend authenticating a user and issuing a credential
 */
async function mockGovernmentCredentialIssuer(userId) {
    console.log(`Government: Received credential request for user ${userId}`);

    if (!USERS[userId] || USERS[userId] === null) {
        console.log(`Government: User ${userId} not found or has no data`);
        return { error: 'User not found or has no data' };
    }

    const userAge = USERS[userId].age;

    try {
        // Create a Pedersen commitment to the user's age
        console.log(`Government: Creating Pedersen commitment for age ${userAge}`);
        const { commitment, blindingFactor } = await createPedersenCommitment(userAge);
        console.log(`Government: Successfully created Pedersen commitment`);

        // Create credential data
        const credential = {
            userId,
            age: userAge,
            commitment,
            blindingFactor: blindingFactor.toString(),
            issuedAt: Date.now()
        };

        // Sign the full credential with JWT for transport
        const signedCredential = jwt.sign(credential, GOVERNMENT_SECRET_KEY);

        console.log(`Government: Issued credential for user ${userId} with age ${userAge}`);
        return { signedCredential };
    } catch (error) {
        console.error(`Government: Error issuing credential for user ${userId}:`, error);
        return { error: `Failed to issue credential: ${error.message}` };
    }
}

/**
 * Simulates the browser extension generating a ZK proof
 */
async function mockUserAgentProofGenerator(signedCredential, ageRequirement) {
    console.log('User Agent: Generating ZK proof');

    try {
        // Decode the JWT to get the credential
        const credential = jwt.verify(signedCredential, GOVERNMENT_SECRET_KEY);

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
            commitment: credential.commitment,
            userAge: credential.age,
            blindingFactor: credential.blindingFactor
        };

        console.log('User Agent: Preparing inputs for ZK proof');
        console.log('User Agent: Age requirement:', ageRequirement);
        console.log('User Agent: User age:', credential.age);

        try {
            console.log('User Agent: Calling snarkjs.groth16.fullProve with circuit inputs');
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                circuitInputs,
                CIRCUIT_WASM_PATH,
                CIRCUIT_ZKEY_PATH
            );

            console.log('User Agent: Generated ZK proof successfully');
            console.log('User Agent: Public signals:', publicSignals);

            return {
                proof,
                publicSignals,
                metadata: {
                    userId: credential.userId,
                    meetsAgeRequirement: credential.age >= ageRequirement
                }
            };
        } catch (error) {
            console.error('User Agent: Error during proof generation:', error);

            // Log the input format for debugging (but redact the actual values for privacy)
            const debugInputs = {
                ...circuitInputs,
                userAge: '[REDACTED]',
                blindingFactor: '[REDACTED]'
            };
            console.log('Circuit inputs:', JSON.stringify(debugInputs, null, 2));

            throw new Error('Failed to generate proof with snarkjs');
        }
    } catch (error) {
        console.error('User Agent: Error generating proof', error);
        return { error: `Failed to generate proof: ${error.message}` };
    }
}

/**
 * Simulates the service provider verifying the ZK proof
 */
async function mockServiceProviderVerifier(proof, publicSignals, ageRequirement) {
    console.log('Service Provider: Verifying ZK proof');
    console.log('Public Signals:', publicSignals);

    try {
        // Check if verification key exists
        if (!fs.existsSync(VERIFICATION_KEY_PATH)) {
            throw new Error(`Verification key not found at ${VERIFICATION_KEY_PATH}`);
        }

        // Load verification key
        const vkey = JSON.parse(fs.readFileSync(VERIFICATION_KEY_PATH, 'utf8'));

        // Verify SNARK proof
        let proofValid = false;
        try {
            proofValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
            console.log('Is Verified:', proofValid);
        } catch (e) {
            console.error('Service Provider: Error during SNARK verification', e);
            return false;
        }

        // The public signals are:
        // [0] - isVerified (1 if age requirement met, 0 if not)
        // [1] - ageRequirement
        // [2] - commitment
        const isVerified = publicSignals[0] === '1';
        const providedAgeReq = Number(publicSignals[1]);

        console.log('Public signals interpretation:');
        console.log(`- isVerified: ${isVerified}`);
        console.log(`- ageRequirement: ${providedAgeReq}`);

        if (!proofValid) {
            console.log('Service Provider: Proof verification failed');
            return false;
        }
        if (providedAgeReq !== ageRequirement) {
            console.log(`Service Provider: Age requirement mismatch - Expected ${ageRequirement}, got ${providedAgeReq}`);
            return false;
        }
        if (!isVerified) {
            console.log('Service Provider: Proof valid but age requirement not met');
            return false;
        }

        console.log('Service Provider: Verification successful - Age requirement met and commitment valid');
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

    try {
        // Step 1: Service provider initiates a request
        const { ageRequirement } = mockServiceProviderRequest(customAgeRequirement);

        // Step 2: User agent requests credential from government
        console.log('\n--- Step 2: Government issues credential ---');
        const { signedCredential, error: govError } = await mockGovernmentCredentialIssuer(userId);
        if (govError) {
            console.log(`Verification flow failed: ${govError}`);
            return { success: false, error: govError };
        }

        // Step 3: User agent generates a ZK proof
        console.log('\n--- Step 3: User agent generates ZK proof ---');
        const { proof, publicSignals, metadata, error: proofError } =
            await mockUserAgentProofGenerator(signedCredential, ageRequirement);
        if (proofError) {
            console.log(`Verification flow failed: ${proofError}`);
            return { success: false, error: proofError };
        }

        // Step 4: Service provider verifies the proof
        console.log('\n--- Step 4: Service provider verifies proof ---');
        const isVerified = await mockServiceProviderVerifier(proof, publicSignals, ageRequirement);

        console.log(`\n=== Verification flow completed for user ${userId} ===`);
        if (USERS[userId] && USERS[userId] !== null) {
            console.log(`Actual age: ${USERS[userId].age}, Required age: ${ageRequirement}`);
            console.log(`Verification result: ${isVerified ? 'PASSED' : 'FAILED'}`);
            console.log(`Expected result: ${metadata.meetsAgeRequirement ? 'PASSED' : 'FAILED'}`);

            // Check if the result matches the expected result
            if (isVerified !== metadata.meetsAgeRequirement) {
                console.warn('WARNING: Verification result does not match expected result!');
                console.warn('This may indicate an issue with the circuit or the proof generation.');
            }
        }

        return {
            success: isVerified,
            ageRequirement,
            userAge: USERS[userId] && USERS[userId] !== null ? USERS[userId].age : null,
            expectedResult: metadata ? metadata.meetsAgeRequirement : false
        };
    } catch (error) {
        console.error('Error in verification flow:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    mockServiceProviderRequest,
    mockGovernmentCredentialIssuer,
    mockUserAgentProofGenerator,
    mockServiceProviderVerifier,
    runFullVerificationFlow
};
