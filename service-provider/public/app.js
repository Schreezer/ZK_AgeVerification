// Service Provider Frontend JavaScript

// DOM Elements
const verifyAgeBtn = document.getElementById('verify-age-btn');
const verificationStatus = document.getElementById('verification-status');
const verificationSection = document.getElementById('verification-section');
const contentSection = document.getElementById('content-section');
const ageRequirementSpan = document.getElementById('age-requirement');

// Global variables
let currentAgeRequirement = 16; // EU standard for social media
let sessionId = null;

// Initialize the application
function init() {
  // Set the age requirement
  ageRequirementSpan.textContent = currentAgeRequirement;

  // Add event listeners
  verifyAgeBtn.addEventListener('click', initiateVerification);

  // Add event listeners for social media interactions
  setupSocialMediaInteractions();
}

// Setup social media interactions
function setupSocialMediaInteractions() {
  // Add event listeners to social media buttons when they exist
  document.addEventListener('DOMContentLoaded', () => {
    // Like buttons
    document.querySelectorAll('.action-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        const action = this.innerText.trim();
        const post = this.closest('.post');
        const statsElement = post.querySelector('.post-stats');

        if (action.includes('Like')) {
          // Toggle like
          this.classList.toggle('liked');
          if (this.classList.contains('liked')) {
            this.style.color = '#003399';
            this.querySelector('i').style.color = '#003399';

            // Update like count
            const likeCountEl = statsElement.querySelector('span:first-child');
            const currentLikes = parseInt(likeCountEl.innerText.match(/\d+/)[0]);
            likeCountEl.innerHTML = `<i class="fas fa-thumbs-up"></i> ${currentLikes + 1} Likes`;
          } else {
            this.style.color = '#65676b';
            this.querySelector('i').style.color = '#65676b';

            // Update like count
            const likeCountEl = statsElement.querySelector('span:first-child');
            const currentLikes = parseInt(likeCountEl.innerText.match(/\d+/)[0]);
            likeCountEl.innerHTML = `<i class="fas fa-thumbs-up"></i> ${currentLikes - 1} Likes`;
          }
        } else if (action.includes('Comment')) {
          // Show a GDPR-compliant comment alert
          alert('Before commenting, please note that your comment will be processed in accordance with EU Regulation 2016/679 (GDPR) and stored on servers within the European Union. By proceeding, you consent to this processing.');
        } else if (action.includes('Share')) {
          // Show a sharing alert
          alert('Sharing functionality is currently under review by the European Commission to ensure compliance with the Digital Services Act. Please check back in 6-8 weeks.');
        }
      });
    });

    // Refresh button
    const refreshBtn = document.querySelector('.feed-controls .btn:first-child');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        // Show a spinning animation
        this.querySelector('i').classList.add('fa-spin');

        // After a delay, stop the animation and show a message
        setTimeout(() => {
          this.querySelector('i').classList.remove('fa-spin');
          alert('Feed refreshed in accordance with EU Directive 2019/1024 on open data and the re-use of public sector information.');
        }, 1000);
      });
    }

    // Filter button
    const filterBtn = document.querySelector('.feed-controls .btn:last-child');
    if (filterBtn) {
      filterBtn.addEventListener('click', function() {
        alert('Content filtering options are available in 24 official EU languages. Please select your preferred language from the settings menu.');
      });
    }
  });
}

// Function to initiate the verification process
async function initiateVerification() {
  try {
    // Show loading state
    updateStatus('Initiating age verification...', 'status-info');
    verifyAgeBtn.disabled = true;

    // Call the API to initiate verification
    const response = await fetch('/api/initiate-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ageRequirement: currentAgeRequirement })
    });

    if (!response.ok) {
      throw new Error('Failed to initiate verification');
    }

    const data = await response.json();
    currentAgeRequirement = data.ageRequirement;
    sessionId = data.sessionId;

    // Trigger the extension
    triggerExtension();

  } catch (error) {
    console.error('Error initiating verification:', error);
    updateStatus('Error initiating verification. Please try again.', 'status-error');
    verifyAgeBtn.disabled = false;
  }
}

