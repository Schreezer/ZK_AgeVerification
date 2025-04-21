// Background script for the ZK Age Verification extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Background script received message:', request);
  
  if (request.action === 'storeCredential') {
    // Store the credential in local storage
    chrome.storage.local.set({ credential: request.credential }, function() {
      console.log('Credential stored in extension storage');
      sendResponse({ success: true });
    });
    return true; // Indicates async response
  }
  
  if (request.action === 'generateProof') {
    // Get the credential from storage
    chrome.storage.local.get(['credential'], async function(result) {
      if (!result.credential) {
        sendResponse({ 
          success: false, 
          error: 'No credential found. Please obtain a credential from the government portal first.' 
        });
        return;
      }
      
      try {
        // Generate the proof
        const proofResult = await generateProof(result.credential, request.ageRequirement);
        sendResponse({ success: true, ...proofResult });
      } catch (error) {
        console.error('Error generating proof:', error);
        sendResponse({ 
          success: false, 
          error: `Error generating proof: ${error.message}` 
        });
      }
    });
    return true; // Indicates async response
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
    
    // Import snarkjs dynamically
    const snarkjsModule = await import(chrome.runtime.getURL('snarkjs.min.js'));
    const snarkjs = snarkjsModule.default;
    
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
