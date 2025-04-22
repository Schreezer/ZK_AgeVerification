/**
 * Run the MiMC test circuit and compare with JavaScript implementation
 */

const { mimcHash } = require('./pedersen_utils');
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

async function runMimcTest() {
    console.log('=== Running MiMC Test ===');
    
    // Fixed test values
    const x_in = 25;
    const k = 123456789;
    
    // Calculate hash in JavaScript
    const jsHash = mimcHash(x_in, k);
    console.log(`JavaScript hash: ${jsHash}`);
    
    // Run the circuit
    console.log('\nRunning the circuit...');
    
    try {
        // Generate witness
        const wasmPath = path.join(__dirname, 'test_mimc_fixed_js', 'test_mimc_fixed.wasm');
        
        // Create empty input (the circuit uses fixed values)
        const inputsPath = path.join(__dirname, 'test_mimc_fixed_inputs.json');
        fs.writeFileSync(inputsPath, JSON.stringify({}, null, 2));
        
        // Generate witness
        const { witness } = await snarkjs.wtns.calculate({}, wasmPath, 'witness.wtns');
        
        // Read the witness file
        const buffer = fs.readFileSync('witness.wtns');
        
        // Parse the witness file
        // The format is: header (32 bytes) + number of witnesses (32 bytes) + witnesses (each 32 bytes)
        const numWitnesses = buffer.readUInt32LE(32);
        console.log(`Number of witnesses: ${numWitnesses}`);
        
        // The output is at index 1 (index 0 is always 1)
        const circuitHash = buffer.slice(64 + 32, 64 + 64).toString('hex');
        console.log(`Circuit hash (hex): ${circuitHash}`);
        
        // Convert to decimal for comparison
        const circuitHashDec = BigInt(`0x${circuitHash}`);
        console.log(`Circuit hash (dec): ${circuitHashDec}`);
        
        // Compare the hashes
        if (jsHash.toString() === circuitHashDec.toString()) {
            console.log('✅ JavaScript and circuit hashes match!');
        } else {
            console.log('❌ JavaScript and circuit hashes do not match!');
            console.log('This indicates a difference in the hash implementation.');
            
            // Print the difference
            console.log(`\nJS hash:      ${jsHash}`);
            console.log(`Circuit hash: ${circuitHashDec}`);
        }
    } catch (error) {
        console.error('Error running the circuit:', error);
        
        // Try a different approach
        console.log('\nTrying a different approach...');
        
        try {
            // Use the snarkjs CLI to generate the witness
            const { execSync } = require('child_process');
            execSync(`node node_modules/snarkjs/build/cli.cjs wtns calculate test_mimc_fixed_js/test_mimc_fixed.wasm test_mimc_fixed_inputs.json witness.wtns`, { stdio: 'inherit' });
            
            // Export the witness to JSON
            execSync(`node node_modules/snarkjs/build/cli.cjs wtns export json witness.wtns witness.json`, { stdio: 'inherit' });
            
            // Read the witness JSON
            const witnessJson = JSON.parse(fs.readFileSync('witness.json', 'utf8'));
            
            // The output is at index 1 (index 0 is always 1)
            const circuitHash = witnessJson[1];
            console.log(`Circuit hash: ${circuitHash}`);
            
            // Compare the hashes
            if (jsHash.toString() === circuitHash) {
                console.log('✅ JavaScript and circuit hashes match!');
            } else {
                console.log('❌ JavaScript and circuit hashes do not match!');
                console.log('This indicates a difference in the hash implementation.');
                
                // Print the difference
                console.log(`\nJS hash:      ${jsHash}`);
                console.log(`Circuit hash: ${circuitHash}`);
            }
        } catch (error) {
            console.error('Error with alternative approach:', error);
        }
    }
    
    console.log('\n=== MiMC Test Completed ===');
}

runMimcTest().catch(console.error);
