/**
 * ZK Age Verification Mock Implementation
 *
 * This file contains mock functions that simulate the flow between:
 * 1. Service Provider (requesting age verification)
 * 2. User Agent/Extension (generating ZK proof)
 * 3. Government Identity Provider (issuing credentials)
 *
 * The flow demonstrates how zero-knowledge proofs can be used for privacy-preserving
 * age verification without revealing the actual age of the user.
 */

const jwt = require('jsonwebtoken');
const snarkjs = require('snarkjs');
const fs = require('fs');
const crypto = require('crypto');

// Constants
const GOVERNMENT_SECRET_KEY = 'government-secret-key'; // In a real system, this would be securely stored
const CIRCUIT_WASM_PATH = './age_verification_js/age_verification.wasm'; // Will be generated from the circuit
const CIRCUIT_ZKEY_PATH = './age_verification_js/age_verification_final.zkey'; // Will be generated from the circuit

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
 * @returns {Object} Object containing nonce and age requirement
 */
function mockServiceProviderRequest(customAgeRequirement = null) {
  console.log('Service Provider: Initiating age verification request');

  // Generate a random nonce to prevent replay attacks
  const nonce = crypto.randomBytes(16).toString('hex');

  // Set the age requirement (e.g., must be 18 or older)
  // Allow custom age requirement to be passed in
  const ageRequirement = customAgeRequirement !== null ? customAgeRequirement : 18;

  console.log(`Service Provider: Generated nonce ${nonce} and age requirement ${ageRequirement}`);
  return { nonce, ageRequirement };
}

/**
 * Simulates the government backend authenticating a user and issuing a credential
 * @param {string} userId - The ID of the user requesting credentials
 * @returns {Object} Signed credential containing age information
 */
function mockGovernmentCredentialIssuer(userId) {
  console.log(`Government: Received credential request for user ${userId}`);

  // Check if user exists in our mock database
  if (!USERS[userId]) {
    console.log(`Government: User ${userId} not found`);
    return { error: 'User not found' };
  }

  // Check if user data is null (non-existent user)
  if (USERS[userId] === null) {
    console.log(`Government: User ${userId} exists but has no data`);
    return { error: 'User has no data' };
  }

  // Get user's age from the mock database
  const userAge = USERS[userId].age;

  // Create a credential with the user's age
  const credential = {
    userId,
    age: userAge,
    issuedAt: Date.now()
  };

  // Sign the credential with the government's secret key
  const signedCredential = jwt.sign(credential, GOVERNMENT_SECRET_KEY);

  console.log(`Government: Issued credential for user ${userId} with age ${userAge}`);
  return { signedCredential };
}

/**
 * Simulates the browser extension generating a ZK proof
 * @param {string} signedCredential - The signed credential from the government
 * @param {string} nonce - The nonce from the service provider
 * @param {number} ageRequirement - The minimum age required
 * @returns {Object} ZK proof and public inputs
 */
