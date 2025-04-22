// Government Portal Frontend JavaScript

// DOM Elements
const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const credentialSection = document.getElementById('credential-section');
const credentialName = document.getElementById('credential-name');
const credentialUserId = document.getElementById('credential-userId');
const credentialAge = document.getElementById('credential-age');
const credentialIssued = document.getElementById('credential-issued');
const sendToExtensionBtn = document.getElementById('send-to-extension-btn');

// Global variables
let currentCredential = null;
let serviceProviderData = null;

// Initialize the application
function init() {
  // Clear localStorage to reset any cached credentials
  console.log('Clearing localStorage cache...');
  localStorage.clear();
  console.log('Cache cleared successfully!');

  // Parse URL parameters (from service provider)
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');
  const ageRequirement = urlParams.get('ageRequirement');

  if (sessionId && ageRequirement) {
    serviceProviderData = { sessionId, ageRequirement: parseInt(ageRequirement) };
    console.log('Received service provider data:', serviceProviderData);

    // Store service provider data in localStorage
    localStorage.setItem('serviceProviderData', JSON.stringify(serviceProviderData));
  } else {
    // Try to retrieve service provider data from localStorage
    const storedData = localStorage.getItem('serviceProviderData');
    if (storedData) {
      serviceProviderData = JSON.parse(storedData);
      console.log('Retrieved service provider data from localStorage:', serviceProviderData);
    }
  }

  // Check if we have a stored credential
  const storedCredential = localStorage.getItem('currentCredential');
  if (storedCredential) {
    currentCredential = storedCredential;

    // Also store it in a data attribute for the extension to find
    const credentialDataElement = document.getElementById('credential-data');
    if (credentialDataElement) {
      credentialDataElement.setAttribute('data-credential', currentCredential);
    }

    // Decode the JWT to display the credential information
    const decodedCredential = parseJwt(currentCredential);

    // Log detailed information about the credential
    console.log('Decoded credential details:', {
      hasSignature: 'signature' in decodedCredential,
      signatureType: typeof decodedCredential.signature,
      signatureValue: decodedCredential.signature ?
        (typeof decodedCredential.signature === 'string' ?
          decodedCredential.signature.substring(0, 20) + '...' :
          (decodedCredential.signature.signature ?
            decodedCredential.signature.signature.substring(0, 20) + '...' :
            'complex signature object')) :
        'undefined',
      hasPublicKey: 'publicKey' in decodedCredential,
      publicKeyType: typeof decodedCredential.publicKey,
      publicKeyValue: decodedCredential.publicKey || 'undefined'
    });

    // Update the credential display
    credentialName.textContent = decodedCredential.name;
    credentialUserId.textContent = decodedCredential.userId;
    credentialAge.textContent = decodedCredential.age;
    credentialIssued.textContent = new Date(decodedCredential.issuedAt).toLocaleString();

    // Show the credential section
    loginSection.classList.add('hidden');
    credentialSection.classList.remove('hidden');

    console.log('Retrieved credential from localStorage');
  }

  // Add event listeners
  loginForm.addEventListener('submit', handleLogin);
  sendToExtensionBtn.addEventListener('click', sendToExtension);
}

// Function to handle login form submission
async function handleLogin(event) {
  event.preventDefault();

  const userId = document.getElementById('userId').value;
  const password = document.getElementById('password').value;

  try {
    // Call the API to issue a credential
    const response = await fetch('/api/issue-credential', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Authentication failed');
    }

    const data = await response.json();
    currentCredential = data.signedCredential;

    // Store the credential in localStorage
    localStorage.setItem('currentCredential', currentCredential);

    // Also store it in a data attribute for the extension to find
    const credentialDataElement = document.getElementById('credential-data');
    if (credentialDataElement) {
      credentialDataElement.setAttribute('data-credential', currentCredential);
    }

    // Decode the JWT to display the credential information
    const decodedCredential = parseJwt(currentCredential);

    // Log detailed information about the credential
    console.log('Decoded credential details:', {
      hasSignature: 'signature' in decodedCredential,
      signatureType: typeof decodedCredential.signature,
      signatureValue: decodedCredential.signature ?
        (typeof decodedCredential.signature === 'string' ?
          decodedCredential.signature.substring(0, 20) + '...' :
          (decodedCredential.signature.signature ?
            decodedCredential.signature.signature.substring(0, 20) + '...' :
            'complex signature object')) :
        'undefined',
      hasPublicKey: 'publicKey' in decodedCredential,
      publicKeyType: typeof decodedCredential.publicKey,
      publicKeyValue: decodedCredential.publicKey || 'undefined'
    });

    // Update the credential display
    credentialName.textContent = decodedCredential.name;
    credentialUserId.textContent = decodedCredential.userId;
    credentialAge.textContent = decodedCredential.age;
    credentialIssued.textContent = new Date(decodedCredential.issuedAt).toLocaleString();

    // Show the credential section
    loginSection.classList.add('hidden');
    credentialSection.classList.remove('hidden');

    console.log('Credential stored in localStorage');

  } catch (error) {
    console.error('Error during login:', error);
    alert(`Login failed: ${error.message}`);
  }
}

