'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Tabs,
  Tab,
  Badge,
  Alert,
  Stack
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
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRating, setNewPlayerRating] = useState('1500');

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      const rating = parseInt(newPlayerRating) || 1500;
      addPlayer(newPlayerName.trim(), rating);
      setNewPlayerName('');
      setNewPlayerRating('1500');
      setAddPlayerOpen(false);
    }
  };

  const handleSessionToggle = () => {
    if (currentSession.isActive) {
      endSession();
    } else {
      initializeSession();
    }
  };

  const activePlayers = players.filter(p => p.status !== PlayerStatus.INACTIVE);
  const waitingCount = queueEntries.length;
  const playingCount = players.filter(p => p.status === PlayerStatus.PLAYING).length;

  return (
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
      <Dialog 
        open={addPlayerOpen} 
        onClose={() => setAddPlayerOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Player</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Player Name"
            fullWidth
            variant="outlined"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Initial Rating"
            type="number"
            fullWidth
            variant="outlined"
            value={newPlayerRating}
            onChange={(e) => setNewPlayerRating(e.target.value)}
            helperText="Default: 1500 (Range: 1000-3000)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPlayerOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddPlayer}
            variant="contained"
            disabled={!newPlayerName.trim()}
          >
            Add Player
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoublesQueue;