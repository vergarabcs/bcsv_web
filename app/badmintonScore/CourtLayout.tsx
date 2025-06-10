import { Box, Grid, keyframes } from '@mui/material';
import { initialColorMap, TEAM_NAME, TOP_HALF } from './constants';
import { CourtPosition } from './types';
import { useBadmintonStore } from './useBadmintonStore';
import CompassCalibrationIcon from '@mui/icons-material/CompassCalibration';
import { PositionFlags } from '../types';


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

const getColorKey = (positionFlags: PositionFlags, positionName: CourtPosition): CourtPosition => {
  
  // Initialize mapping
  const transformMap: Record<CourtPosition, CourtPosition> = {
    Q1: "Q1",
    Q2: "Q2",
    Q3: "Q3",
    Q4: "Q4"
  };
  
  // Apply court position swap (horizontal swap) - swap Q1↔Q2 and Q3↔Q4
  if (positionFlags.courtPos) {
    transformMap.Q1 = "Q2";
    transformMap.Q2 = "Q1";
    transformMap.Q3 = "Q4";
    transformMap.Q4 = "Q3";
  }
  
  // Apply player 1 position swap (diagonal swap) - swap Q2↔Q3
  if (positionFlags.p1) {
    const temp = transformMap.Q2;
    transformMap.Q2 = transformMap.Q3;
    transformMap.Q3 = temp;
  }
  
  // Apply player 2 position swap (diagonal swap) - swap Q1↔Q4
  if (positionFlags.p2) {
    const temp = transformMap.Q1;
    transformMap.Q1 = transformMap.Q4;
    transformMap.Q4 = temp;
  }
  
  // Return the transformed position
  return transformMap[positionName];
}

// Extracted Quadrant component
const Quadrant: React.FC<QuadrantProps> = ({ positionName, isServing }) => {
  const transition = 'background-color 1s ease-in-out';
  const servingTeam = useBadmintonStore(state => state.servingTeam);
  const positionFlags = useBadmintonStore(state => state.positionFlags);
  const colorKey = getColorKey(positionFlags, positionName);
  const verticalPosition: React.CSSProperties = TOP_HALF.includes(positionName) 
    ? { top: "2rem" } 
    : { bottom: "2rem" };

  return (
    <Grid size={6}>
      <Box sx={{
        height: "100%",
        backgroundColor: initialColorMap[colorKey],
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