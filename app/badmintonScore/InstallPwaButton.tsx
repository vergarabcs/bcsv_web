import { Alert, Box, Button, Snackbar } from "@mui/material"
import { useEffect, useState } from "react";
import { registerServiceWorker, isPWAInstalled } from '../lib/pwaUtils';
import GetAppIcon from '@mui/icons-material/GetApp';

export const InstallPwaButton = () => {
  // PWA install logic states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);

  // Register service worker on mount
  useEffect(() => {
    const initServiceWorker = async () => {
      try {
        const registration = await registerServiceWorker();
        if (registration) {
          setServiceWorkerRegistered(true);
          setStatusMessage('PWA service worker registered - app can be installed');
          setShowSnackbar(true);
        } else {
          setStatusMessage('PWA installation may not be available');
          setShowSnackbar(true);
        }
      } catch (error) {
        // Optionally handle error
      }
    };
    if (typeof window !== 'undefined') {
      initServiceWorker();
    }
  }, []);

  // PWA detection logic
  const checkInstallationStatus = () => {
    if (isPWAInstalled()) {
      setStatusMessage('App is already installed');
      setShowSnackbar(true);
      setIsInstallable(false);
      return;
    }
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    const iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
    if (iOSSafari) {
      setIsInstallable(true);
      setStatusMessage('To install: tap the share icon and select "Add to Home Screen"');
      return;
    }
  };

  useEffect(() => {
    checkInstallationStatus();
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      setStatusMessage('App is available for installation');
      setShowSnackbar(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setStatusMessage('App installed successfully!');
      setShowSnackbar(true);
    });
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [serviceWorkerRegistered]);

  const handleInstallClick = () => {
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    const iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
    if (iOSSafari) {
      setStatusMessage('To install: tap the share icon and select "Add to Home Screen"');
      setShowSnackbar(true);
      return;
    }
    if (!deferredPrompt) {
      setStatusMessage('Installation not available at this time');
      setShowSnackbar(true);
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        setStatusMessage('Installation started!');
      } else {
        setStatusMessage('Installation cancelled');
      }
      setShowSnackbar(true);
      setDeferredPrompt(null);
    }).catch(() => {
      setStatusMessage('Installation error occurred');
      setShowSnackbar(true);
    });
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  return (<>
    {/* Install App button for PWA */}
    {isInstallable && (
      <Button
        variant="outlined"
        startIcon={<GetAppIcon />}
        onClick={handleInstallClick}
        fullWidth
      >
        Install App
      </Button>
    )}

    {/* Status Snackbar for PWA install messages */}
    <Snackbar
      open={showSnackbar}
      autoHideDuration={6000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
        {statusMessage}
      </Alert>
    </Snackbar>

  </>)
}