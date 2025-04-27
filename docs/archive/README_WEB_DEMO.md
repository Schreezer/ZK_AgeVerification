# ZK Age Verification Web Demo

This project demonstrates a privacy-preserving age verification system using zero-knowledge proofs. The system allows users to prove they meet age requirements without revealing their actual age.

## System Architecture

The demo consists of three main components:

1. **Service Provider Website** (Port 3000)
   - Simulates a website that requires age verification
   - Verifies ZK proofs submitted by users

2. **Government Identity Portal** (Port 3001)
   - Issues age credentials to users
   - Simulates a government identity provider

3. **Browser Extension Simulator**
   - Simulates a browser extension that would:
     - Receive credentials from the government
     - Generate ZK proofs
     - Submit proofs to service providers

4. **Circuit File Server** (Port 3002)
   - Serves the ZK circuit files needed by the extension simulator

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

## Setup Instructions

1. **Install dependencies for all components**

   ```bash
   # Install service provider dependencies
   cd service-provider
   npm install
   
   # Install government backend dependencies
   cd ../government-backend
   npm install
   
   # Install circuit server dependencies
   cd ../circuit-server
   npm install
   
   # Return to root directory
   cd ..
   ```

2. **Ensure circuit files are compiled**

   The demo uses the simple age verification circuit. Make sure it's compiled by running:

   ```bash
   cd mock-implementation
   npm run compile:simple
   ```

   If you don't have a script for this, you can manually compile the circuit:

   ```bash
   circom simple_age_verification.circom --r1cs --wasm --sym
   ```

3. **Start all servers**

   From the project root directory, run:

   ```bash
   node start-servers.js
   ```

   This will start all three servers:
   - Service Provider: http://localhost:3000
   - Government Portal: http://localhost:3001
   - Circuit File Server: http://localhost:3002

## Using the Demo

1. **Visit the Service Provider Website**

   Open your browser and navigate to http://localhost:3000

2. **Click "Verify My Age"**

   This will initiate the age verification process and open the Government Identity Portal in a new window.

3. **Log in to the Government Portal**

   Use one of the following test accounts:
   - `user1` (25 years old)
   - `user2` (16 years old)
   - `user3` (18 years old)
   - `user4` (65 years old)
   - `user5` (0 years old)
   - `user6` (120 years old)

   Any password will work for the demo.

4. **Send Credential to Extension**

   After logging in, you'll see your credential. Click "Send to Extension" to simulate sending the credential to the browser extension.

5. **Proof Generation and Verification**

   The extension simulator will generate a ZK proof and send it back to the service provider. If the age requirement is met, you'll gain access to the premium content.

## How It Works

1. **Service Provider** requests age verification with a specific age requirement.
2. **User** authenticates with the **Government Portal** to obtain a signed age credential.
3. **Browser Extension** (simulated) receives the credential and generates a ZK proof that the user meets the age requirement without revealing their actual age.
4. **Service Provider** verifies the proof and grants access if the age requirement is met.

## Technical Details

- The ZK circuit is implemented using Circom and the groth16 proving system.
- The proof generation and verification use the snarkjs library.
- Communication between components is done via HTTP requests and window.postMessage.

## Security Considerations

This is a demo implementation and has several simplifications:

- JWT tokens are signed with a hardcoded key
- No real authentication is performed
- The browser extension is simulated with JavaScript
- Circuit files are served from a separate server instead of being bundled with the extension

In a production implementation, these issues would need to be addressed with proper security measures.
