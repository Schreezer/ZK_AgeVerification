# ZK Age Verification Demo

This project demonstrates a privacy-preserving age verification system using zero-knowledge proofs. The system allows users to prove they meet age requirements without revealing their actual age.

## Implementation Status

### Completed
- ✅ Simplified age verification circuit without EdDSA
- ✅ Circuit compilation and setup with Powers of Tau
- ✅ Generation of proving and verification keys
- ✅ Zero-knowledge proof generation and verification
- ✅ Mock implementation of the verification flow
- ✅ Test cases for various age scenarios

### Pending
- ❌ Full EdDSA signature verification implementation (encountering issues with circomlibjs library)
- ❌ Integration of EdDSA signatures with the age verification flow
- ❌ Web interface for demonstration
- ❌ Optimization of circuit constraints

## Project Structure

- `age_verification.circom`: The full circuit with EdDSA signature verification
- `simple_age_verification.circom`: A simplified circuit for age verification without signatures
- `zk_age_verification_mock.js`: Implementation of the full flow with EdDSA
- `simple_zk_age_verification_mock.js`: Implementation of the simplified flow
- `run_demo.js`: Script to run the simplified demo
- `eddsa_utils.js`: Utilities for EdDSA signature generation and verification

## Running the Demo

### Simplified Age Verification Demo

To run the simplified demo without EdDSA signature verification:

```bash
node run_demo.js
```

This will demonstrate the following test cases:
1. User over 18 (should pass)
2. User under 18 (should fail)
3. User exactly 18 (should pass)
4. Custom age requirement (21+) (should pass for user with age 25)

### Expected Output

When running the demo, you should see output similar to this:

```
=== ZK Age Verification Demo ===

--- Test Case 1: User over 18 ---
=== Starting verification flow for user user1 ===
Service Provider: Initiating age verification request
Service Provider: Set age requirement to 18
User Agent: Generating ZK proof
User Agent: Preparing inputs for ZK proof
User Agent: Generated ZK proof
Service Provider: Verifying ZK proof
Public Signals: [ '1', '18' ]
Provided Age Requirement: 18 Expected: 18
Is Verified: true
Service Provider: Verification successful - Age requirement met
=== Verification flow completed for user user1 ===
Actual age: 25, Required age: 18
Verification result: PASSED
Expected result: PASSED
Result: PASSED
```

### Understanding the Output

- The demo simulates the interaction between a service provider, a user, and a verification system
- The user's actual age is never revealed to the service provider
- The service provider only learns whether the user meets the age requirement
- The zero-knowledge proof ensures privacy while maintaining verifiability

### Full Demo with EdDSA

Now that the EdDSA implementation issues have been resolved, you can run the full demo with signature verification:

1. First, set up the circuit and generate the necessary keys:

```bash
node setup_circuit.js
```

2. Then run the full demo:

```bash
node run_full_demo.js
```

This adds an additional layer of security by verifying that the age credential was issued by a trusted authority using EdDSA signatures.

## Implementation Details

### Zero-Knowledge Age Verification

The system uses a zero-knowledge circuit to verify that a user's age meets a requirement without revealing the actual age. The circuit takes two inputs:
- `ageRequirement`: The minimum age required (public input)
- `userAge`: The user's actual age (private input)

The circuit outputs a boolean value indicating whether the user meets the age requirement.

### EdDSA Signature Verification

The full implementation includes EdDSA signature verification to ensure that the age credential was issued by a trusted authority (e.g., a government identity provider). The signature verification ensures that:
1. The credential was issued by the trusted authority
2. The credential has not been tampered with

## System Components

1. **Service Provider**
   - Initiates verification requests
   - Sets age requirements
   - Verifies zero-knowledge proofs

2. **Government Identity Provider**
   - Issues age credentials
   - Signs credentials using EdDSA
   - Manages user identity database

3. **User Agent/Browser Extension**
   - Receives credentials from government
   - Generates zero-knowledge proofs
   - Protects user privacy

## Technical Implementation

The project uses:
- Circom 2.0.0 for circuit development
- SnarkJS for proof generation and verification
- EdDSA for digital signatures
- Node.js for the mock implementation

## Implementation Challenges and Solutions

### EdDSA Implementation Issues
The full implementation with EdDSA signature verification faced several challenges that have now been addressed:

1. **Library Compatibility**: The circomlibjs library requires specific initialization and had compatibility issues with the implementation.
   - **Solution**: Implemented a singleton pattern for library initialization to prevent race conditions and ensure proper loading.

2. **Message Format**: There were issues with the format of the message being signed. The EdDSA implementation expects a specific format.
   - **Solution**: Updated the message preparation to use proper scalar conversion and consistent formats between signing and verification.

3. **Bit Representation**: Converting between different bit representations (for age, signatures, etc.) was causing errors.
   - **Solution**: Created custom helper functions (`bufferToBits` and `scalarToBits`) to ensure consistent bit representation and proper bit ordering.

4. **Circuit Complexity**: The full circuit with EdDSA verification has high complexity, requiring a large Powers of Tau file (2^16).
   - **Solution**: Modified the circuit to use MiMC hash for EdDSA verification and optimized the bit conversion process.

### Testing and Verification
To verify that the EdDSA implementation works correctly, we've added:

1. A test script (`test_eddsa_compatibility.js`) to verify the compatibility fixes
2. Improved error handling and logging throughout the implementation
3. A setup script (`setup_circuit.js`) to compile the circuit and generate the necessary keys

## Future Work

- Implement a web interface for the demo
- Add more complex verification rules
- Integrate with real identity providers
- Further optimize the circuits for better performance
- Add support for batch verification of multiple credentials
- Implement revocation mechanisms for credentials
- Add support for selective disclosure of attributes
- Create a mobile app for credential management
