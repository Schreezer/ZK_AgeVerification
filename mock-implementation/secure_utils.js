/**
 * Utilities for secure age verification with MiMC7 commitments and SHA256 signatures
 */

const crypto = require('crypto');
const circomlibjs = require('circomlibjs');

// Field size for BabyJub curve
const FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

// MiMC7 hasher instance
let mimc7;

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
 * Generate a random blinding factor
 * @returns {BigInt} A random blinding factor
 */
function generateBlindingFactor() {
    // Generate a random 32-byte buffer
    const randomBuffer = crypto.randomBytes(32);
    // Convert to BigInt
    return BigInt('0x' + randomBuffer.toString('hex')) % FIELD_SIZE;
}

/**
 * Generate a random nonce
 * @returns {BigInt} A random nonce
 */
function generateNonce() {
    // Generate a random 32-byte buffer
    const randomBuffer = crypto.randomBytes(32);
    // Convert to BigInt
    return BigInt('0x' + randomBuffer.toString('hex')) % FIELD_SIZE;
}

/**
 * Create a commitment to a value using MiMC7 hash
 * @param {Number} value - The value to commit to (e.g., age)
 * @param {BigInt} blindingFactor - The blinding factor
 * @returns {Promise<Object>} The commitment and the inputs used
 */
async function createCommitment(value, blindingFactor = null) {
    // If no blinding factor is provided, generate a random one
    if (blindingFactor === null) {
        blindingFactor = generateBlindingFactor();
    }

    // Initialize MiMC7
    const mimc = await initMimc7();
    const F = mimc.F;

    // Convert inputs to field elements
    const x = F.e(value.toString());
    const key = F.e(blindingFactor.toString());

    // Calculate hash
    const hash = mimc.hash(x, key);

    return {
        value,
        blindingFactor,
        commitment: F.toString(hash)
    };
}

/**
 * Verify a commitment using MiMC7 hash
 * @param {String} commitment - The commitment hash
 * @param {Number} value - The value that was committed
 * @param {BigInt} blindingFactor - The blinding factor used
 * @returns {Promise<Boolean>} True if the commitment is valid
 */
async function verifyCommitment(commitment, value, blindingFactor) {
    // Initialize MiMC7
    const mimc = await initMimc7();
    const F = mimc.F;

    // Convert inputs to field elements
    const x = F.e(value.toString());
    const key = F.e(blindingFactor.toString());

    // Calculate hash
    const hash = mimc.hash(x, key);

    // Compare with provided commitment
    return F.toString(hash) === commitment;
}

/**
 * Generate a key pair for the government
 * @returns {Promise<Object>} The key pair with privateKey and publicKey
 */
async function generateGovernmentKeyPair() {
    // Generate a random private key (as a field element)
    const privateKey = generateBlindingFactor();

    // For simplicity, we'll use the private key directly as the public key
    // In a real system, we would use a proper key derivation function
    const publicKey = privateKey;

    return {
        privateKey: privateKey.toString(),
        publicKey: publicKey.toString()
    };
}

/**
 * Sign a commitment with the government's private key using MiMC7
 * @param {String} commitment - The commitment to sign
 * @param {BigInt} nonce - The nonce to prevent replay attacks
 * @param {String} privateKey - The government's private key
 * @returns {Promise<Object>} The signature and related data
 */
async function signCommitment(commitment, nonce, privateKey) {
    // Initialize MiMC7
    const mimc = await initMimc7();
    const F = mimc.F;

    // Create the message hash (commitment + nonce)
    const messageHash = mimc.hash(
        F.e(commitment.toString()),
        F.e(nonce.toString())
    );

    // Sign the message hash with the private key
    const signature = mimc.hash(
        messageHash,
        F.e(privateKey.toString())
    );

    return {
        commitment,
        nonce,
        signature: F.toString(signature)
    };
}

/**
 * Verify a signature on a commitment using MiMC7
 * @param {String} commitment - The commitment that was signed
 * @param {BigInt} nonce - The nonce used in the signature
 * @param {String} signature - The signature to verify
 * @param {String} publicKey - The government's public key
 * @returns {Promise<Boolean>} True if the signature is valid
 */
async function verifySignature(commitment, nonce, signature, publicKey) {
    // Initialize MiMC7
    const mimc = await initMimc7();
    const F = mimc.F;

    // Create the message hash (commitment + nonce)
    const messageHash = mimc.hash(
        F.e(commitment.toString()),
        F.e(nonce.toString())
    );

    // Create the expected signature
    const expectedSignature = mimc.hash(
        messageHash,
        F.e(publicKey.toString())
    );

    // Compare with provided signature
    return F.toString(expectedSignature) === signature.toString();
}

/**
 * Issue a government credential for a user's age
 * @param {String} userId - The user's ID
 * @param {Number} age - The user's age
 * @param {String} privateKey - The government's private key
 * @param {String} publicKey - The government's public key
 * @returns {Promise<Object>} The credential with commitment, signature, etc.
 */
async function issueGovernmentCredential(userId, age, privateKey, publicKey) {
    // Create commitment to age
    const { value, blindingFactor, commitment } = await createCommitment(age);

    // Generate nonce
    const nonce = generateNonce();

    // Sign the commitment
    const { signature } = await signCommitment(commitment, nonce, privateKey);

    // Create the credential
    const credential = {
        userId,
        age,
        commitment,
        blindingFactor: blindingFactor.toString(),
        nonce: nonce.toString(),
        signature,
        publicKey,
        issuedAt: Date.now()
    };

    return credential;
}

module.exports = {
    generateBlindingFactor,
    generateNonce,
    createCommitment,
    verifyCommitment,
    generateGovernmentKeyPair,
    signCommitment,
    verifySignature,
    issueGovernmentCredential,
    initMimc7
};
