/**
 * Demo script for the secure age verification system
 * This script runs through various test cases to demonstrate the system
 */

const { runFullVerificationFlow, initGovernmentKeys } = require('./secure_age_verification_mock');

/**
 * Run the demo with various test cases
 */
async function runDemo() {
    console.log('=== Secure ZK Age Verification Demo ===');

    // Initialize government keys
    const keys = await initGovernmentKeys();

    console.log('\nGovernment Keys:');
    console.log(`- Public Key: ${keys.publicKey.substring(0, 10)}...`);
    console.log(`- Private Key: ${keys.privateKey.substring(0, 10)}...\n`);

    // Test cases
    const testCases = [
        { name: 'User over 18 (should pass)', userId: 'user1', ageReq: 18, expectedResult: true },
        { name: 'User under 18 (should fail)', userId: 'user2', ageReq: 18, expectedResult: false },
        { name: 'User exactly 18 (should pass)', userId: 'user3', ageReq: 18, expectedResult: true },
        { name: 'Senior user with higher age req (should pass)', userId: 'user4', ageReq: 21, expectedResult: true },
        { name: 'Edge case: age 0 with req 1 (should fail)', userId: 'user5', ageReq: 1, expectedResult: false },
        { name: 'Non-existent user (should fail)', userId: 'nonExistentUser', ageReq: 18, expectedResult: false }
    ];

    // Run each test case
    for (const testCase of testCases) {
        console.log(`\n--- Test Case: ${testCase.name} ---\n`);

        try {
            const result = await runFullVerificationFlow(testCase.userId, testCase.ageReq);

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
}

// Run the demo
runDemo().catch(console.error);
