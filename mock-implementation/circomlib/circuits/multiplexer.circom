// Minimal stub for Multiplexer.circom to satisfy ECDSA import

template Multiplexer(k, n) {
    signal input inp[n][k];
    signal input sel;
    signal output out[k];

    // Simple passthrough: always output inp[0]
    for (var i = 0; i < k; i++) {
        out[i] <== inp[0][i];
    }
}