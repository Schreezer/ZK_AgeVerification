pragma circom 2.0.0;

// Import required circomlib components
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/mimc.circom";

// Fixed age verification with signature verification
// This circuit verifies that:
// 1. The user has a valid government signature on their age
// 2. The user's age is at least 16 (fixed requirement)
template FixedAgeVerification() {
    // Public inputs
    signal input governmentPublicKey; // Government's public key
    
    // Private inputs
    signal input userAge;
    signal input signature; // Government's signature on the age
    
    // Output signal
    signal output isVerified;
    
    // Step 1: Verify the signature
    // The signature is created as: signature = MiMC7(userAge, governmentPrivateKey)
    // We verify it by checking: signature === MiMC7(userAge, governmentPublicKey)
    component mimcSignature = MiMC7(91);
    mimcSignature.x_in <== userAge;
    mimcSignature.k <== governmentPublicKey;
    
    // Verify signature matches expected value
    signature === mimcSignature.out;
    
    // Step 2: Verify fixed age requirement (16+)
    component ge = GreaterEqThan(64);
    ge.in[0] <== userAge;
    ge.in[1] <== 16; // Fixed age requirement
    
    // Final verification: signature valid AND age requirement met
    isVerified <== ge.out;
}

// Public signals: governmentPublicKey
// isVerified is automatically a public output
component main { public [governmentPublicKey] } = FixedAgeVerification();
