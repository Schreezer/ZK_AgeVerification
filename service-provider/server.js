/**
 * Service Provider Backend
 * 
 * This server provides:
 * 1. A static website that requires age verification
 * 2. API endpoints for verifying ZK proofs
 */

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const snarkjs = require('snarkjs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Constants
const VERIFICATION_KEY_PATH = path.join(__dirname, '..', 'mock-implementation', 'simple_age_verification_verification_key.json');

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to initiate age verification
app.post('/api/initiate-verification', (req, res) => {
  console.log('Service Provider: Initiating age verification request');
  
  // Set the age requirement (default to 18 if not specified)
  const ageRequirement = req.body.ageRequirement || 18;
  
  console.log(`Service Provider: Set age requirement to ${ageRequirement}`);
  res.json({ 
    ageRequirement,
    sessionId: Date.now().toString() // Simple session ID for demo purposes
  });
});

// API endpoint to verify ZK proof
app.post('/api/verify-proof', async (req, res) => {
  console.log('Service Provider: Verifying ZK proof');
  
  const { proof, publicSignals, ageRequirement } = req.body;
  
  if (!proof || !publicSignals || !ageRequirement) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  try {
    // Check if verification key exists
    if (!fs.existsSync(VERIFICATION_KEY_PATH)) {
      throw new Error(`Verification key not found at ${VERIFICATION_KEY_PATH}`);
    }
    
    // Load verification key
    const vkey = JSON.parse(fs.readFileSync(VERIFICATION_KEY_PATH, 'utf8'));
    
    // Verify SNARK proof
    let proofValid = false;
    try {
      proofValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
      console.log('Is Verified:', proofValid);
    } catch (e) {
      console.error('Service Provider: Error during SNARK verification', e);
      return res.status(500).json({ error: 'Error during proof verification' });
    }
    
    // The public signals are in reverse order from what we expected
    // The first signal is isVerified (1 if valid, 0 if invalid)
    // The second signal is the age requirement
    const isVerified = publicSignals[0] === '1';
    const providedAgeReq = parseInt(publicSignals[1]);
    
    console.log('Public Signals:', publicSignals);
    console.log('Provided Age Requirement:', providedAgeReq, 'Expected:', ageRequirement);
    console.log('Is Verified:', isVerified);
    
    if (!proofValid) {
      console.log('Service Provider: Proof verification failed');
      return res.status(400).json({ success: false, message: 'Proof verification failed' });
    }
    
    if (providedAgeReq !== ageRequirement) {
      console.log('Service Provider: Age requirement mismatch');
      return res.status(400).json({ success: false, message: 'Age requirement mismatch' });
    }
    
    if (!isVerified) {
      console.log('Service Provider: Proof valid but requirements not met');
      return res.status(403).json({ success: false, message: 'Age requirement not met' });
    }
    
    console.log('Service Provider: Verification successful - Age requirement met');
    return res.json({ success: true, message: 'Age verification successful' });
    
  } catch (error) {
    console.error('Service Provider: Error verifying proof', error);
    return res.status(500).json({ error: 'Error verifying proof' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Service Provider server running on http://localhost:${PORT}`);
});
