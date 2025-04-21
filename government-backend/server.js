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

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Constants
const GOVERNMENT_SECRET_KEY = 'government-secret-key';

// Mock user database (for simulation purposes)
const USERS = {
  'user1': { age: 25, name: 'Alice Johnson' },
  'user2': { age: 16, name: 'Bob Smith' },
  'user3': { age: 18, name: 'Charlie Davis' },
  'user4': { age: 65, name: 'David Wilson' },
  'user5': { age: 0, name: 'Eve Newborn' },
  'user6': { age: 120, name: 'Frank Elder' }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to authenticate user and issue credential
app.post('/api/issue-credential', (req, res) => {
  console.log('Government: Received credential issuance request');
  
  const { userId, password } = req.body;
  
  // Simple authentication (in a real system, this would be more secure)
  if (!USERS[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // For demo purposes, any password is accepted
  const userAge = USERS[userId].age;
  const userName = USERS[userId].name;
  
  console.log(`Government: Issuing credential for user ${userId} with age ${userAge}`);
  
  // Create credential data
  const credential = {
    userId,
    name: userName,
    age: userAge,
    issuedAt: Date.now()
  };
  
  // Sign the credential with JWT for transport
  const signedCredential = jwt.sign(credential, GOVERNMENT_SECRET_KEY);
  
  console.log(`Government: Issued credential for user ${userId} with age ${userAge}`);
  return res.json({ signedCredential });
});

// Start server
app.listen(PORT, () => {
  console.log(`Government server running on http://localhost:${PORT}`);
});
