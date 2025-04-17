// SPDX-License-Identifier: AGPL-3.0-or-later
// Official circomlib secp256k1 ECDSA circuit
// Source: https://github.com/iden3/circomlib/blob/master/circuits/ecdsa/ecdsa.circom

pragma circom 2.0.0;

include "../secp256k1.circom";
include "../utils.circom";

template Ecdsa() {
    signal input R8x;
    signal input R8y;
    signal input S;
    signal input msghash;
    signal input pkx;
    signal input pky;
    signal output out;

    component ecdsa = EcdsaVerify();
    ecdsa.R8x <== R8x;
    ecdsa.R8y <== R8y;
    ecdsa.S <== S;
    ecdsa.msghash <== msghash;
    ecdsa.pkx <== pkx;
    ecdsa.pky <== pky;
    out <== ecdsa.out;
}