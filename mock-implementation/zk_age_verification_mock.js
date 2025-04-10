/**
 * ZK Age Verification Mock Implementation
 *
 * This file contains mock functions that simulate the flow between:
 * 1. Service Provider (requesting age verification)
 * 2. User Agent/Extension (generating ZK proof)
 * 3. Government Identity Provider (issuing credentials)
 */

const jwt = require('jsonwebtoken');
const snarkjs = require('snarkjs');
const fs = require('fs');
const crypto = require('crypto');

// Constants
const GOVERNMENT_SECRET_KEY = 'government-secret-key'; // In a real system, this would be securely stored
const CIRCUIT_WASM_PATH = './age_verification_js/age_verification.wasm'; // Will be generated from the circuit
const CIRCUIT_ZKEY_PATH = './age_verification_js/age_verification_final.zkey'; // Will be generated from the circuit

// P-384 Parameters (mock values for demonstration)
const P384_MOCK = {
  // Mock public key - in real implementation would be actual P-384 key
  // Each coordinate split into 8 limbs of 48 bits each
  publicKey: {
    x: Array(8).fill(0).map((_, i) => BigInt(i + 1)), // [1n, 2n, 3n, ..., 8n]
    y: Array(8).fill(0).map((_, i) => BigInt(i + 9))  // [9n, 10n, 11n, ..., 16n]
  }
};

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
 * Generate a mock P-384 ECDSA signature
 * In a real implementation, this would use actual P-384 ECDSA
 */
function generateMockP384Signature(message) {
  const hash = crypto.createHash('sha384').update(message).digest();
  
  // Convert hash to BigInt array (8 limbs of 48 bits each)
  const hashLimbs = Array(8).fill(0).map((_, i) => {
    const start = i * 6; // 6 bytes = 48 bits
    const slice = hash.slice(start, start + 6);
    // Pad with zeros if needed
    const padded = Buffer.concat([slice, Buffer.alloc(6 - slice.length)]);
    return BigInt('0x' + padded.toString('hex'));
  });

  // Generate deterministic but mock R and S values
  const r = hashLimbs.map(h => h + BigInt(1)); // R = hash + 1 for each limb
  const s = hashLimbs.map(h => h + BigInt(2)); // S = hash + 2 for each limb

  return { r, s, msgHash: hashLimbs };
}

/**
 * Simulates a service provider initiating an age verification request
 */
function mockServiceProviderRequest(customAgeRequirement = null) {
  console.log('Service Provider: Initiating age verification request');

  // Generate a random 384-bit nonce (48 bytes)
  const nonceBuffer = crypto.randomBytes(48);
  
  // Split nonce into 8 limbs of 48 bits each
  const nonce = Array(8).fill(0).map((_, i) => {
    const start = i * 6; // 6 bytes = 48 bits
    const slice = nonceBuffer.slice(start, start + 6);
    return BigInt('0x' + slice.toString('hex'));
  });

  // Set the age requirement
  const ageRequirement = customAgeRequirement !== null ? customAgeRequirement : 18;

  console.log(`Service Provider: Generated nonce and age requirement ${ageRequirement}`);
  return { nonce, ageRequirement };
}

/**
 * Simulates the government backend authenticating a user and issuing a credential
 */
function mockGovernmentCredentialIssuer(userId) {
  console.log(`Government: Received credential request for user ${userId}`);

  if (!USERS[userId] || USERS[userId] === null) {
    console.log(`Government: User ${userId} not found or has no data`);
    return { error: 'User not found or has no data' };
  }

  const userAge = USERS[userId].age;
  
  // Create credential data
  const credentialData = {
    userId,
    age: userAge,
    issuedAt: Date.now()
  };

  // Generate mock P-384 signature
  const message = JSON.stringify(credentialData);
  const signature = generateMockP384Signature(message);

  // Create the full credential
  const credential = {
    ...credentialData,
    signature: {
      r: signature.r.map(n => n.toString()),
      s: signature.s.map(n => n.toString()),
      msgHash: signature.msgHash.map(n => n.toString())
    }
  };

  // Sign the full credential with JWT for transport
  const signedCredential = jwt.sign(credential, GOVERNMENT_SECRET_KEY);

  console.log(`Government: Issued credential for user ${userId} with age ${userAge}`);
  return { signedCredential };
}

/**
 * Simulates the browser extension generating a ZK proof
 */
