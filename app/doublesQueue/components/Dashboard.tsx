'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Group as GroupIcon,
  Timer as TimerIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useDoublesQueueStore } from '../useDoublesQueueStore';
import { PlayerStatus, CourtStatus, getRatingCategory, getRatingCategoryColor } from '../types';

const Dashboard: React.FC = () => {
  const {
    courts,
    queueEntries,
    nextMatches,
    currentSession,
    players,
    startGame,
    refreshQueue,
    completeGame,
    joinQueue
  } = useDoublesQueueStore();

  const activeCourts = courts.filter(c => c.status === CourtStatus.OCCUPIED);
  const availableCourts = courts.filter(c => c.status === CourtStatus.AVAILABLE);
  const playingPlayers = players.filter(p => p.status === PlayerStatus.PLAYING);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const handleStartMatch = (courtId: string, matchIndex: number) => {
    const match = nextMatches[matchIndex];
    if (match) {
      startGame(courtId, match);
    }
  };

  if (!currentSession.isActive) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          No active session
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start a session to begin managing games
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
      {/* Court Status */}
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🏟️ Courts Status
        <IconButton size="small" onClick={refreshQueue}>
          <RefreshIcon />
        </IconButton>
      </Typography>
      
      <Stack spacing={2} sx={{ mb: 3 }}>
        {courts.map((court) => (
          <Card 
            key={court.id}
            variant="outlined"
            sx={{ 
              borderColor: court.status === CourtStatus.OCCUPIED ? 'success.main' : 'grey.300',
              bgcolor: court.status === CourtStatus.OCCUPIED ? 'success.light' : 'background.paper'
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {court.name}
                </Typography>
                <Chip 
                  label={court.status}
                  color={court.status === CourtStatus.OCCUPIED ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              {court.currentGame && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Team 1:</strong> {court.currentGame.team1.player1.name} & {court.currentGame.team1.player2.name}
                    <br />
                    <strong>Team 2:</strong> {court.currentGame.team2.player1.name} & {court.currentGame.team2.player2.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Playing for {formatTime(court.currentGame.startTime)}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          if (!court.currentGame) return;
                          const game = court.currentGame;
                          completeGame(game.id, 1);
                          // rejoin players after completion
                          setTimeout(() => {
                            joinQueue(game.team1.player1.id);
                            joinQueue(game.team1.player2.id);
                            joinQueue(game.team2.player1.id);
                            joinQueue(game.team2.player2.id);
                          }, 100);
                        }}
                        fullWidth
                      >
                        Team 1 Wins
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => {
                          if (!court.currentGame) return;
                          const game = court.currentGame;
                          completeGame(game.id, 2);
                          setTimeout(() => {
                            joinQueue(game.team1.player1.id);
                            joinQueue(game.team1.player2.id);
                            joinQueue(game.team2.player1.id);
                            joinQueue(game.team2.player2.id);
                          }, 100);
                        }}
                        fullWidth
                      >
                        Team 2 Wins
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
              
              {court.status === CourtStatus.AVAILABLE && nextMatches.length > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlayIcon />}
                  onClick={() => handleStartMatch(court.id, 0)}
                  fullWidth
                >
                  Start Next Match
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Next Matches */}
      {nextMatches.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            ⏭️ Next Matches ({nextMatches.length} ready)
          </Typography>
          
          {nextMatches.map((match, index) => (
            <Card key={index} sx={{ mb: 2 }} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Paper sx={{ p: 1, bgcolor: 'primary.light', color: 'primary.contrastText', flex: 1 }}>
                    <Typography variant="subtitle2" align="center">Team 1</Typography>
                    <Typography variant="body2" align="center">
                      {match.teams[0].player1.name} ({match.teams[0].player1.rating})
                      <br />
                      {match.teams[0].player2.name} ({match.teams[0].player2.rating})
                    </Typography>
                    <Typography variant="caption" align="center" display="block">
                      Avg: {Math.round(match.teams[0].averageRating)}
                    </Typography>
                  </Paper>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
                    <Typography variant="h6">VS</Typography>
                  </Box>
                  
                  <Paper sx={{ p: 1, bgcolor: 'secondary.light', color: 'secondary.contrastText', flex: 1 }}>
                    <Typography variant="subtitle2" align="center">Team 2</Typography>
                    <Typography variant="body2" align="center">
                      {match.teams[1].player1.name} ({match.teams[1].player1.rating})
                      <br />
                      {match.teams[1].player2.name} ({match.teams[1].player2.rating})
                    </Typography>
                    <Typography variant="caption" align="center" display="block">
                      Avg: {Math.round(match.teams[1].averageRating)}
                    </Typography>
                  </Paper>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Chip 
                      label={`Rating diff: ${Math.round(match.ratingDifference)}`}
                      color={match.ratingDifference < 100 ? 'success' : match.ratingDifference < 200 ? 'warning' : 'error'}
                      size="small"
                    />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      Balance: {Math.round(match.balanceQuality)}%
                    </Typography>
                  </Box>
                  
                  {availableCourts.length > 0 && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleStartMatch(availableCourts[0].id, index)}
                      startIcon={<PlayIcon />}
                    >
                      Start Game
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Current Queue */}
      {queueEntries.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            ⏳ Queue ({queueEntries.length} waiting)
          </Typography>
          
          <List dense>
            {queueEntries.slice(0, 8).map((entry, index) => {
              const waitTime = entry.player.joinedQueueTime 
                ? formatTime(entry.player.joinedQueueTime)
                : '0m';
              const category = getRatingCategory(entry.player.rating);
              
              return (
                <ListItem
                  key={entry.player.id}
                  sx={{
                    bgcolor: index < 4 ? 'action.selected' : 'background.paper',
                    borderRadius: 1,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    pr: 1
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          #{index + 1} {entry.player.name}
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pr: 8 }}>
                        <span>Rating: {entry.player.rating}</span>
                        <span>Wait: {waitTime}</span>
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                    sx={{ pr: 8 }}
                  />
                  <Box sx={{ 
                    position: 'absolute', 
                    right: 16, 
                    display: 'flex', 
                    alignItems: 'center' 
                  }}>
                    <Typography variant="caption" color="primary" fontWeight="bold">
                      Priority: {Math.round(entry.priority)}
                    </Typography>
                  </Box>
                </ListItem>
              );
            })}
          </List>
          
          {queueEntries.length > 8 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              ... and {queueEntries.length - 8} more players waiting
            </Typography>
          )}
        </>
      )}

      {queueEntries.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <GroupIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            No players in queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add players and have them join the queue to start
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;