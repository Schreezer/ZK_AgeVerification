/**
 * Debug script for the MiMC age verification circuit
 */

const { mimcHash, generateBlindingFactor } = require('./pedersen_utils');
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

async function debugCircuit() {
    console.log('=== Debugging MiMC Age Verification Circuit ===');

    try {
        // Step 1: Create test inputs
        console.log('\n1. Creating test inputs...');

        const userAge = 25;
        const ageRequirement = 18;
        const blindingFactor = generateBlindingFactor();

        // Calculate the commitment using our JavaScript implementation
        const commitment = mimcHash(userAge, blindingFactor);

        console.log(`User age: ${userAge}`);
        console.log(`Age requirement: ${ageRequirement}`);
        console.log(`Blinding factor: ${blindingFactor}`);
        console.log(`Commitment: ${commitment}`);

        // Step 2: Prepare circuit inputs
        console.log('\n2. Preparing circuit inputs...');

        const circuitInputs = {
            ageRequirement,
            commitment: commitment.toString(),
            userAge,
            blindingFactor: blindingFactor.toString()
        };

        // Save inputs to a file
        const inputsPath = path.join(__dirname, 'debug_inputs.json');
        fs.writeFileSync(inputsPath, JSON.stringify(circuitInputs, null, 2));
        console.log(`Inputs saved to ${inputsPath}`);

        // Step 3: Generate witness
        console.log('\n3. Generating witness...');

        const wasmPath = path.join(__dirname, 'mimc_age_verification_js', 'mimc_age_verification_js', 'mimc_age_verification.wasm');

        if (!fs.existsSync(wasmPath)) {
            throw new Error(`WASM file not found at ${wasmPath}`);
        }

        try {
            // Calculate witness using snarkjs.groth16.fullProve
            await snarkjs.groth16.fullProve(
                circuitInputs,
                wasmPath,
                path.join(__dirname, 'mimc_age_verification.zkey')
            );
            console.log('✅ Witness calculation succeeded');
        } catch (error) {
            console.error('❌ Witness calculation failed:', error.message);

            // Print the exact constraint that failed
            console.log('\nDebugging the constraint failure:');
            console.log('- Check line 31 in mimc_age_verification.circom:');
            console.log('  commitment === mimc.out;');

            // Calculate the MiMC hash in the circuit
            const circuitHash = mimcHash(userAge, blindingFactor);
            console.log(`\nCircuit should calculate: mimcHash(${userAge}, ${blindingFactor}) = ${circuitHash}`);
            console.log(`Provided commitment: ${commitment}`);

            if (circuitHash.toString() === commitment.toString()) {
                console.log('✅ The hash values match, but the circuit constraint still fails.');
                console.log('This suggests there might be a type conversion issue in the circuit.');
            } else {
                console.log('❌ The hash values do not match. There is an implementation difference.');
                console.log('The JavaScript and circuit implementations of MiMC7 are not equivalent.');
            }
        }

        console.log('\n=== Circuit Debugging Completed ===');
    } catch (error) {
        console.error('Error during circuit debugging:', error);
    }
}

debugCircuit().catch(console.error);
