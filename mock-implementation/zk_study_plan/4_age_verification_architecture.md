# Module 4: Age Verification System Architecture

## System Overview

Our zero-knowledge age verification system involves three main parties:

1. **Service Provider**: Requests age verification (e.g., a website requiring users to be 18+)
2. **User Agent**: Acts on behalf of the user (e.g., a browser extension)
3. **Government Identity Provider**: Issues age credentials (e.g., a digital ID authority)

The system allows users to prove they meet age requirements without revealing their actual age, using zero-knowledge proofs and digital signatures.

## System Components

### 1. Service Provider

The service provider is the entity requesting age verification. It:

- Initiates verification requests with specific age requirements
- Receives and verifies zero-knowledge proofs
- Makes access decisions based on verification results

**Key Functions:**
- `mockServiceProviderRequest()`: Initiates a verification request
- `mockServiceProviderVerifier()`: Verifies the proof submitted by the user

### 2. User Agent

The user agent acts on behalf of the user. It:

- Requests credentials from the government identity provider
- Generates zero-knowledge proofs
- Submits proofs to service providers

**Key Functions:**
- `mockUserAgentProofGenerator()`: Generates a ZK proof using the user's credential

### 3. Government Identity Provider

The government identity provider is a trusted authority that:

- Maintains a database of verified user identities and ages
- Issues digitally signed credentials
- Provides public keys for verification

**Key Functions:**
- `mockGovernmentCredentialIssuer()`: Issues a signed credential containing the user's age
- `generateEdDSAKeypair()`: Generates keypairs for signing credentials

## Data Flow

The verification process follows these steps:

1. **Request Initiation**:
   - Service provider specifies an age requirement
   - User agent receives this request

2. **Credential Acquisition**:
   - User agent requests a credential from the government provider
   - Government provider authenticates the user
   - Government provider issues a signed credential containing the user's age

3. **Proof Generation**:
   - User agent receives the credential
   - User agent generates a zero-knowledge proof that:
     - The credential is valid (signature verification)
     - The user's age meets the requirement

4. **Verification**:
   - User agent submits the proof to the service provider
   - Service provider verifies the proof
   - Service provider grants or denies access based on the result

## Sequence Diagram

```
┌─────────────────┐          ┌────────────┐          ┌─────────────┐
│ Service Provider│          │ User Agent │          │ Government  │
└────────┬────────┘          └─────┬──────┘          └──────┬──────┘
         │                         │                        │
         │ 1. Request Verification │                        │
         │────────────────────────>│                        │
         │ (age_requirement)       │                        │
         │                         │                        │
         │                         │ 2. Request Credential  │
         │                         │───────────────────────>│
         │                         │                        │
         │                         │                        │ 3. Authenticate User
         │                         │                        │──────────────────┐
         │                         │                        │                  │
         │                         │                        │<─────────────────┘
         │                         │                        │
         │                         │ 4. Issue Credential    │
         │                         │<───────────────────────│
         │                         │ (signed with EdDSA)    │
         │                         │                        │
         │                         │ 5. Generate ZK Proof   │
         │                         │──────────────────┐     │
         │                         │                  │     │
         │                         │<─────────────────┘     │
         │                         │                        │
         │ 6. Submit Proof         │                        │
         │<────────────────────────│                        │
         │                         │                        │
         │ 7. Verify Proof         │                        │
         │──────────────┐          │                        │
         │              │          │                        │
         │<─────────────┘          │                        │
         │                         │                        │
         │ 8. Access Decision      │                        │
         │────────────────────────>│                        │
         │                         │                        │
```

## Data Structures

### 1. Credential

The credential issued by the government contains:

```javascript
{
  userId: string,       // Identifier for the user
  age: number,          // User's actual age
  issuedAt: timestamp,  // When the credential was issued
  signature: {          // EdDSA signature components
    R8: number[256],    // R component as bit array
    S: number[256],     // S component as bit array
    A: number[256],     // Public key as bit array
    msg: number[32]     // Message (age) as bit array
  }
}
```

### 2. Zero-Knowledge Proof

The proof generated by the user agent contains:

