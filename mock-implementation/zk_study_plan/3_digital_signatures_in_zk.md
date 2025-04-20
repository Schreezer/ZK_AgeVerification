# Module 3: Digital Signatures in Zero-Knowledge

## Introduction to Digital Signatures

Digital signatures are cryptographic primitives that provide:

1. **Authentication**: Verify the identity of the signer
2. **Integrity**: Ensure the message hasn't been altered
3. **Non-repudiation**: Prevent the signer from denying they signed the message

In our age verification system, digital signatures are used to authenticate credentials issued by a trusted authority (like a government ID provider).

## Edwards-curve Digital Signature Algorithm (EdDSA)

EdDSA is a modern digital signature scheme that offers several advantages over older schemes like ECDSA:

1. **Deterministic**: Same message and key always produce the same signature
2. **Fast**: Efficient signature generation and verification
3. **Secure**: Resistant to various side-channel attacks
4. **Simple**: Easier to implement correctly than other signature schemes

### Mathematical Foundation of EdDSA

EdDSA operates on a special type of elliptic curve called a twisted Edwards curve, which has the form:

```
ax² + y² = 1 + dx²y²
```

The most common variants are:

- **Ed25519**: Uses the curve Curve25519 (designed for 128-bit security)
- **Ed448**: Uses the curve Curve448 (designed for 224-bit security)

### Key Components of EdDSA

1. **Private Key**: A random scalar value
2. **Public Key**: A point on the curve derived from the private key
3. **Message**: The data being signed
4. **Signature**: Consists of two components:
   - R: A point on the curve (derived from a deterministic nonce)
   - S: A scalar value that satisfies the verification equation

### EdDSA Signature Generation

At a high level, the EdDSA signature generation process involves:

1. Derive a deterministic nonce from the private key and message
2. Compute R = nonce * G (where G is the base point of the curve)
3. Compute h = H(R || A || M) (where H is a cryptographic hash function, A is the public key, and M is the message)
4. Compute S = nonce + h * privateKey
5. The signature is the pair (R, S)

### EdDSA Signature Verification

To verify an EdDSA signature (R, S) for a message M with public key A:

1. Compute h = H(R || A || M)
2. Check if S * G = R + h * A

If the equation holds, the signature is valid.

## EdDSA in Circom

Implementing EdDSA verification in a zero-knowledge circuit is complex but made easier by circomlib's EdDSA components.

### Key Components from Circomlib

```circom
include "node_modules/circomlib/circuits/eddsa.circom";
include "node_modules/circomlib/circuits/mimc.circom";
```

The main components are:

1. **EdDSAMiMCVerifier**: Verifies EdDSA signatures using the MiMC hash function
2. **MiMC7**: An efficient hash function designed for ZK circuits

### Example: EdDSA Verification Circuit

```circom
template EdDSAVerification() {
    // Public inputs
    signal input M; // Message hash
    
    // Private inputs
    signal input A[256]; // Public key bits
    signal input R8[256]; // R component bits
    signal input S[256]; // S component bits
    
    // Output
    signal output valid;
    
    // Verify EdDSA signature
    component eddsaVerifier = EdDSAMiMCVerifier();
    eddsaVerifier.M <== M;
    
    for (var i = 0; i < 256; i++) {
        eddsaVerifier.A[i] <== A[i];
        eddsaVerifier.R8[i] <== R8[i];
        eddsaVerifier.S[i] <== S[i];
    }
    
    valid <== eddsaVerifier.valid;
}
```

## Integrating EdDSA with Age Verification

In our age verification system, we combine EdDSA signature verification with age comparison:

1. The government issues a credential containing the user's age, signed with EdDSA
2. The user proves they have a valid credential AND that their age meets the requirement
3. The service provider verifies this proof without learning the actual age

### The Full Circuit

Let's examine the key parts of our `age_verification.circom` circuit:

```circom
template AgeVerificationWithEdDSA() {
    // Public input: age requirement
    signal input ageRequirement;

    // Private inputs
    signal input userAge;

    // EdDSA signature components
    signal input A[256];  // Public key bits
    signal input R8[256]; // Signature component R8
    signal input S[256];  // Signature component S
    signal input msg[32]; // Message bits (age encoded in 32 bits)

    // Output signal
    signal output isVerified;

    // ... (message preparation code) ...

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
```

This circuit:

1. Takes the age requirement as a public input
2. Takes the user's age and signature components as private inputs
3. Verifies the EdDSA signature on the age
4. Checks if the user's age meets the requirement
5. Outputs 1 only if both the signature is valid AND the age requirement is met

