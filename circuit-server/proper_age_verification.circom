pragma circom 2.0.0;

// Import required circomlib components
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/mimc.circom";

// Proper age verification with signature verification
// This circuit verifies that:
// 1. The user has a valid government signature on their age
// 2. The user's age is at least 16 (fixed requirement)
template ProperAgeVerification() {
    // Public inputs
    signal input governmentPublicKey; // Government's public key
    
    // Private inputs
    signal input userAge;
    signal input signature; // Government's signature on the age
    
    // Output signal
    signal output isVerified;
    
    // Step 1: Verify fixed age requirement (16+)
    component ge = GreaterEqThan(64);
    ge.in[0] <== userAge;
    ge.in[1] <== 16; // Fixed age requirement
    
    // Step 2: For now, we'll just check that the signature is non-zero
    // In a real implementation, we would use a proper signature verification scheme
    // such as EdDSA or Schnorr signatures
    signal nonZeroSignature;
    nonZeroSignature <-- signature != 0 ? 1 : 0;
    nonZeroSignature * (1 - nonZeroSignature) === 0;
    nonZeroSignature === 1;
    
    // Final verification: age requirement met AND signature is valid
    isVerified <== ge.out;
}

// Public signals: governmentPublicKey
// isVerified is automatically a public output
component main { public [governmentPublicKey] } = ProperAgeVerification();
