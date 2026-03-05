// This script is loaded in the index.html to force proper Dashboard routing
document.addEventListener('DOMContentLoaded', function() {
  // Force the current URL to be /dashboard if the URL contains dashboard
  if (window.location.pathname.toLowerCase().includes('dashboard') && 
      window.location.pathname !== '/dashboard') {
    console.log('Redirecting to proper dashboard URL');
    window.location.href = '/dashboard';
  }
  
  // Add global click handler to capture any Dashboard link clicks
  document.addEventListener('click', function(e) {
    // Check if the click was on an element with Dashboard in the text
    const clickedElText = e.target.textContent?.toLowerCase() || '';
    const nearestAnchor = e.target.closest('a');
    const hrefValue = nearestAnchor?.getAttribute('href') || '';
    
    if ((clickedElText.includes('dashboard') || hrefValue.includes('dashboard')) && 
        (hrefValue !== '/dashboard' || window.location.pathname !== '/dashboard')) {
      e.preventDefault();
      console.log('Dashboard link intercepted - ensuring proper routing');
      window.location.href = '/dashboard';
    }
  });
});