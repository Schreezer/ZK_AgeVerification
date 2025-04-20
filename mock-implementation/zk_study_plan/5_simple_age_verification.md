# Module 5: Simple Age Verification Circuit

## Introduction to the Simple Age Verification Circuit

Before diving into the full age verification system with EdDSA signatures, let's understand the simpler version that focuses only on age comparison. This circuit demonstrates the core zero-knowledge property: proving that a user's age meets a requirement without revealing the actual age.

## The Simple Age Verification Circuit

Let's examine the `simple_age_verification.circom` circuit:

```circom
pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

// Simple age verification without EdDSA
template SimpleAgeVerification() {
    // Public input: age requirement
    signal input ageRequirement;
    
    // Private inputs
    signal input userAge;
    
    // Output signal
    signal output isVerified;
    
    // Verify age requirement
    component ge = GreaterEqThan(32);
    ge.in[0] <== userAge;
    ge.in[1] <== ageRequirement;

    // Final verification: age requirement met
    isVerified <== ge.out;
}

// Public signals: ageRequirement and verification result
component main { public [ageRequirement] } = SimpleAgeVerification();
```

### Key Components

1. **Inputs**:
   - `ageRequirement`: The minimum age required (public input)
   - `userAge`: The user's actual age (private input)

2. **Output**:
   - `isVerified`: Boolean result (1 if age requirement is met, 0 otherwise)

3. **Components**:
   - `GreaterEqThan`: A component from circomlib that checks if one number is greater than or equal to another

### How It Works

1. The circuit takes the age requirement as a public input (known to both prover and verifier)
2. The user's actual age is provided as a private input (known only to the prover)
3. The `GreaterEqThan` component checks if `userAge >= ageRequirement`
4. The result (0 or 1) is output as `isVerified`

## Understanding the GreaterEqThan Component

The `GreaterEqThan` component is a crucial part of our circuit. Let's understand how it works:

```circom
template GreaterEqThan(n) {
    signal input in[2];
    signal output out;

    component lt = LessThan(n);
    lt.in[0] <== in[1];
    lt.in[1] <== in[0];
    out <== lt.out;
}
```

This component:
1. Takes two n-bit inputs
2. Uses a `LessThan` component with the inputs reversed
3. If in[0] >= in[1], then in[1] < in[0] OR in[0] == in[1], so the output is 1
4. Otherwise, the output is 0

The `LessThan` component itself is more complex and implements a binary comparison algorithm that works efficiently in arithmetic circuits.

## JavaScript Implementation

Let's look at how the simple age verification is implemented in JavaScript:

### Service Provider Request

```javascript
function mockServiceProviderRequest(customAgeRequirement = null) {
    console.log('Service Provider: Initiating age verification request');

    // Set the age requirement
    let ageRequirement = customAgeRequirement !== null ? customAgeRequirement : 18;
    // Clamp negative age requirement
    if (ageRequirement < 0) {
        console.warn('Service Provider: Negative age requirement received, defaulting to 0');
        ageRequirement = 0;
    }

    console.log(`Service Provider: Set age requirement to ${ageRequirement}`);
    return { ageRequirement };
}
```

### User Agent Proof Generator

```javascript
async function mockUserAgentProofGenerator(userId, ageRequirement) {
    console.log('User Agent: Generating ZK proof');

    try {
        if (!USERS[userId] || USERS[userId] === null) {
            console.log(`User Agent: User ${userId} not found or has no data`);
            return { error: 'User not found or has no data' };
        }

        const userAge = USERS[userId].age;

        // Prepare inputs for the ZK circuit
        const circuitInputs = {
            ageRequirement,
            userAge
        };

        console.log('User Agent: Preparing inputs for ZK proof');

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            circuitInputs,
            CIRCUIT_WASM_PATH,
            CIRCUIT_ZKEY_PATH
        );

        console.log('User Agent: Generated ZK proof');
        return {
            proof,
            publicSignals,
            metadata: {
                userId,
                meetsAgeRequirement: userAge >= ageRequirement
            }
        };
    } catch (error) {
        console.error('User Agent: Error generating proof', error);
        return { error: 'Failed to generate proof' };
    }
}
```

### Service Provider Verifier

```javascript
async function mockServiceProviderVerifier(proof, publicSignals, ageRequirement) {
    console.log('Service Provider: Verifying ZK proof');

    try {
        // Load verification key
        const vkeyPath = './simple_age_verification_verification_key.json';
        const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));

        // Verify SNARK proof
        let proofValid = false;
        try {
            proofValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
        } catch (e) {
            console.error('Service Provider: Error during SNARK verification', e);
            return false;
        }

        // The public signals are in reverse order from what we expected
        // The first signal is isVerified (1 if valid, 0 if invalid)
        // The second signal is the age requirement
        const isVerified = publicSignals[0] === '1';
        const providedAgeReq = parseInt(publicSignals[1]);

        console.log('Public Signals:', publicSignals);
        console.log('Provided Age Requirement:', providedAgeReq, 'Expected:', ageRequirement);
        console.log('Is Verified:', isVerified);

        if (!proofValid) {
            console.log('Service Provider: Proof verification failed');
            return false;
        }
        if (providedAgeReq !== ageRequirement) {
            console.log('Service Provider: Age requirement mismatch');
            return false;
        }
        if (!isVerified) {
            console.log('Service Provider: Proof valid but requirements not met');
            return false;
        }

        console.log('Service Provider: Verification successful - Age requirement met');
        return true;
    } catch (error) {
        console.error('Service Provider: Error verifying proof', error);
        return false;
    }
}
```

