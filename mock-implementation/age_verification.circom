pragma circom 2.0.0;

// Import required circomlib components
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/eddsa.circom";
include "node_modules/circomlib/circuits/eddsamimc.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/mimc.circom";
include "node_modules/circomlib/circuits/pointbits.circom";

// Age verification with EdDSA: verify signature and ensure userAge meets requirement
// This is an optimized version to reduce circuit complexity
template AgeVerificationWithEdDSA() {
    // Public input: age requirement
    signal input ageRequirement;

    // Private inputs
    signal input userAge;

    // EdDSA signature components
    signal input A[256];  // Public key bits
    signal input R8[256]; // Signature component R8
    signal input S[256];  // Signature component S
    signal input msg[32]; // Message bits (age encoded in 32 bits is sufficient)

    // Output signals
    signal output isVerified;
    signal output isSignatureValid;

    // Convert bit arrays to field elements for the verifier
    component bits2pointA = Bits2Point_Strict();
    for (var i = 0; i < 256; i++) {
        bits2pointA.in[i] <== A[i];
    }

    // Convert R8 bits to point
    component bits2pointR = Bits2Point_Strict();
    for (var i = 0; i < 256; i++) {
        bits2pointR.in[i] <== R8[i];
    }

    // Convert S bits to field element
    component bits2S = Bits2Num(256);
    for (var i = 0; i < 256; i++) {
        bits2S.in[i] <== S[i];
    }

    // Convert message bits to field element
    component bits2Msg = Bits2Num(32);
    for (var i = 0; i < 32; i++) {
        bits2Msg.in[i] <== msg[i];
    }

    // Create MiMC hash component for EdDSA
    component mimc = MiMC7(91);
    mimc.x_in <== bits2Msg.out;
    mimc.k <== 0;

    // Verify EdDSA signature using the MiMC hash
    component eddsaVerifier = EdDSAMiMCVerifier();
    eddsaVerifier.enabled <== 1;
    eddsaVerifier.Ax <== bits2pointA.out[0];
    eddsaVerifier.Ay <== bits2pointA.out[1];
    eddsaVerifier.R8x <== bits2pointR.out[0];
    eddsaVerifier.R8y <== bits2pointR.out[1];
    eddsaVerifier.S <== bits2S.out;
    eddsaVerifier.M <== mimc.out;

    // Create a signal to indicate if the signature is valid
    // EdDSAMiMCVerifier doesn't have an output signal, but it will constrain the circuit
    // to be valid only if the signature is valid. We'll use a dummy signal set to 1.
    signal dummySignatureValid;
    dummySignatureValid <== 1;
    isSignatureValid <== dummySignatureValid;

    // Verify age requirement
    component ge = GreaterEqThan(32);
    ge.in[0] <== userAge;
    ge.in[1] <== ageRequirement;

    // Final verification: both age requirement met AND signature valid
    // Since EdDSAMiMCVerifier will fail the entire circuit if signature is invalid,
    // we only need to check the age requirement for the final output
    isVerified <== ge.out;
}

// Public signals: ageRequirement and verification result
component main { public [ageRequirement] } = AgeVerificationWithEdDSA();
