# Zero-Knowledge Age Verification System - Setup Guide

This guide explains how to set up and run the complete Zero-Knowledge Age Verification system, including all servers, the Chrome extension, and circuit setup.

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Chrome browser (for extension)
- Git

## Project Structure

```
project/
├── circuit-server/          # ZK circuit and proof generation
├── government-backend/      # Credential issuing server
├── proof-server/           # Proof generation server
├── service-provider/       # Example service provider
└── chrome-extension/       # Browser extension
```

## 1. Circuit Setup

First, we need to set up the zero-knowledge circuits and generate proving/verification keys.

```bash
# Install circom
curl -L https://raw.githubusercontent.com/iden3/circom/master/install.sh | bash

# Install snarkjs globally
npm install -g snarkjs

# Setup the circuit-server
cd circuit-server
npm install

# Download the Powers of Tau file (if not present)
curl -O https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau

# Generate the circuit keys
npm run setup
```

This will create:
- `schnorr_age_verification.wasm`: WebAssembly file for proof generation
- `schnorr_age_verification.zkey`: Proving key
- `schnorr_age_verification_verification_key.json`: Verification key

## 2. Government Backend Setup

```bash
cd government-backend
npm install

# Create a .env file with required configurations
cat > .env << EOL
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
EOL

# Start the server
npm start
```

The government backend will run on `http://localhost:3001`

## 3. Proof Server Setup

```bash
cd proof-server
npm install

# Create a .env file
cat > .env << EOL
PORT=3002
CIRCUIT_PATH=../circuit-server/schnorr_age_verification.wasm
ZKEY_PATH=../circuit-server/schnorr_age_verification.zkey
EOL

# Start the server
npm start
```

The proof server will run on `http://localhost:3002`

## 4. Service Provider Setup

```bash
cd service-provider
npm install

# Copy the verification key
cp ../circuit-server/schnorr_age_verification_verification_key.json ./

# Create a .env file
cat > .env << EOL
PORT=3003
PROOF_SERVER_URL=http://localhost:3002
EOL

# Start the server
npm start
```

The service provider will run on `http://localhost:3003`

## 5. Chrome Extension Setup

```bash
cd chrome-extension

# Install dependencies
npm install

# Build the extension
npm run build
```

To install the extension in Chrome:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` directory

## 6. Starting the Complete System

1. Start all servers in separate terminals:

```bash
# Terminal 1 - Government Backend
cd government-backend
npm start

# Terminal 2 - Proof Server
cd proof-server
npm start

# Terminal 3 - Service Provider
cd service-provider
npm start
```

2. Ensure the Chrome extension is loaded and active

## Testing the Setup

1. Visit the government backend UI: `http://localhost:3001`
   - Request a new age credential

2. Visit the service provider: `http://localhost:3003`
   - You should see the age verification prompt
   - The extension should handle the verification process

## Troubleshooting

### Common Issues

1. **WASM File Not Found**
   - Ensure the circuit compilation was successful
   - Check if the WASM file path in the proof server's .env is correct

2. **Verification Key Issues**
   - Verify the verification key was properly copied to the service provider
   - Check the file permissions

3. **Chrome Extension Not Working**
   - Check the extension console for errors
   - Ensure all environment variables are set correctly
   - Try reloading the extension

### Useful Commands

```bash
# Rebuild circuit
cd circuit-server
npm run setup

# Clear all builds
find . -name "*.wasm" -type f -delete
find . -name "*.zkey" -type f -delete

# Check server logs
cd <server-directory>
npm run logs
```

## File Artifacts

The following files are generated during setup and are required for the system to work:

```
circuit-server/
├── schnorr_age_verification.wasm
├── schnorr_age_verification.zkey
└── schnorr_age_verification_verification_key.json

service-provider/
└── schnorr_age_verification_verification_key.json
```

These files are large and binary, so they're ignored by git (.gitignore). You'll need to generate them locally using the setup instructions above.

## Environment Variables

Each component requires specific environment variables. Here's a comprehensive list:

### Government Backend (.env)
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### Proof Server (.env)
```
PORT=3002
CIRCUIT_PATH=../circuit-server/schnorr_age_verification.wasm
ZKEY_PATH=../circuit-server/schnorr_age_verification.zkey
```

### Service Provider (.env)
```
PORT=3003
PROOF_SERVER_URL=http://localhost:3002
```

## Development Notes

- The `.gitignore` file excludes build artifacts, WASM files, and circuit-specific files
- Always regenerate circuit files after pulling new changes
- Keep the `ptau` file if you plan to make circuit modifications
- Don't commit any `.env` files or generated keys