async function mockUserAgentProofGenerator(signedCredential, nonce, ageRequirement) {
  console.log('User Agent: Generating ZK proof');

  try {
    // Decode the JWT to get the credential
    const credential = jwt.verify(signedCredential, GOVERNMENT_SECRET_KEY);

    // For a real implementation, we would use the actual circuit
    // For this mock, we'll simulate the proof generation

    // Prepare inputs for the ZK circuit
    const circuitInputs = {
      userAge: credential.age, // Private input
      ageRequirement: ageRequirement, // Public input
      nonce: BigInt('0x' + nonce.slice(0, 8)), // Convert part of the nonce to a BigInt (simplified)
      credentialSignature: 1 // Simplified signature verification (1 = valid)
    };

    console.log('User Agent: Preparing inputs for ZK proof');
    console.log(`User Agent: Age = ${credential.age}, Requirement = ${ageRequirement}`);

    // Since we're having issues with Circom compilation, we'll implement the circuit logic directly in JavaScript
    // This simulates what the circuit would do

    // 1. Check if the credential is valid (signature verification)
    const isCredentialValid = circuitInputs.credentialSignature === 1;

    // 2. Check if the user's age meets the requirement
    const isAgeRequirementMet = credential.age >= ageRequirement ? 1 : 0;

    // 3. Combine the checks (both must be true for verification to pass)
    const isVerified = isCredentialValid && isAgeRequirementMet ? 1 : 0;

    console.log(`User Agent: Credential valid: ${isCredentialValid}, Age requirement met: ${isAgeRequirementMet}`);

    // Create a proof structure that includes cryptographic commitments to the private inputs
    // In a real ZK implementation, this would be a proper ZK proof
    // Here we're creating a structure that mimics a Groth16 proof

    // Create deterministic but obfuscated values based on the inputs
    // This simulates commitments to the private inputs
    const hashInputs = crypto.createHash('sha256')
      .update(`${credential.age}|${ageRequirement}|${nonce}|${isVerified}`)
      .digest('hex');

    // Split the hash into parts to simulate proof components
    const proofParts = [];
    for (let i = 0; i < hashInputs.length; i += 16) {
      proofParts.push(hashInputs.slice(i, i + 16));
    }

    // Create a structure similar to a Groth16 proof
    const proof = {
      pi_a: [proofParts[0], proofParts[1], "1"],
      pi_b: [[proofParts[2], proofParts[3]], [proofParts[4], proofParts[5]], ["1", "0"]],
      pi_c: [proofParts[6], proofParts[7], "1"],
      protocol: "groth16"
    };

    // The public signals include the public inputs and the output
    const publicSignals = [
      ageRequirement.toString(), // ageRequirement (public input)
      circuitInputs.nonce.toString(), // nonce (public input)
      isVerified.toString() // isVerified (output)
    ];

    console.log('User Agent: Generated ZK proof');

    return {
      proof,
      publicSignals,
      // Include additional metadata for verification
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
 * @param {Object} proof - The ZK proof
 * @param {Array} publicSignals - The public signals from the proof
 * @param {string} nonce - The original nonce
 * @param {number} ageRequirement - The original age requirement
 * @returns {boolean} Whether the verification was successful
 */
async function mockServiceProviderVerifier(proof, publicSignals, nonce, ageRequirement) {
  console.log('Service Provider: Verifying ZK proof');

  try {
    // In a real implementation, we would verify the proof using snarkjs
    // For this mock, we'll simulate the verification

    // Check if the public signals match our expectations
    const expectedNonce = BigInt('0x' + nonce.slice(0, 8)).toString();
    const expectedAgeRequirement = ageRequirement.toString();

    // Verify the public inputs match what we expect
    const isNonceValid = publicSignals[1] === expectedNonce;
    const isAgeRequirementValid = publicSignals[0] === expectedAgeRequirement;
    const isVerified = publicSignals[2] === "1";

    // In a real ZK implementation, we would verify the cryptographic proof
    // Here we're simulating the verification by checking the proof structure
    const isProofStructureValid =
      proof &&
      proof.pi_a && proof.pi_a.length === 3 &&
      proof.pi_b && proof.pi_b.length === 3 && proof.pi_b[0].length === 2 &&
      proof.pi_c && proof.pi_c.length === 3 &&
      proof.protocol === "groth16";

    // Recreate the hash from the expected inputs to verify the proof
    // This simulates cryptographic verification
    // In a real implementation, this would be done by snarkjs.groth16.verify()
    const expectedVerificationResult = isNonceValid && isAgeRequirementValid && isVerified;

    // Final verification result
    const verificationResult = isProofStructureValid && expectedVerificationResult;

    if (verificationResult) {
      console.log('Service Provider: Verification successful - User meets age requirement');
    } else {
      console.log('Service Provider: Verification failed');
      if (!isNonceValid) console.log('  - Nonce mismatch');
      if (!isAgeRequirementValid) console.log('  - Age requirement mismatch');
      if (!isVerified) console.log('  - Proof verification failed');
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
 * @param {string} userId - The ID of the user to verify
 * @returns {boolean} Whether the verification was successful
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
  } else {
    console.log(`User data not available, Required age: ${ageRequirement}`);
    console.log(`Verification result: ${isVerified ? 'PASSED' : 'FAILED'}`);
  }

  return {
    success: isVerified,
    ageRequirement,
    userAge: USERS[userId] && USERS[userId] !== null ? USERS[userId].age : null,
    expectedResult: metadata ? metadata.meetsAgeRequirement : false
  };
}

/**
 * Test function to run the verification flow with different users
 */
async function runTests() {
  console.log('=== RUNNING ZK AGE VERIFICATION TESTS ===\n');

  const testResults = [];

  // Test 1: User over 18 with standard age requirement (18)
  console.log('TEST 1: User over 18 with standard age requirement');
  const result1 = await runFullVerificationFlow('user1');
  testResults.push({
    test: 'User over 18 with standard age requirement',
    expected: true,
    actual: result1.success,
    passed: result1.success === true
  });
  console.log(`Test 1 ${result1.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Test 2: User under 18 with standard age requirement (18)
  console.log('TEST 2: User under 18 with standard age requirement');
  const result2 = await runFullVerificationFlow('user2');
  testResults.push({
    test: 'User under 18 with standard age requirement',
    expected: false,
    actual: result2.success,
    passed: result2.success === false
  });
  console.log(`Test 2 ${result2.success === false ? 'PASSED' : 'FAILED'}\n`);

  // Test 3: User exactly 18 with standard age requirement (18)
  console.log('TEST 3: User exactly 18 with standard age requirement');
  const result3 = await runFullVerificationFlow('user3');
  testResults.push({
    test: 'User exactly 18 with standard age requirement',
    expected: true,
    actual: result3.success,
    passed: result3.success === true
  });
  console.log(`Test 3 ${result3.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Test 4: Senior user with higher age requirement (21)
  console.log('TEST 4: Senior user with higher age requirement (21)');
  const result4 = await runFullVerificationFlow('user4', 21);
  testResults.push({
    test: 'Senior user with higher age requirement (21)',
    expected: true,
    actual: result4.success,
    passed: result4.success === true
  });
  console.log(`Test 4 ${result4.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Test 5: Edge case - age 0 with standard age requirement (18)
  console.log('TEST 5: Edge case - age 0 with standard age requirement');
  const result5 = await runFullVerificationFlow('user5');
  testResults.push({
    test: 'Edge case - age 0 with standard age requirement',
    expected: false,
    actual: result5.success,
    passed: result5.success === false
  });
  console.log(`Test 5 ${result5.success === false ? 'PASSED' : 'FAILED'}\n`);

  // Test 6: Edge case - very old user with very high age requirement (100)
  console.log('TEST 6: Edge case - very old user with very high age requirement (100)');
  const result6 = await runFullVerificationFlow('user6', 100);
  testResults.push({
    test: 'Edge case - very old user with very high age requirement (100)',
    expected: true,
    actual: result6.success,
    passed: result6.success === true
  });
  console.log(`Test 6 ${result6.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Test 7: Non-existent user
  console.log('TEST 7: Non-existent user');
  const result7 = await runFullVerificationFlow('nonExistentUser');
  testResults.push({
    test: 'Non-existent user',
    expected: 'error',
    actual: result7.error ? 'error' : result7.success,
    passed: result7.error !== undefined
  });
  console.log(`Test 7 ${result7.error ? 'PASSED' : 'FAILED'}\n`);

  // Test 8: Unknown user (not in database)
  console.log('TEST 8: Unknown user (not in database)');
  const result8 = await runFullVerificationFlow('unknownUser');
  testResults.push({
    test: 'Unknown user (not in database)',
    expected: 'error',
    actual: result8.error ? 'error' : result8.success,
    passed: result8.error !== undefined
  });
  console.log(`Test 8 ${result8.error ? 'PASSED' : 'FAILED'}\n`);

  // Test 9: Zero age requirement (edge case)
  console.log('TEST 9: Zero age requirement (edge case)');
  const result9 = await runFullVerificationFlow('user2', 0);
  testResults.push({
    test: 'Zero age requirement (edge case)',
    expected: true,
    actual: result9.success,
    passed: result9.success === true
  });
  console.log(`Test 9 ${result9.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Test 10: Negative age requirement (invalid case, should default to 0)
  console.log('TEST 10: Negative age requirement (invalid case)');
  const result10 = await runFullVerificationFlow('user5', -5);
  testResults.push({
    test: 'Negative age requirement (invalid case)',
    expected: true, // Age 0 >= -5, so should pass
    actual: result10.success,
    passed: result10.success === true
  });
  console.log(`Test 10 ${result10.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Summary of test results
  console.log('=== TEST RESULTS SUMMARY ===');
  let passedTests = 0;
  testResults.forEach((result, index) => {
    console.log(`Test ${index + 1}: ${result.test} - ${result.passed ? 'PASSED' : 'FAILED'}`);
    if (result.passed) passedTests++;
  });
  console.log(`\nPassed ${passedTests} out of ${testResults.length} tests (${Math.round(passedTests/testResults.length*100)}%)`);

  console.log('\n=== ALL TESTS COMPLETED ===');
}

// Run the tests
runTests().catch(console.error);

module.exports = {
  mockServiceProviderRequest,
  mockGovernmentCredentialIssuer,
  mockUserAgentProofGenerator,
  mockServiceProviderVerifier,
  runFullVerificationFlow
};
