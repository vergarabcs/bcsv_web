import { useState, useEffect } from 'react';
import { Box, Grid, keyframes } from '@mui/material';
import { T_TEAMS, TEAM_NAME, TOP_HALF } from './constants';
import { CourtPosition, PlayerColor } from './types';
import { useBadmintonStore } from './useBadmintonStore';
import CompassCalibrationIcon from '@mui/icons-material/CompassCalibration';

// Map colors to their CSS color values
const colorValues: Record<PlayerColor, string> = {
  yellow: '#FED141',
  red: '#BF0D3E',
  blue: '#0032A0',
  white: '#FFFFFF'
};

// Define blinking animation keyframes
const blinkAnimation = keyframes`
  0% {
  }
  50% {
    transform: rotate(20deg);
  }
  100% { 
  }
`;

interface QuadrantProps {
  positionName: CourtPosition;
  isServing: boolean;
}

// Extracted Quadrant component
const Quadrant: React.FC<QuadrantProps> = ({ positionName, isServing }) => {
  const colorName = useBadmintonStore(state => state.positions[positionName])
  const transition = 'background-color 1s ease-in-out';
  const servingTeam = useBadmintonStore(state => state.servingTeam);

  const verticalPosition: React.CSSProperties = TOP_HALF.includes(positionName) 
    ? { top: "2rem" } 
    : { bottom: "2rem" };

  return (
    <Grid size={6}>
      <Box sx={{
        height: "100%",
        backgroundColor: colorValues[colorName],
        transition: transition,
        position: 'relative'
      }}>
      {isServing && (
        <CompassCalibrationIcon 
        sx={{
          animation: isServing ? `${blinkAnimation} 1.0s infinite` : 'none',
          fontSize: '3rem',
          position: 'absolute',
          right: '2rem',
          transform: 'rotate(45deg)',
          scale: 2.0,
          color: servingTeam === TEAM_NAME.TEAM1? 'black' : 'white',
          ...verticalPosition
        }}
        />
      )}
      </Box>
    </Grid>
  );
};

export const CourtLayout: React.FC = () => {
  const positions = useBadmintonStore(state => state.positions)

  let servingPlayer = useBadmintonStore(state => {
    // For team 1 (Q2 & Q3)
    if (state.servingTeam === TEAM_NAME.TEAM1) {
      return state.player1Score % 2 === 0 ? 3 : 2;
    }
    // For team 2 (Q1 & Q4)
    return state.player2Score % 2 === 0 ? 1 : 4;
  });

  // Helper function to determine if quadrant is the serving quadrant
  const isServingQuadrant = (quadrant: number): boolean => {
    return quadrant === servingPlayer;
  };

  return (
    <Grid data-testid="courtLayout" container sx={{
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 0
    }}>
      {/* Court graphic */}

      <Grid container rowSpacing={0} columnSpacing={0} sx={{ width: '100%', height: '100%' }}>
        <Quadrant
          positionName={"Q2"}
          isServing={isServingQuadrant(2)}
        />
        <Quadrant
          positionName={"Q1"}
          isServing={isServingQuadrant(1)}
        />
        <Quadrant
          positionName={"Q3"}
          isServing={isServingQuadrant(3)}
        />
        <Quadrant
          positionName={"Q4"}
          isServing={isServingQuadrant(4)}
        />
      </Grid>
    </Grid>
  );
};