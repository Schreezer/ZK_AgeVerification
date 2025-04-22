/**
 * Utilities for fixed age verification with signatures
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
 * Issue a government credential for a user's age
 * @param {String} userId - The user's ID
 * @param {Number} age - The user's age
 * @param {String} privateKey - The government's private key
 * @returns {Promise<Object>} The credential with age and signature
 */
async function issueGovernmentCredential(userId, age, privateKey) {
    // Sign the age
    const signature = await signAge(age, privateKey);
    
    // Create the credential
    const credential = {
        userId,
        age,
        signature,
        issuedAt: Date.now()
    };
    
    return credential;
}

module.exports = {
    generateGovernmentKeyPair,
    signAge,
    verifySignature,
    issueGovernmentCredential,
    initMimc7
};
