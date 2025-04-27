# ZK Age Verification System: Setup and Operation Guide

This document explains how to run the ZK Age Verification system and describes what happens in each component.

## System Components

The system consists of three main components:
1. **Service Provider Frontend** - A social media website called "EuroGram" that requires age verification
2. **Government Backend** - Issues age credentials to users
3. **Chrome Extension** - Facilitates zero-knowledge age verification between the service provider and government

## How to Run the System

### 1. Start the Service Provider

```bash
cd service-provider
npm start
```

This will start the service provider on http://localhost:3000.

### 2. Start the Government Backend

```bash
cd government-backend
npm start
```

This will start the government portal on http://localhost:3001.

### 3. Start the Circuit Server

```bash
cd circuit-server
npm start
```

This will start the circuit server on http://localhost:3002, which provides the necessary ZK circuit files.

### 4. Install the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" and select the `chrome-extension` directory
4. The extension should now be installed and visible in your Chrome toolbar

## What Happens in Each Component

### Service Provider (EuroGram)

The service provider is a social media website that requires age verification before allowing access to content. When you visit http://localhost:3000:

1. You see the EuroGram social media interface with an age verification requirement
2. When you click "Verify My Age", the service provider:
   - Generates a session ID
   - Sets the age requirement (16 years)
   - Dispatches a custom event for the extension to detect
   - Updates a hidden communication element for the extension

### Government Backend

The government portal issues age credentials to users. When you visit http://localhost:3001 (usually redirected by the extension):

1. You see a login form where you can enter test credentials (e.g., user1/any-password)
2. When you log in, the government backend:
   - Retrieves the user's age from a mock database
   - Creates a signed credential containing the user's age
   - Displays the credential information
   - Stores the credential in localStorage and a data attribute
3. When you click "Send to Extension", the government portal:
   - Dispatches a custom event with the credential
   - Waits for the extension to process the credential
   - Falls back to a simulator if the extension doesn't respond

### Chrome Extension

The extension facilitates zero-knowledge age verification between the service provider and government portal:

1. **Content Script**: Runs on both the service provider and government portal pages
   - Detects when the service provider requests age verification
   - Opens the government portal when needed
   - Extracts the credential from the government portal
   - Sends the credential to the background script

2. **Background Script**: Runs in the background
   - Stores the credential securely
   - Generates a zero-knowledge proof that the user's age meets the requirement
   - Uses the snarkjs library to create the proof
   - Returns the proof to the content script

3. **Popup**: Provides a user interface
   - Shows stored credentials
   - Allows users to clear credentials

## The Complete Flow

1. User visits EuroGram (service provider) at http://localhost:3000
2. User clicks "Verify My Age"
3. The extension detects this request and opens the government portal
4. User logs in at the government portal with test credentials
5. User clicks "Send to Extension" to share their age credential
6. The extension stores the credential and generates a zero-knowledge proof
7. The proof demonstrates that the user's age meets the requirement without revealing the actual age
8. The extension sends the proof back to EuroGram
9. EuroGram verifies the proof using the circuit server
10. If valid, EuroGram grants access to the content

## Test Users

You can use any of these test users to log in at the government portal:
- user1: Age 25, Name: Alice Johnson
- user2: Age 16, Name: Bob Smith
- user3: Age 18, Name: Charlie Davis
- user4: Age 65, Name: David Wilson
- user5: Age 0, Name: Eve Newborn
- user6: Age 120, Name: Frank Elder

Any password will work for these test users.

## Troubleshooting

- If the extension doesn't respond, the government portal will fall back to a simulator after 5 seconds
- If you encounter errors, check the browser console for detailed logs
- You can reload the extension from chrome://extensions/ if it's not working properly
- Make sure all three servers are running before testing the flow
