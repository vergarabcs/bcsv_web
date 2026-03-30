'use client';

import React, { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Fab,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  PlayArrow as PlayIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useDoublesQueueStore } from '../useDoublesQueueStore';
import { PlayerStatus, getRatingCategory, getRatingCategoryColor } from '../types';

const QueueManager: React.FC = () => {
  const {
    players,
    queueEntries,
    currentSession,
    addPlayer,
    joinQueue,
    leaveQueue,
    updatePlayerStatus,
    refreshQueue
  } = useDoublesQueueStore();

  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const normalizedSearch = search.trim().toLowerCase();

  const inactivePlayers = players.filter(p => p.status === PlayerStatus.INACTIVE);
  const activePlayers = players.filter(p => p.status !== PlayerStatus.INACTIVE);
  const filteredQueueEntries = queueEntries.filter(entry =>
    entry.player.name.toLowerCase().includes(normalizedSearch)
  );
  const filteredInactive = inactivePlayers.filter(p =>
    p.name.toLowerCase().includes(normalizedSearch)
  );
  const filteredActiveNonQueue = activePlayers.filter(player =>
    player.status !== PlayerStatus.WAITING &&
    player.name.toLowerCase().includes(normalizedSearch)
  );

  const handleJoinQueue = (playerId: string) => {
    joinQueue(playerId);
  };

  const handleCheckIn = (playerId: string) => {
    joinQueue(playerId);
    setSearch('');

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  };

  const handleCreateAndCheckIn = () => {
    const name = search.trim();
    if (!name) {
      return;
    }

    const existingPlayer = players.find(
      player => player.name.toLowerCase() === name.toLowerCase()
    );

    if (existingPlayer) {
      handleCheckIn(existingPlayer.id);
      return;
    }

    addPlayer(name, 1500);

    const createdPlayer = useDoublesQueueStore
      .getState()
      .players.find(player => player.name.toLowerCase() === name.toLowerCase());

    if (createdPlayer) {
      handleCheckIn(createdPlayer.id);
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    // Enter only checks in automatically when exactly one player matches.
    if (filteredInactive.length === 1) {
      event.preventDefault();
      handleCheckIn(filteredInactive[0].id);
    }
  };

  const handleLeaveQueue = (playerId: string) => {
    leaveQueue(playerId);
  };

  const handleTogglePlayerActive = (playerId: string, isActive: boolean) => {
    updatePlayerStatus(playerId, isActive ? PlayerStatus.WAITING : PlayerStatus.INACTIVE);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  if (!currentSession.isActive) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          No active session
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start a session to manage the queue
        </Typography>
      </Box>
    );
  }

    return (
      <Box sx={{ 
        p: 2, 
        pb: 12, // Extra padding for bottom navigation
        overflow: 'auto', 
        height: 'calc(100vh - 200px)', // Fixed height calculation
        maxHeight: 'calc(100vh - 200px)'
      }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search players..."
            fullWidth
            value={search}
            inputRef={searchInputRef}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="contained"
            onClick={handleCreateAndCheckIn}
            startIcon={<AddIcon />}
            disabled={!search.trim()}
          >
            New
          </Button>
        </Box>

        {/* Queue Status */}
        <Typography variant="h6" gutterBottom>
          🎯 Current Queue ({filteredQueueEntries.length}/{queueEntries.length} players)
        </Typography>      {filteredQueueEntries.length > 0 ? (
        <Paper sx={{ mb: 3 }}>
          <List>
            {filteredQueueEntries.map((entry, index) => {
              const waitTime = entry.player.joinedQueueTime 
                ? formatTime(entry.player.joinedQueueTime)
                : '0m';
              const category = getRatingCategory(entry.player.rating);
              
              return (
                <ListItem
                  key={entry.player.id}
                  divider={index < filteredQueueEntries.length - 1}
                  sx={{
                    bgcolor: index < 4 ? 'action.selected' : 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                    <Typography 
                      variant="h6" 
                      color="primary"
                      sx={{ 
                        minWidth: 40, 
                        textAlign: 'center',
                        bgcolor: index < 4 ? 'primary.main' : 'grey.300',
                        color: index < 4 ? 'white' : 'text.primary',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {index + 1}
                    </Typography>
                  </Box>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {entry.player.name}
                        </Typography>
                        <Chip
                          label={category}
                          size="small"
                          sx={{
                            bgcolor: getRatingCategoryColor(category),
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Box component="span" sx={{ display: 'block', fontSize: '0.875rem' }}>
                          Rating: {entry.player.rating} | Priority: {Math.round(entry.priority)}
                        </Box>
                        <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary' }}>
                          Wait time: {waitTime} | W/L: {entry.player.wins}/{entry.player.losses}
                        </Box>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleLeaveQueue(entry.player.id)}
                      startIcon={<RemoveIcon />}
                    >
                      Remove
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body1" color="text.secondary">
            {search.trim() ? 'No matching players in queue' : 'No players in queue'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search.trim() ? 'Try a different name or create a new player.' : 'Add players from the list below'}
          </Typography>
        </Paper>
      )}

      {search.trim() && filteredActiveNonQueue.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            ✅ Active Players ({filteredActiveNonQueue.length})
          </Typography>

          <Paper sx={{ mb: 3 }}>
            <List>
              {filteredActiveNonQueue.map((player, index) => {
                const category = getRatingCategory(player.rating);

                return (
                  <ListItem key={player.id} divider={index < filteredActiveNonQueue.length - 1}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="bold">
                            {player.name}
                          </Typography>
                          <Chip
                            label={category}
                            size="small"
                            sx={{
                              bgcolor: getRatingCategoryColor(category),
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                          <Chip
                            label={player.status}
                            size="small"
                            color={player.status === PlayerStatus.PLAYING ? 'warning' : 'default'}
                          />
                        </Box>
                      }
                      secondary={`Rating: ${player.rating} | Games: ${player.gamesPlayed}`}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </>
      )}

      {/* Inactive Players */}
      {inactivePlayers.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            😴 Inactive Players ({filteredInactive.length}/{inactivePlayers.length} not playing)
          </Typography>
          
          <Paper>
            <List>
              {filteredInactive.map((player) => {
                const category = getRatingCategory(player.rating);
                
                return (
                  <ListItem key={player.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {player.name}
                          </Typography>
                          <Chip
                            label={category}
                            size="small"
                            sx={{
                              bgcolor: getRatingCategoryColor(category),
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        </Box>
                      }
                      secondary={`Rating: ${player.rating} | Games: ${player.gamesPlayed}`}
                    />
                    
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleCheckIn(player.id)}
                        startIcon={<PlayIcon />}
                      >
                        Check In
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default QueueManager;