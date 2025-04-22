/**
 * Utilities for government backend
 */

const crypto = require('crypto');
const circomlibjs = require('circomlibjs');
const fs = require('fs');
const path = require('path');

// Field size for BabyJub curve
const FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

// Constants
const KEYS_FILE_PATH = path.join(__dirname, 'government_keys.json');
const FIXED_AGE_REQUIREMENT = 16;

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
 * Generate a key pair for the government
 * @returns {Promise<Object>} The key pair with privateKey and publicKey
 */
async function generateGovernmentKeyPair() {
    // Generate a random private key (as a field element)
    const privateKey = crypto.randomBytes(32);
    const privateKeyBigInt = BigInt('0x' + privateKey.toString('hex')) % FIELD_SIZE;
    
    // For simplicity, we'll use the private key directly as the public key
    // In a real system, we would use a proper key derivation function
    const publicKey = privateKeyBigInt;
    
    return { 
        privateKey: privateKeyBigInt.toString(),
        publicKey: publicKey.toString() 
    };
}

/**
 * Sign a user's age with the government's private key
 * @param {Number} age - The user's age
 * @param {String} privateKey - The government's private key
 * @returns {Promise<String>} The signature
 */
async function signAge(age, privateKey) {
    // Initialize MiMC7
    const mimc = await initMimc7();
    const F = mimc.F;
    
    // Sign the age with the private key
    // signature = MiMC7(age, privateKey)
    const signature = mimc.hash(
        F.e(age.toString()),
        F.e(privateKey.toString())
    );
    
    return F.toString(signature);
}

/**
 * Verify a signature on an age
 * @param {Number} age - The age that was signed
 * @param {String} signature - The signature to verify
 * @param {String} publicKey - The government's public key
 * @returns {Promise<Boolean>} True if the signature is valid
 */
async function verifySignature(age, signature, publicKey) {
    // Initialize MiMC7
    const mimc = await initMimc7();
    const F = mimc.F;
    
    // Calculate the expected signature
    // expectedSignature = MiMC7(age, publicKey)
    const expectedSignature = mimc.hash(
        F.e(age.toString()),
        F.e(publicKey.toString())
    );
    
    // Compare with provided signature
    return F.toString(expectedSignature) === signature.toString();
}

/**
 * Initialize government keys
 * @returns {Promise<Object>} The government keys
 */
async function initGovernmentKeys() {
    try {
        // Check if keys file exists
        if (fs.existsSync(KEYS_FILE_PATH)) {
            // Load existing keys
            const keysData = fs.readFileSync(KEYS_FILE_PATH, 'utf8');
            const keys = JSON.parse(keysData);
            console.log('Government: Loaded existing keys');
            return keys;
        } else {
            // Generate new keys
            const keys = await generateGovernmentKeyPair();
            // Save keys to file
            fs.writeFileSync(KEYS_FILE_PATH, JSON.stringify(keys, null, 2));
            console.log('Government: Generated and saved new keys');
            return keys;
        }
    } catch (error) {
        console.error('Government: Error initializing keys:', error);
        throw error;
    }
}

module.exports = {
    initMimc7,
    generateGovernmentKeyPair,
    signAge,
    verifySignature,
    initGovernmentKeys,
    FIXED_AGE_REQUIREMENT
};
