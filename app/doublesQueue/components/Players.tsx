'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as StableIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useDoublesQueueStore } from '../useDoublesQueueStore';
import { getRatingCategory, getRatingCategoryColor, GameStatus } from '../types';

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
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const Players: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const {
    players,
    games,
    currentSession
  } = useDoublesQueueStore();

  const completedGames = games.filter(g => g.status === GameStatus.COMPLETED);
  
  // Calculate session stats
  const sessionStats = {
    totalGames: currentSession.totalGames,
    averageRating: players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.rating, 0) / players.length) : 0,
    activePlayerCount: players.filter(p => p.gamesPlayed > 0).length,
    totalPlayers: players.length
  };

  // Sort players by different criteria
  const playersByRating = [...players].sort((a, b) => b.rating - a.rating);
  const playersByWins = [...players].sort((a, b) => b.wins - a.wins);
  const playersByWinRate = [...players]
    .filter(p => p.gamesPlayed > 0)
    .sort((a, b) => (b.wins / b.gamesPlayed) - (a.wins / a.gamesPlayed));
  const playersByGames = [...players].sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getWinRate = (player: any) => {
    if (player.gamesPlayed === 0) return 0;
    return Math.round((player.wins / player.gamesPlayed) * 100);
  };

  const getRatingTrend = (player: any) => {
    if (player.ratingHistory.length < 2) return 'stable';
    const recent = player.ratingHistory.slice(-5);
    const oldRating = recent[0].oldRating;
    const newRating = recent[recent.length - 1].newRating;
    
    if (newRating > oldRating + 20) return 'up';
    if (newRating < oldRating - 20) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon color="success" />;
      case 'down': return <TrendingDownIcon color="error" />;
      default: return <StableIcon color="action" />;
    }
  };

  const selectedPlayerData = selectedPlayer ? players.find(p => p.id === selectedPlayer) : null;

  return (
    <Box sx={{ 
      overflow: 'auto', 
      height: 'calc(100vh - 200px)', 
      maxHeight: 'calc(100vh - 200px)',
      pb: 12
    }}>
      {/* Session Overview */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          📈 Player Overview
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5">{sessionStats.totalGames}</Typography>
            <Typography variant="caption">Games</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5">{sessionStats.activePlayerCount}</Typography>
            <Typography variant="caption">Active Players</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5">{sessionStats.averageRating}</Typography>
            <Typography variant="caption">Avg Rating</Typography>
          </Box>
        </Box>
      </Box>

      {/* Player Tabs */}
      <Paper square>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Rankings" />
          <Tab label="Performance" />
          <Tab label="Details" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            🏆 Player Rankings
          </Typography>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {playersByRating.map((player, index) => {
                  const category = getRatingCategory(player.rating);
                  const trend = getRatingTrend(player);
                  
                  return (
                    <TableRow 
                      key={player.id}
                      hover
                      onClick={() => setSelectedPlayer(player.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {index < 3 && <TrophyIcon color={index === 0 ? 'warning' : 'action'} />}
                          #{index + 1}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {player.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {player.rating}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={category}
                          size="small"
                          sx={{
                            bgcolor: getRatingCategoryColor(category),
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {getTrendIcon(trend)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            📊 Performance Stats
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
              <Typography variant="h5" color="primary">
                {playersByWins[0]?.wins || 0}
              </Typography>
              <Typography variant="caption">Most Wins</Typography>
              <Typography variant="body2" fontWeight="bold">
                {playersByWins[0]?.name || 'N/A'}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
              <Typography variant="h5" color="success.main">
                {playersByWinRate[0] ? getWinRate(playersByWinRate[0]) : 0}%
              </Typography>
              <Typography variant="caption">Best Win Rate</Typography>
              <Typography variant="body2" fontWeight="bold">
                {playersByWinRate[0]?.name || 'N/A'}
              </Typography>
            </Paper>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Player</TableCell>
                  <TableCell>Games</TableCell>
                  <TableCell>Wins</TableCell>
                  <TableCell>Win Rate</TableCell>
                  <TableCell>Current Streak</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {playersByGames.map((player) => (
                  <TableRow 
                    key={player.id}
                    hover
                    onClick={() => setSelectedPlayer(player.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {player.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{player.gamesPlayed}</TableCell>
                    <TableCell>{player.wins}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getWinRate(player)}
                          sx={{ width: 50, height: 6 }}
                        />
                        <Typography variant="caption">
                          {getWinRate(player)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {player.currentStreak !== 0 && (
                        <Chip
                          label={`${Math.abs(player.currentStreak)} ${player.currentStreak > 0 ? 'W' : 'L'}`}
                          size="small"
                          color={player.currentStreak > 0 ? 'success' : 'error'}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            👤 Player Details
          </Typography>
          
          {players.length > 0 ? (
            <List>
              {players.map((player) => (
                <ListItem 
                  key={player.id} 
                  onClick={() => setSelectedPlayer(player.id)}
                  divider
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {player.name}
                        </Typography>
                        <Chip
                          label={getRatingCategory(player.rating)}
                          size="small"
                          sx={{
                            bgcolor: getRatingCategoryColor(getRatingCategory(player.rating)),
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Box component="span" sx={{ display: 'block', fontSize: '0.875rem' }}>
                          Rating: {player.rating} | Games: {player.gamesPlayed} | W/L: {player.wins}/{player.losses}
                        </Box>
                        {player.gamesPlayed > 0 && (
                          <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary' }}>
                            Win Rate: {getWinRate(player)}%
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <PersonIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No players added yet
              </Typography>
            </Paper>
          )}
        </Box>
      </TabPanel>

      {/* Player Detail Dialog */}
      <Dialog
        open={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedPlayerData?.name} - Player Details
        </DialogTitle>
        <DialogContent>
          {selectedPlayerData && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Overview</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                    <Typography variant="h5">{selectedPlayerData.rating}</Typography>
                    <Typography variant="caption">Current Rating</Typography>
                  </Paper>
                  <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                    <Typography variant="h5">{selectedPlayerData.gamesPlayed}</Typography>
                    <Typography variant="caption">Games Played</Typography>
                  </Paper>
                  <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                    <Typography variant="h5">{getWinRate(selectedPlayerData)}%</Typography>
                    <Typography variant="caption">Win Rate</Typography>
                  </Paper>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Recent Rating Changes</Typography>
              {selectedPlayerData.ratingHistory.length > 0 ? (
                <List dense>
                  {selectedPlayerData.ratingHistory.slice(-5).reverse().map((change, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">
                              {change.won ? '🏆 Win' : '❌ Loss'}
                            </Typography>
                            <Chip
                              label={`${change.change > 0 ? '+' : ''}${change.change}`}
                              size="small"
                              color={change.change > 0 ? 'success' : 'error'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box component="span" sx={{ fontSize: '0.75rem' }}>
                            {change.oldRating} → {change.newRating}
                            <br />
                            vs {change.opponent1} & {change.opponent2}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No games played yet
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPlayer(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Players;