import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { T_TEAMS, TEAM_NAME } from './constants';
import { CourtPosition, PlayerColor } from './types';

export interface CourtLayoutProps {
  positions: Record<CourtPosition, PlayerColor>;
}

// Map colors to their CSS color values
const colorValues: Record<PlayerColor, string> = {
  blue: '#0032A0',
  red: '#BF0D3E',
  yellow: '#FED141',
  white: '#FFFFFF'
};

export const CourtLayout: React.FC<CourtLayoutProps> = ({ positions }) => {
  // Define a transition for the background color changes
  const transition = 'background-color 1s ease-in-out';

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
        
        {/* Left column - Q1 and Q2 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
          {/* Q1 */}
          <Box sx={{ 
            flex: 1, 
            backgroundColor: colorValues[positions.Q1],
            position: 'relative',
            transition: transition
          }} />
          
          {/* Q2 */}
          <Box sx={{ 
            flex: 1, 
            backgroundColor: colorValues[positions.Q2],
            position: 'relative',
            transition: transition
          }} />
        </Box>
        
        {/* Right Column - Q3 and Q4 */}
        <Box sx={{ 
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: '50%',
          display: 'flex',
          flexDirection: 'row'
        }}>
          {/* Q4 */}
          <Box sx={{ 
            flex: 1, 
            backgroundColor: colorValues[positions.Q4],
            position: 'relative',
            transition: transition
          }} />
          
          {/* Q3 */}
          <Box sx={{ 
            flex: 1, 
            backgroundColor: colorValues[positions.Q3],
            position: 'relative',
            transition: transition
          }} />
        </Box>
      </Box>
    </Box>
  );
};