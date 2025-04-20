# Module 6: Advanced Age Verification with EdDSA

## Introduction to Advanced Age Verification

In the previous module, we explored a simple age verification circuit that could prove a user meets an age requirement without revealing their actual age. However, that circuit had a significant limitation: it relied on the user to honestly provide their age without any verification.

In this module, we'll explore the advanced age verification circuit that addresses this limitation by incorporating EdDSA signature verification. This ensures that the age being used in the proof was issued by a trusted authority (like a government ID provider) and hasn't been tampered with.

## The Advanced Age Verification Circuit

Let's examine the `age_verification.circom` circuit:

```circom
pragma circom 2.0.0;

// Import required circomlib components
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/eddsa.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/mimc.circom";

// Age verification with EdDSA: verify signature and ensure userAge meets requirement
// This is an optimized version to reduce circuit complexity
template AgeVerificationWithEdDSA() {
    // Public input: age requirement
    signal input ageRequirement;

    // Private inputs
    signal input userAge;

    // EdDSA signature components
    signal input A[256];  // Public key bits
    signal input R8[256]; // Signature component R8
    signal input S[256];  // Signature component S
    signal input msg[32]; // Message bits (age encoded in 32 bits is sufficient)

    // Output signal
    signal output isVerified;

    // Prepare the message for EdDSA verification
    // Convert 32-bit message to 256-bit for EdDSA
    signal fullMsg[256];
    for (var i = 0; i < 32; i++) {
        fullMsg[i] <== msg[i];
    }
    for (var i = 32; i < 256; i++) {
        fullMsg[i] <== 0;
    }

    // Create MiMC hash component for EdDSA
    component mimc = MiMC7(91);
    var msgBits = 32; // We're using 32 bits for the age

    // Convert bit array to field elements for MiMC
    component bits2num = Bits2Num(msgBits);
    for (var i = 0; i < msgBits; i++) {
        bits2num.in[i] <== msg[i];
    }

    // Use the numeric value as input to MiMC
    mimc.x_in <== bits2num.out;
    mimc.k <== 0;

    // Verify EdDSA signature using the MiMC hash
    component eddsaVerifier = EdDSAMiMCVerifier();

    // Connect the MiMC hash output to the verifier
    eddsaVerifier.M <== mimc.out;

    // Connect the signature components
    for (var i = 0; i < 256; i++) {
        eddsaVerifier.A[i] <== A[i];
        eddsaVerifier.R8[i] <== R8[i];
        eddsaVerifier.S[i] <== S[i];
    }

    // Verify age requirement
    component ge = GreaterEqThan(32);
    ge.in[0] <== userAge;
    ge.in[1] <== ageRequirement;

    // Final verification: both signature must be valid AND age requirement met
    signal sigValid;
    sigValid <== eddsaVerifier.valid;

    // Both conditions must be met: valid signature AND meets age requirement
    isVerified <== sigValid * ge.out; // Multiplication acts as AND in circom
}

// Public signals: ageRequirement and verification result
component main { public [ageRequirement] } = AgeVerificationWithEdDSA();
```

### Key Components

1. **Inputs**:
   - `ageRequirement`: The minimum age required (public input)
   - `userAge`: The user's actual age (private input)
   - `A[256]`: The public key bits (private input)
   - `R8[256]`: The R component of the EdDSA signature (private input)
   - `S[256]`: The S component of the EdDSA signature (private input)
   - `msg[32]`: The message bits (age encoded in 32 bits) (private input)

2. **Output**:
   - `isVerified`: Boolean result (1 if signature is valid AND age requirement is met, 0 otherwise)

3. **Components**:
   - `MiMC7`: A hash function optimized for ZK circuits
   - `Bits2Num`: Converts a bit array to a number
   - `EdDSAMiMCVerifier`: Verifies an EdDSA signature using MiMC hash
   - `GreaterEqThan`: Checks if one number is greater than or equal to another

