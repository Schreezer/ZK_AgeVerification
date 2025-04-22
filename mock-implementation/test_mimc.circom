
pragma circom 2.0.0;
include "node_modules/circomlib/circuits/mimc.circom";

template TestMiMC() {
    signal input x_in;
    signal input k;
    signal output out;
    
    component mimc = MiMC7(91);
    mimc.x_in <== x_in;
    mimc.k <== k;
    
    out <== mimc.out;
}

component main = TestMiMC();
