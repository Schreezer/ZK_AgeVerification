TITLE: Circom CLI Help Command Output
DESCRIPTION: Complete command-line interface documentation for the circom compiler showing all available flags and options including output formats, optimization levels, and compilation settings. Shows usage patterns, flags for different output formats (r1cs, wasm, C++), optimization flags (O0, O1, O2), and various configuration options.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/compilation-options.md#2025-04-12_snippet_0

LANGUAGE: console
CODE:
```
USAGE:
    circom [FLAGS] [OPTIONS] [--] [input]

FLAGS:
        --r1cs                                 Outputs the constraints in r1cs format
        --sym                                  Outputs witness in sym format
        --wasm                                 Compiles the circuit to wasm
        --json                                 Outputs the constraints in json format
        --wat                                  Compiles the circuit to wat
    -c, --c                                    Compiles the circuit to C++
        --O0                                   No simplification is applied
        --O1                                   Only applies signal to signal and signal to constant simplification
        --O2                                   Full constraint simplification
        --verbose                              Shows logs during compilation
        --inspect                              Does an additional check over the constraints produced
        --constraint_assert_dissabled          Does not add asserts in the witness generation code to check constraints
                                               introduced with "==="
        --use_old_simplification_heuristics    Applies the old version of the heuristics when performing linear
                                               simplification
        --simplification_substitution          Outputs the substitution applied in the simplification phase in
                                               json format
        --no_asm                               Does not use asm files in witness generation code in C++
        --no_init                              Removes initializations to 0 of variables ("var") in the witness
                                               generation code
    -h, --help                                 Prints help information
    -V, --version                              Prints version information

OPTIONS:
    -o, --output <output>                    Path to the directory where the output will be written [default: .]
    -p, --prime <prime>                      To choose the prime number to use to generate the circuit. Receives the
                                             name of the curve (bn128, bls12377, bls12381, goldilocks, grumpkin, pallas, secq256r1, vesta) [default: bn128]
    -l <link_libraries>...                   Adds directory to library search path
        --O2round <simplification_rounds>    Maximum number of rounds of the simplification process

ARGS:
    <input>    Path to a circuit with a main component [default: ./circuit.circom]
```

----------------------------------------

TITLE: Implementing a Simple Multiplier Circuit in Circom
DESCRIPTION: A basic Circom circuit template that multiplies two input signals and produces an output signal. It declares input signals a and b, and output signal c, with a constraint defining c as the product of a and b.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/writing-circuits.md#2025-04-12_snippet_0

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0;
  
/*This circuit template checks that c is the multiplication of a and b.*/  

template Multiplier2 () {  

   // Declaration of signals.  
   signal input a;  
   signal input b;  
   signal output c;  
     
   // Constraints.  
   c <== a * b;  
}
```

----------------------------------------

TITLE: Compiling a Circom Circuit
DESCRIPTION: Shows the command to compile a Circom circuit file. This command generates R1CS constraints, WASM code for witness generation, a symbols file for debugging, and C++ code for witness generation.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/compiling-circuits.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
circom multiplier2.circom --r1cs --wasm --sym --c
```

----------------------------------------

TITLE: Implementing Main Component with Public and Private Signals in Circom
DESCRIPTION: Shows a complete example of defining a template 'A' and instantiating it as the main component. It demonstrates how to declare public and private input signals, and how output signals are always public.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/the-main-component.md#2025-04-12_snippet_1

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0;

template A(){
    signal input in1;
    signal input in2;
    signal output out;
    out <== in1 * in2;
}

component main {public [in1]}= A();
```

----------------------------------------

TITLE: Declaring Version Pragma in Circom
DESCRIPTION: Specifies the compiler version that a circom file is compatible with. This pragma should be used at the beginning of all .circom files to ensure compiler compatibility. Without this instruction, the compiler assumes compatibility with the latest version and displays a warning.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/pragma.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
pragma circom xx.yy.zz;
```

----------------------------------------

TITLE: 2-Input AND Gate Implementation in Circom
DESCRIPTION: Creates a 2-input AND gate by combining multiplier and binary check components. Shows composition of multiple templates and constraint handling for logic operations.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/more-circuits/more-basic-circuits.md#2025-04-12_snippet_3

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0;

