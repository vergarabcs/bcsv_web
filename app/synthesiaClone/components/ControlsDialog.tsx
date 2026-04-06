'use client';

import type { ChangeEvent, SyntheticEvent } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import PianoIcon from '@mui/icons-material/Piano';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import styles from '../SynthesiaClone.module.css';
import {
  SYNTHESIA_GAMEPAD_ACTIONS,
  type SynthesiaGamepadAction,
} from '../useSynthesiaGamepad';

type ControlsDialogProps = {
  open: boolean;
  onClose: () => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  isPlaying: boolean;
  hasNotes: boolean;
  midiName: string;
  trackCount: number;
  currentTime: number;
  duration: number;
  tempo: number | null;
  playbackRate: number;
  seekStepSeconds: number;
  formatTime: (seconds: number) => string;
  onPlayPause: () => void;
  onStop: () => void;
  onJump: (deltaSeconds: number) => void | Promise<void>;
  onPlaybackRateChange: (value: number) => void;
  onSeek: (event: Event, value: number | number[]) => void;
  onSeekCommitted: (event: Event | SyntheticEvent, value: number | number[]) => void | Promise<void>;
  gamepadMappings: Record<SynthesiaGamepadAction, number | null>;
  isGamepadListening: boolean;
  listeningGamepadAction: SynthesiaGamepadAction | null;
  onStartGamepadMapping: (action: SynthesiaGamepadAction) => void;
};

const GAMEPAD_MAPPING_CONFIG: { action: SynthesiaGamepadAction; label: string }[] = [
  { action: SYNTHESIA_GAMEPAD_ACTIONS.PLAY_PAUSE, label: 'Play / pause' },
  { action: SYNTHESIA_GAMEPAD_ACTIONS.REWIND, label: 'Rewind' },
  { action: SYNTHESIA_GAMEPAD_ACTIONS.FORWARD, label: 'Forward' },
];

const formatGamepadButton = (buttonIndex: number | null) => {
  if (buttonIndex === null) {
    return 'Not set';
  }

  return `Button ${buttonIndex}`;
};

export function ControlsDialog({
  open,
  onClose,
  onFileUpload,
  isPlaying,
  hasNotes,
  midiName,
  trackCount,
  currentTime,
  duration,
  tempo,
  playbackRate,
  seekStepSeconds,
  formatTime,
  onPlayPause,
  onStop,
  onJump,
  onPlaybackRateChange,
  onSeek,
  onSeekCommitted,
  gamepadMappings,
  isGamepadListening,
  listeningGamepadAction,
  onStartGamepadMapping,
}: ControlsDialogProps) {
  const seekStepLabel = Number.isInteger(seekStepSeconds) ? seekStepSeconds.toString() : seekStepSeconds.toFixed(1);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Playback & upload controls</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {(midiName || trackCount || duration || tempo) ? (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip icon={<PianoIcon />} label={midiName || 'No MIDI loaded yet'} variant={midiName ? 'filled' : 'outlined'} />
              {trackCount ? <Chip label={`${trackCount} track${trackCount === 1 ? '' : 's'}`} /> : null}
              {duration ? <Chip label={formatTime(duration)} /> : null}
              {tempo ? <Chip label={`${tempo} BPM`} /> : null}
            </Stack>
          ) : null}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
            <Button component="label" variant="contained" startIcon={<UploadFileIcon />}>
              Upload MIDI
              <input hidden type="file" accept=".mid,.midi,audio/midi,audio/x-midi" onChange={onFileUpload} />
            </Button>

            <Button
              variant="outlined"
              startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              onClick={onPlayPause}
              disabled={!hasNotes}
            >
              {isPlaying ? 'Pause' : currentTime > 0 ? 'Resume' : 'Play'}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={<StopIcon />}
              onClick={onStop}
              disabled={!hasNotes}
            >
              Stop
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              size="small"
              variant="text"
              startIcon={<FastRewindIcon />}
              onClick={() => {
                void onJump(-seekStepSeconds);
              }}
              disabled={!hasNotes || currentTime <= 0}
            >
              Back {seekStepLabel}s
            </Button>
            <Button
              size="small"
              variant="text"
              endIcon={<FastForwardIcon />}
              onClick={() => {
                void onJump(seekStepSeconds);
              }}
              disabled={!hasNotes || currentTime >= duration}
            >
              Forward {seekStepLabel}s
            </Button>
          </Stack>

          <Box>
            <Typography variant="body2" gutterBottom>
              Gamepad controls
            </Typography>
            <Stack spacing={1}>
              {GAMEPAD_MAPPING_CONFIG.map(({ action, label }) => (
                <Stack key={action} direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                  <Button
                    size="small"
                    variant="outlined"
                    color={isGamepadListening && listeningGamepadAction === action ? 'secondary' : 'primary'}
                    onClick={() => onStartGamepadMapping(action)}
                  >
                    {isGamepadListening && listeningGamepadAction === action ? 'Press a gamepad button...' : `Map ${label}`}
                  </Button>
                  <Chip size="small" label={formatGamepadButton(gamepadMappings[action])} />
                </Stack>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="body2" gutterBottom>
              Playback speed: {playbackRate.toFixed(2)}x
            </Typography>
            <Slider
              min={0.5}
              max={1.5}
              step={0.05}
              value={playbackRate}
              onChange={(_event, value) => onPlaybackRateChange(Array.isArray(value) ? value[0] : value)}
              disabled={isPlaying}
            />
          </Box>

          <Box className={styles.progressRow}>
            <Typography variant="body2" className={styles.progressLabel}>
              {formatTime(currentTime)}
            </Typography>
            <Slider
              min={0}
              max={duration || 1}
              step={0.01}
              value={Math.min(currentTime, duration || 0)}
              onChange={onSeek}
              onChangeCommitted={onSeekCommitted}
              disabled={!hasNotes}
            />
            <Typography variant="body2" className={styles.progressLabel}>
              {formatTime(duration)}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
