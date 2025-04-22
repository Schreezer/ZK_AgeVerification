# Implementing Schnorr Signatures for ZK Age Verification

This document outlines the plan for implementing Schnorr signatures in our ZK age verification system, using MiMC7 as the hash function.

## 1. Overview of Schnorr Signatures

Schnorr signatures are simple, efficient, and provide strong security guarantees. They work on elliptic curves and have the following components:

- **Key Generation**: Generate a private key `sk` and compute the public key `pk = G * sk`
- **Signature Generation**: Create a signature (R, s) for a message m
- **Signature Verification**: Verify that the signature corresponds to the message and public key

## 2. Implementation Plan

### 2.1 Key Generation

```javascript
// In mimc_utils.js
async function generateSchnorrKeyPair() {
    // Initialize the BabyJubJub curve (compatible with circom)
    const babyJub = await circomlibjs.buildBabyjub();
    const F = babyJub.F;
    
    // Generate a random private key
    const privateKey = crypto.randomBytes(32);
    const privateKeyScalar = F.e(privateKey.toString('hex'));
    
    // Compute the public key point
    const publicKeyPoint = babyJub.mulPointEscalar(babyJub.Base8, privateKeyScalar);
    
    // Return both keys
    return {
        privateKey: F.toString(privateKeyScalar),
        publicKey: {
            x: F.toString(publicKeyPoint[0]),
            y: F.toString(publicKeyPoint[1])
        }
    };
}
```

### 2.2 Signature Generation

```javascript
// In mimc_utils.js
async function schnorrSign(message, privateKey) {
    // Initialize the curve and MiMC7
    const babyJub = await circomlibjs.buildBabyjub();
    const F = babyJub.F;
    const mimc7 = await circomlibjs.buildMimc7();
    
    // Convert inputs to field elements
    const m = F.e(message.toString());
    const sk = F.e(privateKey);
    
    // Generate a random nonce (k)
    const k = F.e(crypto.randomBytes(32).toString('hex'));
    
    // Compute R = k * G
    const R = babyJub.mulPointEscalar(babyJub.Base8, k);
    
    // Compute the challenge e = MiMC7(R.x || R.y || pk.x || pk.y || m)
    const publicKey = babyJub.mulPointEscalar(babyJub.Base8, sk);
    const e = mimc7.multiHash([R[0], R[1], publicKey[0], publicKey[1], m]);
    
    // Compute s = k + e * sk
    const s = F.add(k, F.mul(e, sk));
    
    // Return the signature (R, s)
    return {
        R: {
            x: F.toString(R[0]),
            y: F.toString(R[1])
        },
        s: F.toString(s)
    };
}
```

### 2.3 Signature Verification (JavaScript)

```javascript
// In mimc_utils.js
async function schnorrVerify(message, signature, publicKey) {
    // Initialize the curve and MiMC7
    const babyJub = await circomlibjs.buildBabyjub();
    const F = babyJub.F;
    const mimc7 = await circomlibjs.buildMimc7();
    
    // Convert inputs to field elements
    const m = F.e(message.toString());
    const R = [F.e(signature.R.x), F.e(signature.R.y)];
    const s = F.e(signature.s);
    const pk = [F.e(publicKey.x), F.e(publicKey.y)];
    
    // Compute the challenge e = MiMC7(R.x || R.y || pk.x || pk.y || m)
    const e = mimc7.multiHash([R[0], R[1], pk[0], pk[1], m]);
    
    // Verify: s * G = R + e * pk
    const sG = babyJub.mulPointEscalar(babyJub.Base8, s);
    const ePk = babyJub.mulPointEscalar(pk, e);
    const rPlusEPk = babyJub.addPoint(R, ePk);
    
    // Check if the points are equal
    return babyJub.F.eq(sG[0], rPlusEPk[0]) && babyJub.F.eq(sG[1], rPlusEPk[1]);
}
```

### 2.4 Circom Circuit for Signature Verification