template And2(){
   //Declaration of signals and components.
   signal input in1;
   signal input in2;
   signal output out;
   component mult = Multiplier2();
   component binCheck[2];
   
   //Statements.
   binCheck[0] = binaryCheck();
   binCheck[0].in <== in1;
   binCheck[1] = binaryCheck();
   binCheck[1].in <== in2;
   mult.in1 <== binCheck[0].out;
   mult.in2 <== binCheck[1].out;
   out <== mult.out;
}

component main = And2();
```

----------------------------------------

TITLE: Exporting Solidity Verifier Contract in SnarkJS
DESCRIPTION: Generates a Solidity smart contract for on-chain verification of proofs. This contract can be deployed to Ethereum or compatible blockchains to verify proofs.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/proving-circuits.md#2025-04-12_snippet_8

LANGUAGE: text
CODE:
```
snarkjs zkey export solidityverifier multiplier2_0001.zkey verifier.sol
```

----------------------------------------

TITLE: Defining Main Component Syntax in Circom
DESCRIPTION: Demonstrates the syntax for creating the main component in Circom. The main component is special as it defines global input and output signals for a circuit and allows specification of public input signals.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/the-main-component.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
component main {public [signal_list]} = tempid(v1,...,vn);
```

----------------------------------------

TITLE: Converting Number to Binary Bits in Circom
DESCRIPTION: A template that converts a number to its binary representation. It uses bitwise operators and constraints to ensure the conversion is correct, returning an array of bits.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/basic-operators.md#2025-04-12_snippet_2

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0;

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1=0;
    var e2=1;
    for (var i = 0; i<n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] -1 ) === 0;
        lc1 += out[i] * e2;
        e2 = e2+e2;
    }
    lc1 === in;
}

component main {public [in]}= Num2Bits(3);
```

----------------------------------------

TITLE: Generating a Groth16 Proof in SnarkJS
DESCRIPTION: Creates a zk-SNARK proof using the Groth16 protocol. It takes the zkey file and witness as inputs and outputs the proof and public signals files.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/proving-circuits.md#2025-04-12_snippet_6

LANGUAGE: text
CODE:
```
snarkjs groth16 prove multiplier2_0001.zkey witness.wtns proof.json public.json
```

----------------------------------------

TITLE: Assigning Signals with Bitwise Operations in Circom
DESCRIPTION: Shows how to use the '<--' operator for assigning a signal when the expression cannot be directly included in an arithmetic constraint, such as bitwise operations.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/signals.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
out[k] <-- (in >> k) & 1;
```

----------------------------------------

TITLE: Verifying a Proof in SnarkJS
DESCRIPTION: Verifies a zk-SNARK proof using the verification key, public inputs/outputs, and the proof itself. Returns 'OK' if the proof is valid.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/proving-circuits.md#2025-04-12_snippet_7

LANGUAGE: text
CODE:
```
snarkjs groth16 verify verification_key.json public.json proof.json
```

----------------------------------------

TITLE: Basic Template Definition in Circom
DESCRIPTION: Shows the basic structure of a template definition with input/output signals and parameters.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
template tempid ( param_1, ... , param_n ) {
 signal input a;
 signal output b;

 .....

}
```

----------------------------------------

TITLE: Declaring Signals in Circom
DESCRIPTION: Demonstrates how to declare input, output, and intermediate signals in Circom. Signals can be named identifiers or stored in arrays.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/signals.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
signal input in;
signal output out[N];
signal inter;
```

----------------------------------------

TITLE: Valid Component Array Implementation in Circom
DESCRIPTION: Complete example showing how to correctly implement an array of components in Circom. Demonstrates instantiating multiple components of the same template with different parameters.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/data-types.md#2025-04-12_snippet_3

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0;

template fun(N){
  signal output out;
  out <== N;
}

template all(N){
  component c[N];
  for(var i = 0; i < N; i++){
     c[i] = fun(i);
  }
}

component main = all(5);
```

----------------------------------------

TITLE: Implementing IsZero Check in Circom
DESCRIPTION: A template that checks if an input signal is zero. It uses the inverse calculation technique with constraints to ensure the output is 1 if the input is 0, and 0 otherwise.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/basic-operators.md#2025-04-12_snippet_1

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0;

template IsZero() {
    signal input in;
    signal output out;
    signal inv;
    inv <-- in!=0 ? 1/in : 0;
    out <== -in*inv +1;
    in*out === 0;
}

component main {public [in]}= IsZero();
```

