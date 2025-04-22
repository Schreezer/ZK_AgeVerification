pragma circom 2.0.0;

include "node_modules/circomlib/circuits/mimc.circom";

// Simple test circuit for MiMC7
template SimpleMiMCTest() {
    // Output signal
    signal output out;
    
    // Fixed inputs for testing
    var x_in = 25;
    var k = 123456789;
    
    // Create MiMC hash
    component mimc = MiMC7(91);
    mimc.x_in <== x_in;
    mimc.k <== k;
    
    // Output the hash
    out <== mimc.out;
}

component main { public [out] } = SimpleMiMCTest();
