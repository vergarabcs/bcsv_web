'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Court, CourtStatus } from '../types';

interface BadmintonCardProps {
  court: Court;
  formatTime: (date: Date) => string;
  onWin: (winner: 1 | 2) => void;
}

const DIMENSIONS = {
  length: 13.4,
  width: 6.1,
  singlesWidth: 5.18,
  lineWidth: 0.04,
  // serviceDistance is distance from net to service area
  serviceDistance: 1.98
}

// Calculate percentages based on court dimensions
const COURT_ASPECT = DIMENSIONS.length / DIMENSIONS.width;
const NET_POSITION = 50; // Center
const SERVICE_LINE_PCT = (DIMENSIONS.serviceDistance / (DIMENSIONS.length / 2)) * 100 / 2;
const SINGLES_SIDELINE_PCT = ((DIMENSIONS.width - DIMENSIONS.singlesWidth) / 2) / DIMENSIONS.width * 100;

const BadmintonCard: React.FC<BadmintonCardProps> = ({ court, formatTime, onWin }) => {
  const game = court.currentGame;

  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: '#3f9f46',
        borderRadius: 1.5,
        aspectRatio: `${COURT_ASPECT} / 1`,
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Court header info */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          p: 1,
          zIndex: 10,
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.8)'
        }}
      >
        {court.name} • {game ? `Playing ${formatTime(game.startTime)}` : 'Available'}
      </Box>

      {/* Badminton court lines - drawn on green surface */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {/* Outer boundary */}
        <Box
          sx={{
            position: 'absolute',
            inset: `${(DIMENSIONS.serviceDistance / DIMENSIONS.length) * 50}% 0%`,
            border: '2px solid rgba(255, 255, 255, 0.95)',
            borderRadius: 0.5
          }}
        />
        {/* Center net line (vertical) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: 1,
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(255, 255, 255, 0.95)'
          }}
        />
        {/* Service lines (horizontal) */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${50 - SERVICE_LINE_PCT}%`,
            height: 1,
            bgcolor: 'rgba(255, 255, 255, 0.8)'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${50 + SERVICE_LINE_PCT}%`,
            height: 1,
            bgcolor: 'rgba(255, 255, 255, 0.8)'
          }}
        />
        {/* Singles sidelines (vertical) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${SINGLES_SIDELINE_PCT}%`,
            width: 1,
            bgcolor: 'rgba(255, 255, 255, 0.6)'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: `${SINGLES_SIDELINE_PCT}%`,
            width: 1,
            bgcolor: 'rgba(255, 255, 255, 0.6)'
          }}
        />
      </Box>

      {/* Team info and controls - overlaid on court */}
      {game ? (
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            height: '100%',
            p: { xs: 1, sm: 1.5 }
          }}
        >
          <Box
            sx={{
              color: 'common.white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                Team 1
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {game.team1.player1.name}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 1 }}>
                {game.team1.player2.name}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onWin(1)}
              fullWidth
              size="small"
              sx={{ fontSize: '0.7rem' }}
            >
              Win
            </Button>
          </Box>

          <Box
            sx={{
              color: 'common.white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                Team 2
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {game.team2.player1.name}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 1 }}>
                {game.team2.player2.name}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => onWin(2)}
              fullWidth
              size="small"
              sx={{ fontSize: '0.7rem' }}
            >
              Win
            </Button>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}
        >
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            Waiting for next match
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BadmintonCard;