----------------------------------------

TITLE: N-Input AND Gate Implementation in Circom
DESCRIPTION: Extends the AND gate to handle N inputs using arrays and loops. Combines binary checks and multipliers in a scalable design pattern.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/more-circuits/more-basic-circuits.md#2025-04-12_snippet_4

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0;

template AndN (N){
   //Declaration of signals and components.
   signal input in[N];
   signal output out;
   component mult[N-1];
   component binCheck[N];
   
   //Statements.
   for(var i = 0; i < N; i++){
   	   binCheck[i] = binaryCheck();
	     binCheck[i].in <== in[i];
   }
   for(var i = 0; i < N-1; i++){
   	   mult[i] = Multiplier2();
   }
   mult[0].in1 <== binCheck[0].out;
   mult[0].in2 <== binCheck[1].out;
   for(var i = 0; i < N-2; i++){
	   mult[i+1].in1 <== mult[i].out;
	   mult[i+1].in2 <== binCheck[i+2].out;
   	   
   }
   out <== mult[N-2].out; 
}

component main = AndN(4);
```

----------------------------------------

TITLE: Basic Array Declaration and Initialization in Circom
DESCRIPTION: Examples of array declaration in Circom, both with and without initialization. Shows how to declare fixed-size arrays, parameter-based sizes, multidimensional arrays, and function-initialized arrays.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/data-types.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
var x[3] = [2,8,4];
var z[n+1];  // where n is a parameter of a template
var dbl[16][2] = base;
var y[5] = someFunction(n);
```

----------------------------------------

TITLE: Creating N-Input Multiplier with Arrays in Circom
DESCRIPTION: Shows implementation of a parameterized N-input multiplier using arrays and loops. Demonstrates template parameterization and dynamic component instantiation based on input size.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/more-circuits/more-basic-circuits.md#2025-04-12_snippet_1

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0; 

template Multiplier2(){
     /*Code from the previous example.*/
}

template MultiplierN (N){
   //Declaration of signals and components.
   signal input in[N];
   signal output out;
   component comp[N-1];
   
   //Statements.
   for(var i = 0; i < N-1; i++){
   	   comp[i] = Multiplier2();
   }

   // ... some more code (see below)
   
}

component main = MultiplierN(4);
```

----------------------------------------

TITLE: Computing Witness with WebAssembly in Circom
DESCRIPTION: Command to generate a witness file from WebAssembly code. This uses the JavaScript wrapper generated by Circom to process the input and create a binary witness file.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/computing-the-witness.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
node generate_witness.js multiplier2.wasm input.json witness.wtns
```

----------------------------------------

TITLE: Defining a Multiplier Circuit in Circom
DESCRIPTION: Demonstrates how to create a simple multiplier circuit using Circom. The code defines a Multiplier2 template with two input signals and one output signal, and creates a main component instance.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/compiling-circuits.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
pragma circom 2.0.0;

template Multiplier2() {
    signal input a;
    signal input b;
    signal output c;
    c <== a*b;
 }

 component main = Multiplier2();
```

----------------------------------------

TITLE: Implementing 3-Input Multiplier in Circom
DESCRIPTION: Demonstrates how to extend a 2-input multiplier to handle 3 inputs using component instantiation and signal connections. Uses template inheritance and shows proper signal routing between components.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/more-circuits/more-basic-circuits.md#2025-04-12_snippet_0

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0;

template Multiplier2(){
     /*Code from the previous example.*/
}

//This circuit multiplies in1, in2, and in3.
template Multiplier3 () {
   //Declaration of signals and components.
   signal input in1;
   signal input in2;
   signal input in3;
   signal output out;
   component mult1 = Multiplier2();
   component mult2 = Multiplier2();

   //Statements.
   mult1.in1 <== in1;
   mult1.in2 <== in2;
   mult2.in1 <== mult1.out;
   mult2.in2 <== in3;
   out <== mult2.out;
}

component main = Multiplier3();
```

----------------------------------------

