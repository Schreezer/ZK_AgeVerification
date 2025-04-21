// Determine which site we're on
const isServiceProvider = window.location.href.includes('localhost:3000');
const isGovernmentPortal = window.location.href.includes('localhost:3001');

console.log('ZK Age Verification Extension loaded on:', window.location.href);
console.log('Extension: Is service provider site?', isServiceProvider);
console.log('Extension: Is government portal site?', isGovernmentPortal);

// Initialize based on the current site
if (isServiceProvider) {
    console.log('Extension: Initializing for service provider site');
    initServiceProviderSite();
} else if (isGovernmentPortal) {
    console.log('Extension: Initializing for government portal site');
    initGovernmentPortalSite();
} else {
    console.log('Extension: Not on a recognized site');
}

// Initialize for the service provider site
function initServiceProviderSite() {
    console.log('Extension: Setting up event listeners for service provider site');

    // Check for the communication element
    const commElement = document.getElementById('zk-extension-communication');
    if (commElement) {
        console.log('Extension: Found communication element');

        // Set up a MutationObserver to watch for changes to the communication element
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-status') {
                    const status = commElement.getAttribute('data-status');
                    console.log('Extension: Communication element status changed to', status);

                    if (status === 'verification-requested') {
                        console.log('Extension: Verification requested via communication element');
                        const ageRequirement = parseInt(commElement.getAttribute('data-age-requirement'));
                        const sessionId = commElement.getAttribute('data-session-id');

                        // Update the status to let the service provider know we detected the request
                        commElement.setAttribute('data-status', 'extension-detected');

                        // Handle the verification request
                        handleAgeVerificationRequest({
                            detail: {
                                ageRequirement: ageRequirement,
                                sessionId: sessionId
                            }
                        });
                    }
                }
            });
        });

        observer.observe(commElement, { attributes: true });

        // Check if verification is already requested
        if (commElement.getAttribute('data-status') === 'verification-requested') {
            console.log('Extension: Verification already requested');
            const ageRequirement = parseInt(commElement.getAttribute('data-age-requirement'));
            const sessionId = commElement.getAttribute('data-session-id');

            // Update the status to let the service provider know we detected the request
            commElement.setAttribute('data-status', 'extension-detected');

            // Handle the verification request
            handleAgeVerificationRequest({
                detail: {
                    ageRequirement: ageRequirement,
                    sessionId: sessionId
                }
            });
        }
    }

    // Listen for the custom event from the service provider
    console.log('Extension: Adding event listener for ZK_AGE_VERIFICATION_REQUESTED');
    document.addEventListener('ZK_AGE_VERIFICATION_REQUESTED', handleAgeVerificationRequest);

    // Also listen for the verify button click as a fallback
    console.log('Extension: Adding click listener for verify-age-btn');
    document.addEventListener('click', function(event) {
        if (event.target.id === 'verify-age-btn') {
            console.log('Extension: Verify age button clicked');

            // Wait a short time to let the service provider's event dispatch happen first
            setTimeout(() => {
                // Get the age requirement from the page
                const ageRequirementElement = document.getElementById('age-requirement');
                if (ageRequirementElement) {
                    const ageRequirement = parseInt(ageRequirementElement.textContent);
                    console.log('Extension: Detected age requirement from button click:', ageRequirement);

                    // Create a synthetic event to reuse the handler
                    handleAgeVerificationRequest({
                        detail: {
                            ageRequirement: ageRequirement,
                            sessionId: Date.now().toString() // Generate a session ID if none exists
                        }
                    });
                }
            }, 500);
        }
    });

    console.log('Extension: Service provider site initialization complete');
}

