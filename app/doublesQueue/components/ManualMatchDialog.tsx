import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper
} from '@mui/material';
import { useDoublesQueueStore } from '../useDoublesQueueStore';
import { MatchSuggestion, MatchTeam, Player } from '../types';

interface ManualMatchDialogProps {
  open: boolean;
  onClose: () => void;
}

const ManualMatchDialog: React.FC<ManualMatchDialogProps> = ({ open, onClose }) => {
  const { queueEntries, players, addManualMatch, manualMatches, currentSession } = useDoublesQueueStore();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const playersById = useMemo(
    () => new Map(players.map(player => [player.id, player])),
    [players]
  );

  const formatElapsed = (dateValue?: Date) => {
    if (!dateValue) return '-';

    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 60000));

    if (elapsedMinutes < 1) return '<1m';
    if (elapsedMinutes < 60) return `${elapsedMinutes}m`;

    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  };

  // Filter out players already in manual matches
  const availableQueueEntries = useMemo(() => {
    const manualMatchPlayerIds = new Set(
      manualMatches.flatMap(match => match.playerIds)
    );
    return queueEntries
      .filter(entry => !manualMatchPlayerIds.has(entry.playerId))
      .map(entry => {
        const player = playersById.get(entry.playerId);
        if (!player) {
          return null;
        }

        const gamesInSession = currentSession.gamesPlayed.get(player.id) ?? 0;
        const waitFrom = player.lastGameTime ?? player.joinedQueueTime;

        return {
          entry,
          player,
          gamesInSession,
          waitLabel: formatElapsed(waitFrom)
        };
      })
      .filter(
        (
          item
        ): item is {
          entry: typeof queueEntries[number];
          player: Player;
          gamesInSession: number;
          waitLabel: string;
        } => !!item
      );
  }, [currentSession.gamesPlayed, manualMatches, playersById, queueEntries]);

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
    <Dialog open={open} onClose={handleClose} fullScreen>
      <DialogTitle>Manually Create Match</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, pt: 0, pb: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select Players ({selectedPlayerIds.length}/4)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          First 2 selected = Team 1, next 2 selected = Team 2
        </Typography>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <TableContainer sx={{ height: '100%' }}>
            <Table stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '46%' }}>Name</TableCell>
                  <TableCell sx={{ width: '16%' }} align="right">Rating</TableCell>
                  <TableCell sx={{ width: '16%' }} align="right">Games</TableCell>
                  <TableCell sx={{ width: '22%' }} align="right">Wait</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedAvailableQueueEntries.map((entry) => {
                  const selectedIndex = selectedPlayerIds.indexOf(entry.player.id);
                  const isSelected = selectedIndex !== -1;
                  const isTeam1 = selectedIndex >= 0 && selectedIndex < 2;
                  const rowBg = isTeam1 ? 'primary.main' : 'secondary.main';
                  const rowBgHover = isTeam1 ? 'primary.dark' : 'secondary.dark';
                  const rowColor = isTeam1 ? 'primary.contrastText' : 'secondary.contrastText';

                  return (
                    <TableRow
                      key={entry.player.id}
                      hover
                      onClick={() => handleTogglePlayer(entry.player.id)}
                      sx={{
                        cursor: 'pointer',
                        '& > *': {
                          py: 0.25,
                          px: 1
                        },
                        ...(isSelected && {
                          bgcolor: rowBg,
                          '& > *': {
                            color: rowColor,
                            borderBottomColor: 'transparent'
                          },
                          '&:hover': {
                            bgcolor: rowBgHover
                          },
                          '&.MuiTableRow-hover:hover': {
                            bgcolor: rowBgHover
                          }
                        }),
                        ...(!isSelected && selectedPlayerIds.length >= 4 && {
                          opacity: 0.55
                        })
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.player.name}
                      </TableCell>
                      <TableCell align="right">{Math.round(entry.player.rating)}</TableCell>
                      <TableCell align="right">{entry.gamesInSession}</TableCell>
                      <TableCell align="right">{entry.waitLabel}</TableCell>
                    </TableRow>
                  );
                })}
                {availableQueueEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No available players in queue
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleCreateMatch} 
          variant="contained" 
          disabled={selectedPlayerIds.length !== 4}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManualMatchDialog;
