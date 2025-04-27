TITLE: Implementing Element-wise Array Assignment in Circom
DESCRIPTION: Example of using the <== operator for element-wise assignment of signal arrays with the same dimensions.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/anonymous-components-and-tuples.md#2025-04-12_snippet_4

LANGUAGE: text
CODE:
```
template Ex(n,m){ 
   signal input in[n];
   signal output out[m];
   out <== in;
}
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

TITLE: Invalid Variable Assignment with Unknown Condition
DESCRIPTION: Example showing incorrect variable assignment depending on unknown input.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/control-flow.md#2025-04-12_snippet_6

LANGUAGE: circom
CODE:
```
template wrong(){
    signal input in;
    var x; 
    var t = 5;
    if(in > 3){
      t = 2;
    }
    x === t;
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

TITLE: Enhanced Log Operation with Multiple Arguments
DESCRIPTION: Demonstration of the enhanced log operation (available since Circom 2.0.6) that supports multiple expressions and string literals in a single statement.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/debugging-operations.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
log("The expected result is ", 135, " but the value of a is", a);
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

TITLE: Invalid Component Output Usage
DESCRIPTION: Shows an error case where component output is used before all inputs are set.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_5

LANGUAGE: text
CODE:
```
pragma circom 2.0.0;

template Internal() {
   signal input in[2];
   signal output out;
   out <== in[0]*in[1];
}

template Main() {
   signal input in[2];
   signal output out;
   component c = Internal ();
   c.in[0] <== in[0];
   c.out ==> out;  // c.in[1] is not assigned yet
   c.in[1] <== in[1];  // this line should be placed before calling c.out
}

component main = Main();
```

----------------------------------------

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

TITLE: Parallel Component Declaration
DESCRIPTION: Demonstrates component-level parallelization syntax.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_9

LANGUAGE: text
CODE:
```
component comp = parallel NameTemplate(...){...}
```

----------------------------------------

TITLE: Using Loops to Mark Unused Array Elements (Circom)
DESCRIPTION: Shows how to use a loop to mark intentionally unused elements of an array output from a subcomponent.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/inspect.md#2025-04-12_snippet_7

LANGUAGE: circom
CODE:
```
for (var i = 1; i < n; i++) {
  _ <== check.out[i];
}
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

TITLE: Using Underscore Notation to Avoid Warnings (Circom)
DESCRIPTION: Shows how to use the underscore notation to indicate intentionally unused signals and avoid compiler warnings.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/inspect.md#2025-04-12_snippet_1

LANGUAGE: circom
CODE:
```
template A(n) {
  signal aux;
  signal out;
  if(n == 2) {
    aux <== 2;
    out <== B()(aux);
  } else {
    _ <== aux;
    out <== 5;
  }
}
```

----------------------------------------

TITLE: Empty Log Operations for Line Breaks
DESCRIPTION: Shows two equivalent ways to print an end-of-line using the log operation with either an empty string or no arguments.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/debugging-operations.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
log("");
log();
```

----------------------------------------

TITLE: Erroneous Tag Value Assignment
DESCRIPTION: Example showing incorrect tag value modification after signal assignment.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/tags.md#2025-04-12_snippet_5

LANGUAGE: circom
CODE:
```
template Bits2Num(n) {
    ...
    lc1 ==> out;
    out.maxbit = n;
}
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

TITLE: Valid Template with No Signal Dependencies
DESCRIPTION: Example of correct template implementation where conditions don't affect constraint generation.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/control-flow.md#2025-04-12_snippet_4

LANGUAGE: circom
CODE:
```
template right(N){
    signal input in;
    var x = 2;
    var t = 5;
    if(in > N){
      t = 2;
    }
}
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

TITLE: Using Underscore Notation for Subcomponent Outputs (Circom)
DESCRIPTION: Shows how to use the underscore notation to indicate intentionally unused subcomponent outputs and avoid compiler warnings.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/inspect.md#2025-04-12_snippet_4

LANGUAGE: circom
CODE:
```
template check_bits(n) {
  signal input in;
  component check = Num2Bits(n);
  check.in <== in;
  _ <== check.out;
}
```

----------------------------------------

TITLE: Invalid Assignment in Expression (Error Example)
DESCRIPTION: Shows an invalid use of assignment within an expression that would cause a compilation error in Circom.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/variables-and-mutability.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
a = (b = 3) + 2;
```

----------------------------------------

TITLE: Handling Unused Subcomponent Outputs (Circom)
DESCRIPTION: Demonstrates how to handle unused outputs from subcomponents when only using the component for property checking.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/inspect.md#2025-04-12_snippet_3

LANGUAGE: circom
CODE:
```
include "bitify.circom";

template check_bits(n) {
  signal input in;
  component check = Num2Bits(n);
  check.in <== in;
}

component main = check_bits(10);
```

----------------------------------------

TITLE: Valid Template with Known Parameter Dependencies
DESCRIPTION: Demonstrates correct usage of constraints with known parameter values.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/control-flow.md#2025-04-12_snippet_5

LANGUAGE: circom
CODE:
```
template right(N1,N2){
    signal input in;
    var x = 2;
    var t = 5;
    if(N1 > N2){
      t = 2;
    }
    x === t;
}
```

----------------------------------------

TITLE: Double Signal Assignment in Circom (Error Example)
DESCRIPTION: Demonstrates a code snippet that produces a compilation error due to assigning a value to a signal twice, which is not allowed due to signal immutability.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/signals.md#2025-04-12_snippet_5

LANGUAGE: text
CODE:
```
pragma circom 2.0.0;

template A(){
   signal input in;
   signal output outA; 
   outA <== in;
}

template B(){
   //Declaration of signals
   signal output out;
   out <== 0;
   component comp = A();
   comp.in <== 0;
   out <== comp.outA;
}

component main = B();
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

TITLE: Command for Generating sym File with Default Optimization
DESCRIPTION: Shows the command to run the circom compiler with the --sym flag to generate a sym file with default optimization level (--O1).
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/formats/sym.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
circom symbols.circom --r1cs --wasm --sym 
```

----------------------------------------

TITLE: Circom CLI Help Output
DESCRIPTION: Console output showing all available options and flags for the Circom compiler command line interface.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/installation.md#2025-04-12_snippet_4

LANGUAGE: console
CODE:
```
circom --help

circom compiler 2.2.2
IDEN3
Compiler for the circom programming language

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
        --O1                                   Only applies signal to signal and signal to constant simplification. This
                                               is the default option
        --O2                                   Full constraint simplification
        --verbose                              Shows logs during compilation
        --inspect                              Does an additional check over the constraints produced
        --constraint_assert_dissabled          Does not add asserts in the witness generation code to check constraints
                                               introduced with "===" 
        --use_old_simplification_heuristics    Applies the old version of the heuristics when performing linear
                                               simplification
        --simplification_substitution          Outputs the substitution applied in the simplification phase in json
                                               format
        --no_asm                               Does not use asm files in witness generation code in C++
        --no_init                              Removes initializations to 0 of variables ("var") in the witness
                                               generation code
    -h, --help                                 Prints help information
    -V, --version                              Prints version information

OPTIONS:
    -o, --output <output>                    Path to the directory where the output will be written [default: .]
    -p, --prime <prime>                      To choose the prime number to use to generate the circuit. Receives the
                                             name of the curve (bn128, bls12377, bls12381, goldilocks, grumpkin, pallas,
                                             secq256r1, vesta) [default: bn128]
    -l <link_libraries>...                   Adds directory to library search path
        --O2round <simplification_rounds>    Maximum number of rounds of the simplification process

ARGS:
    <input>    Path to a circuit with a main component [default: ./circuit.circom]
```

----------------------------------------

TITLE: Invalid Constraint Generation with Unknown Condition
DESCRIPTION: Example of incorrect template implementation where constraints depend on unknown input signals.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/control-flow.md#2025-04-12_snippet_3

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0;

template A(){}
template wrong(N1){
    signal input in;
    component c;
    if(in > N1){
      c = A();
    }
}
component main {public [in]} = wrong(1);
```

----------------------------------------

TITLE: Invalid Assignment in Conditional (Error Example)
DESCRIPTION: Demonstrates another incorrect use of assignment within a conditional statement that would result in a compilation error.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/variables-and-mutability.md#2025-04-12_snippet_3

LANGUAGE: text
CODE:
```
var x;
if (x = 3) {
   var y = 0;
}
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

TITLE: Invalid Component Parameter Usage
DESCRIPTION: Example showing incorrect usage of non-constant parameters in component instantiation.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_3

LANGUAGE: text
CODE:
```
pragma circom 2.0.0;

template A(N1,N2){
   signal input in;
   signal output out; 
   out <== N1 * in * N2;
}


template wrong (N) {
 signal input a;
 signal output b;
 component c = A(a,N); 
}

component main {public [a]} = wrong(1);
```

----------------------------------------

TITLE: Function with Missing Return Path
DESCRIPTION: An example of an incomplete function that will trigger a compilation error because it doesn't have return statements for all possible execution paths.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/functions.md#2025-04-12_snippet_3

LANGUAGE: text
CODE:
```
function example(N){
	 if(N >= 0){ return 1;}
//	 else{ return 0;}
}
```

----------------------------------------

TITLE: Sample Circom Circuit Definition
DESCRIPTION: Example circuit implementation showing Internal and Main templates with signal definitions and constraints.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/formats/constraints-json.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
pragma circom 2.0.0;

template Internal() {
   signal input in[2];
   signal output out;
   out <== in[0]*in[1];
}

template Main() {
   signal input in[2];
   signal output out;
   component c = Internal ();
   c.in[0] <== in[0];
   c.in[1] <== in[1]+2*in[0]+1;
   c.out ==> out;
}
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

TITLE: Handling Partially Used Subcomponent Outputs (Circom)
DESCRIPTION: Demonstrates how to handle cases where only some outputs of a subcomponent are used, while others are intentionally ignored.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/inspect.md#2025-04-12_snippet_6

LANGUAGE: circom
CODE:
```
include "bitify.circom";

template parity(n) {
  signal input in;
  signal output out;
  component check = Num2Bits(n);
  check.in <== in;
  out <== check.out[0];
}

component main = parity(10);
```

----------------------------------------

TITLE: Invalid Signal Assignment Example
DESCRIPTION: Demonstrates an invalid template where an input signal is assigned within its definition, causing an error.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
pragma circom 2.0.0;

template wrong (N) {
 signal input a;
 signal output b;
 a <== N;
}

component main = wrong(1);
```

----------------------------------------

TITLE: Default Optimization (--O1) Constraints Output
DESCRIPTION: Shows the R1CS constraints output with default O1 optimization level.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/formats/constraints-json.md#2025-04-12_snippet_3

LANGUAGE: text
CODE:
```
{
"constraints": [
[{"2":"21888242871839275222246405745257275088548364400416034343698204186575808495616"},{"4":"1"},{"1":"21888242871839275222246405745257275088548364400416034343698204186575808495616"}],
[{},{},{"0":"1","2":"2","3":"1","4":"21888242871839275222246405745257275088548364400416034343698204186575808495616"}]
]
}
```

----------------------------------------

TITLE: Defining Signals in Conditional Blocks (Circom)
DESCRIPTION: Illustrates how to define signals inside conditional blocks with conditions known at compilation time to avoid warnings about unused signals.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/inspect.md#2025-04-12_snippet_2

LANGUAGE: circom
CODE:
```
template A(n) {
  signal out;
  if(n == 2) {
    signal aux <== 2;
    out <== B()(aux);
  } else {
    out <== 5;
  }
}
```

----------------------------------------

TITLE: sym File Output with Default Optimization (O1)
DESCRIPTION: Shows the sym file output generated with the default optimization level (--O1), where some signals have been eliminated during simplification.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/formats/sym.md#2025-04-12_snippet_3

LANGUAGE: text
CODE:
```
1,1,1,main.out
2,2,1,main.in[0]
3,3,1,main.in[1]
4,-1,0,main.c.out
5,-1,0,main.c.in[0]
6,4,0,main.c.in[1]
```

----------------------------------------

TITLE: Invalid Component Array Implementation in Circom
DESCRIPTION: Example of an invalid component array implementation that produces a compilation error. This demonstrates that all components in an array must be of the same template type.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/data-types.md#2025-04-12_snippet_4

LANGUAGE: circom
CODE:
```
pragma circom 2.0.0;

template fun(N){
  signal output out;
  out <== N;
}

template fun2(N){
  signal output out;
  out <== N;
}

template all(N){
  component c[N];
  for(var i = 0; i < N; i++){
        if(i < N)
             c[i] = fun(i);
        else
           c[i] = fun2(i);
  }
}

component main = all(5);
```

----------------------------------------

TITLE: Default Simplification Output in Circom (--O1)
DESCRIPTION: This JSON snippet shows the output of the simplification substitution process with default optimization level (--O1). Two signals have been substituted.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/formats/simplification-json.md#2025-04-12_snippet_3

LANGUAGE: json
CODE:
```
{
"5" : {"2":"1"},
"4" : {"1":"1"}
}
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

TITLE: Component Instantiation Syntax
DESCRIPTION: Shows how to instantiate a template using the component keyword with parameters.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/templates-and-components.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
component c = tempid(v1,...,vn);
```

----------------------------------------

TITLE: Accessing Non-Output Signals in Circom (Error Example)
DESCRIPTION: Shows an example that produces a compilation error due to attempting to access a signal that is not declared as an output signal.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/signals.md#2025-04-12_snippet_4

LANGUAGE: text
CODE:
```
pragma circom 2.0.0;

template A(){
   signal input in;
   signal outA; //We do not declare it as output.
   outA <== in;
}

template B(){
   //Declaration of signals
   signal output out;
   component comp = A();
   out <== comp.outA;
}

component main = B();
```

----------------------------------------

TITLE: Basic R1CS JSON Structure
DESCRIPTION: Shows the top-level JSON structure for R1CS constraints output.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/formats/constraints-json.md#2025-04-12_snippet_0

LANGUAGE: json
CODE:
```
{
"constraints": [
constraint_1,
...
constraint_n
]
}
```

----------------------------------------

TITLE: Invalid Function with Signal Declaration and Constraint
DESCRIPTION: This example shows what's not allowed in circom functions: declaring signals or generating constraints. These operations are only allowed in templates.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/functions.md#2025-04-12_snippet_2

LANGUAGE: text
CODE:
```
function nbits(a) {
    signal input in; //This is not allowed.
    var n = 1;
    var r = 0;
    while (n-1<a) {
        r++;
        n *= 2;
    }
    r === a; //This is also not allowed.
    return r;
}
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

TITLE: Handling Unused Signals in Conditional Branches (Circom)
DESCRIPTION: Demonstrates how to handle signals that are only used in certain conditional branches to avoid warnings about underconstrained signals.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/code-quality/inspect.md#2025-04-12_snippet_0

LANGUAGE: circom
CODE:
```
template B() {
  signal input in;
  signal output out;
  out <== in + 1;
}

template A(n) {
  signal aux;
  signal out;
  if(n == 2) {
    aux <== 2;
    out <== B()(aux);
  } else {
    out <== 5;
  }
}

component main = A(3);
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

TITLE: Command for Generating sym File with No Optimization
DESCRIPTION: Shows the command to run the circom compiler with the --sym flag and --O0 option to generate a sym file without any optimization.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/formats/sym.md#2025-04-12_snippet_4

LANGUAGE: text
CODE:
```
circom symbols.circom --r1cs --wasm --sym --O0
```

----------------------------------------

TITLE: Simplification Substitution Output Flag
DESCRIPTION: Command flag to generate a JSON file containing details of applied simplifications.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/circom-insight/simplification.md#2025-04-12_snippet_4

LANGUAGE: bash
CODE:
```
--simplification_substitution
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

TITLE: For Loop Implementation in Circom
DESCRIPTION: Shows a basic for loop implementation with counter and variable increment.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/control-flow.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
var y = 0;
for(var i = 0; i < 100; i++){
    y++;
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

TITLE: sym File Output with No Optimization (O0)
DESCRIPTION: Shows the sym file output generated with no optimization (--O0), where all signals are preserved in the output.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/formats/sym.md#2025-04-12_snippet_5

LANGUAGE: text
CODE:
```
1,1,1,main.out
2,2,1,main.in[0]
3,3,1,main.in[1]
4,4,0,main.c.out
5,5,0,main.c.in[0]
6,6,0,main.c.in[1]
```

----------------------------------------

TITLE: Selectively Ignoring Outputs with Underscore in Circom
DESCRIPTION: Example showing how to selectively ignore specific outputs from an anonymous component with multiple outputs using underscores.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/anonymous-components-and-tuples.md#2025-04-12_snippet_6

LANGUAGE: text
CODE:
```
template A(n){
   signal input a;
   signal output b, c, d;
   b <== a * a;
   c <== a + 2;
   d <== a * a + 2;
}
template B(n){
   signal input in;
   signal output out1;
   (_,out1,_) <== A(n)(in);
}
component main = B(3);
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

TITLE: Signal Assignment with Constraint in Circom
DESCRIPTION: Demonstrates the use of <== operator for combined signal assignment and constraint generation.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/constraint-generation.md#2025-04-12_snippet_1

LANGUAGE: text
CODE:
```
out <== 1 - a*b;
```

----------------------------------------

TITLE: Installing Circom Binary
DESCRIPTION: Cargo command to install the compiled Circom binary to the user's path for system-wide access.
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/getting-started/installation.md#2025-04-12_snippet_3

LANGUAGE: text
CODE:
```
cargo install --path circom
```

----------------------------------------

TITLE: No Optimization (--O0) Constraints Output
DESCRIPTION: Shows the R1CS constraints output with O0 optimization level (no optimizations).
SOURCE: https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/formats/constraints-json.md#2025-04-12_snippet_4

LANGUAGE: text
CODE:
```
{
"constraints": [
[{},{},{"2":"1","5":"21888242871839275222246405745257275088548364400416034343698204186575808495616"}],
[{},{},{"0":"1","2":"2","3":"1","6":"21888242871839275222246405745257275088548364400416034343698204186575808495616"}],
[{},{},{"1":"21888242871839275222246405745257275088548364400416034343698204186575808495616","4":"1"}],
[{"5":"21888242871839275222246405745257275088548364400416034343698204186575808495616"},{"6":"1"},{"4":"21888242871839275222246405745257275088548364400416034343698204186575808495616"}]
]
}
```