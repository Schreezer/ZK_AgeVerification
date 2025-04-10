pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
// Use the p384 ECDSA implementation
include "../../ecdsa-p384-circom/circuits/ecdsa.circom";

// Template to verify age against a requirement using a signed credential
template AgeVerification() {
    // === Public Inputs ===
    // Age requirement set by the service provider
    signal input ageRequirement;
    // Nonce provided by the service provider for uniqueness
    signal input nonce[8]; // 384-bit nonce split into 8 limbs of 48 bits
    // Government's public ECDSA key (P-384)
    // Represented as [[X0..X8], [Y0..Y8]], each coordinate in 8 limbs of 48 bits
    signal input govtPubKey[2][8];

    // === Private Inputs ===
    // User's age from the credential
    signal input userAge; // Assuming age fits within a field element (e.g., < 253 bits)
    // Hash of the credential data (e.g., SHA256) that was signed
    signal input credentialHash[8]; // 384-bit hash split into 8 limbs of 48 bits
    // P-384 ECDSA signature components (R and S) from the government
    signal input signatureR[8]; // 384-bit R split into 8 limbs of 48 bits
    signal input signatureS[8]; // 384-bit S split into 8 limbs of 48 bits

    // === Output ===
    // 1 if signature is valid AND age requirement is met, 0 otherwise
    signal output isVerified;

    // === Logic ===
    // 1. Verify the ECDSA signature
    component sigVerifier = ECDSAVerifyNoPubkeyCheck(48, 8); // 48-bit limbs, 8 limbs for P-384
    sigVerifier.r <== signatureR;
    sigVerifier.s <== signatureS;
    sigVerifier.msghash <== credentialHash;
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 8; j++) {
            sigVerifier.pubkey[i][j] <== govtPubKey[i][j];
        }
    }
    // sigVerifier.out is 1 if the signature is valid, 0 otherwise

    // 2. Check if user's age meets the requirement
    component ageCheck = GreaterEqThan(32); // Use 32-bit comparison for age
    ageCheck.in[0] <== userAge;
    ageCheck.in[1] <== ageRequirement;
    // ageCheck.out is 1 if userAge >= ageRequirement, 0 otherwise

    // 3. Final verification: signature must be valid AND age requirement met
    isVerified <== sigVerifier.result * ageCheck.out;
}

// Instantiate the main component and declare public signals
component main {public [ageRequirement, nonce, govtPubKey]} = AgeVerification();