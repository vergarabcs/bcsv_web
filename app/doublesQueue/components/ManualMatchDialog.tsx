import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import { SwapVert as SwapIcon } from '@mui/icons-material';
import { useDoublesQueueStore } from '../useDoublesQueueStore';
import { Player, MatchSuggestion, Team } from '../types';

interface ManualMatchDialogProps {
  open: boolean;
  onClose: () => void;
}

const ManualMatchDialog: React.FC<ManualMatchDialogProps> = ({ open, onClose }) => {
  const { queueEntries, addManualMatch, manualMatches } = useDoublesQueueStore();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [team1PlayerIds, setTeam1PlayerIds] = useState<string[]>([]);

  // Filter out players already in manual matches
  const availableQueueEntries = useMemo(() => {
    const manualMatchPlayerIds = new Set(
      manualMatches.flatMap(m => m.players.map(p => p.id))
    );
    return queueEntries.filter(e => !manualMatchPlayerIds.has(e.player.id));
  }, [queueEntries, manualMatches]);

  const sortedAvailableQueueEntries = useMemo(
    () =>
      [...availableQueueEntries].sort((a, b) =>
        a.player.name.localeCompare(b.player.name, undefined, { sensitivity: 'base' })
      ),
    [availableQueueEntries]
  );

  const handleTogglePlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(prev => prev.filter(id => id !== playerId));
      setTeam1PlayerIds(prev => prev.filter(id => id !== playerId));
    } else {
      if (selectedPlayerIds.length < 4) {
        setSelectedPlayerIds(prev => [...prev, playerId]);
        // Auto-assign to team 1 if it has space
        if (team1PlayerIds.length < 2) {
          setTeam1PlayerIds(prev => [...prev, playerId]);
        }
      }
    }
  };

  const handleToggleTeam = (playerId: string) => {
    if (team1PlayerIds.includes(playerId)) {
      setTeam1PlayerIds(prev => prev.filter(id => id !== playerId));
    } else {
      if (team1PlayerIds.length < 2) {
        setTeam1PlayerIds(prev => [...prev, playerId]);
      }
    }
  };

  const handleCreateMatch = () => {
    if (selectedPlayerIds.length !== 4) return;

    const selectedPlayers = selectedPlayerIds
      .map(id => availableQueueEntries.find(e => e.player.id === id)?.player)
      .filter((p): p is Player => !!p);

    if (selectedPlayers.length !== 4) return;

    const team1Players = selectedPlayers.filter(p => team1PlayerIds.includes(p.id));
    const team2Players = selectedPlayers.filter(p => !team1PlayerIds.includes(p.id));

    if (team1Players.length !== 2 || team2Players.length !== 2) return;

    const team1: Team = {
      player1: team1Players[0],
      player2: team1Players[1],
      averageRating: (team1Players[0].rating + team1Players[1].rating) / 2
    };

    const team2: Team = {
      player1: team2Players[0],
      player2: team2Players[1],
      averageRating: (team2Players[0].rating + team2Players[1].rating) / 2
    };

    const ratingDifference = Math.abs(team1.averageRating - team2.averageRating);
    const balanceQuality = Math.max(0, 100 - ratingDifference);
    
    // Calculate total priority (simplified)
    const totalPriority = 0; // We don't really care about priority for manual matches

    const match: MatchSuggestion = {
      players: [team1.player1, team1.player2, team2.player1, team2.player2],
      teams: [team1, team2],
      balanceQuality,
      totalPriority,
      ratingDifference
    };

    addManualMatch(match);
    handleClose();
  };

  const handleClose = () => {
    setSelectedPlayerIds([]);
    setTeam1PlayerIds([]);
    onClose();
  };

  const selectedPlayers = selectedPlayerIds
    .map(id => availableQueueEntries.find(e => e.player.id === id)?.player)
    .filter((p): p is Player => !!p);

  const team1Players = selectedPlayers.filter(p => team1PlayerIds.includes(p.id));
  const team2Players = selectedPlayers.filter(p => !team1PlayerIds.includes(p.id));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Manual Match</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Players ({selectedPlayerIds.length}/4)
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List dense>
                {sortedAvailableQueueEntries.map((entry) => (
                  <ListItem
                    key={entry.player.id}
                    disablePadding
                  >
                    <ListItemButton
                      onClick={() => handleTogglePlayer(entry.player.id)}
                      disabled={!selectedPlayerIds.includes(entry.player.id) && selectedPlayerIds.length >= 4}
                    >
                      <Checkbox
                        edge="start"
                        checked={selectedPlayerIds.includes(entry.player.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText 
                        primary={entry.player.name} 
                        secondary={`Rating: ${entry.player.rating}`} 
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {availableQueueEntries.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No available players in queue" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" gutterBottom>
              Arrange Teams
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="subtitle2">Team 1</Typography>
                {team1Players.length === 0 && <Typography variant="body2" sx={{ opacity: 0.7 }}>Select players...</Typography>}
                {team1Players.map(p => (
                  <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2">{p.name} ({p.rating})</Typography>
                    <IconButton size="small" onClick={() => handleToggleTeam(p.id)} sx={{ color: 'inherit' }}>
                      <SwapIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                {team1Players.length === 2 && (
                   <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                     Avg: {Math.round((team1Players[0].rating + team1Players[1].rating) / 2)}
                   </Typography>
                )}
              </Paper>

              <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                <Typography variant="subtitle2">Team 2</Typography>
                {team2Players.length === 0 && <Typography variant="body2" sx={{ opacity: 0.7 }}>Select players...</Typography>}
                {team2Players.map(p => (
                  <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2">{p.name} ({p.rating})</Typography>
                    <IconButton size="small" onClick={() => handleToggleTeam(p.id)} sx={{ color: 'inherit' }}>
                      <SwapIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                {team2Players.length === 2 && (
                   <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                     Avg: {Math.round((team2Players[0].rating + team2Players[1].rating) / 2)}
                   </Typography>
                )}
              </Paper>

              {selectedPlayers.length === 4 && team1Players.length === 2 && team2Players.length === 2 && (
                <Box sx={{ textAlign: 'center' }}>
                  <Chip 
                    label={`Rating Diff: ${Math.abs(
                      Math.round((team1Players[0].rating + team1Players[1].rating) / 2) - 
                      Math.round((team2Players[0].rating + team2Players[1].rating) / 2)
                    )}`}
                    color="default"
                  />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleCreateMatch} 
          variant="contained" 
          disabled={selectedPlayerIds.length !== 4 || team1Players.length !== 2 || team2Players.length !== 2}
        >
          Create Match
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManualMatchDialog;
