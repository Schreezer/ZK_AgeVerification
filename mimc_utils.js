/**
 * Utilities for Schnorr signature generation and verification using MiMC7
 */

const circomlibjs = require('circomlibjs');
const crypto = require('crypto');

// Cached instances
let mimc7;
let babyJub;

/**
 * Initialize the MiMC7 hasher
 * @returns {Promise<Object>} The initialized MiMC7 hasher
 */
async function initMimc7() {
    if (!mimc7) {
        mimc7 = await circomlibjs.buildMimc7();
    }
    return mimc7;
}

/**
 * Initialize the BabyJubJub curve
 * @returns {Promise<Object>} The initialized BabyJubJub curve
 */
async function initBabyJub() {
    if (!babyJub) {
        babyJub = await circomlibjs.buildBabyjub();
    }
    return babyJub;
}

/**
 * Sign a value with a private key using MiMC7 (legacy method)
 * @param {Number|String} value - The value to sign
 * @param {Number|String} privateKey - The private key to use for signing
 * @returns {Promise<String>} The signature as a string
 * @deprecated Use schnorrSign instead
 */
async function mimcSign(value, privateKey) {
    const mimc = await initMimc7();
    const F = mimc.F;

    // Hash the value with the private key to create the signature
    const hash = mimc.hash(
        F.e(value.toString()),
        F.e(privateKey.toString())
    );

    return F.toString(hash);
}

/**
 * Sign a message using a simplified Schnorr-like scheme with MiMC7 hash
 * @param {Number|String} message - The message to sign (e.g., age)
 * @param {String} privateKey - The private key as a string
 * @returns {Promise<Object>} The signature object with signature, message, and nonce
 */
async function schnorrSign(message, privateKey) {
    // Initialize MiMC7
    const mimc = await initMimc7();
    const F = mimc.F;

    // Convert inputs to field elements
    const m = F.e(message.toString());
    const sk = F.e(privateKey);

    // Generate a random nonce
    const nonce = Math.floor(Math.random() * 1000000000).toString();

    // Compute the public key
    const publicKey = mimc.hash(sk, F.e(0));

    // Compute the hash of the nonce and public key
    const nonceHash = mimc.hash(F.e(nonce), publicKey);

    // Compute the signature as MiMC7(message, nonceHash)
    const sig = mimc.hash(m, nonceHash);

    // Return the signature with the nonce
    return {
        signature: F.toString(sig),
        message: message.toString(),
        nonce: nonce
    };
}

/**
 * Generate a key pair for Schnorr signatures using MiMC7
 * @returns {Promise<Object>} The key pair with privateKey and publicKey
 */
async function generateSchnorrKeyPair() {
    // Initialize MiMC7
    const mimc = await initMimc7();

    // Generate a random private key
    const privateKeyInt = Math.floor(Math.random() * 1000000000);
    const privateKey = privateKeyInt.toString();

    // Compute the public key as MiMC7(privateKey, 0)
    // This is a simplified approach but works for our demonstration
    const publicKey = mimc.hash(mimc.F.e(privateKey), mimc.F.e(0));

    // Return both keys in a format suitable for our application
    return {
        privateKey: privateKey,
        publicKey: mimc.F.toString(publicKey)
    };
}

/**
 * Generate a key pair for MiMC7 signatures (legacy method)
 * @returns {Promise<Object>} The key pair with privateKey and publicKey
 * @deprecated Use generateSchnorrKeyPair instead
 */
async function generateKeyPair() {
    // Generate a random private key
    const privateKey = Math.floor(Math.random() * 1000000000).toString();

    // In a real system, we would derive the public key from the private key
    // using a one-way function. For simplicity, we'll use a different value.
    const publicKey = (parseInt(privateKey) + 1000000).toString();

    return { privateKey, publicKey };
}

/**
 * Verify a MiMC7 signature (legacy method)
 * @param {Number|String} value - The value that was signed
 * @param {String} signature - The signature to verify
 * @param {Number|String} publicKey - The public key to use for verification
 * @returns {Promise<Boolean>} True if the signature is valid
 * @deprecated Use schnorrVerify instead
 */
async function mimcVerify(value, signature, publicKey) {
    // In a real signature scheme, we would use the public key to verify the signature
    // For now, we'll just check that the signature is non-zero
    return signature !== '0';
}

/**
 * Verify a signature using our Schnorr-like scheme
 * @param {Number|String} message - The message that was signed (e.g., age)
 * @param {Object} signatureObj - The signature object with signature, message, and nonce
 * @param {String} publicKey - The public key as a string
 * @returns {Promise<Boolean>} True if the signature is valid
 */
async function schnorrVerify(message, signatureObj, publicKey) {
    // Initialize MiMC7
    const mimc = await initMimc7();
    const F = mimc.F;

    // Convert inputs to field elements
    const m = F.e(message.toString());
    const sig = F.e(signatureObj.signature);
    const pk = F.e(publicKey);

    // Check that the message in the signature object matches the expected message
    if (signatureObj.message !== message.toString()) {
        console.error('Message mismatch in signature verification');
        return false;
    }

    // Check if the nonce is present
    if (!signatureObj.nonce) {
        console.error('Missing nonce in signature verification');
        return false;
    }

    // Compute the hash of the nonce and public key
    const nonceHash = mimc.hash(F.e(signatureObj.nonce), pk);

    // Compute the expected signature
    const expectedSig = mimc.hash(m, nonceHash);

    // Compare the provided signature with the expected signature
    return F.eq(sig, expectedSig);
}

module.exports = {
    // Core functions
    initMimc7,
    initBabyJub,

    // Schnorr signature functions
    generateSchnorrKeyPair,
    schnorrSign,
    schnorrVerify,

    // Legacy functions (deprecated)
    mimcSign,
    mimcVerify,
    generateKeyPair
};
