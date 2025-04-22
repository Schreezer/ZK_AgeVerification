/**
 * Utilities for MiMC-based commitments in the ZK age verification system
 * Using circomlibjs for MiMC7 hash function
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
 * Create a commitment to a value using MiMC7 hash
 * @param {Number} value - The value to commit to (e.g., age)
 * @param {BigInt} blindingFactor - The blinding factor
 * @returns {Promise<Object>} The commitment and the inputs used
 */
async function createPedersenCommitment(value, blindingFactor = null) {
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
async function verifyPedersenCommitment(commitment, value, blindingFactor) {
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

module.exports = {
    generateBlindingFactor,
    createPedersenCommitment,
    verifyPedersenCommitment,
    initMimc7
};