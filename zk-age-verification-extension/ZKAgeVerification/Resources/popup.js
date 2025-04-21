// Popup script for the ZK Age Verification extension

// DOM Elements
const statusElement = document.getElementById('status');
const credentialCard = document.getElementById('credential-card');
const credentialName = document.getElementById('credential-name');
const credentialUserId = document.getElementById('credential-userId');
const credentialAge = document.getElementById('credential-age');
const credentialIssued = document.getElementById('credential-issued');
const clearCredentialButton = document.getElementById('clear-credential');

// Initialize the popup
function initPopup() {
  // Load the current credential from storage
  chrome.storage.local.get(['credential'], function(result) {
    if (result.credential) {
      displayCredential(result.credential);
    }
  });
  
  // Add event listeners
  clearCredentialButton.addEventListener('click', clearCredential);
}

// Display the credential in the popup
function displayCredential(credentialJwt) {
  try {
    // Parse the JWT
    const credential = parseJwt(credentialJwt);
    
    // Update the credential display
    credentialName.textContent = credential.name || 'N/A';
    credentialUserId.textContent = credential.userId || 'N/A';
    credentialAge.textContent = credential.age || 'N/A';
    credentialIssued.textContent = credential.issuedAt ? new Date(credential.issuedAt).toLocaleString() : 'N/A';
    
    // Show the credential card
    credentialCard.classList.add('active');
    
    // Update the status
    updateStatus('Credential loaded', 'success');
    
    // Enable the clear button
    clearCredentialButton.disabled = false;
  } catch (error) {
    console.error('Error displaying credential:', error);
    updateStatus('Error loading credential', 'error');
  }
}

// Clear the current credential
function clearCredential() {
  // Clear from storage
  chrome.storage.local.remove(['credential'], function() {
    // Hide the credential card
    credentialCard.classList.remove('active');
    
    // Update the status
    updateStatus('No credential loaded', 'info');
    
    // Disable the clear button
    clearCredentialButton.disabled = true;
  });
}

// Update the status message
function updateStatus(message, type) {
  statusElement.textContent = message;
  statusElement.className = `status status-${type}`;
}

// Helper function to parse JWT
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return {};
  }
}

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', initPopup);
