// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registration successful with scope: ', registration.scope);
        
        // Force update check on each page load
        registration.update();
        
        // Check if the service worker is already controlling the page
        if (navigator.serviceWorker.controller) {
          console.log('Service Worker is already controlling the page');
        }
      })
      .catch((error) => {
        console.error('Service Worker registration failed: ', error);
      });
  });
  
  // Log any changes in controller status
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker controller has changed');
  });
}

// Debug info for PWA installation
window.addEventListener('appinstalled', (event) => {
  console.log('Application was successfully installed!');
});

// Explicitly log if beforeinstallprompt fires
window.addEventListener('beforeinstallprompt', (event) => {
  console.log('beforeinstallprompt event fired!', event);
  // Don't do anything here - just for logging purposes
});