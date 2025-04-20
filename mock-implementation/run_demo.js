/**
 * Demo script to run the simplified age verification flow
 */

const { runFullVerificationFlow } = require('./simple_zk_age_verification_mock');

async function runDemo() {
    console.log('\n=== ZK Age Verification Demo ===\n');
    
    // Test case 1: User over 18
    console.log('\n--- Test Case 1: User over 18 ---');
    const result1 = await runFullVerificationFlow('user1', 18);
    console.log('Result:', result1.success ? 'PASSED' : 'FAILED');
    
    // Test case 2: User under 18
    console.log('\n--- Test Case 2: User under 18 ---');
    const result2 = await runFullVerificationFlow('user2', 18);
    console.log('Result:', result2.success ? 'PASSED' : 'FAILED');
    
    // Test case 3: User exactly 18
    console.log('\n--- Test Case 3: User exactly 18 ---');
    const result3 = await runFullVerificationFlow('user3', 18);
    console.log('Result:', result3.success ? 'PASSED' : 'FAILED');
    
    // Test case 4: Custom age requirement (21+)
    console.log('\n--- Test Case 4: Custom age requirement (21+) ---');
    const result4 = await runFullVerificationFlow('user1', 21);
    console.log('Result:', result4.success ? 'PASSED' : 'FAILED');
    
    console.log('\n=== Demo Completed ===\n');
}

runDemo().catch(console.error);