TITLE: Creating JSON Input for Circom Circuit
DESCRIPTION: A simple JSON input file for a multiplier circuit where a=3 and b=11. Strings are used instead of numbers to avoid JavaScript integer precision limitations.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/computing-the-witness.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
{"a": "3", "b": "11"}
```

----------------------------------------

TITLE: Basic Constraint Definition in Circom
DESCRIPTION: Shows how to define a basic equality constraint using the === operator. This constraint ensures that a*(a-1) equals 0.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/constraint-generation.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
a*(a-1) === 0;
```

----------------------------------------

TITLE: Safe Division Assignment in Circom
DESCRIPTION: Demonstrates the proper way to handle division operations by combining signal assignment with appropriate constraints.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/constraint-generation.md#2025-04-12_snippet_3

LANGUAGE: text
CODE:
```
a <-- b/c;
a*c === b;
```

----------------------------------------

TITLE: Compilation Time Assert Example in Circom
DESCRIPTION: Demonstrates a compilation-time assert that checks if template parameter n is greater than 0. If the assertion fails during compilation (e.g., when n=0), it throws error T3001.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/code-assertion.md#2025-04-12_snippet_0

LANGUAGE: circom
CODE:
```
template A(n) {
  signal input in;
  assert(n>0);
  in * in === n;
}

component main = A(0);
```

----------------------------------------

TITLE: Runtime Assert Example in Circom
DESCRIPTION: Shows a runtime assert that verifies if an input signal is less than or equal to 254. This assertion is checked during witness generation rather than at compilation time.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/code-assertion.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
template Translate(n) {
  signal input in;  
  assert(in<=254);
  . . .
}
```

----------------------------------------

TITLE: Recursive Number Bits Calculator Function
DESCRIPTION: A function that calculates the number of bits required to represent a number. This demonstrates recursion and looping in circom functions.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/functions.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
/*
    This function calculates the number of extra bits 
    in the output to do the full sum.
 */

function nbits(a) {
    var n = 1;
    var r = 0;
    while (n-1<a) {
        r++;
        n *= 2;
    }
    return r;
}
```

----------------------------------------

TITLE: Custom Template Definition
DESCRIPTION: Demonstrates how to define and use custom templates for PLONK scheme integration.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_11

LANGUAGE: text
CODE:
```
pragma circom 2.0.6; // note that custom templates are only allowed since version 2.0.6
pragma custom_templates;

template custom Example() {
   // custom template's code
}

template UsingExample() {
   component example = Example(); // instantiation of the custom template
}
```

----------------------------------------

TITLE: Variable Declaration and Assignment in Circom
DESCRIPTION: Demonstrates various ways to declare and initialize variables in Circom, including simple assignments, initialization at declaration, and array initialization.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/variables-and-mutability.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
var x;
x = 234556;
var y = 0;
var z[3] = [1,2,3];
```

----------------------------------------

TITLE: Demonstrating Valid Circom Identifiers
DESCRIPTION: Examples showing valid identifier patterns in Circom, including underscore prefixes, variable names with special characters like $ and _, and signal declarations.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/identifiers.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
signal input _in; 
var o_u_t;
var o$o;

```

----------------------------------------

TITLE: Signal Assignment with Constraint in Circom
DESCRIPTION: Demonstrates the use of <== operator for combined signal assignment and constraint generation.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/constraint-generation.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
out <== 1 - a*b;
```

----------------------------------------

TITLE: Preparing Phase 2 of Trusted Setup in SnarkJS
DESCRIPTION: Prepares the Powers of Tau for the Phase 2 (circuit-specific) ceremony. This generates the final Powers of Tau file that will be used for circuit setup.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/proving-circuits.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```

----------------------------------------

TITLE: Binary Check Circuit Implementation in Circom
DESCRIPTION: Implements a circuit to verify if an input signal is binary (0 or 1) using constraint equations. Shows basic constraint definition and signal assignment.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/more-circuits/more-basic-circuits.md#2025-04-12_snippet_2

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0;

template binaryCheck () {

   // Declaration of signals.
   
   signal input in;
   signal output out;
   
   // Statements.
   
   in * (in-1) === 0;
   out <== in;
}

component main = binaryCheck();
```

----------------------------------------

TITLE: Enhanced Log Operation with Multiple Arguments
DESCRIPTION: Demonstration of the enhanced log operation (available since Circom 2.0.6) that supports multiple expressions and string literals in a single statement.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/debugging-operations.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
log("The expected result is ", 135, " but the value of a is", a);
```

----------------------------------------

