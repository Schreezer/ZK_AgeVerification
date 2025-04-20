# Module 1: Introduction to Zero-Knowledge Proofs

## What are Zero-Knowledge Proofs?

Zero-Knowledge Proofs (ZKPs) are cryptographic protocols that allow one party (the prover) to prove to another party (the verifier) that a statement is true, without revealing any information beyond the validity of the statement itself. In other words, they allow you to prove you know a secret without revealing what that secret is.

## Historical Context

- **Origins**: Introduced in 1985 by Shafi Goldwasser, Silvio Micali, and Charles Rackoff
- **Initial Reception**: Initially considered theoretical with limited practical applications
- **Evolution**: Significant advancements in efficiency and practicality over the past decade
- **Current State**: Now used in blockchain, privacy-preserving authentication, and secure computation

## Core Properties of Zero-Knowledge Proofs

### 1. Completeness

If the statement is true and both the prover and verifier follow the protocol correctly, the verifier will be convinced of the statement's validity.

**Mathematical Definition**: For any true statement x and witness w, the probability that (P, V)(x, w) = accept is at least c (typically c = 1).

### 2. Soundness

If the statement is false, no cheating prover can convince the verifier that it is true, except with some small probability.

**Mathematical Definition**: For any false statement x and any prover strategy P*, the probability that (P*, V)(x) = accept is at most s (typically s is negligible).

### 3. Zero-Knowledge

The verifier learns nothing other than the fact that the statement is true.

**Mathematical Definition**: For any true statement x and witness w, the view of the verifier in the protocol can be simulated by an efficient algorithm S (the simulator) that doesn't have access to w.

## Types of Zero-Knowledge Proofs

### Interactive vs. Non-Interactive

- **Interactive ZKPs**: Require multiple rounds of communication between prover and verifier
- **Non-Interactive ZKPs (NIZKs)**: Require only a single message from prover to verifier
  - Created using the Fiat-Shamir heuristic to transform interactive proofs into non-interactive ones
  - More practical for many applications, including our age verification system

### Computational vs. Statistical

- **Computational ZKPs**: Security relies on computational hardness assumptions
- **Statistical ZKPs**: Provide information-theoretic security (even against computationally unbounded adversaries)

### Common ZKP Systems

1. **zk-SNARKs** (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge)
   - Very short proofs (typically a few hundred bytes)
   - Fast verification
   - Require a trusted setup phase
   - Used in our age verification system

2. **zk-STARKs** (Zero-Knowledge Scalable Transparent Arguments of Knowledge)
   - No trusted setup required
   - Post-quantum secure
   - Larger proof sizes than SNARKs

3. **Bulletproofs**
   - No trusted setup
   - Shorter proofs than STARKs but longer than SNARKs
   - Slower verification than SNARKs

## Applications of Zero-Knowledge Proofs

### Privacy-Preserving Identity Verification

- **Age Verification**: Prove you're over a certain age without revealing your actual age (our focus)
- **KYC Compliance**: Prove you meet regulatory requirements without exposing personal data

### Blockchain and Cryptocurrencies

- **Private Transactions**: Hide transaction details while ensuring validity (e.g., Zcash)
- **Scalability Solutions**: Batch verify transactions off-chain (e.g., zk-Rollups)

### Secure Authentication

- **Password Verification**: Prove knowledge of a password without sending it
- **Credential Verification**: Prove possession of credentials without revealing them

### Secure Computation

- **Private Smart Contracts**: Execute contracts without revealing inputs
- **Private Database Queries**: Query databases without revealing the query

## Intuitive Examples

### The Classic Cave Example

Imagine a circular cave with a door that can only be opened with a secret password:

1. Peggy (prover) wants to prove to Victor (verifier) that she knows the password, without revealing it
2. Victor waits outside while Peggy enters the cave
3. Peggy takes either the left or right path (randomly)
4. Victor enters and shouts which path (A or B) he wants Peggy to come out from
5. If Peggy knows the password, she can always come out the requested path
6. They repeat this process multiple times to reduce the probability of cheating

This demonstrates:
- **Completeness**: If Peggy knows the password, she can always succeed
- **Soundness**: If Peggy doesn't know the password, she has at most a 50% chance of guessing correctly each time
- **Zero-Knowledge**: Victor only learns that Peggy knows the password, not what the password is

### The Colorblind Friend Example

Imagine you have two identical-looking balls that differ only in color (red and green), and your friend is colorblind:

1. Your friend holds one ball in each hand
2. You can see which hand holds which color
3. Your friend puts the balls behind their back, may or may not swap them, then brings them forward again
4. You tell your friend whether they swapped the balls or not
5. If you can consistently tell whether they swapped, you've proven you can distinguish the colors

## Mathematical Foundations

Zero-knowledge proofs rely on several mathematical concepts:

1. **Commitment Schemes**: Allow a party to commit to a value without revealing it
2. **Interactive Proof Systems**: Protocols where a prover convinces a verifier of a statement
3. **Random Oracle Model**: A theoretical model used to analyze cryptographic protocols
4. **Elliptic Curve Cryptography**: Used in many practical ZKP systems (including EdDSA in our system)

## Relevance to Age Verification

In our age verification system:

1. The **prover** is the user who wants to prove they meet an age requirement
2. The **verifier** is the service provider who needs to check the age requirement
3. The **statement** is "I am at least X years old"
4. The **witness** (secret information) is the user's actual age
5. The **zero-knowledge property** ensures the service provider learns only whether the user meets the requirement, not their actual age

## Next Steps

In the next module, we'll explore how these concepts are implemented using arithmetic circuits and the Circom language, which forms the foundation of our age verification system.

## References and Further Reading

1. Goldwasser, S., Micali, S., & Rackoff, C. (1989). The knowledge complexity of interactive proof systems. SIAM Journal on Computing, 18(1), 186-208.
2. Goldreich, O., & Oren, Y. (1994). Definitions and properties of zero-knowledge proof systems. Journal of Cryptology, 7(1), 1-32.
3. Ben-Sasson, E., Chiesa, A., Genkin, D., Tromer, E., & Virza, M. (2013). SNARKs for C: Verifying program executions succinctly and in zero knowledge. In Advances in Cryptology–CRYPTO 2013.
4. "Why and How zk-SNARK Works" by Maksym Petkus: https://arxiv.org/abs/1906.07221
