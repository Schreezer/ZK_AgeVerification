/**
 * Setup script for the Simple ZK Age Verification circuit
 * 
 * This script compiles the simple circuit and generates the necessary keys.
 * It should be run before running the demo.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Constants
const CIRCUIT_NAME = 'simple_age_verification';
const PTAU_FILE = 'pot14_final.ptau';

// Helper function to run a command and log output
async function runCommand(command, description) {
    console.log(`\n--- ${description} ---`);
    console.log(`Running: ${command}`);
    
    try {
        const { stdout, stderr } = await execPromise(command);
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        return true;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return false;
    }
}

// Main setup function
async function setupCircuit() {
    console.log('=== Simple ZK Age Verification Circuit Setup ===\n');
    
    // Step 1: Generate a Powers of Tau file for testing if it doesn't exist
    if (!fs.existsSync(PTAU_FILE)) {
        console.log(`Powers of Tau file (${PTAU_FILE}) not found. Generating...`);
        
        // Generate a new Powers of Tau file with 2^14 constraints (should be enough for testing)
        const ptauSuccess1 = await runCommand(`snarkjs powersoftau new bn128 14 pot14_0.ptau -v`, 'Generating initial Powers of Tau');
        if (!ptauSuccess1) {
            console.error('Failed to generate initial Powers of Tau file.');
            return;
        }
        
        // Contribute to the ceremony (add randomness)
        const ptauSuccess2 = await runCommand(`snarkjs powersoftau contribute pot14_0.ptau pot14_1.ptau --name="First contribution" -v -e="some random text"`, 'Contributing to Powers of Tau');
        if (!ptauSuccess2) {
            console.error('Failed to contribute to Powers of Tau file.');
            return;
        }
        
        // Prepare for phase 2
        const ptauSuccess3 = await runCommand(`snarkjs powersoftau prepare phase2 pot14_1.ptau ${PTAU_FILE} -v`, 'Preparing Powers of Tau for phase 2');
        if (!ptauSuccess3) {
            console.error('Failed to prepare Powers of Tau for phase 2.');
            return;
        }
        
        // Clean up temporary files
        fs.unlinkSync('pot14_0.ptau');
        fs.unlinkSync('pot14_1.ptau');
    }
    
    // Step 2: Compile the circuit
    const compileSuccess = await runCommand(
        `circom ${CIRCUIT_NAME}.circom --r1cs --wasm --sym`,
        'Compiling circuit'
    );
    if (!compileSuccess) {
        console.error('Failed to compile circuit. Please check the circom installation and circuit file.');
        return;
    }
    
    // Step 3: Generate the zkey
    const zkeySuccess = await runCommand(
        `snarkjs groth16 setup ${CIRCUIT_NAME}.r1cs ${PTAU_FILE} ${CIRCUIT_NAME}.zkey`,
        'Generating zkey'
    );
    if (!zkeySuccess) {
        console.error('Failed to generate zkey. Please check the snarkjs installation.');
        return;
    }
    
    // Step 4: Export the verification key
    const vkeySuccess = await runCommand(
        `snarkjs zkey export verificationkey ${CIRCUIT_NAME}.zkey ${CIRCUIT_NAME}_verification_key.json`,
        'Exporting verification key'
    );
    if (!vkeySuccess) {
        console.error('Failed to export verification key.');
        return;
    }
    
    console.log('\n=== Circuit Setup Completed Successfully ===');
    console.log('The simple circuit has been compiled and the necessary keys have been generated.');
    console.log('You can now run the demo with: node run_simple_demo.js');
}

// Run the setup
setupCircuit().catch(error => {
    console.error('Setup failed with error:', error);
});
