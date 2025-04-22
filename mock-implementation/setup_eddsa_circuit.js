/**
 * Setup script for the EdDSA-based age verification circuit
 * This script compiles the circuit and generates the necessary keys
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

// Constants
const CIRCUIT_NAME = 'age_verification';
const CIRCUIT_PATH = path.join(__dirname, `${CIRCUIT_NAME}.circom`);
const OUTPUT_DIR = path.join(__dirname, `${CIRCUIT_NAME}_js`);
const PTAU_PATH = path.join(__dirname, 'pot12_final.ptau');

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
    try {
        console.log('=== Setting up EdDSA-based Age Verification Circuit ===');

        // Step 1: Compile the circuit
        console.log('\n1. Compiling the circuit...');
        execSync(`circom ${CIRCUIT_PATH} --r1cs --wasm --sym -o ${OUTPUT_DIR}`, { stdio: 'inherit' });
        console.log('✅ Circuit compiled successfully');

        // Step 2: Generate a small Powers of Tau file for testing
        console.log('\n2. Generating Powers of Tau file...');

        // Generate a new ptau file with a small number of powers (for testing only)
        console.log('Generating a small ptau file for testing...');
        await snarkjs.powersOfTau.newAccumulator(12, PTAU_PATH);
        await snarkjs.powersOfTau.preparePhase2(PTAU_PATH, PTAU_PATH);

        console.log('✅ Powers of Tau file generated');


        // Step 3: Generate zkey
        console.log('\n3. Generating zkey...');
        const r1csPath = path.join(OUTPUT_DIR, `${CIRCUIT_NAME}.r1cs`);
        const zkeyPath = path.join(__dirname, `${CIRCUIT_NAME}.zkey`);

        await snarkjs.zKey.newZKey(r1csPath, PTAU_PATH, zkeyPath);
        console.log('✅ zkey generated successfully');

        // Step 4: Export verification key
        console.log('\n4. Exporting verification key...');
        const vkeyPath = path.join(__dirname, 'verification_key.json');
        const vkey = await snarkjs.zKey.exportVerificationKey(zkeyPath);
        fs.writeFileSync(vkeyPath, JSON.stringify(vkey, null, 2));
        console.log('✅ Verification key exported successfully');

        console.log('\n=== Setup completed successfully ===');
        console.log('You can now run the full verification flow with EdDSA signatures');
    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
}

main().catch(console.error);
