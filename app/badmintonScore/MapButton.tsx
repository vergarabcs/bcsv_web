import { Box, Button, Chip } from "@mui/material";
import { TGamePadAction } from "./types";
import { useBadmintonStore } from "./useBadmintonStore";
import { InputDevice } from "./useGamepad";

// MapButton component with calculated button/key mappings
interface MapButtonProps {
  action: TGamePadAction;
  label: string;
  inputDevice: InputDevice;
  isListening: boolean;
  listeningDevice: InputDevice | null;
  onMap: () => void;
}

export const MapButton = ({ 
  action, 
  label, 
  inputDevice,
  isListening,
  listeningDevice,
  onMap,
}: MapButtonProps) => {

  const buttonMappings = useBadmintonStore(state => state.buttonMappings)
  const keyMappings = useBadmintonStore(state => state.keyMappings)

  // Calculate the mapped button or key directly in the component
  const getMappedButton = (): number | null => {
    for (const [buttonIndex, mappedAction] of Object.entries(buttonMappings)) {
      if (mappedAction === action) {
        return parseInt(buttonIndex);
      }
    }
    return null;
  };

  const getMappedKey = (): string | null => {
    for (const [key, mappedAction] of Object.entries(keyMappings)) {
      if (mappedAction === action) {
        return key;
      }
    }
    return null;
  };

  const formatKeyCode = (keyCode: string | null): string => {
    if (!keyCode) return "None";
    
    // Handle special keys
    if (keyCode === "Space") return "Spacebar";
    if (keyCode === "ArrowLeft") return "←";
    if (keyCode === "ArrowRight") return "→";
    if (keyCode === "ArrowUp") return "↑";
    if (keyCode === "ArrowDown") return "↓";
    if (keyCode.startsWith("Key")) return keyCode.substring(3);
    if (keyCode.startsWith("Digit")) return keyCode.substring(5);
    
    return keyCode;
  };

  const mappedButton = getMappedButton();
  const mappedKey = getMappedKey();

  return (
    <Box sx={{ flexBasis: { xs: '100%', sm: '30%' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
      <Button 
        variant="outlined"
        color={isListening && listeningDevice === inputDevice ? "secondary" : "primary"}
        onClick={onMap}
        fullWidth
      >
        {isListening && listeningDevice === inputDevice ? 
          inputDevice === 'gamepad' ? "Press a button..." : "Press a key..." : 
          label}
      </Button>
      {inputDevice === 'gamepad' && mappedButton !== null ? (
        <Chip 
          label={`Button ${mappedButton}`} 
          color="primary" 
          size="small"
        />
      ) : inputDevice === 'keyboard' && mappedKey ? (
        <Chip 
          label={formatKeyCode(mappedKey)} 
          color="primary" 
          size="small"
        />
      ) : null}
    </Box>
  );
};