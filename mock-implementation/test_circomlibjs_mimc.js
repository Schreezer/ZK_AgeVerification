/**
 * Test script for the circomlibjs MiMC7 implementation
 */

const circomlibjs = require('circomlibjs');

async function testCircomlibMimc() {
    console.log('=== Testing circomlibjs MiMC7 Implementation ===');
    
    try {
        // Initialize the MiMC7 hasher
        const mimc7 = await circomlibjs.buildMimc7();
        
        // Test values
        const x_in = 25;
        const k = 123456789;
        
        // Calculate hash using circomlibjs
        const F = mimc7.F;
        const hash = mimc7.hash(F.e(x_in), F.e(k));
        
        console.log(`Input: x_in=${x_in}, k=${k}`);
        console.log(`circomlibjs hash: ${F.toString(hash)}`);
        
        // Run the test circuit to get the hash from the circuit
        console.log('\nComparing with circuit output from witness.json:');
        const circuitHash = '544137347968742313265834297797989588032539474792184971620241272180989423940';
        console.log(`Circuit hash: ${circuitHash}`);
        
        // Compare the hashes
        if (F.toString(hash) === circuitHash) {
            console.log('✅ circomlibjs and circuit hashes match!');
        } else {
            console.log('❌ circomlibjs and circuit hashes do not match!');
            console.log('This indicates a difference in the hash implementation.');
        }
        
        console.log('\n=== circomlibjs MiMC7 Test Completed ===');
    } catch (error) {
        console.error('Error testing circomlibjs MiMC7:', error);
    }
}

testCircomlibMimc().catch(console.error);