TITLE: Component Signal Access Example
DESCRIPTION: Demonstrates how to access component signals using dot notation.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_4

LANGUAGE: text
CODE:
```
c.a <== y*z-1;
var x;
x = c.b;
```

----------------------------------------

TITLE: IsZero Template with Binary Tag
DESCRIPTION: Implementation of IsZero template showing binary tag usage on output signals with constraints.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/tags.md#2025-04-12_snippet_3

LANGUAGE: circom
CODE:
```
template IsZero() {
    signal input in;
    signal output {binary} out;
    signal inv;
    inv <-- in!=0 ? 1/in : 0;
    out <== -in*inv +1;
    in*out === 0;
}
```

----------------------------------------

TITLE: Signal Array Declaration in Circom
DESCRIPTION: Demonstrates how to declare arrays of signals in Circom. Shows the syntax for input, output, and intermediate signal arrays with explicit sizes.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/data-types.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
  signal input in[3];
  signal output out[2];
  signal intermediate[4];
```

----------------------------------------

TITLE: Optimizing Assignments with <== Operator (Circom)
DESCRIPTION: Illustrates a case where the compiler suggests using the <== operator instead of <-- for more efficient and secure circuit design.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/inspect.md#2025-04-12_snippet_8

LANGUAGE: circom
CODE:
```
out <-- in / 4;
out*4 === in;
```

----------------------------------------

TITLE: Initializing Signals During Declaration in Circom
DESCRIPTION: Demonstrates the syntax for initializing intermediate and output signals immediately after their declaration, which is supported since Circom 2.0.4.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/signals.md#2025-04-12_snippet_3

LANGUAGE: text
CODE:
```
pragma circom 2.0.0;

template Multiplier2(){
   //Declaration of signals
   signal input in1;
   signal input in2;
   signal output out <== in1 * in2;
}

component main {public [in1,in2]} = Multiplier2();
```

----------------------------------------

TITLE: Bits2Num Template with Binary Tag
DESCRIPTION: Implementation of Bits2Num template using binary tag on input signals to ensure binary values (0 or 1).
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/tags.md#2025-04-12_snippet_1

LANGUAGE: circom
CODE:
```
template Bits2Num(n) {
    signal input {binary} in[n];
    signal output out;
    var lc1=0;

    var e2 = 1;
    for (var i = 0; i<n; i++) {
        lc1 += in[i] * e2;
        e2 = e2 + e2;
    }

    lc1 ==> out;
}

template A(){
    ...
    component b = Bits2Num(10);
    b.in <== a;
    ...
}
```

----------------------------------------

TITLE: Installing SnarkJS via NPM
DESCRIPTION: NPM command to globally install the SnarkJS package, which is used for generating and validating zero-knowledge proofs from Circom circuit artifacts.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/installation.md#2025-04-12_snippet_5

LANGUAGE: text
CODE:
```
npm install -g snarkjs
```

----------------------------------------

TITLE: Full Optimization Flag in Circom
DESCRIPTION: Command flag for complete constraint simplification including Gaussian elimination. Best suited for Groth16 proof system.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/circom-insight/simplification.md#2025-04-12_snippet_2

LANGUAGE: bash
CODE:
```
--O2
```

----------------------------------------

TITLE: Defining Basic Bus Structure in Circom
DESCRIPTION: Basic syntax for defining a bus structure in Circom with parameters.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/buses.md#2025-04-12_snippet_0

LANGUAGE: circom
CODE:
```
bus NameBus(param1,...,paramN){
    //signals, 
    //arrays,
    //other buses...
}
```

----------------------------------------

TITLE: Declaring Custom Templates Pragma in Circom
DESCRIPTION: Indicates that a file uses custom templates or includes files that declare custom templates. This pragma was introduced in circom 2.0.6 and must be included to avoid compiler errors. It should be placed at the beginning of the file after the version pragma.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/pragma.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
pragma custom_templates;
```

----------------------------------------

