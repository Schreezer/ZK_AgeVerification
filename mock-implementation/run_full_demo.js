/**
 * Full ZK Age Verification Demo with EdDSA
 *
 * This script demonstrates the full verification flow with EdDSA signature verification.
 * It runs several test cases to verify different age scenarios.
 */

const { runFullVerificationFlow } = require('./zk_age_verification_mock');

async function runDemo() {
    console.log('\n=== ZK Age Verification with EdDSA Demo ===\n');
    console.log('This demo demonstrates the full verification flow with our improved EdDSA implementation.');
    console.log('The system verifies that a user meets an age requirement without revealing their actual age.');
    console.log('Additionally, it verifies that the age credential was issued by a trusted authority using EdDSA signatures.\n');

    // Define test cases
    const testCases = [
        { name: 'User over 18', userId: 'user1', ageRequirement: 18, expectedResult: true },
        { name: 'User under 18', userId: 'user2', ageRequirement: 18, expectedResult: false },
        { name: 'User exactly 18', userId: 'user3', ageRequirement: 18, expectedResult: true },
        { name: 'Custom age requirement (21+)', userId: 'user1', ageRequirement: 21, expectedResult: true },
        { name: 'Senior verification (65+)', userId: 'user4', ageRequirement: 65, expectedResult: true }
    ];

    // Run each test case
    let passedTests = 0;
    let failedTests = 0;

    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        console.log(`\n--- Test Case ${i+1}: ${test.name} ---`);

        try {
            const result = await runFullVerificationFlow(test.userId, test.ageRequirement);

            // Determine if the test passed
            const testPassed = result.success === test.expectedResult;

            console.log(`\nTest result: ${testPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
            console.log(`Expected verification result: ${test.expectedResult ? 'PASS' : 'FAIL'}`);
            console.log(`Actual verification result: ${result.success ? 'PASS' : 'FAIL'}`);

            if (testPassed) {
                passedTests++;
            } else {
                failedTests++;
                console.error('Test failed! The verification result does not match the expected result.');
                if (result.error) {
                    console.error('Error:', result.error);
                }
            }
        } catch (error) {
            console.error(`Error running test case ${i+1}:`, error);
            failedTests++;
        }

        // Add a separator between test cases
        console.log('\n' + '='.repeat(50));
    }

    // Print summary
    console.log('\n=== Demo Summary ===');
    console.log(`Total tests: ${testCases.length}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);

    console.log('\n=== Demo Completed ===');
    console.log('The ZK age verification system with EdDSA signature verification has been demonstrated.');
    console.log('This implementation ensures privacy while maintaining verifiability.');
}

// Run the demo
runDemo().catch(error => {
    console.error('Demo failed with error:', error);
});
