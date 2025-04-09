# Trust-Minimized Age Verification Architecture Implementation Guide

This document provides a comprehensive guide to implement a trust-minimized age verification system using Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (ZK-SNARKs). The system consists of three main components:

1. **Backend (Government Identity System Simulation)** - Issues signed age attributes.
2. **Service Provider** - Verifies age using ZK-SNARK proofs.
3. **User Agent (Browser Extension)** - Manages authentication and proof generation.

Each section includes setup instructions, code snippets, and testing steps to ensure a functional prototype.

---

## 1. Backend (Government Identity System Simulation)

### Purpose
Simulate a government identity system that authenticates users and issues signed age attributes as JSON Web Tokens (JWTs).

### Technologies
- Node.js
- Express.js
- `jsonwebtoken` (for signing credentials)

### Step 1.1: Set Up the Backend Server
1. Create a directory for the backend:
   ```bash
   mkdir gov-backend && cd gov-backend
   ```
2. Initialize a Node.js project:
   ```bash
   npm init -y
   ```
3. Install required dependencies:
   ```bash
   npm install express jsonwebtoken body-parser
   ```
4. Create a file named `server.js`.

### Step 1.2: Implement the Authentication Endpoint
In `server.js`, set up an Express server with a `/authenticate` endpoint to simulate user authentication and issue a signed token.

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;
const SECRET_KEY = 'government-secret-key'; // Use a secure key in production

app.use(bodyParser.json());

// Simulated user database (for demo purposes)
const users = {
  'user1': { isOver18: true },
  'user2': { isOver18: false }
};