```circom
pragma circom 2.0.0;

include "node_modules/circomlib/circuits/mimc.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/escalarmulfix.circom";
include "node_modules/circomlib/circuits/escalarmul.circom";
include "node_modules/circomlib/circuits/babyjub.circom";
include "node_modules/circomlib/circuits/comparators.circom";

template SchnorrVerify() {
    // Public inputs
    signal input publicKey[2]; // [x, y]
    
    // Private inputs
    signal input userAge;
    signal input signature[3]; // [R.x, R.y, s]
    
    // Output signal
    signal output isVerified;
    
    // Step 1: Verify the age requirement (16+)
    component ge = GreaterEqThan(64);
    ge.in[0] <== userAge;
    ge.in[1] <== 16; // Fixed age requirement
    
    // Step 2: Compute the challenge e = MiMC7(R.x || R.y || pk.x || pk.y || m)
    component mimc = MiMC7Compression(5);
    mimc.ins[0] <== signature[0]; // R.x
    mimc.ins[1] <== signature[1]; // R.y
    mimc.ins[2] <== publicKey[0]; // pk.x
    mimc.ins[3] <== publicKey[1]; // pk.y
    mimc.ins[4] <== userAge;      // message (age)
    mimc.k <== 0;
    
    signal e <== mimc.out;
    
    // Step 3: Compute s * G
    component sG = BabyPbk();
    sG.in <== signature[2]; // s
    
    // Step 4: Compute e * pk
    component ePk = EscalarMul();
    ePk.p[0] <== publicKey[0];
    ePk.p[1] <== publicKey[1];
    ePk.e <== e;
    
    // Step 5: Compute R + e * pk
    component pointAdd = BabyAdd();
    pointAdd.x1 <== signature[0]; // R.x
    pointAdd.y1 <== signature[1]; // R.y
    pointAdd.x2 <== ePk.out[0];
    pointAdd.y2 <== ePk.out[1];
    
    // Step 6: Verify s * G = R + e * pk
    signal xEqual <== sG.out[0] - pointAdd.xout;
    signal yEqual <== sG.out[1] - pointAdd.yout;
    
    signal sigValid <== (xEqual * xEqual + yEqual * yEqual) === 0 ? 1 : 0;
    
    // Final verification: age requirement met AND signature is valid
    isVerified <== ge.out * sigValid;
}

// Public signals: publicKey
// isVerified is automatically a public output
component main { public [publicKey] } = SchnorrVerify();
```

## 3. Integration Plan

### 3.1 Update Government Server

1. Modify the government server to use Schnorr key generation:

```javascript
// In government-backend/server.js
const { generateSchnorrKeyPair, schnorrSign } = require('../mimc_utils');

// Initialize the keys
async function initKeys() {
  GOVERNMENT_KEYS = await generateSchnorrKeyPair();
  console.log('Government: Generated Schnorr key pair');
  console.log(`Government: Public Key: ${JSON.stringify(GOVERNMENT_KEYS.publicKey)}`);
  return GOVERNMENT_KEYS;
}
```

2. Update the credential issuance to use Schnorr signatures:

```javascript
// Create a Schnorr signature for the age
const signature = await schnorrSign(userAge, GOVERNMENT_KEYS.privateKey);
console.log(`Government: Generated Schnorr signature`);

// Create credential data with signature
const credential = {
  userId,
  name: userName,
  age: userAge,
  signature,
  publicKey: GOVERNMENT_KEYS.publicKey,
  fixedAgeRequirement: FIXED_AGE_REQUIREMENT,
  issuedAt: Date.now()
};
```

### 3.2 Update Proof Server

1. Modify the proof server to handle Schnorr signatures:

