# ZK Age Verification Implementation Guide

This guide explains how to use the updated ZK age verification implementation with EdDSA signature verification.

## Overview

The implementation has been updated to fix compatibility issues with the circomlibjs library. The main changes include:

1. Improved library initialization with proper singleton pattern
2. Fixed bit representation for EdDSA signatures
3. Corrected message format for EdDSA verification
4. Updated circuit implementation to use MiMC hash

## Components

### 1. EdDSA Utilities (`eddsa_utils.js`)

This module provides functions for:
- Generating EdDSA keypairs
- Signing age values
- Verifying EdDSA signatures
- Converting between different data formats (numbers, bits, buffers)

```javascript
const { 
    generateEdDSAKeypair, 
    signAge, 
    verifyEdDSASignature,
    numberToBits,
    bufferToBits,
    scalarToBits
} = require('./eddsa_utils');
```

### 2. Age Verification Circuit (`age_verification.circom`)

The circuit verifies:
- The user's age meets the requirement
- The age credential has a valid EdDSA signature

```circom
pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/eddsa.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/mimc.circom";

// Age verification with EdDSA
template AgeVerificationWithEdDSA() {
    // ...
}
```

### 3. Mock Implementation (`zk_age_verification_mock.js`)

This module simulates the interaction between:
- Service Provider (requesting age verification)
- User Agent/Extension (generating ZK proof)
- Government Identity Provider (issuing credentials)

## Usage

### 1. Testing the EdDSA Compatibility

Run the test script to verify the EdDSA implementation:

```bash
node test_eddsa_compatibility.js
```

### 2. Compiling the Circuit

Compile the circuit using Circom:

```bash
circom age_verification.circom --r1cs --wasm --sym
```

### 3. Generating Keys

Generate proving and verification keys:

```bash
snarkjs groth16 setup age_verification.r1cs powersOfTau28_hez_final_16.ptau age_verification.zkey
snarkjs zkey export verificationkey age_verification.zkey verification_key.json
```

### 4. Running the Full Verification Flow

```javascript
const { runFullVerificationFlow } = require('./zk_age_verification_mock');

// Run verification for user1 with age requirement 18
const result = await runFullVerificationFlow('user1', 18);
console.log('Verification result:', result.success ? 'PASSED' : 'FAILED');
```

## Implementation Details

### EdDSA Signature Generation

The `signAge` function generates an EdDSA signature for an age value:

```javascript
const age = 25;
const keypair = await generateEdDSAKeypair();
const signature = await signAge(age, keypair.privateKey);
```

The signature includes:
- `A`: Public key bits (256 bits)
- `R8`: Signature component R8 (256 bits)
- `S`: Signature component S (256 bits)
- `msg`: Message bits (32 bits for age)

### Zero-Knowledge Proof Generation

The `mockUserAgentProofGenerator` function generates a ZK proof:

```javascript
const { proof, publicSignals } = await mockUserAgentProofGenerator(signedCredential, ageRequirement);
```

### Proof Verification

The `mockServiceProviderVerifier` function verifies the ZK proof:

```javascript
const isVerified = await mockServiceProviderVerifier(proof, publicSignals, ageRequirement);
```

## Troubleshooting

If you encounter issues:

1. Check that circomlibjs is properly initialized
2. Verify the bit formats match what the circuit expects
3. Ensure the message format is consistent between signing and verification
4. Check that the circuit is using the correct hash function (MiMC)

## Next Steps

1. Integrate with a web interface
2. Optimize the circuit for better performance
3. Add support for more complex verification rules
4. Integrate with real identity providers
