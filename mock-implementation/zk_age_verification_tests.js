/**
 * Test suite for ZK Age Verification Mock Implementation
 */
const {
  runFullVerificationFlow
} = require('./zk_age_verification_mock.js');

async function runTests() {
  console.log('=== RUNNING ZK AGE VERIFICATION TESTS ===\n');

  const testResults = [];

  // Test 1: User over 18 with standard age requirement (18)
  console.log('TEST 1: User over 18 with standard age requirement');
  const result1 = await runFullVerificationFlow('user1');
  testResults.push({
    test: 'User over 18 with standard age requirement',
    expected: true,
    actual: result1.success,
    passed: result1.success === true
  });
  console.log(`Test 1 ${result1.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Test 2: User under 18 with standard age requirement (18)
  console.log('TEST 2: User under 18 with standard age requirement');
  const result2 = await runFullVerificationFlow('user2');
  testResults.push({
    test: 'User under 18 with standard age requirement',
    expected: false,
    actual: result2.success,
    passed: result2.success === false
  });
  console.log(`Test 2 ${result2.success === false ? 'PASSED' : 'FAILED'}\n`);

  // Test 3: User exactly 18 with standard age requirement (18)
  console.log('TEST 3: User exactly 18 with standard age requirement');
  const result3 = await runFullVerificationFlow('user3');
  testResults.push({
    test: 'User exactly 18 with standard age requirement',
    expected: true,
    actual: result3.success,
    passed: result3.success === true
  });
  console.log(`Test 3 ${result3.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Test 4: Senior user with higher age requirement (21)
  console.log('TEST 4: Senior user with higher age requirement (21)');
  const result4 = await runFullVerificationFlow('user4', 21);
  testResults.push({
    test: 'Senior user with higher age requirement (21)',
    expected: true,
    actual: result4.success,
    passed: result4.success === true
  });
  console.log(`Test 4 ${result4.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Test 5: Edge case - age 0 with standard age requirement (18)
  console.log('TEST 5: Edge case - age 0 with standard age requirement');
  const result5 = await runFullVerificationFlow('user5');
  testResults.push({
    test: 'Edge case - age 0 with standard age requirement',
    expected: false,
    actual: result5.success,
    passed: result5.success === false
  });
  console.log(`Test 5 ${result5.success === false ? 'PASSED' : 'FAILED'}\n`);

  // Test 6: Edge case - very old user with very high age requirement (100)
  console.log('TEST 6: Edge case - very old user with very high age requirement (100)');
  const result6 = await runFullVerificationFlow('user6', 100);
  testResults.push({
    test: 'Edge case - very old user with very high age requirement (100)',
    expected: true,
    actual: result6.success,
    passed: result6.success === true
  });
  console.log(`Test 6 ${result6.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Test 7: Non-existent user
  console.log('TEST 7: Non-existent user');
  const result7 = await runFullVerificationFlow('nonExistentUser');
  testResults.push({
    test: 'Non-existent user',
    expected: 'error',
    actual: result7.error ? 'error' : result7.success,
    passed: result7.error !== undefined
  });
  console.log(`Test 7 ${result7.error ? 'PASSED' : 'FAILED'}\n`);

  // Test 8: Unknown user (not in database)
  console.log('TEST 8: Unknown user (not in database)');
  const result8 = await runFullVerificationFlow('unknownUser');
  testResults.push({
    test: 'Unknown user (not in database)',
    expected: 'error',
    actual: result8.error ? 'error' : result8.success,
    passed: result8.error !== undefined
  });
  console.log(`Test 8 ${result8.error ? 'PASSED' : 'FAILED'}\n`);

  // Test 9: Zero age requirement (edge case)
  console.log('TEST 9: Zero age requirement (edge case)');
  const result9 = await runFullVerificationFlow('user2', 0);
  testResults.push({
    test: 'Zero age requirement (edge case)',
    expected: true,
    actual: result9.success,
    passed: result9.success === true
  });
  console.log(`Test 9 ${result9.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Test 10: Negative age requirement (invalid case, should default to 0)
  console.log('TEST 10: Negative age requirement (invalid case)');
  const result10 = await runFullVerificationFlow('user5', -5);
  testResults.push({
    test: 'Negative age requirement (invalid case)',
    expected: true,
    actual: result10.success,
    passed: result10.success === true
  });
  console.log(`Test 10 ${result10.success === true ? 'PASSED' : 'FAILED'}\n`);

  // Summary of test results
  console.log('=== TEST RESULTS SUMMARY ===');
  let passedTests = 0;
  testResults.forEach((result, index) => {
    console.log(`Test ${index + 1}: ${result.test} - ${result.passed ? 'PASSED' : 'FAILED'}`);
    if (result.passed) passedTests++;
  });
  console.log(`\nPassed ${passedTests} out of ${testResults.length} tests (${Math.round(passedTests/testResults.length*100)}%)`);

  console.log('\n=== ALL TESTS COMPLETED ===');
}

module.exports = runTests;