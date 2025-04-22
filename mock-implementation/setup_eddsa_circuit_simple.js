/**
 * Simplified setup script for the EdDSA-based age verification circuit
 * This script only compiles the circuit without generating keys
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Constants
const CIRCUIT_NAME = 'age_verification';
const CIRCUIT_PATH = path.join(__dirname, `${CIRCUIT_NAME}.circom`);
const OUTPUT_DIR = path.join(__dirname, `${CIRCUIT_NAME}_js`);

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
    try {
        console.log('=== Setting up EdDSA-based Age Verification Circuit (Simplified) ===');

        // Step 1: Compile the circuit
        console.log('\n1. Compiling the circuit...');
        execSync(`circom ${CIRCUIT_PATH} --r1cs --wasm --sym -o ${OUTPUT_DIR}`, { stdio: 'inherit' });
        console.log('✅ Circuit compiled successfully');

        console.log('\n=== Setup completed successfully ===');
        console.log('The circuit has been compiled. To generate keys and run the full verification flow,');
        console.log('you would need to use snarkjs commands directly or modify this script.');
    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
}

main().catch(console.error);