```javascript
{
  proof: {              // zk-SNARK proof
    pi_a: number[3],    // Proof component A
    pi_b: number[3][2], // Proof component B
    pi_c: number[3],    // Proof component C
    protocol: "groth16" // Proof protocol
  },
  publicSignals: [      // Public inputs to the circuit
    ageRequirement,     // The required age
    isVerified          // Result of verification (1 or 0)
  ],
  metadata: {           // Additional information (not part of the proof)
    userId: string,     // User identifier
    meetsAgeRequirement: boolean // Expected result
  }
}
```

## Privacy Considerations

The system is designed with privacy as a primary concern:

1. **Zero-Knowledge Property**:
   - The service provider learns only whether the user meets the age requirement
   - The actual age remains confidential
   - The proof reveals nothing beyond the validity of the statement

2. **Data Minimization**:
   - Only necessary information is included in the proof
   - No persistent identifiers are required

3. **Credential Security**:
   - Credentials are signed to prevent forgery
   - The user maintains control over when to use their credential

## Security Model

### Trust Assumptions

The security of the system relies on several trust assumptions:

1. **Government Identity Provider**:
   - Trusted to correctly verify user identities
   - Trusted to issue accurate credentials
   - Trusted to maintain the security of its signing keys

2. **User Agent**:
   - Trusted by the user to protect their credentials
   - Trusted to generate proofs correctly

3. **Service Provider**:
   - Not trusted with the user's personal data
   - Only trusted to verify proofs correctly

### Threat Model

The system defends against several threats:

1. **Malicious Service Provider**:
   - Attempting to learn the user's actual age
   - Attempting to reuse proofs for other purposes

2. **Malicious User**:
   - Attempting to forge credentials
   - Attempting to modify their age
   - Attempting to reuse someone else's credential

3. **External Attackers**:
   - Attempting to intercept or modify communications
   - Attempting to forge proofs

### Security Measures

1. **Cryptographic Protections**:
   - EdDSA signatures for credential authenticity
   - zk-SNARKs for privacy-preserving verification
   - JWT for secure credential transport

2. **Protocol Safeguards**:
   - Verification of age requirements in the proof
   - Timestamp in credentials to limit validity period

## Implementation Flow

Let's examine how the flow is implemented in our mock system:

### 1. Full Verification Flow

```javascript
async function runFullVerificationFlow(userId, customAgeRequirement = null) {
    console.log(`\n=== Starting verification flow for user ${userId} ===\n`);

    // Step 1: Service provider initiates a request
    const { ageRequirement } = mockServiceProviderRequest(customAgeRequirement);

    // Step 2: User agent requests credential from government
    const { signedCredential, error: govError } = await mockGovernmentCredentialIssuer(userId);
    if (govError) {
        console.log(`Verification flow failed: ${govError}`);
        return { success: false, error: govError };
    }

    // Step 3: User agent generates a ZK proof
    const { proof, publicSignals, metadata, error: proofError } =
        await mockUserAgentProofGenerator(signedCredential, ageRequirement);
    if (proofError) {
        console.log(`Verification flow failed: ${proofError}`);
        return { success: false, error: proofError };
    }

    // Step 4: Service provider verifies the proof
    const isVerified = await mockServiceProviderVerifier(proof, publicSignals, ageRequirement);

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
```

### 2. Service Provider Request

```javascript
function mockServiceProviderRequest(customAgeRequirement = null) {
    console.log('Service Provider: Initiating age verification request');

    // Set the age requirement
    let ageRequirement = customAgeRequirement !== null ? customAgeRequirement : 18;
    // Clamp negative age requirement
    if (ageRequirement < 0) {
        console.warn('Service Provider: Negative age requirement received, defaulting to 0');
        ageRequirement = 0;
    }

    console.log(`Service Provider: Set age requirement to ${ageRequirement}`);
    return { ageRequirement };
}
```

### 3. Government Credential Issuer

