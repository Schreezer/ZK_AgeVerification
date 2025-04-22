/**
 * Test script for the MiMC7 hash implementation
 */

const { mimcHash } = require('./pedersen_utils');

function testMimcHash() {
    console.log('=== Testing MiMC7 Hash Implementation ===');
    
    // Test cases
    const testCases = [
        { value: 25, blindingFactor: 123456789n },
        { value: 18, blindingFactor: 987654321n },
        { value: 0, blindingFactor: 42n }
    ];
    
    for (const testCase of testCases) {
        const { value, blindingFactor } = testCase;
        
        // Calculate hash
        const hash = mimcHash(value, blindingFactor);
        
        console.log(`\nInput: value=${value}, blindingFactor=${blindingFactor}`);
        console.log(`Output: hash=${hash}`);
        
        // Test with different input formats
        const valueStr = value.toString();
        const blindingFactorStr = blindingFactor.toString();
        
        console.log('\nTesting different input formats:');
        
        const hash1 = mimcHash(valueStr, blindingFactorStr);
        console.log(`- String inputs: hash=${hash1}`);
        
        const hash2 = mimcHash(BigInt(value), blindingFactor);
        console.log(`- BigInt inputs: hash=${hash2}`);
        
        // Check if all hashes match
        if (hash.toString() === hash1.toString() && hash.toString() === hash2.toString()) {
            console.log('✅ All hash formats match');
        } else {
            console.log('❌ Hash formats do not match');
        }
    }
    
    console.log('\n=== MiMC7 Hash Test Completed ===');
}

testMimcHash();
