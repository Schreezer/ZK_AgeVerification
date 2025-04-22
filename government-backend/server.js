/**
 * Government Backend
 *
 * This server provides:
 * 1. A static website for issuing age credentials
 * 2. API endpoints for issuing signed credentials
 */

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { schnorrSign, generateSchnorrKeyPair } = require('../mimc_utils');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Constants
const GOVERNMENT_SECRET_KEY = 'government-secret-key';
const FIXED_AGE_REQUIREMENT = 16;

// Generate a simple public/private key pair for testing
// For ZK circuit compatibility, we use the same value for both private and public key
let GOVERNMENT_KEYS;

// Initialize the keys
async function initKeys() {
  GOVERNMENT_KEYS = await generateSchnorrKeyPair();
  console.log('Government: Generated Schnorr key pair');
  console.log(`Government: Public Key: ${GOVERNMENT_KEYS.publicKey}`);
  return GOVERNMENT_KEYS;
}

// Mock user database (for simulation purposes)
const USERS = {
  'user1': { age: 25, name: 'Alice Johnson' },
  'user2': { age: 15, name: 'Bob Smith' },
  'user3': { age: 16, name: 'Charlie Davis' },
  'user4': { age: 65, name: 'David Wilson' },
  'user5': { age: 0, name: 'Eve Newborn' },
  'user6': { age: 120, name: 'Frank Elder' }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to authenticate user and issue credential
app.post('/api/issue-credential', async (req, res) => {
  console.log('Government: Received credential issuance request');

  const { userId, password } = req.body;

  // Simple authentication (in a real system, this would be more secure)
  if (!USERS[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    // For demo purposes, any password is accepted
    const userAge = USERS[userId].age;
    const userName = USERS[userId].name;

    console.log(`Government: Issuing credential for user ${userId} with age ${userAge}`);

    // Create a Schnorr signature using the age and private key
    // This is what the ZK circuit expects for verification
    const signature = await schnorrSign(userAge, GOVERNMENT_KEYS.privateKey);
    console.log(`Government: Generated Schnorr signature: ${signature.signature.substring(0, 20)}...`);
    console.log(`Government: Nonce: ${signature.nonce}`);
    console.log(`Government: Message: ${signature.message}`);

    // Create credential data with signature
    const credential = {
      userId,
      name: userName,
      age: userAge,
      signature,
      publicKey: GOVERNMENT_KEYS.publicKey,
      fixedAgeRequirement: FIXED_AGE_REQUIREMENT,
      issuedAt: Date.now()
    };

    // Sign the credential with JWT for transport
    const signedCredential = jwt.sign(credential, GOVERNMENT_SECRET_KEY);

    console.log(`Government: Issued credential for user ${userId} with age ${userAge}`);
    console.log(`Government: Fixed age requirement: ${FIXED_AGE_REQUIREMENT}+`);
    return res.json({ signedCredential });
  } catch (error) {
    console.error('Government: Error issuing credential:', error);
    return res.status(500).json({ error: 'Error issuing credential' });
  }
});

// API endpoint to get the government's public key
app.get('/api/public-key', (req, res) => {
  console.log('Government: Received request for public key');
  res.json({
    publicKey: GOVERNMENT_KEYS.publicKey,
    fixedAgeRequirement: FIXED_AGE_REQUIREMENT
  });
});

// Start server
initKeys().then(() => {
  app.listen(PORT, () => {
    console.log(`Government server running on http://localhost:${PORT}`);
    console.log(`Fixed age requirement: ${FIXED_AGE_REQUIREMENT}+`);
    console.log(`Government Public Key: ${GOVERNMENT_KEYS.publicKey}`);
  });
}).catch(error => {
  console.error('Failed to initialize government server:', error);
});
