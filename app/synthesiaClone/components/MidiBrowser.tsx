'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import PianoIcon from '@mui/icons-material/Piano';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { useSynthesiaStore } from '../useSynthesiaStore';

type MidiBrowserProps = {
  onOpenControls: () => void;
  onWarmUpAudio: () => Promise<boolean>;
  formatTime: (seconds: number) => string;
};

export function MidiBrowser({ onOpenControls, onWarmUpAudio, formatTime }: MidiBrowserProps) {
  const currentView = useSynthesiaStore((state) => state.currentView);
  const setCurrentView = useSynthesiaStore((state) => state.setCurrentView);
  const youtubeUrl = useSynthesiaStore((state) => state.youtubeUrl);
  const setYoutubeUrl = useSynthesiaStore((state) => state.setYoutubeUrl);
  const convertYoutubeToMidi = useSynthesiaStore((state) => state.convertYoutubeToMidi);
  const isConverting = useSynthesiaStore((state) => state.isConverting);
  const storedMidis = useSynthesiaStore((state) => state.storedMidis);
  const selectedStoredId = useSynthesiaStore((state) => state.selectedStoredId);
  const isLibraryReady = useSynthesiaStore((state) => state.isLibraryReady);
  const refreshStoredMidis = useSynthesiaStore((state) => state.refreshStoredMidis);
  const loadStoredMidiRecord = useSynthesiaStore((state) => state.loadStoredMidiRecord);
  const deleteStoredMidiRecord = useSynthesiaStore((state) => state.deleteStoredMidiRecord);
  const downloadStoredMidiRecord = useSynthesiaStore((state) => state.downloadStoredMidiRecord);
  const midiName = useSynthesiaStore((state) => state.midiName);
  const trackCount = useSynthesiaStore((state) => state.trackCount);
  const duration = useSynthesiaStore((state) => state.duration);
  const tempo = useSynthesiaStore((state) => state.tempo);
  const error = useSynthesiaStore((state) => state.error);
  const statusMessage = useSynthesiaStore((state) => state.statusMessage);
  const hasNotes = useSynthesiaStore((state) => state.notes.length > 0);

  return (
    <Stack spacing={2} sx={{ minHeight: 0 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h6">MIDI browser & download</Typography>
            <Typography variant="body2" color="text.secondary">
              Paste a YouTube URL to convert it into MIDI, cache it in this browser, and load or download it later.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', lg: 'center' }}>
            <TextField
              fullWidth
              label="YouTube URL"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void convertYoutubeToMidi();
                }
              }}
            />

            <Button
              variant="contained"
              color="error"
              startIcon={isConverting ? <CircularProgress size={18} color="inherit" /> : <YouTubeIcon />}
              onClick={() => void convertYoutubeToMidi()}
              disabled={isConverting}
              sx={{ minWidth: { lg: 180 } }}
            >
              {isConverting ? 'Converting...' : 'Convert & Save'}
            </Button>

            <Button variant="outlined" startIcon={<SettingsIcon />} onClick={onOpenControls}>
              Upload MIDI
            </Button>

            <Button
              variant={currentView === 'piano-roll' ? 'contained' : 'outlined'}
              startIcon={<PianoIcon />}
              onClick={() => setCurrentView('piano-roll')}
              disabled={!hasNotes}
            >
              Open Piano Roll
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip icon={<PianoIcon />} label={midiName || 'No MIDI loaded yet'} variant={midiName ? 'filled' : 'outlined'} />
            {trackCount ? <Chip label={`${trackCount} track${trackCount === 1 ? '' : 's'}`} /> : null}
            {duration ? <Chip label={formatTime(duration)} /> : null}
            {tempo ? <Chip label={`${tempo} BPM`} /> : null}
          </Stack>
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error && statusMessage ? <Alert severity="success">{statusMessage}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, minHeight: 0 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ mb: storedMidis.length ? 1.25 : 0 }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Browser MIDI library
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse saved conversions and download or load them into the piano roll.
            </Typography>
          </Box>

          <Button size="small" startIcon={<RefreshIcon />} onClick={() => void refreshStoredMidis()}>
            Refresh
          </Button>
        </Stack>

        {!isLibraryReady ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2">Loading your local MIDI library…</Typography>
          </Stack>
        ) : storedMidis.length ? (
          <Stack spacing={1} sx={{ maxHeight: 'calc(100dvh - 340px)', overflowY: 'auto' }}>
            {storedMidis.map((record) => {
              const isSelected = selectedStoredId === record.id;
              const sourceLabel = record.sourceType === 'youtube' ? 'YouTube cache' : 'Uploaded file';

              return (
                <Box
                  key={record.id}
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1,
                    px: 1.25,
                    py: 1,
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={isSelected ? 700 : 600} noWrap>
                      {record.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {sourceLabel} • {new Date(record.createdAt).toLocaleString()} • {(record.size / 1024).toFixed(1)} KB
                    </Typography>
                    {record.sourceUrl ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                        {record.sourceUrl}
                      </Typography>
                    ) : null}
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      size="small"
                      variant={isSelected ? 'contained' : 'outlined'}
                      startIcon={<PlayArrowIcon />}
                      onClick={() => {
                        // Prime Tone.js sample loading at load time to reduce first-play A/V drift.
                        void onWarmUpAudio();
                        void loadStoredMidiRecord(record);
                      }}
                    >
                      Load
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => downloadStoredMidiRecord(record)}
                    >
                      Download
                    </Button>
                    <IconButton aria-label={`Delete ${record.name}`} onClick={() => void deleteStoredMidiRecord(record)}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No saved MIDI yet. Convert a YouTube link or upload a `.mid` file to start your library.
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}
