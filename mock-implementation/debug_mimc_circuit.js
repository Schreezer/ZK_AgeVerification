/**
 * Focused debug script for the MiMC7 circuit
 */

const { mimcHash } = require('./pedersen_utils');
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

async function debugMimcCircuit() {
    console.log('=== Debugging MiMC7 Circuit ===');
    
    // Test case
    const userAge = 25;
    const blindingFactor = 123456789n;
    
    // Calculate hash in JavaScript
    const jsHash = mimcHash(userAge, blindingFactor);
    console.log(`JavaScript hash: ${jsHash}`);
    
    // Create a simple test circuit file
    const testCircuitPath = path.join(__dirname, 'test_mimc.circom');
    const testCircuitContent = `
pragma circom 2.0.0;
include "node_modules/circomlib/circuits/mimc.circom";

template TestMiMC() {
    signal input x_in;
    signal input k;
    signal output out;
    
    component mimc = MiMC7(91);
    mimc.x_in <== x_in;
    mimc.k <== k;
    
    out <== mimc.out;
}

component main = TestMiMC();
`;
    
    fs.writeFileSync(testCircuitPath, testCircuitContent);
    console.log(`Created test circuit at ${testCircuitPath}`);
    
    // Compile the test circuit
    console.log('\nCompiling test circuit...');
    try {
        const { execSync } = require('child_process');
        execSync(`circom ${testCircuitPath} --r1cs --wasm --sym`, { stdio: 'inherit' });
        console.log('✅ Test circuit compiled successfully');
        
        // Prepare inputs
        const inputsPath = path.join(__dirname, 'test_mimc_inputs.json');
        const inputs = {
            x_in: userAge.toString(),
            k: blindingFactor.toString()
        };
        fs.writeFileSync(inputsPath, JSON.stringify(inputs, null, 2));
        
        // Generate witness
        console.log('\nGenerating witness...');
        const wasmPath = path.join(__dirname, 'test_mimc_js', 'test_mimc.wasm');
        
        try {
            // Use snarkjs to calculate the witness
            const { wtns } = await snarkjs.wtns.calculate(
                inputs,
                wasmPath,
                path.join(__dirname, 'witness.wtns')
            );
            
            // Read the witness output
            const { readWtns } = snarkjs.wtns;
            const witness = await readWtns(path.join(__dirname, 'witness.wtns'));
            
            // The output is at index 1 (index 0 is always 1)
            const circuitHash = witness[1];
            console.log(`Circuit hash: ${circuitHash}`);
            
            // Compare the hashes
            if (jsHash.toString() === circuitHash.toString()) {
                console.log('✅ JavaScript and circuit hashes match!');
            } else {
                console.log('❌ JavaScript and circuit hashes do not match!');
                console.log('This indicates a difference in the hash implementation.');
            }
        } catch (error) {
            console.error('Error generating witness:', error);
            
            // Try a different approach with direct fullProve
            console.log('\nTrying with fullProve...');
            try {
                const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                    inputs,
                    wasmPath,
                    path.join(__dirname, 'pot14_final.ptau')
                );
                
                console.log('Public signals:', publicSignals);
                console.log('✅ Proof generation succeeded');
                
                // The output is the last public signal
                const circuitHash = publicSignals[0];
                console.log(`Circuit hash: ${circuitHash}`);
                
                // Compare the hashes
                if (jsHash.toString() === circuitHash.toString()) {
                    console.log('✅ JavaScript and circuit hashes match!');
                } else {
                    console.log('❌ JavaScript and circuit hashes do not match!');
                    console.log('This indicates a difference in the hash implementation.');
                }
            } catch (error) {
                console.error('Error with fullProve:', error);
            }
        }
    } catch (error) {
        console.error('Error compiling test circuit:', error);
    }
    
    console.log('\n=== MiMC7 Circuit Debugging Completed ===');
}

debugMimcCircuit().catch(console.error);
