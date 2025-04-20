const crypto = require('crypto');
const createBlakeHash = require('blake-hash');
const { Scalar, utils } = require('ffjavascript');

// circomlibjs needs to be initialized asynchronously
let babyJub, eddsa;
let initializationPromise = null;

/**
 * Initialize circomlibjs libraries with proper singleton pattern
 * to prevent multiple initializations and race conditions
 */
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

// Constants for the EdDSA parameters
const EDDSA_PRVKEY_LENGTH = 32;
const MSG_LENGTH = 256; // Number of bits for message

/**
 * Generate EdDSA keypair
 */
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

/**
 * Convert a number to its bit array representation
 * Ensures consistent bit ordering compatible with circom circuits
 */
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

/**
 * Convert a buffer to bits (helper function since utils.leBuff2Bits might not be available)
 */
function bufferToBits(buff, numBits) {
    const res = new Array(numBits).fill(0);
    for (let i = 0; i < buff.length && i*8 < numBits; i++) {
        const b = buff[i];
        for (let j = 0; j < 8 && i*8+j < numBits; j++) {
            res[i*8+j] = (b >> j) & 1;
        }
    }
    return res;
}

/**
 * Convert a scalar to bits (helper function)
 */
function scalarToBits(scalar, numBits) {
    const buff = utils.leInt2Buff(scalar, Math.ceil(numBits / 8));
    return bufferToBits(buff, numBits);
}

/**
 * Sign a message (user's age) using EdDSA
 * Properly formats the message and signature for circom compatibility
 */
async function signAge(age, privateKey) {
    try {
        // Ensure libraries are initialized
        const { babyJub, eddsa } = await initializeLibraries();

        // Format the age as a field element (Scalar)
        // This is critical for compatibility with the circuit
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
        // Note: In circomlibjs, we need to use the point coordinates directly
        // instead of packPoint which doesn't exist in the latest version
        const pubKeyX = publicKey[0];
        // Convert the public key X coordinate to bits
        const pubKeyBits = scalarToBits(Scalar.fromRprLE(pubKeyX, 0, pubKeyX.length), 256);
        for (let i = 0; i < pubKeyBits.length && i < 256; i++) {
            A[i] = pubKeyBits[i];
        }

        // Convert R8 to bits
        // Use the point coordinates directly
        const R8X = signature.R8[0];
        const R8Bits = scalarToBits(Scalar.fromRprLE(R8X, 0, R8X.length), 256);
        for (let i = 0; i < R8Bits.length && i < 256; i++) {
            R8[i] = R8Bits[i];
        }

        // Convert S to bits
        const SBits = scalarToBits(signature.S, 256);
        for (let i = 0; i < SBits.length && i < 256; i++) {
            S[i] = SBits[i];
        }

        console.log('Successfully generated EdDSA signature for age:', age);

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

/**
 * Verify an EdDSA signature
 * Properly handles the message and signature format for verification
 */
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
        console.log('EdDSA signature verification result:', isValid);
        return isValid;
    } catch (error) {
        console.error('Error in verifyEdDSASignature:', error);
        throw error;
    }
}

module.exports = {
    generateEdDSAKeypair,
    signAge,
    verifyEdDSASignature,
    numberToBits,
    bufferToBits,
    scalarToBits
};
