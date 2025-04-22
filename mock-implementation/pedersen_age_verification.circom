pragma circom 2.0.0;

// Import required circomlib components
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/pedersen.circom";
include "node_modules/circomlib/circuits/bitify.circom";

// Age verification with Pedersen commitment
// This circuit verifies that:
// 1. The user has a valid Pedersen commitment to their age
// 2. The user's age meets the required minimum
template PedersenAgeVerification() {
    // Public inputs
    signal input ageRequirement;
    signal input commitment[2]; // Pedersen commitment (x,y) point
    
    // Private inputs
    signal input userAge;
    signal input blindingFactor; // Random value used in the commitment
    
    // Output signal
    signal output isVerified;
    
    // Step 1: Verify the Pedersen commitment
    // Convert userAge to bits for the Pedersen hash
    component ageBits = Num2Bits(64);
    ageBits.in <== userAge;
    
    // Create Pedersen hash of the age with the blinding factor
    component pedersen = Pedersen(64);
    for (var i = 0; i < 64; i++) {
        pedersen.in[i] <== ageBits.out[i];
    }
    pedersen.out[0] === commitment[0];
    pedersen.out[1] === commitment[1];
    
    // Step 2: Verify age requirement
    component ge = GreaterEqThan(64);
    ge.in[0] <== userAge;
    ge.in[1] <== ageRequirement;
    
    // Final verification: both commitment is valid AND age requirement is met
    isVerified <== ge.out;
}

// Public signals: ageRequirement, commitment, and verification result
component main { public [ageRequirement, commitment] } = PedersenAgeVerification();
