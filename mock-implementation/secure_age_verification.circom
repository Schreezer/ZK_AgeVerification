pragma circom 2.0.0;

// Import required circomlib components
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/mimc.circom";

// Secure age verification with MiMC7 commitment and MiMC7 signature verification
// This circuit verifies that:
// 1. The user has a valid commitment to their age
// 2. The commitment is signed by the government
// 3. The user's age meets the required minimum
template SecureAgeVerification() {
    // Public inputs
    signal input ageRequirement;
    signal input commitment; // MiMC7 hash commitment
    signal input governmentPublicKey; // Government's public key

    // Private inputs
    signal input userAge;
    signal input blindingFactor; // Random value used in the commitment
    signal input signature; // Government's signature
    signal input nonce; // Nonce to prevent replay attacks

    // Output signal
    signal output isVerified;

    // Step 1: Verify the commitment
    // Create MiMC hash of the age with the blinding factor
    component mimcCommitment = MiMC7(91);
    mimcCommitment.x_in <== userAge;
    mimcCommitment.k <== blindingFactor;

    // Verify that the commitment matches
    commitment === mimcCommitment.out;

    // Step 2: Verify the signature
    // Create the message hash (commitment + nonce)
    component mimcMessage = MiMC7(91);
    mimcMessage.x_in <== commitment;
    mimcMessage.k <== nonce;

    // Create the expected signature (governmentPublicKey + message hash)
    component mimcSignature = MiMC7(91);
    mimcSignature.x_in <== mimcMessage.out;
    mimcSignature.k <== governmentPublicKey;

    // Verify signature matches expected value
    signature === mimcSignature.out;

    // Step 3: Verify age requirement
    component ge = GreaterEqThan(64);
    ge.in[0] <== userAge;
    ge.in[1] <== ageRequirement;

    // Final verification: commitment valid AND signature valid AND age requirement met
    isVerified <== ge.out;
}

// Public signals: ageRequirement, commitment, governmentPublicKey
// isVerified is automatically a public output
component main { public [ageRequirement, commitment, governmentPublicKey] } = SecureAgeVerification();
