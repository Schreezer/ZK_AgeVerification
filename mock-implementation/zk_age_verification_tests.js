const { expect } = require('chai');
const { runFullVerificationFlow } = require('./zk_age_verification_mock');

async function runTests() {
    console.log('\n=== Starting Age Verification Tests ===\n');

    // Test 1: Valid user over 18
    console.log('\nTest 1: Valid user over 18');
    const test1 = await runFullVerificationFlow('user1', 18);
    expect(test1.success).to.be.true;
    expect(test1.userAge).to.be.equal(25);

    // Test 2: Valid user under 18
    console.log('\nTest 2: Valid user under 18');
    const test2 = await runFullVerificationFlow('user2', 18);
    expect(test2.success).to.be.false;
    expect(test2.userAge).to.be.equal(16);

    // Test 3: Valid user exactly 18
    console.log('\nTest 3: Valid user exactly 18');
    const test3 = await runFullVerificationFlow('user3', 18);
    expect(test3.success).to.be.true;
    expect(test3.userAge).to.be.equal(18);

    // Test 4: Custom age requirement (21+)
    console.log('\nTest 4: Custom age requirement (21+)');
    const test4 = await runFullVerificationFlow('user1', 21);
    expect(test4.success).to.be.true;
    expect(test4.userAge).to.be.equal(25);

    // Test 5: Edge case - age 0
    console.log('\nTest 5: Edge case - age 0');
    const test5 = await runFullVerificationFlow('user5', 18);
    expect(test5.success).to.be.false;
    expect(test5.userAge).to.be.equal(0);

    // Test 6: Non-existent user
    console.log('\nTest 6: Non-existent user');
    const test6 = await runFullVerificationFlow('nonExistentUser', 18);
    expect(test6.success).to.be.false;
    expect(test6.error).to.equal('User not found or has no data');

    console.log('\n=== Age Verification Tests Completed ===\n');
}

module.exports = runTests;

if (require.main === module) {
    runTests().catch(console.error);
}
