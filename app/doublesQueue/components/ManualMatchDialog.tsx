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
  Typography,
  Grid,
  Paper
} from '@mui/material';
import { useDoublesQueueStore } from '../useDoublesQueueStore';
import { MatchSuggestion, MatchTeam, Player } from '../types';

interface ManualMatchDialogProps {
  open: boolean;
  onClose: () => void;
}

const ManualMatchDialog: React.FC<ManualMatchDialogProps> = ({ open, onClose }) => {
  const { queueEntries, players, addManualMatch, manualMatches } = useDoublesQueueStore();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const playersById = useMemo(
    () => new Map(players.map(player => [player.id, player])),
    [players]
  );

  // Filter out players already in manual matches
  const availableQueueEntries = useMemo(() => {
    const manualMatchPlayerIds = new Set(
      manualMatches.flatMap(match => match.playerIds)
    );
    return queueEntries
      .filter(entry => !manualMatchPlayerIds.has(entry.playerId))
      .map(entry => {
        const player = playersById.get(entry.playerId);
        return player ? { entry, player } : null;
      })
      .filter((item): item is { entry: typeof queueEntries[number]; player: Player } => !!item);
  }, [manualMatches, playersById, queueEntries]);

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
    } else {
      if (selectedPlayerIds.length < 4) {
        setSelectedPlayerIds(prev => [...prev, playerId]);
      }
    }
  };

  const handleCreateMatch = () => {
    if (selectedPlayerIds.length !== 4) return;

    const selectedPlayers = selectedPlayerIds
      .map(id => playersById.get(id))
      .filter((p): p is Player => !!p);

    if (selectedPlayers.length !== 4) return;

    const team1Players = [selectedPlayers[0], selectedPlayers[1]];
    const team2Players = [selectedPlayers[2], selectedPlayers[3]];

    const team1: MatchTeam = {
      player1Id: team1Players[0].id,
      player2Id: team1Players[1].id,
      averageRating: (team1Players[0].rating + team1Players[1].rating) / 2
    };

    const team2: MatchTeam = {
      player1Id: team2Players[0].id,
      player2Id: team2Players[1].id,
      averageRating: (team2Players[0].rating + team2Players[1].rating) / 2
    };

    const ratingDifference = Math.abs(team1.averageRating - team2.averageRating);
    const balanceQuality = Math.max(0, 100 - ratingDifference);
    
    // Calculate total priority (simplified)
    const totalPriority = 0; // We don't really care about priority for manual matches

    const match: MatchSuggestion = {
      playerIds: [team1.player1Id, team1.player2Id, team2.player1Id, team2.player2Id],
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
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Manual Match</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Typography variant="subtitle1" gutterBottom>
              Select Players ({selectedPlayerIds.length}/4)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              First 2 selected = Team 1, next 2 selected = Team 2
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: { xs: 520, md: 640 }, overflow: 'auto', p: 0.5 }}>
              <List
                dense
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 0.5,
                  py: 0
                }}
              >
                {sortedAvailableQueueEntries.map((entry) => (
                  (() => {
                    const selectedIndex = selectedPlayerIds.indexOf(entry.player.id);
                    const isSelected = selectedIndex !== -1;
                    const isTeam1 = selectedIndex >= 0 && selectedIndex < 2;
                    const isTeam2 = selectedIndex >= 2;

                    return (
                  <ListItem
                    key={entry.player.id}
                    disablePadding
                    sx={{ width: '100%' }}
                  >
                    <ListItemButton
                      onClick={() => handleTogglePlayer(entry.player.id)}
                      selected={isSelected}
                      disabled={!isSelected && selectedPlayerIds.length >= 4}
                      sx={{
                        borderRadius: 1,
                        px: 1,
                        py: 0.25,
                        minHeight: 32,
                        '&.Mui-selected': {
                          bgcolor: isTeam1 ? 'primary.main' : isTeam2 ? 'secondary.main' : 'action.selected',
                          color: isTeam1
                            ? 'primary.contrastText'
                            : isTeam2
                              ? 'secondary.contrastText'
                              : 'text.primary'
                        },
                        '&.Mui-selected:hover': {
                          bgcolor: isTeam1 ? 'primary.dark' : isTeam2 ? 'secondary.dark' : 'action.hover'
                        }
                      }}
                    >
                      <ListItemText 
                        primary={`${entry.player.name} (${entry.player.rating})`}
                        secondary={
                          isTeam1
                            ? 'Team 1'
                            : isTeam2
                              ? 'Team 2'
                              : undefined
                        }
                        primaryTypographyProps={{ noWrap: true, variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                    );
                  })()
                ))}
                {availableQueueEntries.length === 0 && (
                  <ListItem sx={{ gridColumn: '1 / -1' }}>
                    <ListItemText primary="No available players in queue" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleCreateMatch} 
          variant="contained" 
          disabled={selectedPlayerIds.length !== 4}
        >
          Create Match
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManualMatchDialog;