### How It Works

1. **Message Preparation**:
   - The 32-bit message (age) is padded to 256 bits for EdDSA verification
   - The message is converted from bits to a number using `Bits2Num`
   - The number is hashed using MiMC

2. **Signature Verification**:
   - The `EdDSAMiMCVerifier` component verifies that the signature (R8, S) is valid for the message with the given public key (A)
   - The result is stored in `sigValid`

3. **Age Verification**:
   - The `GreaterEqThan` component checks if `userAge >= ageRequirement`
   - The result is combined with `sigValid` using multiplication (which acts as AND in circom)

4. **Final Result**:
   - `isVerified` is 1 only if both the signature is valid AND the age requirement is met
   - Otherwise, `isVerified` is 0

## Understanding the EdDSA Verification Components

### MiMC Hash Function

MiMC (Minimal Multiplicative Complexity) is a hash function designed specifically for ZK circuits:

```circom
component mimc = MiMC7(91);
mimc.x_in <== bits2num.out;
mimc.k <== 0;
```

- `MiMC7(91)` creates a MiMC hash with 91 rounds
- `x_in` is the input to hash (the age as a number)
- `k` is a constant (set to 0 in this case)

### EdDSAMiMCVerifier

This component verifies an EdDSA signature:

```circom
component eddsaVerifier = EdDSAMiMCVerifier();
eddsaVerifier.M <== mimc.out;

for (var i = 0; i < 256; i++) {
    eddsaVerifier.A[i] <== A[i];
    eddsaVerifier.R8[i] <== R8[i];
    eddsaVerifier.S[i] <== S[i];
}
```

- `M` is the hashed message
- `A` is the public key bits
- `R8` is the R component of the signature
- `S` is the S component of the signature
- `valid` is the output (1 if valid, 0 if invalid)

## JavaScript Implementation

Let's look at how the advanced age verification is implemented in JavaScript:

### Government Credential Issuer

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

### User Agent Proof Generator

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

### Service Provider Verifier

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

## EdDSA Signature Generation

The `signAge` function in `eddsa_utils.js` is responsible for generating an EdDSA signature on the user's age:

```javascript
async function signAge(age, privateKey) {
    try {
        // Ensure libraries are initialized
        const { babyJub, eddsa } = await initializeLibraries();

        // Format the age as a field element (Scalar)
        const ageScalar = Scalar.fromString(age.toString());
        const msgBuff = utils.leInt2Buff(ageScalar, 32); // 32 bytes for the message

        // Create the EdDSA signature using MiMC hash
        const signature = await eddsa.signMiMC(privateKey, msgBuff);

        // Get the public key from the private key
        const publicKey = await eddsa.prv2pub(privateKey);

        // Convert the age to bits for the circuit (32 bits is enough for age)
        const msg = numberToBits(age, 32);

        // Convert signature components to bit arrays
        // These conversions are critical for compatibility with the circuit
        const A = Array(256).fill(0);
        const R8 = Array(256).fill(0);
        const S = Array(256).fill(0);

        // Convert public key (A) to bits
        const pubKeyX = publicKey[0];
        const pubKeyBits = utils.leInt2Bits(pubKeyX, 256);
        for (let i = 0; i < pubKeyBits.length && i < 256; i++) {
            A[i] = pubKeyBits[i];
        }

        // Convert R8 to bits
        const R8X = signature.R8[0];
        const R8Bits = utils.leInt2Bits(R8X, 256);
        for (let i = 0; i < R8Bits.length && i < 256; i++) {
            R8[i] = R8Bits[i];
        }

        // Convert S to bits
        const SBits = utils.leInt2Bits(signature.S, 256);
        for (let i = 0; i < SBits.length && i < 256; i++) {
            S[i] = SBits[i];
        }

        return {
            R8,
            S,
            A,
            msg
        };
    } catch (error) {
        console.error('Error in signAge:', error);
        throw error;
    }
}
```

