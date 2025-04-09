pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

template AgeVerification() {
    // Public inputs
    signal input ageRequirement; // The minimum age required
    signal input nonce; // A random nonce to prevent replay attacks
    
    // Private inputs
    signal input userAge; // The user's actual age (private)
    signal input credentialSignature; // Simulated signature from government (private)
    
    // Output
    signal output isVerified;
    
    // Verify the credential signature (simplified for mock purposes)
    // In a real implementation, this would verify a cryptographic signature
    signal validCredential;
    validCredential <== credentialSignature;
    
    // Check if user's age meets the requirement
    component greaterThanOrEqual = GreaterEqThan(32); // Support ages up to 2^32-1
    greaterThanOrEqual.in[0] <== userAge;
    greaterThanOrEqual.in[1] <== ageRequirement;
    
    // Final verification: credential is valid AND age meets requirement
    isVerified <== validCredential * greaterThanOrEqual.out;
}

component main = AgeVerification();
