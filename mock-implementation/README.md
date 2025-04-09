# ZK Age Verification Mock Implementation

This is a proof-of-concept implementation that demonstrates how zero-knowledge proofs can be used for privacy-preserving age verification without revealing the actual age of the user.

## Overview

This implementation simulates the interaction between three components:

1. **Service Provider**: Requests age verification and verifies proofs
2. **Government Identity Provider**: Issues signed credentials with age information
3. **User Agent (Browser Extension)**: Generates zero-knowledge proofs

## Files

- `age_verification.circom`: A simple Circom circuit for age verification
- `zk_age_verification_mock.js`: Mock implementation of the verification flow

## How It Works

1. The Service Provider generates a random nonce and specifies an age requirement
2. The User Agent requests a credential from the Government
3. The Government issues a signed credential containing the user's age
4. The User Agent generates a zero-knowledge proof that:
   - The user's age meets the requirement
   - The credential is valid
   - The proof is for the specific request (using the nonce)
5. The Service Provider verifies the proof without learning the user's actual age

## Running the Mock Implementation

```bash
# Install dependencies
npm install

# Run the mock implementation
node zk_age_verification_mock.js
```

## Notes

- This is a simplified mock implementation for demonstration purposes
- In a real implementation:
  - The circuit would be compiled and proper ZK proofs would be generated
  - Proper cryptographic signatures would be used for credentials
  - The components would be separate services/applications
  - Additional security measures would be implemented

## Next Steps

To create a full implementation:

1. Compile the Circom circuit and generate proving/verification keys
2. Implement the actual proof generation and verification using snarkjs
3. Create separate applications for each component
4. Implement proper authentication and secure communication
