# EdDSA Compatibility Fix for ZK Age Verification

This document explains the changes made to fix the circomlibjs library compatibility issues in the ZK Age Verification project.

## Problem Description

The original implementation faced several challenges with the circomlibjs library:

1. **Library Initialization**: The circomlibjs library requires asynchronous initialization, which was causing race conditions and timing issues.
2. **Message Format**: The format of the message being signed was not compatible with what the EdDSA implementation expected.
3. **Bit Representation**: The conversion between different bit representations for age, signatures, etc. was causing errors.
4. **Circuit Implementation**: The circuit was not correctly handling the EdDSA verification with the provided inputs.

## Solutions Implemented

### 1. Improved Library Initialization

- Implemented a singleton pattern for library initialization to prevent multiple initializations
- Added proper error handling for initialization failures
- Used promises to ensure the library is fully loaded before any operations

```javascript
let initializationPromise = null;

async function initializeLibraries() {
    // If already initializing, return the existing promise
    if (initializationPromise) {
        return initializationPromise;
    }
    
    // If already initialized, return immediately
    if (babyJub && eddsa) {
        return { babyJub, eddsa };
    }
    
    // Start initialization and store the promise
    initializationPromise = (async () => {
        try {
            const circomlibjs = require('circomlibjs');
            babyJub = await circomlibjs.buildBabyjub();
            eddsa = await circomlibjs.buildEddsa();
            console.log('Successfully initialized circomlibjs libraries');
            return { babyJub, eddsa };
        } catch (error) {
            console.error('Failed to initialize circomlibjs libraries:', error);
            // Reset the promise so we can try again
            initializationPromise = null;
            throw error;
        }
    })();
    
    return initializationPromise;
}
```

### 2. Fixed Bit Representation

- Updated the `numberToBits` function to ensure it produces the correct bit format
- Ensured consistent bit ordering (little-endian) across all conversions
- Used the ffjavascript utilities for bit conversions

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

### 3. Corrected Message Format

- Updated the message preparation to match what the EdDSA verifier expects
- Used proper scalar conversion for the age value
- Ensured consistent format between signing and verification

```javascript
// Format the age as a field element (Scalar)
const ageScalar = Scalar.fromString(age.toString());
const msgBuff = utils.leInt2Buff(ageScalar, 32); // 32 bytes for the message

// Create the EdDSA signature using MiMC hash
const signature = await eddsa.signMiMC(privateKey, msgBuff);
```

### 4. Updated Circuit Implementation

- Modified the circuit to use MiMC hash for EdDSA verification
- Added proper bit conversion in the circuit
- Ensured the signature verification is properly connected to the output

```circom
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
```

## Testing the Fix

A test script `test_eddsa_compatibility.js` has been created to verify the compatibility fixes. This script:

1. Initializes the circomlibjs library
2. Generates an EdDSA keypair
3. Signs a sample age value
4. Verifies the signature directly (without using the circuit)

To run the test:

```bash
node test_eddsa_compatibility.js
```

## Next Steps

After confirming the EdDSA compatibility is fixed, you can proceed with:

1. Compiling the updated circuit
2. Generating new proving and verification keys
3. Testing the full ZK age verification flow with EdDSA signatures

## Conclusion

These changes address the circomlibjs library compatibility issues by ensuring proper initialization, consistent bit representation, correct message format, and updated circuit implementation. The EdDSA signature verification should now work correctly with the ZK age verification system.
