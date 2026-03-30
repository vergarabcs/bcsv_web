'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tabs,
  Tab,
  Badge,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  EmojiEvents as TrophyIcon,
  SportsTennis as CourtIcon
} from '@mui/icons-material';
import { useDoublesQueueStore } from './useDoublesQueueStore';
import { getRatingCategory, getRatingCategoryColor, PlayerStatus, CourtStatus } from './types';
import Dashboard from './components/Dashboard';
import QueueManager from './components/QueueManager';
import GameResults from './components/GameResults';
import Players from './components/Players';
import AddPlayerDialog from './components/AddPlayerDialog';
import GlobalLoader from '../lib/components/GlobalLoader';
import styles from './DoublesQueue.module.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0, pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DoublesQueue: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [endSessionDialogOpen, setEndSessionDialogOpen] = useState(false);
  const [isPlayersLoading, setIsPlayersLoading] = useState(true);

  const {
    players,
    currentSession,
    queueEntries,
    nextMatches,
    courts,
    initializeSession,
    endSession,
    addPlayer,
    joinQueue
  } = useDoublesQueueStore();

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadPlayers = async () => {
      try {
        const response = await fetch('/api/players', {
          signal: controller.signal,
        });
        const data: { players?: Array<{ name: string; rating: number }> } = await response.json();

        if (Array.isArray(data.players)) {
          data.players.forEach(({ name, rating }) => addPlayer(name, rating));
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          // Silently ignore if the sheet is unreachable.
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setIsPlayersLoading(false);
        }
      }
    };

    loadPlayers();

    return () => {
      isMounted = false;
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSessionToggle = () => {
    if (currentSession.isActive) {
      setEndSessionDialogOpen(true);
    } else {
      initializeSession();
    }
  };

  const handleConfirmEndSession = () => {
    endSession();
    setEndSessionDialogOpen(false);
  };

  const activePlayers = players.filter(p => p.status !== PlayerStatus.INACTIVE);
  const waitingCount = queueEntries.length;
  const playingCount = players.filter(p => p.status === PlayerStatus.PLAYING).length;

  return (
    <>
      <GlobalLoader open={isPlayersLoading} label="Loading players..." />
      <Box 
        className={styles.doublesQueue}
        sx={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'background.default'
        }}>
        {/* Header */}
        <Box sx={{ 
          px: 2, 
          py: 1, 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h5" component="h1" fontWeight="bold">
            🏸 Doubles Queue
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={currentSession.isActive ? 'Session Active' : 'Session Inactive'}
              color={currentSession.isActive ? 'success' : 'default'}
              size="small"
            />
            <Button
              variant="contained"
              color={currentSession.isActive ? 'error' : 'success'}
              onClick={handleSessionToggle}
              startIcon={currentSession.isActive ? <StopIcon /> : <PlayIcon />}
              size="small"
            >
              {currentSession.isActive ? 'End' : 'Start'}
            </Button>
          </Box>
        </Box>

        {!currentSession.isActive && (
          <Alert 
            severity="info" 
            sx={{ mx: 2, mt: 1 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={initializeSession}
              >
                Start Session
              </Button>
            }
          >
            Start a session to begin managing the queue and games
          </Alert>
        )}

        {/* Navigation Tabs */}
        <Paper square sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
          >
            <Tab 
              icon={<Badge badgeContent={waitingCount} color="primary"><CourtIcon /></Badge>} 
              label="Dashboard" 
            />
            <Tab 
              icon={<Badge badgeContent={activePlayers.length} color="secondary"><PeopleIcon /></Badge>} 
              label="Queue" 
            />
            <Tab 
              icon={<TrophyIcon />} 
              label="Results" 
            />
            <Tab 
              icon={<SettingsIcon />} 
              label="Players" 
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <TabPanel value={tabValue} index={0}>
            <Dashboard />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <QueueManager />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <GameResults />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <Players />
            {/* Floating Action Button */}
            <Fab 
              color="primary" 
              aria-label="add player"
              onClick={() => setAddPlayerOpen(true)}
              className={`${styles.hapticFeedback}`}
              sx={{ 
                position: 'fixed', 
                bottom: 24, 
                right: 24,
                boxShadow: 4
              }}
            >
              <AddIcon />
            </Fab>
          </TabPanel>
        </Box>

        {/* Add Player Dialog */}
        <AddPlayerDialog
          open={addPlayerOpen}
          onClose={() => setAddPlayerOpen(false)}
          players={players}
          addPlayer={addPlayer}
        />

        {/* End Session Confirmation Dialog */}
        <Dialog
          open={endSessionDialogOpen}
          onClose={() => setEndSessionDialogOpen(false)}
        >
          <DialogTitle>End Session?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to end the current session? This will clear the queue and active games.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEndSessionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmEndSession} color="error" variant="contained">
              End Session
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default DoublesQueue;