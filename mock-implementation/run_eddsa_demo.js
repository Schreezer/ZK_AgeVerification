/**
 * Demo script for the EdDSA-based age verification
 * This script runs the full verification flow with EdDSA signatures
 */

const { runFullVerificationFlow } = require('./zk_age_verification_mock');

async function runDemo() {
    console.log('=== ZK Age Verification with EdDSA Demo ===\n');

    // Test cases
    const testCases = [
        { userId: 'user1', ageReq: 18, desc: 'User over 18 (should pass)' },
        { userId: 'user2', ageReq: 18, desc: 'User under 18 (should fail)' },
        { userId: 'user3', ageReq: 18, desc: 'User exactly 18 (should pass)' },
        { userId: 'user4', ageReq: 21, desc: 'Senior user with higher age req (should pass)' },
        { userId: 'user5', ageReq: 1, desc: 'Edge case: age 0 with req 1 (should fail)' },
        { userId: 'nonExistentUser', ageReq: 18, desc: 'Non-existent user (should fail)' }
    ];

    // Run each test case
    for (const testCase of testCases) {
        console.log(`\n--- Test Case: ${testCase.desc} ---`);
        const result = await runFullVerificationFlow(testCase.userId, testCase.ageReq);
        
        console.log('\nResult:', result.success ? 'PASSED ✅' : 'FAILED ❌');
        if (result.error) {
            console.log('Error:', result.error);
        }
        console.log('-----------------------------------\n');
    }

    console.log('=== Demo Completed ===');
}

runDemo().catch(console.error);
