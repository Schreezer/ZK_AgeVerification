/**
 * Browser Extension Simulator
 * 
 * This script simulates the functionality of a browser extension that would:
 * 1. Receive credentials from the government
 * 2. Generate ZK proofs
 * 3. Send proofs to service providers
 */

// Create a namespace for the extension simulator
window.extensionSimulator = (function() {
  // Load the snarkjs library
  async function loadSnarkJS() {
    if (window.snarkjs) {
      return window.snarkjs;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/snarkjs@0.7.0/build/snarkjs.min.js';
      script.onload = () => resolve(window.snarkjs);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  // Generate a ZK proof
  async function generateProof(credential, ageRequirement) {
    console.log('Extension Simulator: Generating ZK proof');
    console.log('Credential:', credential);
    console.log('Age Requirement:', ageRequirement);
    
    try {
      // Load snarkjs
      const snarkjs = await loadSnarkJS();
      
      // Prepare inputs for the ZK circuit
      const circuitInputs = {
        ageRequirement: ageRequirement,
        userAge: credential.age
      };
      
      console.log('Circuit Inputs:', circuitInputs);
      
      // In a real extension, we would load the wasm and zkey files from local storage
      // For this demo, we'll fetch them from the server
      const wasmPath = 'http://localhost:3002/simple_age_verification_js/simple_age_verification.wasm';
      const zkeyPath = 'http://localhost:3002/simple_age_verification.zkey';
      
      // Generate the proof
      console.log('Generating proof with snarkjs...');
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInputs,
        wasmPath,
        zkeyPath
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
  
  // Public API
  return {
    generateProof
  };
})();