This function:
1. Formats the age as a field element
2. Signs it using EdDSA with MiMC hash
3. Converts the signature components to bit arrays for the circuit
4. Returns the signature components (R8, S, A) and the message bits

## Circuit Compilation and Setup

The process for compiling and setting up the advanced circuit is similar to the simple one:

```bash
# Compile the circuit
circom age_verification.circom --r1cs --wasm --sym

# Generate the trusted setup
snarkjs groth16 setup age_verification.r1cs ptau/pot12_final.ptau age_verification.zkey

# Export the verification key
snarkjs zkey export verificationkey age_verification.zkey verification_key.json
```

## Advantages of the Advanced Circuit

The advanced circuit offers several advantages over the simple one:

1. **Authentication**: The age is signed by a trusted authority, ensuring its authenticity
2. **Tamper Resistance**: Any modification to the age would invalidate the signature
3. **Credential Verification**: The circuit verifies both the age requirement and the credential's validity
4. **Privacy Preservation**: The user's actual age remains private

## Security Considerations

### 1. Key Management

The security of the system relies on proper key management:

- The government's private key must be securely stored
- Compromise of the private key would allow forging credentials

### 2. Signature Malleability

EdDSA signatures are designed to be non-malleable, meaning:

- An attacker cannot modify a valid signature to create another valid signature
- This prevents various attacks on the signature scheme

### 3. Circuit Correctness

The circuit must correctly implement the verification logic:

- Any bugs in the circuit could lead to false positives or negatives
- Formal verification of circuits is an active research area

### 4. Trusted Setup

zk-SNARKs require a trusted setup phase:

- If the randomness used in the setup is compromised, false proofs could be generated
- Multi-party computation can be used to make the setup more secure

## Performance Considerations

The advanced circuit is more complex than the simple one, which affects performance:

1. **Circuit Size**: More constraints mean larger circuit size
2. **Proving Time**: More complex circuits take longer to generate proofs
3. **Memory Usage**: Higher memory requirements for proof generation
4. **Verification Time**: Verification remains efficient regardless of circuit complexity

## Testing the Advanced Circuit

Let's look at how we can test the advanced age verification circuit:

```javascript
// Test with a user over the age requirement
const result1 = await runFullVerificationFlow('user1', 18); // user1 is 25
console.log('User over age requirement:', result1.success); // true

// Test with a user under the age requirement
const result2 = await runFullVerificationFlow('user2', 18); // user2 is 16
console.log('User under age requirement:', result2.success); // false

// Test with a user exactly at the age requirement
const result3 = await runFullVerificationFlow('user3', 18); // user3 is 18
console.log('User exactly at age requirement:', result3.success); // true

// Test with a non-existent user
const result4 = await runFullVerificationFlow('nonExistentUser', 18);
console.log('Non-existent user:', result4.success); // false

// Test with a tampered credential
// This would require modifying the code to simulate tampering
```

## Circuit Optimization Techniques

Several techniques can be used to optimize the circuit:

1. **Bit Packing**: Using fewer bits for values when possible
2. **Efficient Components**: Using optimized components from circomlib
3. **Circuit Simplification**: Removing unnecessary constraints
4. **Parallel Computation**: Structuring the circuit to allow parallel computation

## Next Steps

In the next module, we'll explore practical implementation and testing of the full age verification system.

## References and Further Reading

1. "EdDSA for more curve" by D.J. Bernstein et al.: https://ed25519.cr.yp.to/ed25519-20110926.pdf
2. "MiMC: Efficient Encryption and Cryptographic Hashing with Minimal Multiplicative Complexity" by Albrecht et al.: https://eprint.iacr.org/2016/492.pdf
3. Circomlib EdDSA Implementation: https://github.com/iden3/circomlib/tree/master/circuits/eddsa.circom
4. "Zero-Knowledge Proofs for Identity Verification" by Iden3: https://iden3.io/post/zkp-for-identity-verification
