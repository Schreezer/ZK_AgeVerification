pragma circom 2.0.0;

// Import required circomlib components
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/mimc.circom";
include "node_modules/circomlib/circuits/bitify.circom";

// Age verification with MiMC-based commitment
// This circuit verifies that:
// 1. The user has a valid commitment to their age
// 2. The user's age meets the required minimum
template MiMCAgeVerification() {
    // Public inputs
    signal input ageRequirement;
    signal input commitment; // MiMC hash commitment

    // Private inputs
    signal input userAge;
    signal input blindingFactor; // Random value used in the commitment

    // Output signal
    signal output isVerified;

    // Step 1: Verify the commitment
    // Create MiMC hash of the age with the blinding factor
    component mimc = MiMC7(91);
    mimc.x_in <== userAge;
    mimc.k <== blindingFactor;

    // Verify that the commitment matches
    // We need to ensure the types match exactly
    signal commitmentCheck;
    commitmentCheck <== mimc.out - commitment;
    commitmentCheck === 0;

    // Step 2: Verify age requirement
    component ge = GreaterEqThan(64);
    ge.in[0] <== userAge;
    ge.in[1] <== ageRequirement;

    // Final verification: both commitment is valid AND age requirement is met
    isVerified <== ge.out;
}

// Public signals: ageRequirement, commitment
// isVerified is automatically a public output
component main { public [ageRequirement, commitment] } = MiMCAgeVerification();
