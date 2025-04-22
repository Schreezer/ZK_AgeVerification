/**
 * Setup script for the Pedersen-based age verification circuit
 * This script compiles the circuit and generates the necessary keys
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

// Constants
const CIRCUIT_NAME = 'mimc_age_verification';
const CIRCUIT_PATH = path.join(__dirname, `${CIRCUIT_NAME}.circom`);
const OUTPUT_DIR = path.join(__dirname, `${CIRCUIT_NAME}_js`);
const PTAU_PATH = path.join(__dirname, 'pot14_final.ptau');

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
    try {
        console.log('=== Setting up Pedersen-based Age Verification Circuit ===');

        // Step 1: Compile the circuit
        console.log('\n1. Compiling the circuit...');
        execSync(`circom ${CIRCUIT_PATH} --r1cs --wasm --sym -o ${OUTPUT_DIR}`, { stdio: 'inherit' });
        console.log('✅ Circuit compiled successfully');

        // Step 2: Check if Powers of Tau file exists
        console.log('\n2. Checking Powers of Tau file...');
        if (!fs.existsSync(PTAU_PATH)) {
            console.error(`❌ Powers of Tau file not found at ${PTAU_PATH}`);
            console.log('Please make sure the file exists or update the path in this script.');
            process.exit(1);
        }
        console.log('✅ Powers of Tau file found');

        // Step 3: Generate zkey
        console.log('\n3. Generating zkey...');
        const r1csPath = path.join(OUTPUT_DIR, `${CIRCUIT_NAME}.r1cs`);
        const zkeyPath = path.join(__dirname, `${CIRCUIT_NAME}.zkey`);

        await snarkjs.zKey.newZKey(r1csPath, PTAU_PATH, zkeyPath);
        console.log('✅ zkey generated successfully');

        // Step 4: Export verification key
        console.log('\n4. Exporting verification key...');
        const vkeyPath = path.join(__dirname, `${CIRCUIT_NAME}_verification_key.json`);
        const vkey = await snarkjs.zKey.exportVerificationKey(zkeyPath);
        fs.writeFileSync(vkeyPath, JSON.stringify(vkey, null, 2));
        console.log('✅ Verification key exported successfully');

        console.log('\n=== Setup completed successfully ===');
        console.log('You can now run the Pedersen-based age verification flow');
    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
}

main().catch(console.error);
