import React, { useState, useMemo } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Chip,
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
import { useCurrentMinute } from '../hooks/useCurrentMinute';
import { CourtStatus, MatchSuggestion, MatchTeam, Player, PlayerStatus } from '../types';
import { derivePartnershipHistoryFromGames, getMostRecentPlayerActivityTime } from '../storeHelpers';

interface ManualMatchDialogProps {
  open: boolean;
  onClose: () => void;
}

const ManualMatchDialog: React.FC<ManualMatchDialogProps> = ({ open, onClose }) => {
  const {
    queueEntries,
    players,
    courts,
    addManualMatch,
    startGame,
    manualMatches,
    currentSession,
    queueManager,
    games
  } = useDoublesQueueStore();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const now = useCurrentMinute();
  const playersById = useMemo(
    () => new Map(players.map(player => [player.id, player])),
    [players]
  );
  const queueEntryByPlayerId = useMemo(
    () => new Map(queueEntries.map((entry, index) => [entry.playerId, { entry, index }])),
    [queueEntries]
  );
  const partnershipHistory = useMemo(
    () => derivePartnershipHistoryFromGames(games),
    [games]
  );
  const manualMatchPlayerIds = useMemo(
    () => new Set(manualMatches.flatMap(match => match.playerIds)),
    [manualMatches]
  );

  const formatElapsed = (dateValue?: Date) => {
    if (!dateValue) return '-';

    const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - new Date(dateValue).getTime()) / 60000));

    if (elapsedMinutes < 1) return '<1m';
    if (elapsedMinutes < 60) return `${elapsedMinutes}m`;

    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  };

  const eligibleFillEntries = useMemo(
    () => queueEntries.filter(entry => !manualMatchPlayerIds.has(entry.playerId)),
    [manualMatchPlayerIds, queueEntries]
  );

  const availablePlayers = useMemo(
    () =>
      players
        .filter(player => player.status !== PlayerStatus.INACTIVE)
        .map(player => {
          const gamesInSession = currentSession.gamesPlayed.get(player.id) ?? 0;
          const waitFrom = getMostRecentPlayerActivityTime(player);

          return {
            player,
            queueInfo: queueEntryByPlayerId.get(player.id),
            gamesInSession,
            waitLabel: formatElapsed(waitFrom),
            isInGame: player.status === PlayerStatus.PLAYING,
            isOnCreatedMatch: manualMatchPlayerIds.has(player.id),
          };
        }),
    [currentSession.gamesPlayed, manualMatchPlayerIds, now, players, queueEntryByPlayerId]
  );

  const sortedAvailablePlayers = useMemo(
    () =>
      [...availablePlayers].sort((a, b) =>
        a.player.name.localeCompare(b.player.name, undefined, { sensitivity: 'base' })
      ),
    [availablePlayers]
  );

  const availableCourt = useMemo(
    () => courts.find(court => court.status === CourtStatus.AVAILABLE),
    [courts]
  );
  const fillMatch = useMemo(() => {
    if (selectedPlayerIds.length === 0 || selectedPlayerIds.length >= 4) {
      return null;
    }

    return queueManager.findBestMatch(
      eligibleFillEntries,
      players,
      partnershipHistory,
      selectedPlayerIds
    );
  }, [eligibleFillEntries, partnershipHistory, players, queueManager, selectedPlayerIds]);

  const selectedPlayers = useMemo(
    () => selectedPlayerIds.map(playerId => playersById.get(playerId)).filter((player): player is Player => !!player),
    [playersById, selectedPlayerIds]
  );
  const hasSelectedInGamePlayer = selectedPlayers.some(player => player.status === PlayerStatus.PLAYING);

  const handleTogglePlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(prev => prev.filter(id => id !== playerId));
    } else {
      if (selectedPlayerIds.length < 4) {
        setSelectedPlayerIds(prev => [...prev, playerId]);
      }
    }
  };

  const buildMatchFromSelection = (): MatchSuggestion | null => {
    if (selectedPlayerIds.length !== 4) return null;

    const selectedPlayers = selectedPlayerIds
      .map(id => playersById.get(id))
      .filter((p): p is Player => !!p);

    if (selectedPlayers.length !== 4) return null;

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

    return {
      playerIds: [team1.player1Id, team1.player2Id, team2.player1Id, team2.player2Id],
      teams: [team1, team2],
      balanceQuality,
      totalPriority,
      ratingDifference
    };
  };

  const handleCreateMatch = () => {
    const match = buildMatchFromSelection();
    if (!match) return;

    addManualMatch(match);
    handleClose();
  };

  const handleCreateAndStartMatch = () => {
    if (!availableCourt) return;

    const match = buildMatchFromSelection();
    if (!match) return;

    addManualMatch(match);
    startGame(availableCourt.id, match);
    handleClose();
  };

  const handleFill = () => {
    if (!fillMatch) {
      return;
    }

    setSelectedPlayerIds(fillMatch.playerIds);
  };

  const handleClose = () => {
    setSelectedPlayerIds([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullScreen>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, pt: 0, pb: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select Players ({selectedPlayerIds.length}/4)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          First 2 selected = Team 1, next 2 selected = Team 2
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Fill keeps your selected players in the match and uses the automatic algorithm to complete the lineup.
        </Typography>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <TableContainer sx={{ height: '100%' }}>
            <Table stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '50%' }}>Name</TableCell>
                  <TableCell sx={{ width: '16%' }} align="right">Rating</TableCell>
                  <TableCell sx={{ width: '14%' }} align="right">Games</TableCell>
                  <TableCell sx={{ width: '20%' }} align="right">Wait</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedAvailablePlayers.map((entry) => {
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
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flexWrap: 'wrap' }}>
                          <Box component="span" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                            {entry.player.name}
                          </Box>
                          {entry.isInGame && (
                            <Chip label="In Game" size="small" color="warning" sx={{ height: 18 }} />
                          )}
                          {entry.isOnCreatedMatch && (
                            <Chip label="Created Match" size="small" variant="outlined" sx={{ height: 18 }} />
                          )}
                          {!entry.queueInfo && !entry.isInGame && (
                            <Chip label={entry.player.status} size="small" variant="outlined" sx={{ height: 18, textTransform: 'capitalize' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{Math.round(entry.player.rating)}</TableCell>
                      <TableCell align="right">{entry.gamesInSession}</TableCell>
                      <TableCell align="right">{entry.waitLabel}</TableCell>
                    </TableRow>
                  );
                })}
                {availablePlayers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No checked-in players available
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
        <Button onClick={handleFill} variant="outlined" disabled={!fillMatch}>
          Fill
        </Button>
        <Button
          onClick={handleCreateAndStartMatch}
          variant="contained"
          color="secondary"
          disabled={selectedPlayerIds.length !== 4 || !availableCourt || hasSelectedInGamePlayer}
        >
          Create & Start
        </Button>
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
