/**
 * Secure ZK Age Verification Implementation with MiMC7 and SHA256
 *
 * This file contains functions that simulate the flow between:
 * 1. Service Provider (requesting age verification)
 * 2. Government (issuing credentials)
 * 3. User Agent/Extension (generating ZK proof)
 */

const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const {
    generateGovernmentKeyPair,
    issueGovernmentCredential,
    verifySignature,
    verifyCommitment
} = require('./secure_utils');

// Constants
const CIRCUIT_WASM_PATH = path.join(__dirname, 'secure_age_verification_js', 'secure_age_verification_js', 'secure_age_verification.wasm');
const CIRCUIT_ZKEY_PATH = path.join(__dirname, 'secure_age_verification.zkey');
const VERIFICATION_KEY_PATH = path.join(__dirname, 'secure_age_verification_verification_key.json');

// Mock user database (for simulation purposes)
const USERS = {
    'user1': { age: 25 }, // Over 18
    'user2': { age: 16 }, // Under 18
    'user3': { age: 18 }, // Exactly 18
    'user4': { age: 65 }, // Senior
    'user5': { age: 0 },  // Edge case: age 0
    'nonExistentUser': null // Will be used to test non-existent user
};

// Generate government key pair (in a real system, this would be done once and stored securely)
let GOVERNMENT_KEYS;

// Initialize government keys
async function initGovernmentKeys() {
    if (!GOVERNMENT_KEYS) {
        GOVERNMENT_KEYS = await generateGovernmentKeyPair();
    }
    return GOVERNMENT_KEYS;
}

// Store issued credentials (in a real system, this would be a database)
const ISSUED_CREDENTIALS = {};

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
 * Simulates the government issuing a credential
 */
async function mockGovernmentCredentialIssuer(userId) {
    console.log(`Government: Received credential request for user ${userId}`);

    try {
        if (!USERS[userId] || USERS[userId] === null) {
            console.log(`Government: User ${userId} not found or has no data`);
            return { error: 'User not found or has no data' };
        }

        // Ensure government keys are initialized
        const keys = await initGovernmentKeys();

        const userAge = USERS[userId].age;
        console.log(`Government: Creating credential for age ${userAge}`);

        // Issue the credential
        const credential = await issueGovernmentCredential(
            userId,
            userAge,
            keys.privateKey,
            keys.publicKey
        );

        // Store the credential
        ISSUED_CREDENTIALS[userId] = credential;

        console.log('Government: Successfully created credential');
        console.log(`Government: Issued credential for user ${userId} with age ${userAge}`);

        return { credential };
    } catch (error) {
        console.error('Government: Error issuing credential', error);
        return { error: 'Failed to issue credential' };
    }
}

/**
 * Simulates the user agent generating a ZK proof
 */
async function mockUserAgentProofGenerator(userId, ageRequirement) {
    console.log('User Agent: Generating ZK proof');

    try {
        // Get the credential
        const credential = ISSUED_CREDENTIALS[userId];
        if (!credential) {
            console.log(`User Agent: No credential found for user ${userId}`);
            return { error: 'No credential found' };
        }

        console.log('User Agent: Preparing inputs for ZK proof');
        console.log(`User Agent: Age requirement: ${ageRequirement}`);
        console.log(`User Agent: User age: ${credential.age}`);

        // Prepare inputs for the ZK circuit
        const circuitInputs = {
            ageRequirement,
            commitment: credential.commitment,
            governmentPublicKey: credential.publicKey,
            userAge: credential.age,
            blindingFactor: credential.blindingFactor,
            signature: credential.signature,
            nonce: credential.nonce
        };

        console.log('User Agent: Calling snarkjs.groth16.fullProve with circuit inputs');

        // Generate the proof
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
                userId,
                meetsAgeRequirement: credential.age >= ageRequirement
            }
        };
    } catch (error) {
        console.error('User Agent: Error generating proof', error);
        console.error('Circuit inputs:', {
            ageRequirement,
            commitment: ISSUED_CREDENTIALS[userId]?.commitment,
            governmentPublicKey: ISSUED_CREDENTIALS[userId]?.publicKey,
            userAge: "[REDACTED]",
            blindingFactor: "[REDACTED]",
            signature: "[REDACTED]",
            nonce: "[REDACTED]"
        });
        return { error: 'Failed to generate proof: ' + error.message };
    }
}

/**
 * Simulates the service provider verifying the ZK proof
 */
async function mockServiceProviderVerifier(proof, publicSignals, ageRequirement) {
    console.log('Service Provider: Verifying ZK proof');

    try {
        // Load verification key
        const vkey = JSON.parse(fs.readFileSync(VERIFICATION_KEY_PATH, 'utf8'));

        // Verify SNARK proof
        let proofValid = false;
        try {
            proofValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
        } catch (e) {
            console.error('Service Provider: Error during SNARK verification', e);
            return false;
        }

        console.log('Public Signals:', publicSignals);
        console.log('Is Verified:', proofValid);

        // The public signals are:
        // [0] - isVerified (1 if age requirement met, 0 if not)
        // [1] - ageRequirement
        // [2] - commitment
        // [3] - governmentPublicKey
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

        console.log('Service Provider: Verification successful - Age requirement met and credential valid');
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

    // Step 2: Government issues credential
    console.log('\n--- Step 2: Government issues credential ---');
    const { credential, error: credentialError } = await mockGovernmentCredentialIssuer(userId);
    if (credentialError) {
        console.log(`Verification flow failed: ${credentialError}`);
        return { success: false, error: credentialError };
    }

    // Step 3: User agent generates a ZK proof
    console.log('\n--- Step 3: User agent generates ZK proof ---');
    const { proof, publicSignals, metadata, error: proofError } =
        await mockUserAgentProofGenerator(userId, ageRequirement);
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

        if (isVerified !== metadata.meetsAgeRequirement) {
            console.log('WARNING: Verification result does not match expected result!');
            console.log('This may indicate an issue with the circuit or the proof generation.');
        }
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
    mockGovernmentCredentialIssuer,
    mockUserAgentProofGenerator,
    mockServiceProviderVerifier,
    runFullVerificationFlow,
    initGovernmentKeys
};