```javascript
// In proof-server/server.js
const { schnorrVerify } = require('../mimc_utils');

// Verify the signature before generating the proof
try {
  console.log('Proof Server: Verifying Schnorr signature...');
  const isValid = await schnorrVerify(age, signature, publicKey);
  if (!isValid) {
    console.warn('Proof Server: Signature verification failed! This may cause the circuit to fail.');
  } else {
    console.log('Proof Server: Signature verified successfully!');
  }
} catch (verifyError) {
  console.error('Proof Server: Error verifying signature:', verifyError);
}

// Prepare inputs for the ZK circuit
const circuitInputs = {
  publicKey: [publicKey.x, publicKey.y],
  userAge: parseInt(age),
  signature: [signature.R.x, signature.R.y, signature.s]
};
```

### 3.3 Create and Compile the New Circuit

1. Save the Schnorr verification circuit to `circuit-server/schnorr_age_verification.circom`
2. Compile the circuit:

```bash
cd circuit-server
circom schnorr_age_verification.circom --r1cs --wasm -o ./
```

3. Perform the trusted setup:

```bash
snarkjs powersoftau new bn128 14 pot14_0000.ptau -v
snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau -v
snarkjs groth16 setup schnorr_age_verification.r1cs pot14_final.ptau schnorr_age_verification_0000.zkey
snarkjs zkey contribute schnorr_age_verification_0000.zkey schnorr_age_verification_0001.zkey --name="First contribution" -v
snarkjs zkey export verificationkey schnorr_age_verification_0001.zkey verification_key.json
```

### 3.4 Update the Proof Server to Use the New Circuit

```javascript
// In proof-server/server.js
const SCHNORR_WASM_PATH = path.join(CIRCUIT_DIR, 'schnorr_age_verification_js', 'schnorr_age_verification.wasm');
const SCHNORR_ZKEY_PATH = path.join(CIRCUIT_DIR, 'schnorr_age_verification_0001.zkey');

// Use the Schnorr circuit if available
const WASM_PATH = fs.existsSync(SCHNORR_WASM_PATH) ? SCHNORR_WASM_PATH : FIXED_WASM_PATH;
const ZKEY_PATH = fs.existsSync(SCHNORR_ZKEY_PATH) ? SCHNORR_ZKEY_PATH : FIXED_ZKEY_PATH;
```

## 4. Testing Plan

1. **Unit Tests**:
   - Test key generation
   - Test signature generation
   - Test signature verification in JavaScript
   - Test the circuit with valid and invalid signatures

2. **Integration Tests**:
   - Test the government server's credential issuance
   - Test the proof server's proof generation
   - Test the end-to-end flow with the Chrome extension

3. **Performance Tests**:
   - Measure the time taken for key generation
   - Measure the time taken for signature generation
   - Measure the time taken for proof generation
   - Optimize if necessary

## 5. Security Considerations

1. **Key Management**:
   - Ensure the government's private key is securely stored
   - Consider using a hardware security module (HSM) for production

2. **Nonce Management**:
   - Ensure nonces are never reused (critical for Schnorr security)
   - Consider using deterministic nonce generation (RFC 6979)

3. **Circuit Security**:
   - Ensure the circuit correctly implements the verification logic
   - Consider formal verification of the circuit

4. **Side-Channel Attacks**:
   - Implement constant-time operations where possible
   - Be aware of potential timing attacks

## 6. Implementation Timeline

1. **Week 1**: Implement and test the JavaScript components
   - Implement key generation
   - Implement signature generation
   - Implement signature verification
   - Write unit tests

2. **Week 2**: Implement and test the circuit
   - Implement the Schnorr verification circuit
   - Compile and set up the circuit
   - Test the circuit with various inputs

3. **Week 3**: Integrate with the existing system
   - Update the government server
   - Update the proof server
   - Update the Chrome extension if necessary

4. **Week 4**: Testing and optimization
   - Perform integration tests
   - Perform performance tests
   - Optimize as necessary
   - Document the implementation

## 7. Conclusion

Implementing Schnorr signatures with MiMC7 will provide a secure and efficient way to verify age credentials in our ZK system. This approach maintains the privacy benefits of zero-knowledge proofs while ensuring the authenticity of government-issued credentials.

The implementation will require changes to the government server, proof server, and circuit, but the Chrome extension should require minimal changes as it primarily acts as a transport layer.
