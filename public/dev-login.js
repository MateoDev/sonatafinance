// This is a utility script to provide a quick devmode login method
(function() {
  // Create a dev login button that appears in the corner
  function createDevLoginButton() {
    const button = document.createElement('button');
    button.id = 'dev-login-btn'; // add ID for easier styling/selection
    button.textContent = 'Force Developer Account Login';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '99999';
    button.style.padding = '8px 12px';
    button.style.background = '#000';
    button.style.color = 'white';
    button.style.border = '1px solid #666';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.fontFamily = 'sans-serif';
    button.style.fontSize = '14px';
    button.style.opacity = '0.85';
    
    button.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
      button.style.background = '#333';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.opacity = '0.85';
      button.style.background = '#000';
    });
    
    button.addEventListener('click', async () => {
      button.textContent = 'Logging in...';
      button.style.opacity = '0.5';
      
      try {
        // First, try to logout if already logged in
        try {
          await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
          });
          console.log('Logged out any existing user');
        } catch (e) {
          console.log('No logout needed');
        }
        
        // Now call the dev login endpoint
        const response = await fetch('/api/login/dev', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Dev login successful as developer account:', data);
          
          // Force clearing any firebase auth token
          localStorage.removeItem('firebaseToken');
          localStorage.removeItem('authUser');
          
          // Update cache values for dashboard access
          localStorage.setItem('dashboard_accessible', 'true');
          localStorage.setItem('user_role', 'developer');
          
          // Inform the user
          button.textContent = 'Success! Redirecting...';
          
          // Force a hard reload to reset all auth states
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
        } else {
          console.error('Dev login failed:', await response.text());
          button.textContent = 'Login Failed';
          setTimeout(() => {
            button.textContent = 'Force Developer Account Login';
            button.style.opacity = '0.85';
          }, 2000);
        }
      } catch (error) {
        console.error('Dev login error:', error);
        button.textContent = 'Login Error';
        setTimeout(() => {
          button.textContent = 'Force Developer Account Login';
          button.style.opacity = '0.85';
        }, 2000);
      }
    });
    
    document.body.appendChild(button);
  }
  
  // Add the button when the DOM is fully loaded
  window.addEventListener('DOMContentLoaded', () => {
    // Always show the button in any environment
    setTimeout(createDevLoginButton, 1000); // Delay to ensure other UI is loaded
  });
})();