// Function to trigger the browser extension
function triggerExtension() {
  updateStatus('Waiting for browser extension...', 'status-info');

  // Set the age requirement as a data attribute on the body for the extension to read
  document.body.setAttribute('data-age-requirement', currentAgeRequirement);
  document.body.setAttribute('data-session-id', sessionId);

  console.log('Service Provider: Triggering extension with age requirement:', currentAgeRequirement);
  console.log('Service Provider: Session ID:', sessionId);

  // Update the communication element
  const commElement = document.getElementById('zk-extension-communication');
  commElement.setAttribute('data-age-requirement', currentAgeRequirement);
  commElement.setAttribute('data-session-id', sessionId);
  commElement.setAttribute('data-status', 'verification-requested');

  // Dispatch a custom event that the extension's content script can listen for
  const event = new CustomEvent('ZK_AGE_VERIFICATION_REQUESTED', {
    detail: {
      ageRequirement: currentAgeRequirement,
      sessionId: sessionId
    }
  });

  console.log('Service Provider: Dispatching ZK_AGE_VERIFICATION_REQUESTED event');
  document.dispatchEvent(event);
  console.log('Service Provider: Event dispatched');

  // Also try a MutationObserver approach for Safari extensions
  console.log('Service Provider: Setting up MutationObserver for extension communication');
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-status') {
        const status = commElement.getAttribute('data-status');
        console.log('Service Provider: Communication element status changed to', status);

        if (status === 'extension-detected') {
          console.log('Service Provider: Extension detected the verification request');
        }
      }
    });
  });

  observer.observe(commElement, { attributes: true });

  // Listen for messages from the extension
  window.addEventListener('message', handleExtensionMessage);
}

// Function to handle messages from the extension
function handleExtensionMessage(event) {
  console.log('Service Provider: Received message:', event.data);

  // Check if the message is from our extension
  if (event.data && event.data.type === 'ZK_AGE_VERIFICATION') {
    console.log('Service Provider: Received proof from extension');
    const { proof, publicSignals } = event.data;

    // Verify the proof
    verifyProof(proof, publicSignals);
  } else {
    console.log('Service Provider: Received message with unexpected type:', event.data.type);
  }
}

// Function to verify the ZK proof
async function verifyProof(proof, publicSignals) {
  try {
    updateStatus('Verifying proof...', 'status-info');

    // Call the API to verify the proof
    const response = await fetch('/api/verify-proof', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        proof,
        publicSignals,
        ageRequirement: currentAgeRequirement
      })
    });

    const data = await response.json();

    if (data.success) {
      // Verification successful
      updateStatus('Age verification successful! Welcome to EuroGram!', 'status-success');

      // Show the content section after a short delay
      setTimeout(() => {
        verificationSection.classList.add('hidden');
        contentSection.classList.remove('hidden');

        // Add some social media interaction effects
        document.querySelectorAll('.post').forEach((post, index) => {
          setTimeout(() => {
            post.style.opacity = '0';
            post.style.transform = 'translateY(20px)';
            post.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

            setTimeout(() => {
              post.style.opacity = '1';
              post.style.transform = 'translateY(0)';
            }, 100);
          }, index * 200);
        });
      }, 1500);
    } else {
      // Verification failed
      updateStatus(`Verification failed: ${data.message}. Access denied.`, 'status-error');
      verifyAgeBtn.disabled = false;
      
      // Ensure content remains hidden on verification failure
      verificationSection.classList.remove('hidden');
      contentSection.classList.add('hidden');
    }

  } catch (error) {
    console.error('Error verifying proof:', error);
    updateStatus('Error verifying proof. Access denied.', 'status-error');
    verifyAgeBtn.disabled = false;
    
    // Ensure content remains hidden on verification failure
    verificationSection.classList.remove('hidden');
    contentSection.classList.add('hidden');
  }
}

// Function to update the status message
function updateStatus(message, className) {
  verificationStatus.textContent = message;
  verificationStatus.className = 'status-box ' + className;
  verificationStatus.classList.remove('hidden');
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add a global message listener to catch messages from the extension
window.addEventListener('message', function(event) {
  console.log('Service Provider: Global message received:', event.data);

  // Check if the message is from our extension
  if (event.data && event.data.type === 'ZK_AGE_VERIFICATION') {
    console.log('Service Provider: Global listener received proof from extension');
    const { proof, publicSignals } = event.data;

    // Verify the proof
    verifyProof(proof, publicSignals);
  }
});
