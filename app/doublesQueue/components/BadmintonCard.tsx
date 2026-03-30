'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Court } from '../types';

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
  serviceDistance: 1.98,
  // longServiceLine is the distance between the back of the court and the back service boundary.
  longServiceLine: 0.76
}

// Calculate geometry from court dimensions
const COURT_ASPECT = DIMENSIONS.length / DIMENSIONS.width;
const HALF_COURT = DIMENSIONS.length / 2;
const MID_WIDTH = DIMENSIONS.width / 2;
const SINGLES_MARGIN = (DIMENSIONS.width - DIMENSIONS.singlesWidth) / 2;
const LEFT_SHORT_SERVICE_X = HALF_COURT - DIMENSIONS.serviceDistance;
const RIGHT_SHORT_SERVICE_X = HALF_COURT + DIMENSIONS.serviceDistance;
const LEFT_LONG_SERVICE_X = DIMENSIONS.longServiceLine;
const RIGHT_LONG_SERVICE_X = DIMENSIONS.length - DIMENSIONS.longServiceLine;

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

      {/* SVG overlay for crisp, scalable court lines */}
      <Box
        component="svg"
        viewBox={`0 0 ${DIMENSIONS.length} ${DIMENSIONS.width}`}
        preserveAspectRatio="none"
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        <rect
          x={DIMENSIONS.lineWidth / 2}
          y={DIMENSIONS.lineWidth / 2}
          width={DIMENSIONS.length - DIMENSIONS.lineWidth}
          height={DIMENSIONS.width - DIMENSIONS.lineWidth}
          fill="none"
          stroke="rgba(255, 255, 255, 0.95)"
          strokeWidth={DIMENSIONS.lineWidth}
        />

        <line
          x1={HALF_COURT}
          y1={0}
          x2={HALF_COURT}
          y2={DIMENSIONS.width}
          stroke="rgba(255, 255, 255, 0.95)"
          strokeWidth={DIMENSIONS.lineWidth}
        />

        <line
          x1={LEFT_SHORT_SERVICE_X}
          y1={0}
          x2={LEFT_SHORT_SERVICE_X}
          y2={DIMENSIONS.width}
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth={DIMENSIONS.lineWidth}
        />
        <line
          x1={RIGHT_SHORT_SERVICE_X}
          y1={0}
          x2={RIGHT_SHORT_SERVICE_X}
          y2={DIMENSIONS.width}
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth={DIMENSIONS.lineWidth}
        />

        <line
          x1={LEFT_LONG_SERVICE_X}
          y1={0}
          x2={LEFT_LONG_SERVICE_X}
          y2={DIMENSIONS.width}
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth={DIMENSIONS.lineWidth}
        />
        <line
          x1={RIGHT_LONG_SERVICE_X}
          y1={0}
          x2={RIGHT_LONG_SERVICE_X}
          y2={DIMENSIONS.width}
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth={DIMENSIONS.lineWidth}
        />

        <line
          x1={0}
          y1={SINGLES_MARGIN}
          x2={DIMENSIONS.length}
          y2={SINGLES_MARGIN}
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth={DIMENSIONS.lineWidth}
        />
        <line
          x1={0}
          y1={DIMENSIONS.width - SINGLES_MARGIN}
          x2={DIMENSIONS.length}
          y2={DIMENSIONS.width - SINGLES_MARGIN}
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth={DIMENSIONS.lineWidth}
        />

        <line
          x1={LEFT_SHORT_SERVICE_X}
          y1={MID_WIDTH}
          x2={0}
          y2={MID_WIDTH}
          stroke="rgba(255, 255, 255, 0.7)"
          strokeWidth={DIMENSIONS.lineWidth}
        />
        <line
          x1={RIGHT_SHORT_SERVICE_X}
          y1={MID_WIDTH}
          x2={DIMENSIONS.length}
          y2={MID_WIDTH}
          stroke="rgba(255, 255, 255, 0.7)"
          strokeWidth={DIMENSIONS.lineWidth}
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
            boxSizing: 'border-box',
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