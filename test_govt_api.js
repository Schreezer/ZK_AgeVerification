const axios = require('axios');

async function testGovtApi() {
  try {
    console.log('Testing government API...');
    const response = await axios.get('http://localhost:3001/api/public-key');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGovtApi();
