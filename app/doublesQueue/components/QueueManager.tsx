'use client';

import React from 'react';
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
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { useDoublesQueueStore } from '../useDoublesQueueStore';
import { PlayerStatus, getRatingCategory, getRatingCategoryColor } from '../types';

const QueueManager: React.FC = () => {
  const {
    players,
    queueEntries,
    currentSession,
    joinQueue,
    leaveQueue,
    updatePlayerStatus,
    refreshQueue
  } = useDoublesQueueStore();

  const inactivePlayers = players.filter(p => p.status === PlayerStatus.INACTIVE);
  const activePlayers = players.filter(p => p.status !== PlayerStatus.INACTIVE);

  const handleJoinQueue = (playerId: string) => {
    joinQueue(playerId);
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
        {/* Queue Status */}
        <Typography variant="h6" gutterBottom>
          🎯 Current Queue ({queueEntries.length} players)
        </Typography>      {queueEntries.length > 0 ? (
        <Paper sx={{ mb: 3 }}>
          <List>
            {queueEntries.map((entry, index) => {
              const waitTime = entry.player.joinedQueueTime 
                ? formatTime(entry.player.joinedQueueTime)
                : '0m';
              const category = getRatingCategory(entry.player.rating);
              
              return (
                <ListItem
                  key={entry.player.id}
                  divider={index < queueEntries.length - 1}
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
            No players in queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add players from the list below
          </Typography>
        </Paper>
      )}

      {/* Available Players */}
      <Typography variant="h6" gutterBottom>
        👥 Available Players ({activePlayers.length} active)
      </Typography>

      {activePlayers.length > 0 ? (
        <Paper sx={{ mb: 3 }}>
          <List>
            {activePlayers.map((player) => {
              const category = getRatingCategory(player.rating);
              const isWaiting = player.status === PlayerStatus.WAITING;
              const isPlaying = player.status === PlayerStatus.PLAYING;
              
              return (
                <ListItem 
                  key={player.id} 
                  divider
                  sx={{
                    bgcolor: isPlaying ? 'success.light' : 
                            isWaiting ? 'primary.light' : 'background.paper'
                  }}
                >
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
                          color={
                            isPlaying ? 'success' :
                            isWaiting ? 'primary' : 'default'
                          }
                        />
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Box component="span" sx={{ display: 'block', fontSize: '0.875rem' }}>
                          Rating: {player.rating} | Games: {player.gamesPlayed} | W/L: {player.wins}/{player.losses}
                        </Box>
                        {player.currentStreak !== 0 && (
                          <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: player.currentStreak > 0 ? 'success.main' : 'error.main' }}>
                            {player.currentStreak > 0 ? `${player.currentStreak} wins` : `${Math.abs(player.currentStreak)} losses`} streak
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    {!isPlaying && (
                      <Button
                        variant={isWaiting ? "outlined" : "contained"}
                        size="small"
                        onClick={() => isWaiting ? handleLeaveQueue(player.id) : handleJoinQueue(player.id)}
                        startIcon={isWaiting ? <RemoveIcon /> : <AddIcon />}
                      >
                        {isWaiting ? 'Remove' : 'Add to Queue'}
                      </Button>
                    )}
                    {isPlaying && (
                      <Chip label="Playing" color="success" size="small" />
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body1" color="text.secondary">
            No active players
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Players need to check in for the session first
          </Typography>
        </Paper>
      )}

      {/* Inactive Players */}
      {inactivePlayers.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            😴 Inactive Players ({inactivePlayers.length} not playing)
          </Typography>
          
          <Paper>
            <List>
              {inactivePlayers.map((player) => {
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
                        onClick={() => handleJoinQueue(player.id)}
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