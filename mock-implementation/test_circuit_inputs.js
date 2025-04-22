/**
 * Test script for the EdDSA-based age verification circuit inputs
 * This script tests if the inputs are correctly formatted for the circuit
 */

const { generateEdDSAKeypair, signAge } = require('./eddsa_utils');
const fs = require('fs');
const path = require('path');

// Constants
const CIRCUIT_NAME = 'age_verification';
const CIRCUIT_WASM_PATH = path.join(__dirname, `${CIRCUIT_NAME}_js`, `${CIRCUIT_NAME}_js`, `${CIRCUIT_NAME}.wasm`);

async function testCircuitInputs() {
    console.log('=== Testing Circuit Inputs for EdDSA-based Age Verification ===');

    try {
        // Step 1: Check if the circuit WASM file exists
        console.log('\n1. Checking if circuit WASM file exists...');
        if (!fs.existsSync(CIRCUIT_WASM_PATH)) {
            throw new Error(`Circuit WASM file not found at ${CIRCUIT_WASM_PATH}`);
        }
        console.log('✅ Circuit WASM file found');

        // Step 2: Generate a keypair
        console.log('\n2. Generating EdDSA keypair...');
        const keypair = await generateEdDSAKeypair();
        console.log('✅ Successfully generated keypair');

        // Step 3: Sign a sample age
        console.log('\n3. Signing age value...');
        const age = 25;
        const ageRequirement = 18;
        const signature = await signAge(age, keypair.privateKey);
        console.log('✅ Successfully signed age:', age);

        // Step 4: Prepare inputs for the circuit
        console.log('\n4. Preparing inputs for the circuit...');
        const circuitInputs = {
            ageRequirement,
            userAge: age,
            A: signature.A,
            R8: signature.R8,
            S: signature.S,
            msg: signature.msg
        };

        // Step 5: Verify input format
        console.log('\n5. Verifying input format...');
        if (circuitInputs.A.length !== 256) {
            throw new Error(`Invalid A length: ${circuitInputs.A.length}, expected 256`);
        }
        if (circuitInputs.R8.length !== 256) {
            throw new Error(`Invalid R8 length: ${circuitInputs.R8.length}, expected 256`);
        }
        if (circuitInputs.S.length !== 256) {
            throw new Error(`Invalid S length: ${circuitInputs.S.length}, expected 256`);
        }
        if (circuitInputs.msg.length !== 32) {
            throw new Error(`Invalid msg length: ${circuitInputs.msg.length}, expected 32`);
        }
        console.log('✅ All inputs have the correct format');

        // Step 6: Save inputs to a file for later use
        console.log('\n6. Saving inputs to a file...');
        const inputsPath = path.join(__dirname, 'circuit_inputs.json');
        fs.writeFileSync(inputsPath, JSON.stringify(circuitInputs, null, 2));
        console.log(`✅ Inputs saved to ${inputsPath}`);

        console.log('\n=== Circuit Input Testing Completed ===');
        console.log('The inputs are correctly formatted for the circuit.');
        console.log('To run the full verification flow, you would need to generate keys and use snarkjs.');
    } catch (error) {
        console.error('❌ Error during circuit input testing:', error);
    }
}

// Run the test
testCircuitInputs().catch(console.error);
