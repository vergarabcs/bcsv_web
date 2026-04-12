'use client';

import React, { useMemo, useState } from 'react';
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
  LinearProgress
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useDoublesQueueStore } from '../useDoublesQueueStore';
import { useCurrentMinute } from '../hooks/useCurrentMinute';
import { Court, CourtStatus, getRatingCategory, getRatingCategoryColor } from '../types';
import { formatDurationMs, getMostRecentPlayerActivityTime } from '../storeHelpers';
import ManualMatchDialog from './ManualMatchDialog';
import BadmintonCard from './BadmintonCard';

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

  const [manualMatchOpen, setManualMatchOpen] = useState(false);
  const now = useCurrentMinute();
  const playersById = useMemo(
    () => new Map(players.map(player => [player.id, player])),
    [players]
  );
  const resolvedNextMatches = useMemo(
    () =>
      nextMatches
        .map(match => {
          const team1Player1 = playersById.get(match.teams[0].player1Id);
          const team1Player2 = playersById.get(match.teams[0].player2Id);
          const team2Player1 = playersById.get(match.teams[1].player1Id);
          const team2Player2 = playersById.get(match.teams[1].player2Id);

          if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
            return null;
          }

          return {
            match,
            teams: [
              {
                player1: team1Player1,
                player2: team1Player2,
                averageRating: match.teams[0].averageRating
              },
              {
                player1: team2Player1,
                player2: team2Player2,
                averageRating: match.teams[1].averageRating
              }
            ] as const
          };
        })
        .filter(
          (item): item is {
            match: typeof nextMatches[number];
            teams: [
              { player1: typeof players[number]; player2: typeof players[number]; averageRating: number },
              { player1: typeof players[number]; player2: typeof players[number]; averageRating: number }
            ];
          } => !!item
        ),
    [nextMatches, playersById]
  );
  const resolvedQueueEntries = useMemo(
    () =>
      queueEntries
        .map(entry => {
          const player = playersById.get(entry.playerId);
          return player ? { entry, player } : null;
        })
        .filter((item): item is { entry: typeof queueEntries[number]; player: typeof players[number] } => !!item),
    [playersById, queueEntries]
  );

  const availableCourts = courts.filter(c => c.status === CourtStatus.AVAILABLE);

  const formatTime = (date: Date) => {
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

  const handleWin = (court: Court, winner: 1 | 2) => {
    if (!court.currentGame) {
      return;
    }

    const game = court.currentGame;
    completeGame(game.id, winner);

    // Rejoin all players to queue after completion is processed.
    setTimeout(() => {
      joinQueue(game.team1.player1.id);
      joinQueue(game.team1.player2.id);
      joinQueue(game.team2.player1.id);
      joinQueue(game.team2.player2.id);
    }, 100);
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
      
      <Box
        sx={{
          mb: 3,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2
        }}
      >
        {courts.map((court) => (
          <BadmintonCard
            key={court.id}
            court={court}
            formatTime={formatTime}
            onWin={(winner) => handleWin(court, winner)}
            orientation="vertical"
          />
        ))}
      </Box>

      {/* Next Matches */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, mt: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          ⏭️ Suggested Matches ({resolvedNextMatches.length} ready)
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={<AddIcon />}
          onClick={() => setManualMatchOpen(true)}
        >
          Manual
        </Button>
      </Box>

      {resolvedNextMatches.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
          No matches scheduled. Wait for players or create a manual match.
        </Typography>
      )}
          
      {resolvedNextMatches.map(({ match, teams }, index) => (
            <Card key={index} sx={{ mb: 2 }} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Paper sx={{ p: 1, bgcolor: 'primary.light', color: 'primary.contrastText', flex: 1 }}>
                    <Typography variant="subtitle2" align="center">Team 1</Typography>
                    <Typography variant="body2" align="center">
                      {teams[0].player1.name} ({teams[0].player1.rating})
                      <br />
                      {teams[0].player2.name} ({teams[0].player2.rating})
                    </Typography>
                    <Typography variant="caption" align="center" display="block">
                      Avg: {Math.round(teams[0].averageRating)}
                    </Typography>
                  </Paper>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
                    <Typography variant="h6">VS</Typography>
                  </Box>
                  
                  <Paper sx={{ p: 1, bgcolor: 'secondary.light', color: 'secondary.contrastText', flex: 1 }}>
                    <Typography variant="subtitle2" align="center">Team 2</Typography>
                    <Typography variant="body2" align="center">
                      {teams[1].player1.name} ({teams[1].player1.rating})
                      <br />
                      {teams[1].player2.name} ({teams[1].player2.rating})
                    </Typography>
                    <Typography variant="caption" align="center" display="block">
                      Avg: {Math.round(teams[1].averageRating)}
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

      {/* Current Queue */}
      {resolvedQueueEntries.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            ⏳ Queue ({resolvedQueueEntries.length} waiting)
          </Typography>
          
          <List dense>
            {resolvedQueueEntries.map(({ entry, player }, index) => {
              const waitFrom = getMostRecentPlayerActivityTime(player);
              const waitTime = waitFrom
                ? formatTime(waitFrom)
                : '0m';
              const sessionGamesPlayed = currentSession.gamesPlayed.get(player.id) ?? 0;
              const sessionGameDuration = currentSession.gameDurationByPlayerMs.get(player.id) ?? 0;
              const currentWaitDurationMs = waitFrom
                ? Math.max(0, now.getTime() - waitFrom.getTime())
                : 0;
              const totalWaitDurationMs = (currentSession.waitDurationByPlayerMs.get(player.id) ?? 0) + currentWaitDurationMs;
              const category = getRatingCategory(player.rating);
              
              return (
                <ListItem
                  key={player.id}
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
                          #{index + 1} {player.name}
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
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, pr: 8 }}>
                        <span>Rating: {player.rating}</span>
                        <span>Games: {sessionGamesPlayed}</span>
                        <span>Time: {formatDurationMs(sessionGameDuration)}</span>
                        <span>Total Wait: {formatDurationMs(totalWaitDurationMs)}</span>
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
          
          {/* Showing all players in queue */}
        </>
      )}

      {resolvedQueueEntries.length === 0 && (
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

      <ManualMatchDialog 
        open={manualMatchOpen} 
        onClose={() => setManualMatchOpen(false)} 
      />
    </Box>
  );
};

export default Dashboard;