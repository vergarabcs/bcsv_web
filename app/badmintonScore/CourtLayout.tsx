import { useState, useEffect } from 'react';
import { Box, keyframes } from '@mui/material';
import { T_TEAMS, TEAM_NAME } from './constants';
import { CourtPosition, PlayerColor } from './types';
import { useBadmintonStore } from './useBadmintonStore';

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
    box-shadow: inset 0 0 0 0 rgba(0,0,0,0);
  }
  50% { 
    box-shadow: inset 0 0 0 2000px rgba(0,0,0,0.3);
  }
  100% { 
    box-shadow: inset 0 0 0 0 rgba(0,0,0,0);
  }
`;

interface QuadrantProps {
  colorName: PlayerColor;
  isServing: boolean;
}

// Extracted Quadrant component
const Quadrant: React.FC<QuadrantProps> = ({ colorName, isServing }) => {
  const transition = 'background-color 1s ease-in-out';
  
  return (
    <Box sx={{ 
      flex: 1, 
      backgroundColor: colorValues[colorName],
      position: 'relative',
      transition: transition,
      animation: isServing ? `${blinkAnimation} 1.0s infinite` : 'none'
    }} />
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
    <Box sx={{ 
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 0
    }}>
      {/* Court graphic */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        border: '2px solid #000',
        position: 'relative'
      }}>
        {/* Center line */}
        <Box sx={{
          position: 'absolute',
          width: '2px',
          height: '100%',
          backgroundColor: '#000',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }} />
        
        {/* Net line */}
        <Box sx={{
          position: 'absolute',
          width: '100%',
          height: '2px',
          backgroundColor: '#000',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }} />
        
        {/* Left column - Q2 and Q3 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
          {/* Q2 */}
          <Quadrant 
            colorName={positions.Q2} 
            isServing={isServingQuadrant(2)} 
          />
          
          {/* Q1 */}
          <Quadrant 
            colorName={positions.Q1} 
            isServing={isServingQuadrant(1)} 
          />
        </Box>
        
        {/* Right Column - Q1 and Q4 */}
        <Box sx={{ 
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: '50%',
          display: 'flex',
          flexDirection: 'row'
        }}>
          {/* Q3 */}
          <Quadrant 
            colorName={positions.Q3} 
            isServing={isServingQuadrant(3)} 
          />
          
          {/* Q4 */}
          <Quadrant 
            colorName={positions.Q4} 
            isServing={isServingQuadrant(4)} 
          />
        </Box>
      </Box>
    </Box>
  );
};