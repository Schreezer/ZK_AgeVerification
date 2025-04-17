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
const CIRCUIT_WASM_PATH = './age_verification_js/age_verification_js/age_verification.wasm'; // Will be generated from the circuit
const CIRCUIT_ZKEY_PATH = './age_verification_js/age_verification.zkey'; // Updated to match newly generated zkey

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
  let ageRequirement = customAgeRequirement !== null ? customAgeRequirement : 18;
  // Clamp negative age requirement
  if (ageRequirement < 0) {
    console.warn('Service Provider: Negative age requirement received, defaulting to 0');
    ageRequirement = 0;
  }

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

  // Use real ECDSA P-384 signature
  const message = JSON.stringify(credentialData);

  // Key file paths
  const privKeyPath = __dirname + '/p384-private.pem';
  const pubKeyPath = __dirname + '/p384-public.pem';

  // Ensure keypair exists (generate if not)
  let privateKeyPem, publicKeyPem;
  if (fs.existsSync(privKeyPath) && fs.existsSync(pubKeyPath)) {
    privateKeyPem = fs.readFileSync(privKeyPath, 'utf8');
    publicKeyPem = fs.readFileSync(pubKeyPath, 'utf8');
  } else {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-384',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    fs.writeFileSync(privKeyPath, privateKey);
    fs.writeFileSync(pubKeyPath, publicKey);
    privateKeyPem = privateKey;
    publicKeyPem = publicKey;
  }

  // Hash the message with SHA-384
  const hash = crypto.createHash('sha384').update(message).digest();

  // Sign the hash with ECDSA P-384
  const sign = crypto.createSign('SHA384');
  sign.update(message);
  sign.end();
  const derSignature = sign.sign(privateKeyPem);

  // Parse DER signature to get r and s
  function parseEcdsaDerSignature(der) {
    // Minimal ASN.1 DER parser for ECDSA signature
    let offset = 0;
    if (der[offset++] !== 0x30) throw new Error('Invalid DER');
    const seqLen = der[offset++];
    if (der[offset++] !== 0x02) throw new Error('Invalid DER');
    const rLen = der[offset++];
    let r = der.slice(offset, offset + rLen); offset += rLen;
    if (der[offset++] !== 0x02) throw new Error('Invalid DER');
    const sLen = der[offset++];
    let s = der.slice(offset, offset + sLen);
    // Remove leading zeros
    if (r[0] === 0x00) r = r.slice(1);
    if (s[0] === 0x00) s = s.slice(1);
    return {
      r: BigInt('0x' + r.toString('hex')),
      s: BigInt('0x' + s.toString('hex'))
    };
  }
  const { r, s } = parseEcdsaDerSignature(derSignature);

  // Split BigInt into 8 limbs of 48 bits each
  function splitToLimbs(bn) {
    const limbs = [];
    let n = bn;
    const mask = (1n << 48n) - 1n;
    for (let i = 0; i < 8; i++) {
      limbs.unshift((n & mask).toString());
      n >>= 48n;
    }
    return limbs;
  }

  // Split hash into 8 limbs (as in mock)
  function splitHashToLimbs(buf) {
    const limbs = [];
    for (let i = 0; i < 8; i++) {
      const start = i * 6;
      const slice = buf.slice(start, start + 6);
      const padded = Buffer.concat([slice, Buffer.alloc(6 - slice.length)]);
      limbs.push(BigInt('0x' + padded.toString('hex')).toString());
    }
    return limbs;
  }

  // Extract public key coordinates (x, y) as limbs
  function getPublicKeyLimbs(pem) {
    const pubKeyObj = crypto.createPublicKey(pem);
    const spki = pubKeyObj.export({ type: 'spki', format: 'der' });
    // P-384 uncompressed point is last 97 bytes: 0x04 || x(48) || y(48)
    const uncompressed = spki.slice(-97);
    if (uncompressed[0] !== 0x04) throw new Error('Invalid uncompressed point');
    const x = uncompressed.slice(1, 49);
    const y = uncompressed.slice(49, 97);
    function bufToLimbs(buf) {
      const limbs = [];
      for (let i = 0; i < 8; i++) {
        const start = i * 6;
        const slice = buf.slice(start, start + 6);
        const padded = Buffer.concat([slice, Buffer.alloc(6 - slice.length)]);
        limbs.push(BigInt('0x' + padded.toString('hex')).toString());
      }
      return limbs;
    }
    return {
      x: bufToLimbs(x),
      y: bufToLimbs(y)
    };
  }

  const credential = {
    ...credentialData,
    signature: {
      r: splitToLimbs(r),
      s: splitToLimbs(s),
      msgHash: splitHashToLimbs(hash)
    },
    publicKey: getPublicKeyLimbs(publicKeyPem)
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
      ageRequirement,
      userAge: credential.age,
      isVerified: credential.age >= ageRequirement ? 1 : 0,
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
    // Load verification key (assumes verification_key.json is present)
    const vkeyPath = './age_verification_js/verification_key.json';
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));

    // Verify SNARK proof correctness
    let proofValid = false;
    try {
      proofValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    } catch (e) {
      console.error('Service Provider: Error during SNARK verification', e);
      return false;
    }
    // Check circuit output (last public signal) for age requirement
    const meetsRequirement = publicSignals[publicSignals.length - 1] === '1';
    if (!proofValid) {
      console.log('Service Provider: Proof verification failed');
      return false;
    }
    if (!meetsRequirement) {
      console.log('Service Provider: Proof valid but user does NOT meet age requirement');
      return false;
    }
    console.log('Service Provider: Verification successful - User meets age requirement');
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

module.exports = {
  mockServiceProviderRequest,
  mockGovernmentCredentialIssuer,
  mockUserAgentProofGenerator,
  mockServiceProviderVerifier,
  runFullVerificationFlow
};

// Only run tests if directly executed
if (require.main === module) {
  const runTests = require('./zk_age_verification_tests.js');
  runTests().catch(console.error);
}