async function mockUserAgentProofGenerator(signedCredential, nonce, ageRequirement) {
  console.log('User Agent: Generating ZK proof');

  try {
    // Decode the JWT to get the credential
    const credential = jwt.verify(signedCredential, GOVERNMENT_SECRET_KEY);

    // Prepare inputs for the ZK circuit
    const circuitInputs = {
      // Public inputs
      ageRequirement,
      nonce: nonce.map(n => n.toString()),
      govtPubKey: [
        P384_MOCK.publicKey.x.map(n => n.toString()),
        P384_MOCK.publicKey.y.map(n => n.toString())
      ],
      
      // Private inputs
      userAge: credential.age,
      credentialHash: credential.signature.msgHash,
      signatureR: credential.signature.r,
      signatureS: credential.signature.s
    };

    console.log('User Agent: Preparing inputs for ZK proof');

    // In a real implementation, we would use snarkjs to generate the proof
    // For this mock, we'll create a simulated proof structure
    
    // Create deterministic but obfuscated values based on the inputs
    const hashInputs = crypto.createHash('sha384')
      .update(JSON.stringify(circuitInputs))
      .digest('hex');

    // Split the hash into parts to simulate proof components
    const proofParts = [];
    for (let i = 0; i < hashInputs.length; i += 16) {
      proofParts.push(hashInputs.slice(i, i + 16));
    }

    // Create a proof structure similar to a P-384 proof
    const proof = {
      pi_a: [proofParts[0], proofParts[1], "1"],
      pi_b: [[proofParts[2], proofParts[3]], [proofParts[4], proofParts[5]], ["1", "0"]],
      pi_c: [proofParts[6], proofParts[7], "1"],
      protocol: "groth16"
    };

    // The public signals include the public inputs
    const publicSignals = [
      ageRequirement.toString(),
      ...nonce.map(n => n.toString()),
      ...P384_MOCK.publicKey.x.map(n => n.toString()),
      ...P384_MOCK.publicKey.y.map(n => n.toString()),
      // Last signal is the verification result
      credential.age >= ageRequirement ? "1" : "0"
    ];

    console.log('User Agent: Generated ZK proof');

    return {
      proof,
      publicSignals,
      metadata: {
        userId: credential.userId,
        meetsAgeRequirement: credential.age >= ageRequirement
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
async function mockServiceProviderVerifier(proof, publicSignals, nonce, ageRequirement) {
  console.log('Service Provider: Verifying ZK proof');

  try {
    // Extract components from public signals
    const receivedAgeReq = BigInt(publicSignals[0]);
    const receivedNonce = publicSignals.slice(1, 9).map(n => BigInt(n));
    const receivedResult = publicSignals[publicSignals.length - 1] === "1";

    // Verify public inputs match
    const isAgeRequirementValid = receivedAgeReq === BigInt(ageRequirement);
    const isNonceValid = receivedNonce.every((n, i) => n === nonce[i]);
    
    // Verify proof structure
    const isProofStructureValid =
      proof &&
      proof.pi_a?.length === 3 &&
      proof.pi_b?.length === 3 &&
      proof.pi_b[0]?.length === 2 &&
      proof.pi_c?.length === 3 &&
      proof.protocol === "groth16";

    // In a real implementation, we would verify the actual P-384 proof
    // Here we're just checking the structure and public inputs
    const verificationResult = 
      isProofStructureValid && 
      isAgeRequirementValid && 
      isNonceValid && 
      receivedResult;

    if (verificationResult) {
      console.log('Service Provider: Verification successful - User meets age requirement');
    } else {
      console.log('Service Provider: Verification failed');
      if (!isAgeRequirementValid) console.log('  - Age requirement mismatch');
      if (!isNonceValid) console.log('  - Nonce mismatch');
      if (!isProofStructureValid) console.log('  - Invalid proof structure');
    }

    return verificationResult;
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
  const { nonce, ageRequirement } = mockServiceProviderRequest(customAgeRequirement);

  // Step 2: User agent requests credential from government
  const { signedCredential, error: govError } = mockGovernmentCredentialIssuer(userId);
  if (govError) {
    console.log(`Verification flow failed: ${govError}`);
    return { success: false, error: govError };
  }

  // Step 3: User agent generates a ZK proof
  const { proof, publicSignals, metadata, error: proofError } =
    await mockUserAgentProofGenerator(signedCredential, nonce, ageRequirement);
  if (proofError) {
    console.log(`Verification flow failed: ${proofError}`);
    return { success: false, error: proofError };
  }

  // Step 4: Service provider verifies the proof
  const isVerified = await mockServiceProviderVerifier(proof, publicSignals, nonce, ageRequirement);

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

// Only run tests if directly executed
if (require.main === module) {
  // Import test function
  const runTests = require('./zk_age_verification_tests.js');
  runTests().catch(console.error);
}

module.exports = {
  mockServiceProviderRequest,
  mockGovernmentCredentialIssuer,
  mockUserAgentProofGenerator,
  mockServiceProviderVerifier,
  runFullVerificationFlow
};
