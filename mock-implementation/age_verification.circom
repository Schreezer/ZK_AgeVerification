pragma circom 2.1.6;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/bitify.circom";

template AgeVerification() {
    // Public inputs
    signal input ageRequirement; 
    signal input nonce; 

    // Private inputs
    signal input userAge; 
    signal input credentialSignature; 

    // Output
    signal output isVerified;

    // Verify credential (simulated)
    signal validCredential;
    validCredential <== credentialSignature;

    // Age check
    component greaterThanOrEqual = GreaterEqThan(32); 
    greaterThanOrEqual.in[0] <== userAge;
    greaterThanOrEqual.in[1] <== ageRequirement;

    // Final verification
    isVerified <== validCredential * greaterThanOrEqual.out;
}

component main = AgeVerification();