```javascript
async function mockGovernmentCredentialIssuer(userId) {
    console.log(`Government: Received credential request for user ${userId}`);

    if (!USERS[userId] || USERS[userId] === null) {
        console.log(`Government: User ${userId} not found or has no data`);
        return { error: 'User not found or has no data' };
    }

    const userAge = USERS[userId].age;

    // Ensure we have a government keypair
    const keypair = await ensureGovernmentKeypair();

    // Sign the age using EdDSA
    const signature = await signAge(userAge, keypair.privateKey);

    // Create credential data
    const credential = {
        userId,
        age: userAge,
        issuedAt: Date.now(),
        signature
    };

    // Sign the full credential with JWT for transport
    const signedCredential = jwt.sign(credential, GOVERNMENT_SECRET_KEY);

    console.log(`Government: Issued credential for user ${userId} with age ${userAge}`);
    return { signedCredential };
}
```

### 4. User Agent Proof Generator

```javascript
async function mockUserAgentProofGenerator(signedCredential, ageRequirement) {
    console.log('User Agent: Generating ZK proof');

    try {
        // Decode the JWT to get the credential
        const credential = jwt.verify(signedCredential, GOVERNMENT_SECRET_KEY);

        // Prepare inputs for the ZK circuit
        const circuitInputs = {
            ageRequirement,
            userAge: credential.age,
            A: credential.signature.A,
            R8: credential.signature.R8,
            S: credential.signature.S,
            msg: credential.signature.msg
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
```

### 5. Service Provider Verifier

```javascript
async function mockServiceProviderVerifier(proof, publicSignals, ageRequirement) {
    console.log('Service Provider: Verifying ZK proof');

    try {
        // Load verification key
        const vkeyPath = './verification_key.json';
        const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));

        // Verify SNARK proof
        let proofValid = false;
        try {
            proofValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
        } catch (e) {
            console.error('Service Provider: Error during SNARK verification', e);
            return false;
        }

        // The first public signal is the age requirement
        // The second public signal is isVerified (1 if valid, 0 if invalid)
        const providedAgeReq = Number(publicSignals[0]);
        const isVerified = publicSignals[1] === '1';

        if (!proofValid) {
            console.log('Service Provider: Proof verification failed');
            return false;
        }
        if (providedAgeReq !== ageRequirement) {
            console.log('Service Provider: Age requirement mismatch');
            return false;
        }
        if (!isVerified) {
            console.log('Service Provider: Proof valid but requirements not met');
            return false;
        }

        console.log('Service Provider: Verification successful - Age requirement met and signature valid');
        return true;
    } catch (error) {
        console.error('Service Provider: Error verifying proof', error);
        return false;
    }
}
```

## Scalability and Performance

The system's performance characteristics include:

1. **Proof Generation**:
   - Computationally intensive for the user agent
   - Typically takes a few seconds on modern hardware
   - Can be optimized with circuit design improvements

2. **Proof Verification**:
   - Very efficient (milliseconds)
   - Suitable for high-volume service providers

3. **Credential Issuance**:
   - Similar to traditional authentication systems
   - Can leverage existing identity infrastructure

## Extensions and Variations

The basic architecture can be extended in several ways:

1. **Multiple Credential Types**:
   - Support for different types of credentials (e.g., age, citizenship, education)
   - Selective disclosure of credential attributes

2. **Revocation**:
   - Mechanisms for revoking compromised credentials
   - Revocation lists or accumulators

3. **Decentralized Identity**:
   - Integration with decentralized identity systems
   - Self-sovereign identity principles

4. **Mobile Implementation**:
   - Mobile wallet for credential storage
   - NFC or QR code interaction with service providers

## Next Steps

In the next module, we'll dive deeper into the simple age verification circuit, understanding how it works and how to implement it.

## References and Further Reading

1. "Privacy-Preserving Identity Systems: A Framework" by Sovrin Foundation: https://sovrin.org/wp-content/uploads/Privacy-Preserving-Identity-Systems-Framework.pdf
2. "Zero-Knowledge Proofs for Identity Verification" by Iden3: https://iden3.io/post/zkp-for-identity-verification
3. "Self-Sovereign Identity: The Future of Identity" by Sovrin Foundation: https://sovrin.org/wp-content/uploads/2018/03/The-Inevitable-Rise-of-Self-Sovereign-Identity.pdf
4. "The Path to Self-Sovereign Identity" by Christopher Allen: http://www.lifewithalacrity.com/2016/04/the-path-to-self-soverereign-identity.html
