# ZK Age Verification: Implementation Comparison

This document compares the simple age verification implementation with the MiMC7-based implementation, focusing on resilience, security aspects, and the tradeoffs of not using EdDSA.

## Implementation Overview

### Simple Implementation
The simple implementation (`simple_age_verification.circom` and `simple_zk_age_verification_mock.js`) provides basic age verification without cryptographic commitments:

- **Circuit**: Verifies that `userAge >= ageRequirement`
- **Inputs**: `ageRequirement` (public), `userAge` (private)
- **Output**: `isVerified` (public)
- **Security**: Relies solely on the zero-knowledge proof system

### MiMC7-based Implementation
The MiMC7-based implementation (`mimc_age_verification.circom` and `pedersen_age_verification_mock.js`) adds cryptographic commitments:

- **Circuit**: Verifies that:
  1. The commitment matches the user's age and blinding factor
  2. `userAge >= ageRequirement`
- **Inputs**: `ageRequirement` (public), `commitment` (public), `userAge` (private), `blindingFactor` (private)
- **Output**: `isVerified` (public)
- **Security**: Combines zero-knowledge proofs with cryptographic commitments

## Resilience Comparison

### Simple Implementation Vulnerabilities

1. **No Credential Verification**:
   - The simple implementation has no way to verify that the age claim comes from a trusted source
   - Anyone can generate a proof for any age without authentication

2. **No Binding to Identity**:
   - There's no cryptographic binding between the user's identity and their age
   - Proofs can be reused or transferred between users

3. **No Protection Against Replay Attacks**:
   - The same proof can be reused multiple times for different service providers
   - No mechanism to ensure freshness of the proof

4. **No Revocation Mechanism**:
   - Once a proof is generated, it cannot be revoked
   - No way to invalidate proofs if credentials are compromised

### MiMC7-based Implementation Improvements

1. **Credential Verification**:
   - The government issues a signed credential containing a commitment to the user's age
   - The commitment cryptographically binds the age to a random blinding factor
   - The service provider can verify that the commitment comes from a trusted source

2. **Binding to Identity**:
   - The government credential includes the user's identity
   - The commitment is unique to each user due to the random blinding factor
   - Proofs cannot be transferred between users

3. **Protection Against Replay Attacks**:
   - Each proof is tied to a specific commitment
   - The service provider can store verified commitments to prevent reuse
   - The blinding factor adds randomness to prevent correlation

4. **Revocation Mechanism**:
   - The government can maintain a list of revoked commitments
   - Service providers can check against this list before accepting proofs

## Security Analysis: MiMC7 vs. EdDSA

### What We Gain with MiMC7

1. **Efficiency**:
   - MiMC7 is designed specifically for zk-SNARKs
   - Fewer constraints in the circuit (429 vs. thousands for EdDSA)
   - Faster proof generation and verification

2. **Simplicity**:
   - Simpler implementation with fewer components
   - Easier to audit and understand
   - Less prone to implementation errors

3. **Compatibility**:
   - Better compatibility with modern libraries
   - Fewer issues with different curve representations
   - More straightforward integration with existing systems

4. **Reliability**:
   - More stable implementation with fewer edge cases
   - Less sensitive to input formatting issues
   - More robust against implementation errors

### What We Lose Without EdDSA

1. **Digital Signature Properties**:
   - EdDSA provides non-repudiation (signer cannot deny signing)
   - EdDSA signatures can be verified by anyone with the public key
   - MiMC7 commitments don't have these properties by default

2. **Public Verifiability**:
   - EdDSA signatures can be verified without the original message
   - MiMC7 commitments require the original value and blinding factor for verification

3. **Standardization**:
   - EdDSA is a standardized signature algorithm (RFC 8032)
   - MiMC7 is less standardized, though well-established in ZK applications

4. **Key Management**:
   - EdDSA has established key management practices
   - MiMC7 commitments require different key management approaches

## Security Tradeoffs Analysis

### Are We Losing Security by Not Using EdDSA?

**No, but we're making different security tradeoffs:**

1. **Different Security Properties**:
   - EdDSA provides digital signature properties (non-repudiation, public verifiability)
   - MiMC7 provides commitment properties (binding, hiding)
   - Both can be secure when used correctly for their intended purposes

2. **Security of the Underlying Primitives**:
   - Both EdDSA and MiMC7 are considered secure cryptographic primitives
   - EdDSA relies on the security of elliptic curves
   - MiMC7 relies on the security of the MiMC hash function
   - Both have been extensively studied and are considered secure

3. **Implementation Security**:
   - EdDSA implementations are more complex and prone to errors
   - MiMC7 implementations are simpler and less error-prone
   - Our MiMC7 implementation uses the well-tested circomlibjs library

4. **Overall System Security**:
   - The security of the overall system depends on how these primitives are used
   - Our MiMC7-based implementation provides the necessary security properties for age verification
   - The simpler implementation may actually be more secure due to fewer potential implementation flaws

### Mitigating the Tradeoffs

We can mitigate the tradeoffs of not using EdDSA by:

1. **Adding JWT Signatures**:
   - The government credential is signed with a JWT
   - This provides the non-repudiation property of digital signatures
   - The service provider can verify the JWT signature

2. **Implementing Revocation**:
   - The government can maintain a list of revoked commitments
   - Service providers can check against this list

3. **Adding Freshness**:
   - Include a timestamp or nonce in the proof
   - This prevents replay attacks

4. **Using Standardized Components**:
   - Use well-tested libraries for cryptographic operations
   - Follow best practices for key management

## Practical Considerations

### Implementation Complexity

- **EdDSA**: Complex implementation with many components and potential points of failure
- **MiMC7**: Simpler implementation with fewer components and clearer security properties

### Performance

- **EdDSA**: More constraints, slower proof generation and verification
- **MiMC7**: Fewer constraints, faster proof generation and verification

### Maintainability

- **EdDSA**: More complex to maintain and update
- **MiMC7**: Simpler to maintain and update

### Compatibility

- **EdDSA**: More issues with library compatibility and curve representations
- **MiMC7**: Better compatibility with modern libraries

## Conclusion

The MiMC7-based implementation provides significant improvements in resilience compared to the simple implementation, while making reasonable security tradeoffs compared to an EdDSA-based approach.

For the specific use case of age verification, the MiMC7-based implementation:

1. **Provides the necessary security properties**:
   - Zero-knowledge (age is not revealed)
   - Binding (commitment cannot be changed)
   - Authentication (credential comes from a trusted source)

2. **Offers practical advantages**:
   - Simpler implementation
   - Better performance
   - Fewer potential points of failure

3. **Makes reasonable tradeoffs**:
   - Different security properties, but not necessarily weaker
   - Mitigated by additional measures (JWT signatures, revocation)

The choice between MiMC7 and EdDSA depends on the specific requirements of the application. For our age verification use case, the MiMC7-based implementation provides a good balance of security, efficiency, and simplicity.
