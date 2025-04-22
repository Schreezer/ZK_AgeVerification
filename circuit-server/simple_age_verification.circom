pragma circom 2.0.0;

// Import required circomlib components
include "node_modules/circomlib/circuits/comparators.circom";

// Simple age verification without signature verification
// This circuit verifies that:
// 1. The user's age is at least 16 (fixed requirement)
template SimpleAgeVerification() {
    // Public inputs
    signal input governmentPublicKey; // Government's public key (not used for verification)
    
    // Private inputs
    signal input userAge;
    signal input signature; // Signature (not used for verification)
    
    // Output signal
    signal output isVerified;
    
    // Verify fixed age requirement (16+)
    component ge = GreaterEqThan(64);
    ge.in[0] <== userAge;
    ge.in[1] <== 16; // Fixed age requirement
    
    // Final verification: age requirement met
    isVerified <== ge.out;
}

// Public signals: governmentPublicKey
// isVerified is automatically a public output
component main { public [governmentPublicKey] } = SimpleAgeVerification();
