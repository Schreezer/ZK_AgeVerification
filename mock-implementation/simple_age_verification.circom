pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

// Simple age verification without EdDSA
template SimpleAgeVerification() {
    // Public input: age requirement
    signal input ageRequirement;
    
    // Private inputs
    signal input userAge;
    
    // Output signal
    signal output isVerified;
    
    // Verify age requirement
    component ge = GreaterEqThan(32);
    ge.in[0] <== userAge;
    ge.in[1] <== ageRequirement;

    // Final verification: age requirement met
    isVerified <== ge.out;
}

// Public signals: ageRequirement and verification result
component main { public [ageRequirement] } = SimpleAgeVerification();