// Function to send the credential to the extension
function sendToExtension() {
  // Double-check that we have a credential
  if (!currentCredential) {
    // Try to get it from localStorage as a fallback
    const storedCredential = localStorage.getItem('currentCredential');
    if (storedCredential) {
      currentCredential = storedCredential;
      console.log('Retrieved credential from localStorage in sendToExtension');
    } else {
      alert('No credential available to send');
      return;
    }
  }

  // Ensure the credential is stored in the data attribute
  const credentialDataElement = document.getElementById('credential-data');
  if (credentialDataElement) {
    credentialDataElement.setAttribute('data-credential', currentCredential);
  }

  // Check if we have service provider data
  if (!serviceProviderData) {
    // Try to get it from localStorage as a fallback
    const storedData = localStorage.getItem('serviceProviderData');
    if (storedData) {
      serviceProviderData = JSON.parse(storedData);
      console.log('Retrieved service provider data from localStorage in sendToExtension');
    } else {
      alert('No service provider session found. Please start from the service provider website.');
      return;
    }
  }

  // Try to communicate with the browser extension
  try {
    // Create a custom event that the extension's content script can listen for
    const event = new CustomEvent('ZK_CREDENTIAL_AVAILABLE', {
      detail: {
        credential: currentCredential,
        ageRequirement: serviceProviderData.ageRequirement,
        sessionId: serviceProviderData.sessionId
      }
    });

    // Dispatch the event for the extension to catch
    document.dispatchEvent(event);

    // Show a message to the user
    alert('Sending credential to extension. If the extension is properly installed, it will handle the verification process.');

    // Add a fallback mechanism - if the extension doesn't respond within 5 seconds,
    // use the simulator to generate a proof and send it directly
    setTimeout(() => {
      // Check if the window is still open (hasn't been closed by the extension)
      if (!window.closed) {
        console.log('Extension did not respond in time, using fallback mechanism');

        // Use the simulator to generate a proof
        simulateExtensionProofGeneration(currentCredential, serviceProviderData.ageRequirement)
          .then(({ proof, publicSignals }) => {
            // Send the proof back to the service provider
            sendProofToServiceProvider(proof, publicSignals);
          })
          .catch(error => {
            console.error('Error generating proof:', error);
            alert(`Error generating proof: ${error.message}`);
          });
      }
    }, 5000);
  } catch (error) {
    console.error('Error sending credential to extension:', error);
    alert(`Error sending credential to extension: ${error.message}`);
  }
}

// Function to simulate the extension generating a proof
async function simulateExtensionProofGeneration(signedCredential, ageRequirement) {
  // This function simulates what would happen in the browser extension
  console.log('Extension: Generating ZK proof');

  try {
    // Decode the credential
    const credential = parseJwt(signedCredential);

    // Load the browser extension simulator script
    await loadScript('/extension-simulator.js');

    // Generate the proof using the simulator
    return await window.extensionSimulator.generateProof(credential, ageRequirement);

  } catch (error) {
    console.error('Extension: Error generating proof', error);
    throw new Error(`Failed to generate proof: ${error.message}`);
  }
}

// Function to send the proof back to the service provider
function sendProofToServiceProvider(proof, publicSignals) {
  // In a real implementation, this would use the browser extension to communicate
  // For this demo, we'll use window.opener or postMessage

  console.log('Extension: Sending proof to service provider');

  // Check if we have a window opener (service provider)
  if (window.opener) {
    // Send the proof to the opener window
    window.opener.postMessage({
      type: 'ZK_AGE_VERIFICATION',
      proof,
      publicSignals
    }, 'http://localhost:3000');

    // Close this window after sending the proof
    alert('Proof sent to service provider. This window will close.');
    window.close();
  } else {
    alert('Could not communicate with service provider. Please try again.');
  }
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

// Helper function to dynamically load a script
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