// Handler for age verification requests
function handleAgeVerificationRequest(event) {
    console.log('Extension: Age verification requested by service provider', event.detail);

    // Get the age requirement and session ID from the event
    const ageRequirement = event.detail.ageRequirement;
    const sessionId = event.detail.sessionId;

    console.log('Extension: Age requirement:', ageRequirement);
    console.log('Extension: Session ID:', sessionId);

    // Check if we have a credential stored
    console.log('Extension: Checking for stored credential');
    chrome.storage.local.get('credential').then(result => {
        if (result.credential) {
            console.log('Extension: Found stored credential');
            // We have a credential, ask if the user wants to use it
            if (confirm('You have a stored age credential. Would you like to use it for verification?')) {
                console.log('Extension: User chose to use stored credential');
                // Generate proof with the stored credential
                chrome.runtime.sendMessage({
                    action: 'generateProof',
                    ageRequirement
                }).then(response => {
                    console.log('Extension: Generate proof response:', response);
                    if (response && response.success) {
                        console.log('Extension: Proof generated successfully, sending to service provider');
                        // Send the proof to the service provider page
                        window.postMessage({
                            type: 'ZK_AGE_VERIFICATION',
                            proof: response.proof,
                            publicSignals: response.publicSignals
                        }, '*');

                        console.log('Extension: Sent proof to service provider with type ZK_AGE_VERIFICATION');
                    } else {
                        // Failed to generate proof, redirect to government site
                        console.log('Extension: Failed to generate proof, redirecting to government portal');
                        alert('Could not generate proof with stored credential. Redirecting to government portal...');
                        openGovernmentPortal(ageRequirement, sessionId);
                    }
                }).catch(error => {
                    console.error('Extension: Error generating proof:', error);
                    alert('Error generating proof. Redirecting to government portal...');
                    openGovernmentPortal(ageRequirement, sessionId);
                });
            } else {
                // User chose not to use stored credential
                console.log('Extension: User chose not to use stored credential');
                openGovernmentPortal(ageRequirement, sessionId);
            }
        } else {
            // No credential stored, redirect to government portal
            console.log('Extension: No credential stored, redirecting to government portal');
            alert('You need to obtain an age credential from the government portal. Redirecting...');
            openGovernmentPortal(ageRequirement, sessionId);
        }
    }).catch(error => {
        console.error('Extension: Error checking for stored credential:', error);
        alert('Error checking for stored credential. Redirecting to government portal...');
        openGovernmentPortal(ageRequirement, sessionId);
    });
}

// Listen for messages from the extension
window.addEventListener('message', function(event) {
    // Only accept messages from our extension
    if (event.source !== window || !event.data.type || event.data.type !== 'ZK_AGE_VERIFICATION') {
        return;
    }

    console.log('Extension: Received proof from extension:', event.data);

    // Get the proof and public signals
    const { proof, publicSignals } = event.data;

    // Get the age requirement
    const ageRequirement = parseInt(document.body.getAttribute('data-age-requirement'));
    console.log('Extension: Age requirement from data attribute:', ageRequirement);

    // Call the service provider API to verify the proof
    verifyProofWithServiceProvider(proof, publicSignals, ageRequirement);
});

// Initialize for the government portal site
function initGovernmentPortalSite() {
    console.log('Extension: Initializing for government portal site');

    // Listen for the custom event from the government portal
    document.addEventListener('ZK_CREDENTIAL_AVAILABLE', function(event) {
        console.log('Extension: Credential available from government portal', event.detail);

        // Get the credential and age requirement from the event
        const credential = event.detail.credential;
        const ageRequirement = event.detail.ageRequirement;

        if (!credential) {
            console.error('Extension: No credential provided in the event');
            alert('No credential provided. Please try again.');
            return;
        }

        // Store the credential in the extension
        try {
            chrome.runtime.sendMessage({
                action: 'storeCredential',
                credential
            }).then(response => {
            if (response && response.success) {
                console.log('Extension: Credential stored in extension successfully');

                // If we have an age requirement, generate the proof
                if (ageRequirement) {
                    // Generate the proof
                    generateProofAndSendToServiceProvider(ageRequirement);
                } else {
                    alert('Credential stored in extension. You can now return to the service provider.');
                    // Close the window after a short delay
                    setTimeout(() => window.close(), 1500);
                }
            } else {
                console.error('Extension: Error storing credential in extension');
                alert('Error storing credential in extension. Please try again.');
            }
        }).catch(error => {
            console.error('Extension: Error sending message to extension:', error);
            alert('Error communicating with extension. Please make sure the extension is installed and enabled.');
        });
        } catch (error) {
            console.error('Extension: Error in chrome.runtime.sendMessage:', error);
            alert('Error communicating with extension. Please make sure the extension is installed and enabled.');

            // Fallback to the simulator if the extension communication fails
            if (ageRequirement) {
                console.log('Extension: Falling back to simulator');
                // Use the simulator to generate a proof
                const simulateScript = `
                    if (typeof simulateExtensionProofGeneration === 'function' && typeof currentCredential === 'string') {
                        simulateExtensionProofGeneration(currentCredential, ${ageRequirement})
                            .then(result => {
                                sendProofToServiceProvider(result.proof, result.publicSignals);
                            })
                            .catch(err => {
                                console.error('Error in simulator:', err);
                                alert('Error generating proof: ' + err.message);
                            });
                        return true;
                    }
                    return false;
                `;

                const result = executeScript(simulateScript);
                console.log('Extension: Simulator execution result:', result);
            }
        }
    });

    // Also listen for the send to extension button click for backward compatibility
    document.addEventListener('click', function(event) {
        if (event.target.id === 'send-to-extension-btn') {
            console.log('Extension: Send to extension button clicked');

            // Try to get the credential from localStorage first (more reliable)
            const localStorageScript = `
                return localStorage.getItem('currentCredential');
            `;

            // Execute the script to get the credential from localStorage
            let credential = executeScript(localStorageScript);

            // If not found in localStorage, try to get it from the page variable
            if (!credential) {
                console.log('Extension: Credential not found in localStorage, trying page variable');
                const credentialScript = `
                    if (typeof currentCredential === 'string') {
                        return currentCredential;
                    } else {
                        return null;
                    }
                `;

                credential = executeScript(credentialScript);
            }

            // If still not found, try to get it from a data attribute we'll add
            if (!credential) {
                console.log('Extension: Credential not found in page variable, trying data attribute');
                const credentialElement = document.getElementById('credential-data');
                if (credentialElement) {
                    credential = credentialElement.getAttribute('data-credential');
                }
            }

            if (!credential) {
                console.error('Extension: Could not extract credential from page');
                alert('Could not extract credential from page. Please try again.');
                return;
            }

            console.log('Extension: Successfully extracted credential');

            // Send the credential to the extension
            chrome.runtime.sendMessage({
                action: 'storeCredential',
                credential
            }).then(response => {
                if (response && response.success) {
                    console.log('Extension: Credential sent to extension successfully');

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
                    console.error('Extension: Error sending credential to extension');
                    alert('Error sending credential to extension. Please try again.');
                }
            }).catch(error => {
                console.error('Extension: Error sending message to extension:', error);
                alert('Error communicating with extension. Please make sure the extension is installed and enabled.');
            });
        }
    });
}

