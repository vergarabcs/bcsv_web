'use client';

import type { ChangeEvent, SyntheticEvent } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import styles from '../SynthesiaClone.module.css';

type ControlsDialogProps = {
  open: boolean;
  onClose: () => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  isPlaying: boolean;
  hasNotes: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  formatTime: (seconds: number) => string;
  onPlayPause: () => void;
  onStop: () => void;
  onPlaybackRateChange: (value: number) => void;
  onSeek: (event: Event, value: number | number[]) => void;
  onSeekCommitted: (event: Event | SyntheticEvent, value: number | number[]) => void | Promise<void>;
};

export function ControlsDialog({
  open,
  onClose,
  onFileUpload,
  isPlaying,
  hasNotes,
  currentTime,
  duration,
  playbackRate,
  formatTime,
  onPlayPause,
  onStop,
  onPlaybackRateChange,
  onSeek,
  onSeekCommitted,
}: ControlsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Playback controls</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
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
