pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

// Age verification: ensure userAge meets the requirement
template AgeVerification() {
    // Public input: age requirement
    signal input ageRequirement;
    // Private input: user's age
    signal input userAge;
    // Input: 1 if userAge >= ageRequirement, else 0
    signal input isVerified;

    component ge = GreaterEqThan(32);
    ge.in[0] <== userAge;
    ge.in[1] <== ageRequirement;
    // Assert computed output equals provided isVerified
    assert(ge.out == isVerified);
}

// Public signals: ageRequirement and comparator result
component main { public [ageRequirement, isVerified] } = AgeVerification();