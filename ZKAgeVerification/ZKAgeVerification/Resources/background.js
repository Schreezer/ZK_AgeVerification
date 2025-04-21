// Listen for messages from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'storeCredential') {
    // Store the credential in local storage
    browser.storage.local.set({ credential: message.credential })
      .then(() => {
        console.log('Credential stored in extension storage');
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error storing credential:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for the async response
  }
  
  if (message.action === 'generateProof') {
    // Get the credential from storage
    browser.storage.local.get('credential')
      .then(result => {
        if (!result.credential) {
          sendResponse({ 
            success: false, 
            error: 'No credential found. Please obtain a credential from the government portal first.' 
          });
          return;
        }
        
        // Generate the proof
        generateProof(result.credential, message.ageRequirement)
          .then(proofResult => {
            sendResponse({ success: true, ...proofResult });
          })
          .catch(error => {
            console.error('Error generating proof:', error);
            sendResponse({ 
              success: false, 
              error: `Error generating proof: ${error.message}` 
            });
          });
      })
      .catch(error => {
        console.error('Error retrieving credential:', error);
        sendResponse({ 
          success: false, 
          error: `Error retrieving credential: ${error.message}` 
        });
      });
    return true; // Keep the message channel open for the async response
  }
});

// Function to generate a ZK proof
async function generateProof(credentialJwt, ageRequirement) {
  console.log('Generating ZK proof');
  console.log('Age Requirement:', ageRequirement);
  
  try {
    // Parse the JWT
    const credential = parseJwt(credentialJwt);
    console.log('Credential:', credential);
    
    // Load the snarkjs library
    const snarkjsScript = await fetch(browser.runtime.getURL('snarkjs.min.js'));
    const snarkjsCode = await snarkjsScript.text();
    const snarkjs = new Function('return ' + snarkjsCode)();
    
    // Prepare inputs for the ZK circuit
    const circuitInputs = {
      ageRequirement: ageRequirement,
      userAge: credential.age
    };
    
    console.log('Circuit Inputs:', circuitInputs);
    
    // Fetch the wasm and zkey files
    const wasmResponse = await fetch('http://localhost:3002/simple_age_verification_js/simple_age_verification.wasm');
    const wasmBuffer = await wasmResponse.arrayBuffer();
    
    const zkeyResponse = await fetch('http://localhost:3002/simple_age_verification.zkey');
    const zkeyBuffer = await zkeyResponse.arrayBuffer();
    
    // Generate the proof
    console.log('Generating proof with snarkjs...');
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      new Uint8Array(wasmBuffer),
      new Uint8Array(zkeyBuffer)
    );
    
    console.log('Proof generated successfully');
    console.log('Proof:', proof);
    console.log('Public Signals:', publicSignals);
    
    return { proof, publicSignals };
    
  } catch (error) {
    console.error('Error generating proof:', error);
    throw new Error(`Failed to generate proof: ${error.message}`);
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