TITLE: Including External Template Files in Circom
DESCRIPTION: This code shows how to include external template files in a Circom program. The example includes three different files: montgomery.circom, mux3.circom, and babyjub.circom from the circom library. The '.circom' extension is the default and will be automatically added if not specified.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/include.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
include "montgomery.circom";
include "mux3.circom";
include "babyjub.circom";
```

----------------------------------------

TITLE: Edwards to Montgomery Point Conversion Template
DESCRIPTION: Template using Point bus to convert coordinates between Edwards and Montgomery formats.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/buses.md#2025-04-12_snippet_2

LANGUAGE: circom
CODE:
```
template Edwards2Montgomery () {
 input Point() { edwards_point } in ;
 output Point() { montgomery_point } out ;

 out.x <–- (1 + in.y ) / (1 - in.y ) ;
 out.y <–- out.x / in.x ;

 out.x * (1 - in.y ) === (1 + in.y ) ;
 out.y * in.x === out.x ;
 }
```

----------------------------------------

TITLE: Well-Defined Figure Template
DESCRIPTION: Template for validating geometric figure correctness by checking point connections.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/buses.md#2025-04-12_snippet_9

LANGUAGE: circom
CODE:
```
template well_defined_figure(num_sides, dimension){
    input Figure(num_sides,dimension) t;
    output Figure(num_sides,dimension) {well_defined} correct_t;
    var all_equals = 0;
    var isequal = 0;
    for(var i = 0; i < num_sides; i=i+1){
        for(var j = 0; j < dimension; j=j+1){
            isequal = IsEqual()([t.side[i].end.x[j],t.side[(i+1)%num_sides].start.x[j]]);
            all_equals += isequal;
        }
    }
    all_equals === num_sides;
    correct_t <== t;
}
```

----------------------------------------

TITLE: Using Conditional Expression in Circom
DESCRIPTION: Example of a conditional expression used to find the maximum of two values. This demonstrates the ternary operator which can only be used at the top level in Circom.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/basic-operators.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
var z = x>y? x : y;
```

----------------------------------------

TITLE: Basic Log Operations in Circom
DESCRIPTION: Examples of basic log operations for printing numeric values, component properties, and boolean expressions to the standard error stream.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/debugging-operations.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
log(135);
log(c.b);
log(x==y);
```

----------------------------------------

TITLE: Expression Generation Example in Circom
DESCRIPTION: Demonstrates how expressions are generated and constrained in Circom using intermediate variables.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/constraint-generation.md#2025-04-12_snippet_5

LANGUAGE: text
CODE:
```
 signal input a;
 signal output b;
 var x = a*a;
 x += 3;
 b <== x;
```

----------------------------------------

TITLE: Parallel Component Array Example
DESCRIPTION: Shows practical usage of parallel components in an array.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_10

LANGUAGE: text
CODE:
```
component rollupTx[nTx];
for (var i = 0; i < nTx; i++) {
        rollupTx[i] = parallel RollupTx(nLevels, maxFeeTx);
}
```

----------------------------------------

TITLE: Component Instantiation Syntax
DESCRIPTION: Shows how to instantiate a template using the component keyword with parameters.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
component c = tempid(v1,...,vn);
```

----------------------------------------

TITLE: Equivalent Signal Assignment and Constraint
DESCRIPTION: Shows the expanded form of the <== operator using separate assignment (<--) and constraint (===) operations.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/constraint-generation.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
out <-- 1 - a*b;
out === 1 – a*b;
```

----------------------------------------

TITLE: Using Named Inputs with Anonymous Components in Circom
DESCRIPTION: Demonstration of using named inputs with anonymous components, allowing for more flexible input assignment order.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/anonymous-components-and-tuples.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
template A(n){
   signal input a, b;
   signal output c;
   c <== a*b;
}
template B(n){
   signal input in[n];
   signal out <== A(n)(b <== in[1], a <== in[0]);
}
component main = B(2);
```

----------------------------------------

TITLE: Exporting Verification Key in SnarkJS
DESCRIPTION: Extracts the verification key from the zkey file into a separate JSON file. This verification key will be used to verify proofs without the entire trusted setup.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/proving-circuits.md#2025-04-12_snippet_5

LANGUAGE: text
CODE:
```
snarkjs zkey export verificationkey multiplier2_0001.zkey verification_key.json
```

----------------------------------------

TITLE: Defining Public Signals in Circom Main Component
DESCRIPTION: Illustrates how to declare public input signals in the main component of a Circom circuit. Output signals of the main component are always public.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/signals.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
pragma circom 2.0.0;

template Multiplier2(){
   //Declaration of signals
   signal input in1;
   signal input in2;
   signal output out;
   out <== in1 * in2;
}

