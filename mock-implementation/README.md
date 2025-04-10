# Zero-Knowledge Age Verification System

This implementation demonstrates a privacy-preserving age verification system using zero-knowledge proofs and P-384 ECDSA signatures. The system allows users to prove they meet age requirements without revealing their actual age.

## Architecture Overview

### Circuit Design

The system uses a Circom circuit (`age_verification.circom`) that implements:

1. P-384 ECDSA signature verification
   - Verifies government-issued credentials
   - Uses 48-bit limbs (8 limbs total) for P-384 curve operations
   - Validates signature components (R, S) against the public key

2. Zero-knowledge age verification
   - Proves age requirement is met without revealing actual age
   - Implements efficient 32-bit comparison operations
   - Combines signature verification with age check

### System Components

1. **Service Provider**
   - Initiates verification requests
   - Generates unique 384-bit nonces for each request
   - Sets age requirements
   - Verifies zero-knowledge proofs

2. **Government Identity Provider**
   - Issues age credentials
   - Signs credentials using P-384 ECDSA
   - Manages user identity database

3. **User Agent/Browser Extension**
   - Receives credentials from government
   - Generates zero-knowledge proofs
   - Protects user privacy

## Setup and Installation

1. **Prerequisites**
   ```bash
   npm install
   ```

2. **Circuit Compilation**
   - The circuit files are pre-compiled and available in `circuit_build/`
   - WASM and witness generator files are included

## Implementation Details

### 1. Core Modules

- `age_verification.circom`: Main circuit implementation
- `zk_age_verification_mock.js`: Mock implementation of the flow
- `zk_age_verification_tests.js`: Comprehensive test suite

### 2. Data Structures

#### Credential Format
```javascript
{
  userId: string,
  age: number,
  issuedAt: timestamp,
  signature: {
    r: [8 limbs of 48 bits each],
    s: [8 limbs of 48 bits each],
    msgHash: [8 limbs of 48 bits each]
  }
}
```

#### ZK Proof Structure
```javascript
{
  proof: {
    pi_a: [3 elements],
    pi_b: [[2 elements], [2 elements], [2 elements]],
    pi_c: [3 elements],
    protocol: "groth16"
  },
  publicSignals: [
    ageRequirement,
    nonce[8],
    publicKey[2][8],
    result
  ]
}
```

## Test Coverage

The implementation includes comprehensive tests covering:

1. **Standard Cases**
   - Users over 18 (✓ PASSED)
   - Users under 18 (✓ PASSED)
   - Users exactly at age requirement (✓ PASSED)

2. **Special Requirements**
   - Higher age requirements (21+) (✓ PASSED)
   - Custom age thresholds (✓ PASSED)

3. **Edge Cases**
   - Age 0 (✓ PASSED)
   - Very old users (✓ PASSED)
   - Zero age requirement (✓ PASSED)
   - Negative age requirement (✓ PASSED)

4. **Error Cases**
   - Non-existent users (✓ PASSED)
   - Unknown users (✓ PASSED)

Test suite achieves 100% pass rate across all scenarios.

## Security Considerations

1. **Privacy**
   - Zero-knowledge proofs ensure age privacy
   - Only pass/fail result is revealed
   - Actual age remains confidential

2. **Cryptographic Security**
   - P-384 ECDSA for strong signature security
   - 384-bit nonces prevent replay attacks
   - Government credentials are JWT-signed

3. **Limitations**
   - Mock implementation uses simplified key generation
   - Production deployment requires secure key management
   - Additional measures needed for rate limiting

## Usage Example

```javascript
const { runFullVerificationFlow } = require('./zk_age_verification_mock.js');

// Verify a user meets age requirement
const result = await runFullVerificationFlow('userId', 18);
if (result.success) {
    console.log('Age requirement verified!');
} else {
    console.log('Age requirement not met or verification failed');
}
```

## Flow Diagram

```
Service Provider                User Agent                  Government
     |                             |                            |
     |-- Request Verification ---->|                            |
     |  (age_req, nonce)          |                            |
     |                            |--- Request Credential ----->|
     |                            |                            |
     |                            |<---- Issue Credential -----|
     |                            |   (signed with P-384)      |
     |                            |                            |
     |                            |-- Generate ZK Proof -------|
     |                            |                            |
     |<-- Submit Proof -----------|                            |
     |                            |                            |
     |-- Verify Proof            |                            |
     |                           |                            |
