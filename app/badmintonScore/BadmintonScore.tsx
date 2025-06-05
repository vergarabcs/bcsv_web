import { 
  Button, 
  Typography, 
  Box,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { useState, useEffect } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import UndoIcon from '@mui/icons-material/Undo';
import GetAppIcon from '@mui/icons-material/GetApp';
import styles from './BadmintonScore.module.css';
import { CourtLayout } from './CourtLayout';
import { TEAM_NAME } from './constants';
import { useBadmintonStore } from './useBadmintonStore';
import { SettingsDialog } from './SettingsDialog';
import { PlayerScore } from './PlayerScore';
import { registerServiceWorker, isPWAInstalled } from '../lib/pwaUtils';

const TEXT_SHADOW = `0px 0px 10px white`
                
export default function BadmintonScore() {
  // Keep isLandscape state in the component
  const [isLandscape, setIsLandscape] = useState(true);
  // For PWA installation
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  // Service worker status
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);

  // Get everything else from the store
  const {
    gameOver,
    winner,
    resetGame,
    history,
    handleOpenSettings,
    undo,
    canUndo
  } = useBadmintonStore();

  // Register service worker on component mount
  useEffect(() => {
    const initServiceWorker = async () => {
      try {
        const registration = await registerServiceWorker();
        if (registration) {
          console.log('Service worker successfully registered from component');
          setServiceWorkerRegistered(true);
          setStatusMessage('PWA service worker registered - app can be installed');
          setShowSnackbar(true);
        } else {
          console.warn('Service worker registration returned undefined');
          setStatusMessage('PWA installation may not be available');
          setShowSnackbar(true);
        }
      } catch (error) {
        console.error('Error registering service worker:', error);
      }
    };
    
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      initServiceWorker();
    }
  }, []);

  // PWA detection logic
  const checkInstallationStatus = () => {
    // Check if already installed as PWA
    if (isPWAInstalled()) {
      setStatusMessage('App is already installed');
      setShowSnackbar(true);
      setIsInstallable(false);
      return;
    }

    // Manually show install button if on mobile Safari (iOS)
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    const iOSSafari = iOS && webkit && !ua.match(/CriOS/i);

    // iOS doesn't support beforeinstallprompt, but can be installed from Safari
    if (iOSSafari) {
      setIsInstallable(true);
      setStatusMessage('To install: tap the share icon and select "Add to Home Screen"');
      return;
    }
  };

  // Handle PWA installation
  useEffect(() => {
    checkInstallationStatus();

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event captured in component!');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      // Show the install button
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
  }, [serviceWorkerRegistered]); // Depend on serviceWorkerRegistered

  const handleInstallClick = () => {
    // For iOS Safari instruction
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
      console.log('No installation prompt available');
      setStatusMessage('Installation not available at this time');
      setShowSnackbar(true);
      return;
    }
    
    // Show the installation prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setStatusMessage('Installation started!');
      } else {
        console.log('User dismissed the install prompt');
        setStatusMessage('Installation cancelled');
      }
      setShowSnackbar(true);
      // We no longer need the prompt
      setDeferredPrompt(null);
    }).catch((error: any) => {
      console.error('Install prompt error:', error);
      setStatusMessage('Installation error occurred');
      setShowSnackbar(true);
    });
  };

  // Check orientation on load and on resize
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    // Check on mount
    checkOrientation();
    
    // Add listener for resize
    window.addEventListener('resize', checkOrientation);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  return (
    <>
      {!isLandscape && (
        <div className={styles.rotateMessage}>
          <Typography variant="h5">
            Please rotate your device to landscape mode for the best experience
          </Typography>
        </div>
      )}
      
      <div className={styles.forceLandscape}>
        <div className={styles.landscapeContainer}>
          <div className={styles.topControls}>
            {/* Settings button */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<SettingsIcon />}
              onClick={handleOpenSettings}
            >
              Settings
            </Button>
            
            {/* Undo button */}
            <Tooltip title="Undo last action">
              <span>
                <IconButton 
                  color="primary" 
                  onClick={undo} 
                  disabled={!canUndo()}
                  className={styles.undoButton}
                  size="large"
                >
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>

            {/* Install App button */}
            {isInstallable && (
              <Tooltip title="Install as App">
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<GetAppIcon />}
                  onClick={handleInstallClick}
                  className={styles.installButton}
                >
                  Install App
                </Button>
              </Tooltip>
            )}
          </div>

          {/* Court layout as background */}
          <CourtLayout/>

          {/* Score display overlaid on court layout */}
          <div className={styles.scoreDisplay} style={{ position: 'relative', zIndex: 1 }}>
            {/* Player 1 side */}
            <PlayerScore 
              team={TEAM_NAME.TEAM1}
              className={styles.playerArea1}
            />

            {/* Player 2 side */}
            <PlayerScore 
              team={TEAM_NAME.TEAM2}
              className={styles.playerArea2}
            />
          </div>

          {/* Game over overlay */}
          {gameOver && (
            <div className={styles.gameOverlay}>
              <Typography variant="h2" sx={{ color: 'white', mb: 2 }}>
                Game Over
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', mb: 4 }}>
                {winner} wins!
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="large" 
                onClick={resetGame}
              >
                New Game
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog />

      {/* Status Snackbar */}
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
    </>
  );
}