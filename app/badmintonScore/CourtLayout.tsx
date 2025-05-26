import { useState, useEffect } from 'react';
import { Box } from '@mui/material';

// Define the court position types
export type CourtPosition = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type PlayerColor = 'blue' | 'red' | 'yellow' | 'white';

export interface CourtLayoutProps {
  servingTeam: 'Q1Q4' | 'Q2Q3';
  lastScorer: 'Q1Q4' | 'Q2Q3' | null;
}

// The initial position of each player color
const initialPositions: Record<CourtPosition, PlayerColor> = {
  Q1: 'white',
  Q2: 'blue',
  Q3: 'red',
  Q4: 'yellow'
};

// Map colors to their CSS color values
const colorValues: Record<PlayerColor, string> = {
  blue: '#0032A0',
  red: '#BF0D3E',
  yellow: '#FED141',
  white: '#FFFFFF'
};

export const CourtLayout: React.FC<CourtLayoutProps> = ({ servingTeam, lastScorer }) => {
  const [positions, setPositions] = useState<Record<CourtPosition, PlayerColor>>(initialPositions);

  // Handle position swaps when a team scores
  useEffect(() => {
    if (!lastScorer) return;
    
    // Create a new positions object to avoid mutation
    const newPositions = {...positions};
    
    if (lastScorer === 'Q1Q4') {
      // Swap positions for team Q1Q4
      const tempQ1 = newPositions.Q1;
      newPositions.Q1 = newPositions.Q4;
      newPositions.Q4 = tempQ1;
    } else if (lastScorer === 'Q2Q3') {
      // Swap positions for team Q2Q3
      const tempQ2 = newPositions.Q2;
      newPositions.Q2 = newPositions.Q3;
      newPositions.Q3 = tempQ2;
    }
    
    setPositions(newPositions);
  }, [lastScorer]);

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
        
        {/* Top row - Q1 and Q2 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
          {/* Q1 */}
          <Box sx={{ 
            flex: 1, 
            backgroundColor: colorValues[positions.Q1],
            position: 'relative',
            opacity: 0.8,
            border: servingTeam === 'Q1Q4' && positions.Q1 === initialPositions.Q1 ? '3px solid #000' : 'none'
          }} />
          
          {/* Q2 */}
          <Box sx={{ 
            flex: 1, 
            backgroundColor: colorValues[positions.Q2],
            position: 'relative',
            opacity: 0.8,
            border: servingTeam === 'Q2Q3' && positions.Q2 === initialPositions.Q2 ? '3px solid #000' : 'none'
          }} />
        </Box>
        
        {/* Bottom row - Q3 and Q4 */}
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
            opacity: 0.8,
            border: servingTeam === 'Q1Q4' && positions.Q4 === initialPositions.Q4 ? '3px solid #000' : 'none'
          }} />
          
          {/* Q3 */}
          <Box sx={{ 
            flex: 1, 
            backgroundColor: colorValues[positions.Q3],
            position: 'relative',
            opacity: 0.8,
            border: servingTeam === 'Q2Q3' && positions.Q3 === initialPositions.Q3 ? '3px solid #000' : 'none'
          }} />
        </Box>
      </Box>
    </Box>
  );
};