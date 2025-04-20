# Module 2: Zero-Knowledge Circuit Fundamentals

## Arithmetic Circuits: The Building Blocks of ZK Proofs

Arithmetic circuits are the fundamental computational model used in modern zero-knowledge proof systems. They provide a way to express computations that can be efficiently proven in zero knowledge.

### What is an Arithmetic Circuit?

An arithmetic circuit is a directed acyclic graph (DAG) where:

- **Nodes** represent either inputs, constants, or operations (addition, multiplication)
- **Edges** represent the flow of values between operations
- **Inputs** are variables or constants
- **Output** is the result of the computation

In the context of zero-knowledge proofs, arithmetic circuits operate over a finite field (typically a large prime field) rather than over integers or real numbers.

### Example of a Simple Arithmetic Circuit

Consider a circuit that computes `(a + b) * c`:

```
    a     b
     \   /
      \ /
       +
       |
       |
       *
      / \
     /   \
    c     output
```

This circuit has:
- Three input nodes: a, b, and c
- One addition gate (+)
- One multiplication gate (*)
- One output node

### From Programs to Circuits

Any computation can be expressed as an arithmetic circuit, though some are more efficient than others:

1. **Arithmetic Operations**: Directly map to addition and multiplication gates
2. **Logical Operations**: Can be expressed using arithmetic (e.g., AND can be implemented as multiplication)
3. **Conditionals**: Implemented using arithmetic techniques (e.g., multiplying by 0 or 1)
4. **Loops**: Unrolled into a sequence of operations (with fixed bounds)

## Constraint Systems: R1CS

To use arithmetic circuits in zero-knowledge proofs, we convert them into a special form called a Rank-1 Constraint System (R1CS).

### What is R1CS?

R1CS is a way to represent computations as a system of bilinear constraints of the form:

```
(a · w) * (b · w) = (c · w)
```

Where:
- `w` is a vector of variables (including inputs, outputs, and intermediate values)
- `a`, `b`, and `c` are constant vectors
- `·` represents the dot product
- Each constraint corresponds to a multiplication gate in the circuit

### Converting Circuits to R1CS

The process of converting an arithmetic circuit to R1CS involves:

1. Assigning a variable to each wire in the circuit
2. Creating constraints for each gate
3. Organizing these into the a, b, c vectors

### Example: Converting Our Simple Circuit to R1CS

For the circuit `(a + b) * c`:

1. Assign variables:
   - w₁ = a
   - w₂ = b
   - w₃ = c
   - w₄ = a + b (intermediate result)
   - w₅ = (a + b) * c (output)

2. Create constraints:
   - For the addition gate: w₄ = w₁ + w₂
   - For the multiplication gate: w₅ = w₄ * w₃

3. Express in R1CS form:
   - (1·w₁ + 1·w₂ - 1·w₄) = 0 (addition constraint)
   - (1·w₄) * (1·w₃) = (1·w₅) (multiplication constraint)

## From R1CS to QAP: The Mathematical Foundation

Modern zk-SNARK systems convert R1CS into a Quadratic Arithmetic Program (QAP), which allows for efficient proving and verification.

### What is QAP?

A QAP is a way to represent all R1CS constraints as a single polynomial equation. This is achieved by:

1. Converting each constraint into a polynomial
2. Using interpolation to combine these polynomials
3. Creating a single equation that is satisfied if and only if all constraints are satisfied

The details of QAP are mathematically complex and beyond the scope of this introduction, but understanding that this conversion happens is important for grasping the overall process.

## Circom: A Language for ZK Circuits

Circom is a domain-specific language designed for writing arithmetic circuits for zero-knowledge proofs. It provides a more programmer-friendly way to define circuits compared to working directly with R1CS.

### Basic Circom Syntax

```circom
pragma circom 2.0.0;

template Example() {
    // Input signals
    signal input a;
    signal input b;
    signal input c;
    
    // Output signal
    signal output result;
    
    // Intermediate signal
    signal intermediate;
    
    // Constraints
    intermediate <== a + b;
    result <== intermediate * c;
}

// Main component
component main = Example();
```

### Key Circom Concepts

1. **Templates**: Reusable circuit definitions (similar to functions or classes)
2. **Signals**: Variables in the circuit (inputs, outputs, intermediates)
3. **Constraints**: Relationships between signals (using `<==`, `===`, etc.)
4. **Components**: Instances of templates

