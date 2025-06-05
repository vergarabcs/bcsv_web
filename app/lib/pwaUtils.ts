// PWA Utility functions

/**
 * Registers the service worker for PWA functionality
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | undefined> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return undefined;
  }

  try {
    // Register the service worker from the public directory
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('Service Worker registered successfully:', registration);
    
    // Force update check
    await registration.update();
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return undefined;
  }
};

/**
 * Force an update of the service worker
 */
export const updateServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.update();
  }
};

/**
 * Check if the app is installed as a PWA
 */
export const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check if installed as PWA using display-mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check for iOS PWA
  const isIOSPWA = 
    window.navigator.standalone === true || 
    // @ts-ignore - Safari specific property
    (window.navigator as any).standalone === true;
    
  return isStandalone || isIOSPWA;
};