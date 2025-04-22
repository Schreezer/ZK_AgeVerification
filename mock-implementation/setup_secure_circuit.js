/**
 * Setup script for the secure age verification circuit
 * This script compiles the circuit and generates the proving/verification keys
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants
const CIRCUIT_PATH = path.join(__dirname, 'secure_age_verification.circom');
const OUTPUT_DIR = path.join(__dirname, 'secure_age_verification_js');
const PTAU_PATH = path.join(__dirname, 'pot14_final.ptau');
const ZKEY_PATH = path.join(__dirname, 'secure_age_verification.zkey');
const VKEY_PATH = path.join(__dirname, 'secure_age_verification_verification_key.json');

/**
 * Main function to set up the circuit
 */
async function main() {
    console.log('=== Setting up Secure Age Verification Circuit ===');
    
    try {
        // Step 1: Compile the circuit
        console.log('\n1. Compiling the circuit...');
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
        
        // Compile the circuit
        execSync(`circom ${CIRCUIT_PATH} --r1cs --wasm --sym -o ${OUTPUT_DIR}`, { stdio: 'inherit' });
        console.log('✅ Circuit compiled successfully');
        
        // Step 2: Check if Powers of Tau file exists
        console.log('\n2. Checking Powers of Tau file...');
        if (!fs.existsSync(PTAU_PATH)) {
            console.error('❌ Powers of Tau file not found. Please download it first.');
            console.log('You can download it from: https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau');
            process.exit(1);
        }
        console.log('✅ Powers of Tau file found');
        
        // Step 3: Generate zkey
        console.log('\n3. Generating zkey...');
        execSync(`snarkjs groth16 setup ${path.join(OUTPUT_DIR, 'secure_age_verification.r1cs')} ${PTAU_PATH} ${ZKEY_PATH}`, { stdio: 'inherit' });
        console.log('✅ zkey generated successfully');
        
        // Step 4: Export verification key
        console.log('\n4. Exporting verification key...');
        execSync(`snarkjs zkey export verificationkey ${ZKEY_PATH} ${VKEY_PATH}`, { stdio: 'inherit' });
        console.log('✅ Verification key exported successfully');
        
        console.log('\n=== Setup completed successfully ===');
        console.log('You can now run the secure age verification flow');
    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
}

// Run the main function
main().catch(console.error);
