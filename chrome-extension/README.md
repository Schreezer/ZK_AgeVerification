# ZK Age Verification Chrome Extension

This Chrome extension implements a zero-knowledge age verification system that allows users to prove they meet age requirements without revealing their actual age.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" and select the `chrome-extension` directory
4. The extension should now be installed and visible in your Chrome toolbar

## Usage

1. Visit the service provider at http://localhost:3000
2. Click "Verify My Age" button
3. The extension will prompt you to visit the government portal if you don't have a credential
4. At the government portal (http://localhost:3001), log in with one of the test users (e.g., user1/any-password)
5. Click "Send to Extension" to store the credential
6. The extension will generate a zero-knowledge proof and send it to the service provider
7. If the proof is valid, you'll be granted access to the content

## Test Users

- user1: Age 25, Name: Alice Johnson
- user2: Age 16, Name: Bob Smith
- user3: Age 18, Name: Charlie Davis
- user4: Age 65, Name: David Wilson
- user5: Age 0, Name: Eve Newborn
- user6: Age 120, Name: Frank Elder

## Architecture

The extension consists of:

1. **Background Script**: Handles credential storage and proof generation
2. **Content Script**: Injects into web pages to facilitate communication between the extension and websites
3. **Popup**: Displays the stored credential and allows users to clear it

## Development

To modify the extension:

1. Edit the files in the `chrome-extension` directory
2. Reload the extension in Chrome by clicking the refresh icon on the extensions page
3. Test your changes by visiting the service provider and government portal
