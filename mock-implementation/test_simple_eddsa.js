/**
 * Test script for the simple EdDSA verification circuit
 */

const { generateEdDSAKeypair, signAge } = require('./eddsa_utils');
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

async function testSimpleEdDSA() {
    console.log('=== Testing Simple EdDSA Verification Circuit ===');

    try {
        // Step 1: Generate a keypair
        console.log('\n1. Generating EdDSA keypair...');
        const keypair = await generateEdDSAKeypair();
        console.log('✅ Successfully generated keypair');

        // Step 2: Sign a sample age
        console.log('\n2. Signing age value...');
        const age = 25;
        const signature = await signAge(age, keypair.privateKey);
        console.log('✅ Successfully signed age:', age);

        // Step 3: Prepare inputs for the circuit
        console.log('\n3. Preparing inputs for the circuit...');
        const circuitInputs = {
            A: signature.A,
            R8: signature.R8,
            S: signature.S,
            msg: signature.msg
        };

        // Step 4: Save inputs to a file
        const inputsPath = path.join(__dirname, 'simple_eddsa_inputs.json');
        fs.writeFileSync(inputsPath, JSON.stringify(circuitInputs, null, 2));
        console.log(`✅ Inputs saved to ${inputsPath}`);

        // Step 5: Generate witness
        console.log('\n4. Generating witness...');
        const wasmPath = path.join(__dirname, 'simple_eddsa_test_js', 'simple_eddsa_test.wasm');
        const witnessPath = path.join(__dirname, 'witness.wtns');

        try {
            // Use the snarkjs witness calculator
            const { proof, publicSignals } = await snarkjs.wtns.calculate(
                circuitInputs,
                wasmPath,
                witnessPath
            );
            console.log('✅ Witness generated successfully');
        } catch (error) {
            console.error('❌ Error generating witness:', error);
            console.log('This suggests there might be an issue with the EdDSA verification in the circuit.');
            console.log('Let\'s try to debug the specific error:');
            
            // Try to run the witness calculation directly
            const witnessCalculator = await snarkjs.wtns.createWasm(wasmPath);
            try {
                const witness = await witnessCalculator.calculateWTNS(circuitInputs);
                console.log('✅ Direct witness calculation succeeded');
            } catch (error) {
                console.error('❌ Direct witness calculation failed:', error.message);
            }
        }

        console.log('\n=== Simple EdDSA Test Completed ===');
    } catch (error) {
        console.error('❌ Error during simple EdDSA test:', error);
    }
}

// Run the test
testSimpleEdDSA().catch(console.error);
