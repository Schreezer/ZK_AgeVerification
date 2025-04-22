/**
 * Government Backend
 * 
 * This server provides:
 * 1. A static website for issuing age credentials
 * 2. API endpoints for issuing signed credentials with ZK-friendly signatures
 */

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Import the government utilities
const { 
  signAge,
  initGovernmentKeys,
  FIXED_AGE_REQUIREMENT 
} = require('./government_utils');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Constants
const GOVERNMENT_SECRET_KEY = 'government-secret-key';

// Government key pair (will be initialized on startup)
let GOVERNMENT_KEYS;

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
    
    // Sign the age with the government's private key
    const signature = await signAge(userAge, GOVERNMENT_KEYS.privateKey);
    
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
  res.json({ 
    publicKey: GOVERNMENT_KEYS.publicKey, 
    fixedAgeRequirement: FIXED_AGE_REQUIREMENT 
  });
});

// Initialize keys and start server
initGovernmentKeys().then(keys => {
  GOVERNMENT_KEYS = keys;
  console.log(`Government: Public Key: ${GOVERNMENT_KEYS.publicKey.substring(0, 10)}...`);
  
  app.listen(PORT, () => {
    console.log(`Government server running on http://localhost:${PORT}`);
    console.log(`Fixed age requirement: ${FIXED_AGE_REQUIREMENT}+`);
  });
}).catch(error => {
  console.error('Failed to initialize government server:', error);
});