## JavaScript Implementation of EdDSA

Let's look at how EdDSA is implemented in JavaScript for our system:

### Key Generation

```javascript
async function generateEdDSAKeypair() {
    // Initialize libraries if not already done
    if (!babyJub || !eddsa) {
        await initializeLibraries();
    }

    // Generate random private key
    const privateKey = crypto.randomBytes(EDDSA_PRVKEY_LENGTH);

    // Generate public key using circomlib's babyJub
    const publicKey = await babyJub.mulPointEscalar(
        babyJub.Base8,
        Scalar.fromRprLE(privateKey, 0)
    );

    return {
        privateKey: privateKey,
        publicKey: publicKey
    };
}
```

### Signing

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

### Verification

```javascript
async function verifyEdDSASignature(msg, signature, publicKey) {
    try {
        // Ensure libraries are initialized
        const { babyJub, eddsa } = await initializeLibraries();

        // Format the message properly for verification
        let msgBuff;
        if (typeof msg === 'number' || typeof msg === 'string') {
            // If msg is a number or string (like age), convert to scalar and then to buffer
            const msgScalar = Scalar.fromString(msg.toString());
            msgBuff = utils.leInt2Buff(msgScalar, 32);
        } else if (Buffer.isBuffer(msg)) {
            // If already a buffer, use as is
            msgBuff = msg;
        } else if (Array.isArray(msg)) {
            // If it's a bit array, convert to buffer
            msgBuff = utils.bits2Buff(msg);
        } else {
            throw new Error('Unsupported message format for EdDSA verification');
        }

        // Verify the signature
        const isValid = await eddsa.verifyMiMC(msgBuff, signature, publicKey);
        return isValid;
    } catch (error) {
        console.error('Error in verifyEdDSASignature:', error);
        throw error;
    }
}
```

## Format Conversion for Circuit Compatibility

A critical aspect of using EdDSA with zero-knowledge circuits is ensuring the formats are compatible:

### Number to Bits Conversion

```javascript
function numberToBits(number, bits = 32) {
    // Convert to BigInt to handle larger numbers
    const num = BigInt(number);

    // Create a buffer with the number in little-endian format
    const buff = Buffer.alloc(Math.ceil(bits / 8));
    let tempNum = num;
    for (let i = 0; i < buff.length; i++) {
        buff[i] = Number(tempNum & 0xFFn);
        tempNum >>= 8n;
    }

    // Convert buffer to bit array
    const result = new Array(bits).fill(0);
    for (let i = 0; i < bits; i++) {
        const byteIdx = Math.floor(i / 8);
        const bitIdx = i % 8;
        if (byteIdx < buff.length) {
            result[i] = (buff[byteIdx] >> bitIdx) & 1;
        }
    }

    return result;
}
```

## Security Considerations

When using EdDSA in zero-knowledge proofs, several security considerations are important:

1. **Key Management**: Private keys must be securely stored and managed
2. **Deterministic Signatures**: EdDSA's deterministic nature helps prevent nonce reuse attacks
3. **Circuit Correctness**: The circuit must correctly implement the verification equation
4. **Format Compatibility**: Ensure consistent formats between JavaScript and Circom
5. **Hash Function Choice**: MiMC is used for efficiency in ZK circuits, but has different security properties than traditional hash functions

## Benefits of EdDSA for Age Verification

EdDSA offers several advantages for our age verification system:

1. **Efficiency**: EdDSA verification is relatively efficient in ZK circuits
2. **Security**: Strong cryptographic guarantees for credential authenticity
3. **Compatibility**: Well-supported in circomlib and other ZK libraries
4. **Determinism**: Predictable behavior, which is important for testing and debugging

## Next Steps

In the next module, we'll explore the overall architecture of our age verification system, including how the different components interact.

## References and Further Reading

1. "EdDSA for more curve" by D.J. Bernstein et al.: https://ed25519.cr.yp.to/ed25519-20110926.pdf
2. Circomlib EdDSA Implementation: https://github.com/iden3/circomlib/tree/master/circuits/eddsa.circom
3. "The Incredible Machine: How EdDSA Works" by Filippo Valsorda: https://blog.filippo.io/the-incredible-machine-how-eddsa-works/
4. "Understanding EdDSA" by Andrea Corbellini: https://cryptobook.nakov.com/digital-signatures/eddsa-and-ed25519
