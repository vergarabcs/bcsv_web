'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  CheckCircle as WinIcon,
  Cancel as LoseIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useDoublesQueueStore } from '../useDoublesQueueStore';
import { GameStatus, CourtStatus } from '../types';

const GameResults: React.FC = () => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [winningTeam, setWinningTeam] = useState<'1' | '2' | null>(null);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [scores, setScores] = useState({
    set1Team1: '',
    set1Team2: '',
    set2Team1: '',
    set2Team2: '',
    set3Team1: '',
    set3Team2: ''
  });

  const {
    games,
    courts,
    completeGame,
    cancelGame,
    currentSession,
    joinQueue
  } = useDoublesQueueStore();

  const activeGames = games.filter(game => 
    game.status === GameStatus.IN_PROGRESS
  );

  const recentGames = games
    .filter(game => game.status === GameStatus.COMPLETED)
    .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0))
    .slice(0, 10);

  const handleCompleteGame = (gameId: string, team: 1 | 2) => {
    const game = activeGames.find(g => g.id === gameId);
    if (!game) return;

    // Complete the game first
    completeGame(gameId, team);
    
    // Automatically rejoin all players to the queue
    // Add a small delay to ensure the game completion is processed first
    setTimeout(() => {
      joinQueue(game.team1.player1.id);
      joinQueue(game.team1.player2.id);
      joinQueue(game.team2.player1.id);
      joinQueue(game.team2.player2.id);
    }, 100);
    
    setSelectedGameId(null);
    setWinningTeam(null);
  };

  const handleScoreEntry = () => {
    if (selectedGameId && winningTeam) {
      const scoreData = {
        team1Sets: 0,
        team2Sets: 0,
        sets: [
          {
            team1Points: parseInt(scores.set1Team1) || 0,
            team2Points: parseInt(scores.set1Team2) || 0
          }
        ]
      };

      // Simple win/loss determination from first set for now
      if (scoreData.sets[0].team1Points > scoreData.sets[0].team2Points) {
        scoreData.team1Sets = 1;
      } else {
        scoreData.team2Sets = 1;
      }

      completeGame(selectedGameId, parseInt(winningTeam) as 1 | 2, scoreData);
      
      // Reset form
      setSelectedGameId(null);
      setWinningTeam(null);
      setScoreDialogOpen(false);
      setScores({
        set1Team1: '',
        set1Team2: '',
        set2Team1: '',
        set2Team2: '',
        set3Team1: '',
        set3Team2: ''
      });
    }
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

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  if (!currentSession.isActive) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          No active session
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start a session to record game results
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
      {/* Active Games */}
      {activeGames.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            🏸 Active Games ({activeGames.length})
          </Typography>
          
          {activeGames.map((game) => {
            const court = courts.find(c => c.id === game.courtId);
            
            return (
              <Card key={game.id} sx={{ mb: 2 }} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {court?.name || `Court ${game.courtId}`}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimerIcon fontSize="small" />
                      <Typography variant="caption">
                        {formatTime(game.startTime)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Paper sx={{ p: 2, bgcolor: 'primary.light', flex: 1 }}>
                      <Typography variant="subtitle2" align="center" color="primary.contrastText">
                        Team 1
                      </Typography>
                      <Typography variant="body2" align="center" color="primary.contrastText">
                        {game.team1.player1.name} ({game.team1.player1.rating})
                        <br />
                        {game.team1.player2.name} ({game.team1.player2.rating})
                      </Typography>
                      <Typography variant="caption" align="center" display="block" color="primary.contrastText">
                        Avg: {Math.round(game.team1.averageRating)}
                      </Typography>
                    </Paper>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                      <Typography variant="h6">VS</Typography>
                    </Box>
                    
                    <Paper sx={{ p: 2, bgcolor: 'secondary.light', flex: 1 }}>
                      <Typography variant="subtitle2" align="center" color="secondary.contrastText">
                        Team 2
                      </Typography>
                      <Typography variant="body2" align="center" color="secondary.contrastText">
                        {game.team2.player1.name} ({game.team2.player1.rating})
                        <br />
                        {game.team2.player2.name} ({game.team2.player2.rating})
                      </Typography>
                      <Typography variant="caption" align="center" display="block" color="secondary.contrastText">
                        Avg: {Math.round(game.team2.averageRating)}
                      </Typography>
                    </Paper>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleCompleteGame(game.id, 1)}
                      startIcon={<WinIcon />}
                      fullWidth
                    >
                      Team 1 Wins
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => handleCompleteGame(game.id, 2)}
                      startIcon={<WinIcon />}
                      fullWidth
                    >
                      Team 2 Wins
                    </Button>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => cancelGame(game.id)}
                    size="small"
                    sx={{ mt: 1, width: '100%' }}
                  >
                    Cancel Game
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}

      {activeGames.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No games currently in progress. Start games from the Dashboard.
        </Alert>
      )}

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            📊 Recent Results ({recentGames.length})
          </Typography>
          
          <List>
            {recentGames.map((game) => {
              const court = courts.find(c => c.id === game.courtId);
              const winningTeamData = game.winner === 1 ? game.team1 : game.team2;
              const losingTeamData = game.winner === 1 ? game.team2 : game.team1;
              
              return (
                <ListItem key={game.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {court?.name || `Court ${game.courtId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {game.endTime ? formatDateTime(game.endTime) : 'Unknown time'}
                          </Typography>
                        </Box>
                        <Chip
                          label={`Team ${game.winner} Won`}
                          color="success"
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ mt: 1 }}>
                        <Box component="span" sx={{ display: 'block', fontSize: '0.875rem', color: 'success.main' }}>
                          <strong>Winners:</strong> {winningTeamData?.player1.name} & {winningTeamData?.player2.name}
                        </Box>
                        <Box component="span" sx={{ display: 'block', fontSize: '0.875rem', color: 'text.secondary' }}>
                          <strong>Runners-up:</strong> {losingTeamData?.player1.name} & {losingTeamData?.player2.name}
                        </Box>
                        {game.score && (
                          <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary' }}>
                            Score: {game.score.sets[0]?.team1Points}-{game.score.sets[0]?.team2Points}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </>
      )}

      {recentGames.length === 0 && activeGames.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body1" color="text.secondary">
            No games played yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Games will appear here once they are completed
          </Typography>
        </Paper>
      )}

      {/* Score Entry Dialog */}
      <Dialog
        open={scoreDialogOpen}
        onClose={() => setScoreDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enter Game Score</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Who won?
            </Typography>
            <RadioGroup
              value={winningTeam || ''}
              onChange={(e) => setWinningTeam(e.target.value as '1' | '2')}
            >
              <FormControlLabel value="1" control={<Radio />} label="Team 1" />
              <FormControlLabel value="2" control={<Radio />} label="Team 2" />
            </RadioGroup>
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>
            Set 1 Score
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Team 1"
              type="number"
              value={scores.set1Team1}
              onChange={(e) => setScores(prev => ({...prev, set1Team1: e.target.value}))}
              size="small"
            />
            <TextField
              label="Team 2"
              type="number"
              value={scores.set1Team2}
              onChange={(e) => setScores(prev => ({...prev, set1Team2: e.target.value}))}
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScoreDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleScoreEntry}
            variant="contained"
            disabled={!winningTeam}
          >
            Complete Game
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameResults;