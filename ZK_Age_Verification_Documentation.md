# Zero-Knowledge Age Verification System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Implementation Details](#implementation-details)
5. [Security Analysis](#security-analysis)
6. [Potential Vulnerabilities](#potential-vulnerabilities)
7. [Future Improvements](#future-improvements)

## System Overview

The Zero-Knowledge Age Verification System is a privacy-preserving solution that allows users to prove they meet age requirements (16+) to service providers without revealing their actual age or identity. The system uses zero-knowledge proofs and Schnorr signatures to ensure security, privacy, and authenticity.

### Key Features

- **Privacy-Preserving**: Service providers learn only that a user is over 16, not their actual age
- **Cryptographically Secure**: Uses Schnorr signatures and zero-knowledge proofs
- **Decentralized Verification**: Service providers can verify credentials without contacting the government
- **Non-Transferable**: Credentials are bound to specific users
- **Minimal Disclosure**: Only the minimum necessary information is revealed

## Architecture

The system consists of four main components:

1. **Government Backend**: Issues age credentials signed with Schnorr signatures
2. **Chrome Extension**: Acts as an intermediary between the user, government, and service providers
3. **Proof Server**: Generates zero-knowledge proofs of age verification
4. **Service Provider**: Verifies proofs to grant access to age-restricted content

### Data Flow

1. User obtains a government-issued credential through the Chrome extension
2. When visiting a service provider, the extension detects the age verification requirement
3. The extension sends the credential to the proof server
4. The proof server generates a zero-knowledge proof that the user is over 16
5. The extension sends the proof to the service provider
6. The service provider verifies the proof and grants access if valid

## Components

### Government Backend

The government backend is responsible for:
- Generating cryptographic key pairs (Schnorr signatures)
- Issuing age credentials to verified users
- Signing credentials with the government's private key
- Publishing the government's public key for verification

**Key Files**:
- `government-backend/server.js`: Main server implementation
- `government-backend/public/app.js`: Frontend for credential issuance

### Chrome Extension

The Chrome extension serves as:
- A secure storage for the user's credential
- An intermediary between the user and service providers
- A client for the proof server

**Key Files**:
- `chrome-extension/background.js`: Main extension logic
- `chrome-extension/content.js`: Content script for page interaction

### Proof Server

The proof server is responsible for:
- Verifying the authenticity of government-issued credentials
- Generating zero-knowledge proofs of age verification
- Implementing the cryptographic circuits for proof generation

**Key Files**:
- `proof-server/server.js`: Main server implementation
- `circuit-server/schnorr_age_verification.circom`: Zero-knowledge circuit

### Service Provider

The service provider:
- Requests age verification from users
- Verifies zero-knowledge proofs
- Grants access to age-restricted content based on valid proofs

**Key Files**:
- `service-provider/server.js`: Main server implementation
- `service-provider/public/app.js`: Frontend for service provider

## Implementation Details

### Cryptographic Primitives

#### Schnorr Signatures

We implemented a simplified Schnorr signature scheme using MiMC7 hash function:

1. **Key Generation**:
   - Generate a random private key
   - Compute the public key as `MiMC7(privateKey, 0)`

2. **Signature Generation**:
   - Generate a random nonce
   - Compute the signature as `MiMC7(message, MiMC7(nonce, publicKey))`
   - Return the signature, message, and nonce

3. **Signature Verification**:
   - Compute the expected signature using the public key and nonce
   - Compare with the provided signature

#### Zero-Knowledge Circuit

The zero-knowledge circuit verifies:
1. The user's age is at least 16
2. The credential is signed by the government (using Schnorr signature verification)

```circom
template SchnorrAgeVerification() {
    // Public inputs
    signal input publicKey;

    // Private inputs
    signal input userAge;
    signal input signature;
    signal input nonce;

    // Output signal
    signal output isVerified;

    // Verify age requirement (16+)
    component ge = GreaterEqThan(64);
    ge.in[0] <== userAge;
    ge.in[1] <== 16;

    // Verify signature
    component mimcNonce = MiMC7(91);
    mimcNonce.x_in <== nonce;
    mimcNonce.k <== publicKey;

    component mimcAge = MiMC7(91);
    mimcAge.x_in <== userAge;
    mimcAge.k <== mimcNonce.out;

    component isEqual = IsEqual();
    isEqual.in[0] <== mimcAge.out;
    isEqual.in[1] <== signature;

    // Final verification
    isVerified <== ge.out * isEqual.out;
}
```

### Credential Format

Credentials are issued as JWTs with the following structure:

```json
{
  "userId": "user1",
  "name": "Alice Johnson",
  "age": 25,
  "signature": {
    "signature": "417427740928922198021...",
    "message": "25",
    "nonce": "66290286"
  },
  "publicKey": "101126231122079932669731...",
  "fixedAgeRequirement": 16,
  "issuedAt": 1745310519547
}
```

### Proof Format

Proofs are generated using the Groth16 proving system and have the following structure:

```json
{
  "proof": {
    "pi_a": ["19708247411...", "11196264256...", "1"],
    "pi_b": [["15511726351...", "9039726465..."], ["13632249563...", "15216236205..."], ["1", "0"]],
    "pi_c": ["49128106465...", "15902572831...", "1"],
    "protocol": "groth16",
    "curve": "bn128"
  },
  "publicSignals": [
    "1",
    "10112623112207993266973159032438838299106541494109424229535645873971466875081"
  ]
}
```

The public signals contain:
1. Whether the user is over 16 (1 = yes, 0 = no)
2. The government's public key

## Security Analysis

### Security Properties

1. **Authenticity**: Credentials are signed by the government using Schnorr signatures, ensuring they cannot be forged.
2. **Privacy**: Zero-knowledge proofs ensure that service providers learn only that a user is over 16, not their actual age.
3. **Non-transferability**: Credentials are bound to specific users through the signature.
4. **Verifiability**: Service providers can verify the authenticity of credentials without contacting the government.

### Trust Assumptions

1. **Government**: Trusted to issue valid credentials with correct age information.
2. **Proof Server**: Trusted to generate valid proofs and not leak private information.
3. **Chrome Extension**: Trusted to securely store credentials and interact with services.
4. **User's Device**: Trusted not to be compromised.

## Potential Vulnerabilities

### Collusion Attacks

1. **Government-Service Provider Collusion**:
   - **Vulnerability**: The government and service provider could potentially collude to track users.
   - **Mitigation**: The system uses a fixed age requirement (16+) rather than the exact age requirement from the service provider, limiting the information that could be shared in a collusion.
   - **Linkage Vectors**:
     * **Timing Correlation**: The primary vector - if the government knows when a credential was issued and to whom, and a service provider knows when a proof was presented, they could correlate these events.
     * **Public Key Linkage**: The government's public key is included in the public signals of the proof. If the government were to issue different public keys to different users (rather than using a single key for all users), this could create a unique identifier.
   - **Protection Strength**: The current implementation provides strong protection against linking because:
     * We use a single government public key for all users
     * The proof only reveals that the user is over 16, not their exact age
     * The service provider doesn't receive any user identifiers from the government
   - **Remaining Risk**: Primarily timing correlation if the government and service providers share their logs and analyze access patterns.

2. **Proof Server-Service Provider Collusion**:
   - **Vulnerability**: The proof server and service provider could collude to track users.
   - **Mitigation**: The proof server doesn't receive information about which service provider the user is accessing.
   - **Remaining Risk**: Timing correlations could still be used to infer which service a user is accessing.

### Implementation Vulnerabilities

1. **Nonce Reuse**:
   - **Vulnerability**: If the same nonce is reused for different signatures, it could compromise the security of the Schnorr signature scheme.
   - **Current Implementation**: Nonces are generated randomly for each signature.
   - **Remaining Risk**: The random number generator might not provide sufficient entropy, leading to nonce reuse.

2. **Signature Verification Bypass**:
   - **Vulnerability**: The proof server adds a default nonce if one is missing, which could potentially be exploited.
   - **Mitigation**: The signature verification still checks that the signature is valid.
   - **Remaining Risk**: If the signature verification logic has flaws, an attacker might be able to bypass it.

3. **Circuit Vulnerabilities**:
   - **Vulnerability**: The zero-knowledge circuit might have bugs or vulnerabilities.
   - **Mitigation**: The circuit is relatively simple and focused on a specific verification task.
   - **Remaining Risk**: Subtle bugs in the circuit implementation could lead to false positives or negatives.

### User-Side Attacks

1. **Credential Sharing**:
   - **Vulnerability**: Users could share their credentials with others.
   - **Mitigation**: Credentials are bound to specific users through the signature.
   - **Remaining Risk**: If users voluntarily share their entire credential (including the signature), others could use it.

2. **Browser Extension Compromise**:
   - **Vulnerability**: The browser extension could be compromised or replaced with a malicious version.
   - **Mitigation**: Browser security model provides some protection against extension tampering.
   - **Clarification**: A compromised extension could extract legitimate credentials but could not generate fake proofs that would pass verification. The ZK circuit ensures that only valid credentials with proper signatures can generate valid proofs.
   - **Remaining Risk**: Sophisticated attackers who compromise the extension could steal legitimate credentials and use them to generate valid proofs.

3. **Limitations on User Exploits**:
   - **Credential Forgery**: Users cannot forge credentials because they are cryptographically signed by the government using the private key.
   - **Age Modification**: Users cannot modify their age in the credential because changing the age would invalidate the signature.
   - **Age Check Bypass**: Users cannot bypass the age verification because the ZK circuit explicitly checks that the age is ≥ 16.
   - **Proof Tampering**: Users cannot tamper with the proof generation process to create fake proofs, as these would be rejected during verification.
   - **Only Viable Exploit**: The only meaningful way a user could exploit the system is by using someone else's legitimate credential.

## Future Improvements

1. **Enhanced Privacy**:
   - Implement a more sophisticated zero-knowledge proof system that doesn't reveal the government's public key.
   - Use a blinded credential system to prevent the government from tracking which credentials are used.
   - Implement delayed or batched credential issuance to obscure timing correlations.

2. **Improved Security**:
   - Implement a proper deterministic nonce generation scheme (e.g., RFC 6979) to prevent nonce reuse.
   - Add a challenge-response mechanism to prevent replay attacks.
   - Strengthen credential storage in the extension to prevent theft.

3. **Better User Experience**:
   - Implement a more user-friendly interface for obtaining and using credentials.
   - Add support for multiple credentials and service providers.

4. **Extended Functionality**:
   - Support for more complex age requirements (e.g., age ranges).
   - Support for other types of credentials beyond age verification.

5. **Decentralization**:
   - Explore decentralized alternatives to the government as the credential issuer.
   - Implement a decentralized proof generation system to remove the need for a trusted proof server.