### Signal Assignment Operators

- `<--`: Simple assignment (no constraint)
- `<==`: Assignment with constraint
- `===`: Constraint without assignment
- `==>`: Constraint implication

### Example: Age Verification in Circom

Let's look at a simplified version of age verification in Circom:

```circom
pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

template SimpleAgeVerification() {
    // Public input: age requirement
    signal input ageRequirement;
    
    // Private input: user's age
    signal input userAge;
    
    // Output signal
    signal output isVerified;
    
    // Verify age requirement using greater-than-or-equal component
    component ge = GreaterEqThan(32);
    ge.in[0] <== userAge;
    ge.in[1] <== ageRequirement;
    
    // Final verification: age requirement met
    isVerified <== ge.out;
}

// Public signals: ageRequirement and verification result
component main { public [ageRequirement] } = SimpleAgeVerification();
```

This circuit:
1. Takes the age requirement as a public input
2. Takes the user's age as a private input
3. Uses a `GreaterEqThan` component to check if the user's age meets the requirement
4. Outputs a boolean result (1 if verified, 0 if not)

## The Circom Compilation Process

When you write a circuit in Circom, it goes through several steps:

1. **Compilation**: Circom compiler converts the code to an R1CS representation
2. **Witness Generation**: Creates a JavaScript or C++ program that can compute witnesses (solutions to the circuit)
3. **Setup**: Generates proving and verification keys (for zk-SNARKs)
4. **Proving**: Uses the witness and proving key to generate a proof
5. **Verification**: Verifies the proof using the verification key

### Example Compilation Commands

```bash
# Compile the circuit
circom age_verification.circom --r1cs --wasm --sym

# Generate the witness
node age_verification_js/generate_witness.js age_verification_js/age_verification.wasm input.json witness.wtns

# Generate proving and verification keys
snarkjs groth16 setup age_verification.r1cs ptau/pot12_final.ptau age_verification.zkey

# Export verification key
snarkjs zkey export verificationkey age_verification.zkey verification_key.json

# Generate a proof
snarkjs groth16 prove age_verification.zkey witness.wtns proof.json public.json

# Verify the proof
snarkjs groth16 verify verification_key.json public.json proof.json
```

## Circomlib: A Library of Circuit Components

Circomlib is a library of common circuit components that can be reused in Circom circuits. It includes:

1. **Comparators**: Greater than, less than, equality
2. **Bitwise Operations**: AND, OR, XOR
3. **Hashing**: SHA256, Pedersen, MiMC
4. **Signature Verification**: EdDSA
5. **Binary Operations**: Bit manipulation, conversion between binary and decimal

### Using Circomlib Components

```circom
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/eddsa.circom";

// Now you can use components like:
component ge = GreaterEqThan(32);
component bits2num = Bits2Num(32);
component eddsaVerifier = EdDSAMiMCVerifier();
```

## Public vs. Private Inputs

In zero-knowledge circuits, the distinction between public and private inputs is crucial:

### Public Inputs (also called "public signals")
- Known to both the prover and verifier
- Included in the proof verification
- Declared using `public` in the main component

### Private Inputs
- Known only to the prover
- Not revealed to the verifier
- All inputs not declared as public are private by default

### Example Declaration

```circom
// Declaring ageRequirement as public
component main { public [ageRequirement] } = AgeVerification();
```

## Constraints and Circuit Size

The number of constraints in a circuit directly affects:

1. **Proof Generation Time**: More constraints = longer proving time
2. **Memory Requirements**: Larger circuits require more memory
3. **Setup Time**: Longer setup phase for larger circuits

Optimizing circuits to minimize constraints is an important skill in ZK development.

## Next Steps

In the next module, we'll explore how digital signatures (specifically EdDSA) work with zero-knowledge proofs, which is a key component of our age verification system.

## References and Further Reading

1. Circom Documentation: https://docs.circom.io/
2. Circomlib Repository: https://github.com/iden3/circomlib
3. "Programming Zero-Knowledge Proofs" by Elena Nadolinski: https://medium.com/@elena_nadolinski/programming-zero-knowledge-proofs-a-hands-on-tutorial-a0c871b86e79
4. "Understanding PLONK" by Vitalik Buterin: https://vitalik.ca/general/2019/09/22/plonk.html