## Circuit Compilation and Setup

To use the circuit, we need to compile it and generate proving and verification keys:

### 1. Compile the Circuit

```bash
circom simple_age_verification.circom --r1cs --wasm --sym
```

This generates:
- `simple_age_verification.r1cs`: The R1CS constraint system
- `simple_age_verification.sym`: Symbol table for debugging
- `simple_age_verification_js/`: Directory with JavaScript code for witness generation

### 2. Generate a Trusted Setup

```bash
snarkjs groth16 setup simple_age_verification.r1cs ptau/pot12_final.ptau simple_age_verification.zkey
```

This creates:
- `simple_age_verification.zkey`: The proving key

### 3. Export the Verification Key

```bash
snarkjs zkey export verificationkey simple_age_verification.zkey simple_age_verification_verification_key.json
```

This creates:
- `simple_age_verification_verification_key.json`: The verification key used by the service provider

## Generating and Verifying Proofs

### 1. Generate a Witness

The witness is the solution to the circuit constraints, including all private and public inputs:

```javascript
const circuitInputs = {
    ageRequirement: 18,
    userAge: 25
};

const { witness } = await snarkjs.wtns.calculate(
    circuitInputs,
    CIRCUIT_WASM_PATH,
    CIRCUIT_WTNS_PATH
);
```

### 2. Generate a Proof

The proof is created using the witness and the proving key:

```javascript
const { proof, publicSignals } = await snarkjs.groth16.prove(
    CIRCUIT_ZKEY_PATH,
    witness
);
```

### 3. Verify the Proof

The service provider verifies the proof using the verification key:

```javascript
const isValid = await snarkjs.groth16.verify(
    VERIFICATION_KEY,
    publicSignals,
    proof
);
```

## Understanding Public Signals

In our circuit, we have two public signals:

1. `ageRequirement`: The minimum age required
2. `isVerified`: The result of the verification

When the proof is generated, these values are included in the `publicSignals` array. The verifier can check:

1. That the proof is valid (cryptographically)
2. That the `ageRequirement` matches the expected value
3. That `isVerified` is 1 (indicating the age requirement is met)

## Zero-Knowledge Property

The key privacy feature of this circuit is that it never reveals the user's actual age:

1. The `userAge` is a private input, not included in the public signals
2. The proof only reveals whether `userAge >= ageRequirement`, not the value of `userAge`
3. Even if the verifier knows the user is at least 18, they don't know if the user is 18, 25, or 80

## Limitations of the Simple Circuit

While the simple age verification circuit demonstrates the core zero-knowledge property, it has several limitations:

1. **No Authentication**: There's no way to verify that the age belongs to the claimed user
2. **No Credential Verification**: The age is provided directly, with no proof of its authenticity
3. **Trust Assumption**: The system trusts the user to provide their real age

These limitations are addressed in the full system by adding EdDSA signature verification, which we'll explore in the next module.

## Testing the Simple Circuit

Let's look at how we can test the simple age verification circuit:

```javascript
// Test with a user over the age requirement
const result1 = await runFullVerificationFlow('user1', 18); // user1 is 25
console.log('User over age requirement:', result1.success); // true

// Test with a user under the age requirement
const result2 = await runFullVerificationFlow('user2', 18); // user2 is 16
console.log('User under age requirement:', result2.success); // false

// Test with a user exactly at the age requirement
const result3 = await runFullVerificationFlow('user3', 18); // user3 is 18
console.log('User exactly at age requirement:', result3.success); // true

// Test with a custom age requirement
const result4 = await runFullVerificationFlow('user1', 21); // user1 is 25
console.log('Custom age requirement (21):', result4.success); // true

// Test with a very high age requirement
const result5 = await runFullVerificationFlow('user1', 30); // user1 is 25
console.log('Very high age requirement (30):', result5.success); // false
```

## Next Steps

In the next module, we'll explore the advanced age verification circuit that incorporates EdDSA signature verification, addressing the limitations of the simple circuit.

## References and Further Reading

1. Circom Documentation: https://docs.circom.io/
2. SNARKjs Documentation: https://github.com/iden3/snarkjs
3. "Zero-Knowledge Proofs: An illustrated primer" by Matthew Green: https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/
4. "Programming Zero-Knowledge Proofs" by Elena Nadolinski: https://medium.com/@elena_nadolinski/programming-zero-knowledge-proofs-a-hands-on-tutorial-a0c871b86e79
