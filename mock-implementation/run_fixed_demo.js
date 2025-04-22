/**
 * Demo script for the fixed age verification system
 * This script runs through various test cases to demonstrate the system
 */

const { runFullVerificationFlow, initGovernmentKeys, FIXED_AGE_REQUIREMENT } = require('./fixed_age_verification_mock');

/**
 * Run the demo with various test cases
 */
async function runDemo() {
    console.log('=== Fixed Age (16+) Verification Demo ===');
    
    // Initialize government keys
    const keys = await initGovernmentKeys();
    
    console.log('\nGovernment Keys:');
    console.log(`- Public Key: ${keys.publicKey.substring(0, 10)}...`);
    console.log(`- Private Key: ${keys.privateKey.substring(0, 10)}...`);
    
    console.log(`\nFixed Age Requirement: ${FIXED_AGE_REQUIREMENT}+`);

    // Test cases
    const testCases = [
        { name: 'User over 16 (should pass)', userId: 'user1', expectedResult: true },
        { name: 'User under 16 (should fail)', userId: 'user2', expectedResult: false },
        { name: 'User exactly 16 (should pass)', userId: 'user3', expectedResult: true },
        { name: 'Senior user (should pass)', userId: 'user4', expectedResult: true },
        { name: 'Edge case: age 0 (should fail)', userId: 'user5', expectedResult: false },
        { name: 'Non-existent user (should fail)', userId: 'nonExistentUser', expectedResult: false }
    ];

    // Run each test case
    for (const testCase of testCases) {
        console.log(`\n--- Test Case: ${testCase.name} ---\n`);
        
        try {
            const result = await runFullVerificationFlow(testCase.userId);
            
            console.log(`\nResult: ${result.success ? 'PASSED ✅' : 'FAILED ❌'}`);
            if (result.error) {
                console.log(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error(`Error running test case: ${error.message}`);
            console.log(`\nResult: FAILED ❌`);
        }
        
        console.log('-----------------------------------');
    }

    console.log('\n=== Demo Completed ===');
    
    // Privacy analysis
    console.log('\n=== Privacy Analysis ===');
    console.log('In this implementation:');
    console.log('1. The government knows each user\'s real identity and age');
    console.log('2. The service provider only knows if a user is 16+ or not');
    console.log('3. There is no unique identifier (like a commitment) shared between them');
    console.log('4. Even if they collude, they can only narrow down to "all users 16+"');
    console.log('5. This provides strong privacy protection against tracking');
}

// Run the demo
runDemo().catch(console.error);
