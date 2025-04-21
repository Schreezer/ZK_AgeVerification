document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const noCredentialSection = document.getElementById('no-credential');
    const hasCredentialSection = document.getElementById('has-credential');
    const credentialName = document.getElementById('credential-name');
    const credentialUserId = document.getElementById('credential-userId');
    const credentialAge = document.getElementById('credential-age');
    const credentialIssued = document.getElementById('credential-issued');
    const clearCredentialButton = document.getElementById('clear-credential');

    // Check if we have a stored credential
    chrome.storage.local.get('credential').then(result => {
        if (result.credential) {
            // Parse the JWT
            const credential = parseJwt(result.credential);

            // Update the UI
            credentialName.textContent = credential.name || 'N/A';
            credentialUserId.textContent = credential.userId || 'N/A';
            credentialAge.textContent = credential.age || 'N/A';
            credentialIssued.textContent = credential.issuedAt ? new Date(credential.issuedAt).toLocaleString() : 'N/A';

            // Show the credential section
            noCredentialSection.classList.add('hidden');
            hasCredentialSection.classList.remove('hidden');
        }
    });

    // Add event listener for the clear button
    clearCredentialButton.addEventListener('click', function() {
        chrome.storage.local.remove('credential').then(() => {
            // Show the no credential section
            hasCredentialSection.classList.add('hidden');
            noCredentialSection.classList.remove('hidden');
        });
    });

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
});