// Function to verify the proof with the service provider
function verifyProofWithServiceProvider(proof, publicSignals, ageRequirement) {
    console.log('Extension: Verifying proof with service provider');
    console.log('Extension: Proof:', proof);
    console.log('Extension: Public Signals:', publicSignals);
    console.log('Extension: Age Requirement:', ageRequirement);

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
        console.log('Extension: Verification response:', data);

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
        console.error('Extension: Error verifying proof:', error);

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
    console.log('Extension: Generating proof for age requirement:', ageRequirement);

    // Show loading message
    alert('Generating zero-knowledge proof... This may take a few seconds.');

    // Store the opener window reference before async operations
    const openerWindow = window.opener;
    console.log('Extension: Opener window exists?', !!openerWindow);

    // Ask the extension to generate the proof
    chrome.runtime.sendMessage({
        action: 'generateProof',
        ageRequirement
    }).then(response => {
        if (response && response.success) {
            console.log('Extension: Proof generated successfully');

            // Check if we have an opener window (service provider)
            if (openerWindow) {
                try {
                    // Create the message payload
                    const message = {
                        type: 'ZK_AGE_VERIFICATION',
                        proof: response.proof,
                        publicSignals: response.publicSignals
                    };

                    console.log('Extension: Sending message to service provider:', message);

                    // Send the proof to the opener window
                    openerWindow.postMessage(message, 'http://localhost:3000');
                    console.log('Extension: Sent proof to service provider with type ZK_AGE_VERIFICATION');

                    // Also try sending to the parent window if it exists
                    if (window.parent && window.parent !== window) {
                        console.log('Extension: Also sending to parent window');
                        window.parent.postMessage(message, 'http://localhost:3000');
                    }

                    // Close this window after sending the proof
                    alert('Proof sent to service provider. This window will close.');
                    setTimeout(() => window.close(), 1000);
                } catch (error) {
                    console.error('Extension: Error sending proof to service provider:', error);
                    alert('Error sending proof to service provider: ' + error.message);
                }
            } else {
                alert('Proof generated successfully, but could not communicate with service provider. Please return to the service provider and try again.');
            }
        } else {
            console.error('Extension: Error generating proof:', response ? response.error : 'Unknown error');
            alert(`Error generating proof: ${response ? response.error : 'Unknown error'}`);
        }
    }).catch(error => {
        console.error('Extension: Error sending message to extension:', error);
        alert('Error communicating with extension. Please make sure the extension is installed and enabled.');
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

// Function to open the government portal
function openGovernmentPortal(ageRequirement, sessionId) {
    const governmentUrl = `http://localhost:3001?sessionId=${sessionId}&ageRequirement=${ageRequirement}`;
    window.open(governmentUrl, 'governmentWindow', 'width=800,height=600');
}
