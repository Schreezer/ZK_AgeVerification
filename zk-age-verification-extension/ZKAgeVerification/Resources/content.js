// Content script for the ZK Age Verification extension

// Check which site we're on
const isServiceProvider = window.location.href.includes('localhost:3000');
const isGovernmentPortal = window.location.href.includes('localhost:3001');

console.log('ZK Age Verification Extension loaded on:', window.location.href);

// Initialize based on the current site
if (isServiceProvider) {
  initServiceProviderSite();
} else if (isGovernmentPortal) {
  initGovernmentPortalSite();
}

// Initialize for the service provider site
function initServiceProviderSite() {
  console.log('Initializing for service provider site');
  
  // Listen for the verification button click
  document.addEventListener('click', function(event) {
    if (event.target.id === 'verify-age-btn') {
      console.log('Verify age button clicked');
      
      // Get the age requirement from the page
      const ageRequirementElement = document.getElementById('age-requirement');
      const ageRequirement = parseInt(ageRequirementElement.textContent);
      
      // Store the age requirement in a data attribute for later use
      document.body.setAttribute('data-age-requirement', ageRequirement);
      
      // We don't need to do anything else here, as the button's normal action
      // will redirect to the government portal
    }
  });
  
  // Listen for messages from the extension
  window.addEventListener('message', function(event) {
    // Only accept messages from our extension
    if (event.source !== window || !event.data.type || event.data.type !== 'ZK_EXTENSION_PROOF') {
      return;
    }
    
    console.log('Received proof from extension:', event.data);
    
    // Get the proof and public signals
    const { proof, publicSignals } = event.data;
    
    // Get the age requirement
    const ageRequirement = parseInt(document.body.getAttribute('data-age-requirement'));
    
    // Call the service provider API to verify the proof
    verifyProofWithServiceProvider(proof, publicSignals, ageRequirement);
  });
}

// Initialize for the government portal site
function initGovernmentPortalSite() {
  console.log('Initializing for government portal site');
  
  // Listen for the send to extension button click
  document.addEventListener('click', function(event) {
    if (event.target.id === 'send-to-extension-btn') {
      console.log('Send to extension button clicked');
      
      // Get the credential from the page
      const credentialElement = document.querySelector('form');
      if (!credentialElement) {
        console.error('Could not find credential element');
        return;
      }
      
      // Extract the credential JWT from the page
      // This is a bit hacky, but we're assuming the credential is stored in a variable
      // called currentCredential in the page's JavaScript
      const credentialScript = `
        if (typeof currentCredential === 'string') {
          currentCredential;
        } else {
          null;
        }
      `;
      
      // Execute the script to get the credential
      const credential = executeScript(credentialScript);
      
      if (!credential) {
        console.error('Could not extract credential from page');
        alert('Could not extract credential from page. Please try again.');
        return;
      }
      
      // Send the credential to the extension
      chrome.runtime.sendMessage({ 
        action: 'storeCredential', 
        credential 
      }, function(response) {
        if (response && response.success) {
          console.log('Credential sent to extension successfully');
          
          // Get the URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          const ageRequirement = parseInt(urlParams.get('ageRequirement'));
          
          if (!isNaN(ageRequirement)) {
            // Generate the proof
            generateProofAndSendToServiceProvider(ageRequirement);
          } else {
            alert('Credential stored in extension. You can now return to the service provider.');
          }
        } else {
          console.error('Error sending credential to extension');
          alert('Error sending credential to extension. Please try again.');
        }
      });
    }
  });
}

// Function to verify the proof with the service provider
function verifyProofWithServiceProvider(proof, publicSignals, ageRequirement) {
  console.log('Verifying proof with service provider');
  console.log('Proof:', proof);
  console.log('Public Signals:', publicSignals);
  console.log('Age Requirement:', ageRequirement);
  
  // Update the status
  const verificationStatus = document.getElementById('verification-status');
  if (verificationStatus) {
    verificationStatus.textContent = 'Verifying proof...';
    verificationStatus.className = 'status-box status-info';
    verificationStatus.classList.remove('hidden');
  }
  
  // Call the service provider API
  fetch('/api/verify-proof', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      proof,
      publicSignals,
      ageRequirement
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Verification response:', data);
    
    if (data.success) {
      // Verification successful
      if (verificationStatus) {
        verificationStatus.textContent = 'Age verification successful!';
        verificationStatus.className = 'status-box status-success';
      }
      
      // Show the content section after a short delay
      setTimeout(() => {
        const verificationSection = document.getElementById('verification-section');
        const contentSection = document.getElementById('content-section');
        
        if (verificationSection && contentSection) {
          verificationSection.classList.add('hidden');
          contentSection.classList.remove('hidden');
        }
      }, 1500);
    } else {
      // Verification failed
      if (verificationStatus) {
        verificationStatus.textContent = `Verification failed: ${data.message}`;
        verificationStatus.className = 'status-box status-error';
      }
      
      // Re-enable the verify button
      const verifyAgeBtn = document.getElementById('verify-age-btn');
      if (verifyAgeBtn) {
        verifyAgeBtn.disabled = false;
      }
    }
  })
  .catch(error => {
    console.error('Error verifying proof:', error);
    
    if (verificationStatus) {
      verificationStatus.textContent = 'Error verifying proof. Please try again.';
      verificationStatus.className = 'status-box status-error';
    }
    
    // Re-enable the verify button
    const verifyAgeBtn = document.getElementById('verify-age-btn');
    if (verifyAgeBtn) {
      verifyAgeBtn.disabled = false;
    }
  });
}

// Function to generate a proof and send it to the service provider
function generateProofAndSendToServiceProvider(ageRequirement) {
  console.log('Generating proof for age requirement:', ageRequirement);
  
  // Show loading message
  alert('Generating zero-knowledge proof... This may take a few seconds.');
  
  // Ask the extension to generate the proof
  chrome.runtime.sendMessage({ 
    action: 'generateProof', 
    ageRequirement 
  }, function(response) {
    if (response && response.success) {
      console.log('Proof generated successfully');
      
      // Check if we have an opener window (service provider)
      if (window.opener) {
        // Send the proof to the opener window
        window.opener.postMessage({
          type: 'ZK_EXTENSION_PROOF',
          proof: response.proof,
          publicSignals: response.publicSignals
        }, 'http://localhost:3000');
        
        // Close this window after sending the proof
        alert('Proof sent to service provider. This window will close.');
        window.close();
      } else {
        alert('Proof generated successfully, but could not communicate with service provider. Please return to the service provider and try again.');
      }
    } else {
      console.error('Error generating proof:', response ? response.error : 'Unknown error');
      alert(`Error generating proof: ${response ? response.error : 'Unknown error'}`);
    }
  });
}

// Helper function to execute a script in the page context
function executeScript(script) {
  const scriptElement = document.createElement('script');
  scriptElement.textContent = `
    (function() {
      const result = (function() {
        ${script}
      })();
      document.body.setAttribute('data-script-result', JSON.stringify(result));
    })();
  `;
  
  document.body.appendChild(scriptElement);
  document.body.removeChild(scriptElement);
  
  const resultJson = document.body.getAttribute('data-script-result');
  document.body.removeAttribute('data-script-result');
  
  return resultJson ? JSON.parse(resultJson) : null;
}
