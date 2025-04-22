/**
 * Setup script for the proper age verification circuit
 *
 * This script:
 * 1. Compiles the circuit
 * 2. Generates the witness calculator
 * 3. Performs the trusted setup
 * 4. Exports the verification key
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

// Constants
const CIRCUIT_NAME = 'proper_age_verification';
const CIRCUIT_PATH = path.join(__dirname, 'circuit-server', `${CIRCUIT_NAME}.circom`);
const OUTPUT_DIR = path.join(__dirname, 'circuit-server');
const PTAU_PATH = path.join(__dirname, 'mock-implementation', 'ptau', 'powersOfTau28_hez_final_14.ptau');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
    try {
        console.log('Setting up proper age verification circuit...');

        // Step 1: Compile the circuit
        console.log('Compiling circuit...');
        execSync(`circom ${CIRCUIT_PATH} --r1cs --wasm -o ${OUTPUT_DIR}`);
        console.log('Circuit compiled successfully.');

        // Step 2: Perform the trusted setup
        console.log('Performing trusted setup...');

        // Check if the ptau file exists
        if (!fs.existsSync(PTAU_PATH)) {
            console.error(`Powers of Tau file not found at ${PTAU_PATH}`);
            console.error('Please download the file from https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau');
            process.exit(1);
        }

        // Generate the zkey file
        await snarkjs.zKey.newZKey(
            path.join(OUTPUT_DIR, `${CIRCUIT_NAME}.r1cs`),
            PTAU_PATH,
            path.join(OUTPUT_DIR, `${CIRCUIT_NAME}.zkey`)
        );

        // Export the verification key
        const vKey = await snarkjs.zKey.exportVerificationKey(
            path.join(OUTPUT_DIR, `${CIRCUIT_NAME}.zkey`)
        );

        // Write the verification key to a file
        fs.writeFileSync(
            path.join(OUTPUT_DIR, `${CIRCUIT_NAME}_verification_key.json`),
            JSON.stringify(vKey, null, 2)
        );

        console.log('Trusted setup completed successfully.');
        console.log('Circuit setup completed successfully!');

    } catch (error) {
        console.error('Error setting up circuit:', error);
        process.exit(1);
    }
}

main().then(() => {
    process.exit(0);
}).catch(error => {
    console.error(error);
    process.exit(1);
});