// Authentication endpoint
app.post('/authenticate', (req, res) => {
  const { username, password } = req.body;
  // Simulate authentication (replace with real logic in production)
  if (users[username] && password === 'password') {
    const ageAttribute = { isOver18: users[username].isOver18 };
    const token = jwt.sign(ageAttribute, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Authentication failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Government backend running on port ${PORT}`);
});
```

### Step 1.3: Test the Backend
1. Start the server:
   ```bash
   node server.js
   ```
2. Test the `/authenticate` endpoint using a tool like Postman or curl:
   - **Request:** POST `http://localhost:3001/authenticate`
   - **Body:** `{"username": "user1", "password": "password"}`
   - **Expected Response:** A JWT token containing `{"isOver18": true}` in the payload.

---

## 2. Service Provider

### Purpose
Simulate an online service that requires age verification by checking ZK-SNARK proofs submitted by users.

### Technologies
- Node.js
- Express.js
- `snarkjs` (for ZK-SNARK verification)

### Step 2.1: Set Up the Service Provider Server
1. Create a directory for the service provider:
   ```bash
   mkdir service-provider && cd service-provider
   ```
2. Initialize a Node.js project:
   ```bash
   npm init -y
   ```
3. Install required dependencies:
   ```bash
   npm install express body-parser snarkjs
   ```
4. Create a file named `server.js`.

### Step 2.2: Implement the Age Verification Endpoint
In `server.js`, set up an Express server with a `/verify-age` endpoint to receive and verify ZK-SNARK proofs.

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const snarkjs = require('snarkjs');
const app = express();
const PORT = 3002;

app.use(bodyParser.json());

// Load verification key (to be generated from ZK-SNARK circuit)
const verificationKey = require('./path/to/verification_key.json'); // Update path later

// Age verification endpoint
app.post('/verify-age', async (req, res) => {
  const { proof, publicSignals } = req.body;
  try {
    const isValid = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
    if (isValid) {
      res.json({ message: 'Age verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid proof' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Service provider running on port ${PORT}`);
});
```

### Step 2.3: Prepare for ZK-SNARK Integration
- For now, assume a ZK-SNARK circuit and keys are available. Later, you'll generate these files (`verification_key.json`) and update the path in the code.

---

## 3. User Agent (Browser Extension)

### Purpose
Create a user-controlled browser extension that authenticates with the government backend, generates ZK-SNARK proofs, and communicates with the service provider.

### Technologies
- JavaScript
- Browser Extension APIs
- `snarkjs` (for proof generation)

### Step 3.1: Set Up the Browser Extension
1. Create a directory for the extension:
   ```bash
   mkdir user-agent-extension && cd user-agent-extension
   ```
2. Create the following files:
   - `manifest.json` (configuration)
   - `popup.html` (UI)
   - `popup.js` (logic)
   - `background.js` (communication)

### Step 3.2: Implement the Manifest File
In `manifest.json`, define the extension's permissions and components.

```json
{
  "manifest_version": 3,
  "name": "Age Verification Agent",
  "version": "1.0",
  "permissions": ["storage", "activeTab"],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  }
}
```

### Step 3.3: Implement the Popup UI
In `popup.html`, create a simple form for user authentication.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Age Verification</title>
</head>
<body>
  <h1>Authenticate with Government</h1>
  <form id="authForm">
    <label for="username">Username:</label>
    <input type="text" id="username" required><br>
    <label for="password">Password:</label>
    <input type="password" id="password" required><br>
    <button type="submit">Authenticate</button>
  </form>
  <script src="popup.js"></script>
</body>
</html>
```

### Step 3.4: Implement Authentication and Proof Generation
In `popup.js`, handle authentication and simulate proof generation (to be completed with ZK-SNARK integration).

```javascript
document.getElementById('authForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Authenticate with government backend
  const response = await fetch('http://localhost:3001/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('ageToken', data.token);
    alert('Authentication successful! Token stored.');
  } else {
    alert('Authentication failed.');
  }
});

// Placeholder function for ZK-SNARK proof generation
async function generateProof(nonce) {
  const token = localStorage.getItem('ageToken');
  const ageAttribute = JSON.parse(atob(token.split('.')[1])).isOver18;
  // Circuit and keys to be integrated later
  console.log(`Generating proof for isOver18: ${ageAttribute}, nonce: ${nonce}`);
  // Simulated proof (replace with snarkjs implementation)
  return { proof: 'dummyProof', publicSignals: ['dummySignal'] };
}
```

### Step 3.5: Implement Background Script for Communication
In `background.js`, handle communication with the service provider.

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'verifyAge') {
    const nonce = request.nonce;
    generateProof(nonce).then(({ proof, publicSignals }) => {
      fetch('http://localhost:3002/verify-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof, publicSignals })
      })
        .then(response => response.json())
        .then(data => sendResponse(data));
    });
    return true; // Indicates async response
  }
});
```

---

## 4. Integrating the Components

### Step 4.1: Generate ZK-SNARK Circuit and Keys
1. Use Circom to define a circuit verifying the age attribute and a nonce.
2. Compile the circuit and generate proving and verification keys with `snarkjs`.
3. Save the files:
   - `circuit.wasm` and `proving_key.json` in the `user-agent-extension` directory.
   - `verification_key.json` in the `service-provider` directory.

### Step 4.2: Update Paths
- In `service-provider/server.js`, update the path to `verification_key.json`.
- In `user-agent-extension/popup.js`, update paths to `circuit.wasm` and `proving_key.json`, and replace the `generateProof` placeholder with actual `snarkjs` logic.

### Step 4.3: Test the Full Flow
1. Start both servers:
   ```bash
   cd gov-backend && node server.js
   cd ../service-provider && node server.js
   ```
2. Load the extension in your browser (e.g., Chrome):
   - Go to `chrome://extensions/`, enable Developer Mode, and load the `user-agent-extension` directory.
3. Authenticate via the popup with `user1` and `password`.
4. Simulate a service request by triggering `verifyAge` with a nonce (e.g., via a content script or manual call).
5. Verify the service provider responds with "Age verified successfully."

---

## 5. Notes and Considerations

- **Security**: This is a prototype. Use HTTPS, secure key management, and proper authentication in production.
- **ZK-SNARK Circuit**: Design the circuit to verify the JWT signature and age attribute without revealing unnecessary data.
- **Nonce**: The service provider should generate a unique nonce per request to prevent replay attacks.
- **Error Handling**: Add robust error handling to manage network failures, invalid inputs, etc.

By following these steps, you'll create a functional prototype demonstrating trust-minimized age verification with ZK-SNARKs.

--- 

This `.md` file can be saved as `implementation-guide.md` and used as a standalone reference for building the system.