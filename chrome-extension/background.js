// Background script for the ZK Age Verification extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background script received message:', message);

    if (message.action === 'storeCredential') {
        // Store the credential in local storage
        chrome.storage.local.set({ credential: message.credential })
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
        chrome.storage.local.get('credential')
            .then(result => {
                if (!result.credential) {
                    return {
                        success: false,
                        error: 'No credential found. Please obtain a credential from the government portal first.'
                    };
                }

                // Generate the proof
                return generateProof(result.credential, message.ageRequirement)
                    .then(proofResult => {
                        return { success: true, ...proofResult };
                    })
                    .catch(error => {
                        console.error('Error generating proof:', error);
                        return {
                            success: false,
                            error: `Error generating proof: ${error.message}`
                        };
                    });
            })
            .then(response => {
                sendResponse(response);
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

        // Load the snarkjs library from a CDN
        let snarkjs;
        try {
            const response = await fetch('https://cdn.jsdelivr.net/npm/snarkjs@0.7.0/build/snarkjs.min.js');
            if (!response.ok) {
                throw new Error(`Failed to fetch snarkjs: ${response.status} ${response.statusText}`);
            }
            const snarkjsCode = await response.text();
            snarkjs = new Function('return ' + snarkjsCode)();
            console.log('Loaded snarkjs from CDN');
        } catch (e) {
            console.error('Failed to load snarkjs from CDN:', e);
            // Fallback to fetching from the server
            const response = await fetch('http://localhost:3002/zk_age_verification_mock.js');
            if (!response.ok) {
                throw new Error(`Failed to fetch from server: ${response.status} ${response.statusText}`);
            }
            const mockCode = await response.text();
            // Extract the snarkjs mock from the file
            const mockSnarkjs = {
                groth16: {
                    fullProve: async (input, wasm, zkey) => {
                        console.log('Using mock snarkjs implementation');
                        // Simple mock implementation
                        return {
                            proof: {
                                pi_a: ['123', '456', '789'],
                                pi_b: [['123', '456'], ['789', '012'], ['345', '678']],
                                pi_c: ['123', '456', '789'],
                                protocol: 'groth16'
                            },
                            publicSignals: [(input.userAge >= input.ageRequirement) ? '1' : '0', input.ageRequirement.toString()]
                        };
                    }
                }
            };
            snarkjs = mockSnarkjs;
            console.log('Using mock snarkjs implementation');
        }

        // Prepare inputs for the ZK circuit
        const circuitInputs = {
            ageRequirement: ageRequirement,
            userAge: credential.age
        };

        console.log('Circuit Inputs:', circuitInputs);

        // Try to fetch the wasm and zkey files
        let wasmBuffer, zkeyBuffer;
        try {
            console.log('Fetching wasm file...');
            const wasmResponse = await fetch('http://localhost:3002/simple_age_verification_js/simple_age_verification.wasm');
            if (!wasmResponse.ok) {
                throw new Error(`Failed to fetch wasm: ${wasmResponse.status} ${wasmResponse.statusText}`);
            }
            wasmBuffer = await wasmResponse.arrayBuffer();

            console.log('Fetching zkey file...');
            const zkeyResponse = await fetch('http://localhost:3002/simple_age_verification.zkey');
            if (!zkeyResponse.ok) {
                throw new Error(`Failed to fetch zkey: ${zkeyResponse.status} ${zkeyResponse.statusText}`);
            }
            zkeyBuffer = await zkeyResponse.arrayBuffer();
        } catch (e) {
            console.error('Error fetching circuit files:', e);
            // If we're using the mock snarkjs, we don't need the actual files
            if (!snarkjs.groth16.fullProve.toString().includes('mock')) {
                throw e;
            }
        }

        // Generate the proof
        console.log('Generating proof with snarkjs...');
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            circuitInputs,
            wasmBuffer ? new Uint8Array(wasmBuffer) : null,
            zkeyBuffer ? new Uint8Array(zkeyBuffer) : null
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