component main {public [in1,in2]} = Multiplier2();
```

----------------------------------------

TITLE: Parallel Component Declaration
DESCRIPTION: Demonstrates component-level parallelization syntax.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_9

LANGUAGE: text
CODE:
```
component comp = parallel NameTemplate(...){...}
```

----------------------------------------

TITLE: Nested Bus Definitions
DESCRIPTION: Example of nested bus definitions for Film, Date, and Person structures.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/buses.md#2025-04-12_snippet_6

LANGUAGE: circom
CODE:
```
bus Film() {
    signal title[50];
    signal director[50];
    signal year;
}

bus Date() {
    signal day;
    signal month;
    signal year;
}

bus Person() {
    signal name[50];
    Film() films[10];
    Date() birthday;
}
```

----------------------------------------

TITLE: Computing Witness with C++ in Circom
DESCRIPTION: Command to run the compiled C++ witness calculator with an input file. This generates the same witness file as the WebAssembly method but with better performance for large circuits.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/computing-the-witness.md#2025-04-12_snippet_3

LANGUAGE: text
CODE:
```
./multiplier2 input.json witness.wtns
```

----------------------------------------

TITLE: Parallel Template Declaration
DESCRIPTION: Shows syntax for declaring parallel templates for optimization.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_8

LANGUAGE: text
CODE:
```
template parallel NameTemplate(...){...}
```

----------------------------------------

TITLE: Component Array Implementation
DESCRIPTION: Shows how to implement and use arrays of components with recursive logic.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_7

LANGUAGE: text
CODE:
```
template MultiAND(n) {
    signal input in[n];
    signal output out;
    component and;
    component ands[2];
    var i;
    if (n==1) {
        out <== in[0];
    } else if (n==2) {
          and = AND();
        and.a <== in[0];
        and.b <== in[1];
        out <== and.out;
    } else {
        and = AND();
        var n1 = n\2;
        var n2 = n-n\2;
        ands[0] = MultiAND(n1);
        ands[1] = MultiAND(n2);
        for (i=0; i<n1; i++) ands[0].in[i] <== in[i];
        for (i=0; i<n2; i++) ands[1].in[i] <== in[n1+i];
        and.a <== ands[0].out;
        and.b <== ands[1].out;
        out <== and.out;
    }
}
```

----------------------------------------

TITLE: Compiling C++ Witness Generator for Circom
DESCRIPTION: Command to compile the C++ witness calculator generated by Circom. This creates an executable that can compute witnesses significantly faster than the WebAssembly version.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/computing-the-witness.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
make
```

----------------------------------------

TITLE: Creating Point Bus Structure
DESCRIPTION: Defines a Point bus containing x and y coordinates as signals.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/buses.md#2025-04-12_snippet_1

LANGUAGE: circom
CODE:
```
bus Point(){
    signal x;
    signal y;
}
```

----------------------------------------

TITLE: Defining Basic Functions in Circom
DESCRIPTION: Basic syntax for defining a function in circom. Functions take parameters and must return a value or expression.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/functions.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
function funid ( param1, ... , paramn ) {

 .....

 return x;
}
```

----------------------------------------

TITLE: Basic If-Then-Else Conditional in Circom
DESCRIPTION: Demonstrates basic conditional statement usage with variable assignments and arithmetic operations.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/control-flow.md#2025-04-12_snippet_0

LANGUAGE: text
CODE:
```
var x = 0;
var y = 1;
if (x >= 0) {
   x = y + 1;
   y += 1;
} else {
   y = x;
}
```

----------------------------------------

TITLE: Using Anonymous Components to Avoid Warnings (Circom)
DESCRIPTION: Illustrates how to use anonymous components to simplify code and avoid warnings about unused signals.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/inspect.md#2025-04-12_snippet_5

LANGUAGE: circom
CODE:
```
template check_bits(n){
  signal input in;
  _ <== Num2Bits(n)(in);
}
```

----------------------------------------

TITLE: Demonstrating Error Generation in Circom
DESCRIPTION: This example shows a common error when programming in Circom - trying to assign a value to a signal using the = operator instead of the <== constraint operator. This generates an error: "Assignee and assigned types do not match operator."
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/circom-insight/compiler-messages.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
pragma circom 2.0.0;

template A(){
  signal in;
  in = 1;
}

component main = A();
```