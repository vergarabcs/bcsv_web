import { Box, Grid, keyframes } from '@mui/material';
import { initialColorMap, TEAM_NAME } from './constants';
import { CourtPosition } from './types';
import { useBadmintonStore } from './useBadmintonStore';
import { PositionFlags } from '../types';


// Define blinking animation keyframes
const blinkAnimation = keyframes`
  0% {
    filter: saturate(1) brightness(0.5);
  }
  50% {
    filter: saturate(1.6) brightness(1.1);
  }
  100% {
    filter: saturate(1) brightness(0.5);
  }
`;

interface QuadrantProps {
  positionName: CourtPosition;
}

const swap = (obj: Record<CourtPosition, CourtPosition>, key1: CourtPosition, key2: CourtPosition) => {
  const temp = obj[key1]
  obj[key1] = obj[key2]
  obj[key2] = temp
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
    swap(transformMap, "Q1", "Q2")
    swap(transformMap, "Q3", "Q4")

    positionFlags.p1 && swap(transformMap, "Q1", "Q4")
    positionFlags.p2 && swap(transformMap, "Q2", "Q3")
  }else{
    positionFlags.p2 && swap(transformMap, "Q1", "Q4")
    positionFlags.p1 && swap(transformMap, "Q2", "Q3")
  }
  
  // Return the transformed position
  return transformMap[positionName];
}

// Extracted Quadrant component
const Quadrant: React.FC<QuadrantProps> = ({ positionName }) => {
  const isServing = useBadmintonStore(state => {
    const isServingFromLeft = (state.servingTeam === TEAM_NAME.TEAM1) !== state.positionFlags.courtPos;
    const leftSideScore = !state.positionFlags.courtPos ? state.player1Score : state.player2Score
    const rightSideScore = !state.positionFlags.courtPos ? state.player2Score : state.player1Score

    switch (positionName) {
      case "Q2":
        return (isServingFromLeft) && leftSideScore % 2 !== 0
      case "Q3":
        return (isServingFromLeft) && leftSideScore % 2 === 0
      case "Q1":
        return !isServingFromLeft && rightSideScore % 2 === 0
      case "Q4":
        return !isServingFromLeft && rightSideScore % 2 !== 0
    }
  });

  const transition = 'background-color 1s ease-in-out';
  const positionFlags = useBadmintonStore(state => state.positionFlags);
  const colorKey = getColorKey(positionFlags, positionName);

  return (
    <Grid size={6}>
      <Box sx={{
        height: "100%",
        backgroundColor: initialColorMap[colorKey],
        transition: transition,
        position: 'relative',
        animation: isServing ? `${blinkAnimation} 1.0s infinite`: 'none'
      }}>
      </Box>
    </Grid>
  );
};

export const CourtLayout: React.FC = () => {

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
        />
        <Quadrant
          positionName={"Q1"}
        />
        <Quadrant
          positionName={"Q3"}
        />
        <Quadrant
          positionName={"Q4"}
        />
      </Grid>
    </Grid>
  );
};