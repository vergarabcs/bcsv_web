'use client';

import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import MenuIcon from '@mui/icons-material/Menu';
import PauseIcon from '@mui/icons-material/Pause';
import PianoIcon from '@mui/icons-material/Piano';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import styles from './SynthesiaClone.module.css';
import { ControlsDialog } from './components/ControlsDialog';
import { MidiBrowser } from './components/MidiBrowser';
import { PianoRoll } from './components/PianoRoll';
import { SYNTHESIA_PLAYBACK_CONFIG } from './config';
import { useSynthesiaAudioPlayer } from './useSynthesiaAudioPlayer';
import { useSynthesiaStore, type SynthesiaView } from './useSynthesiaStore';

type NavItem = {
  view: SynthesiaView;
  label: string;
  caption: string;
  icon: ReactNode;
};

const DRAWER_WIDTH = 280;
const MIN_PIANO_ROLL_HEIGHT = 320;

const navItems: NavItem[] = [
  {
    view: 'browser',
    label: 'MIDI browser & download',
    caption: 'Convert, browse, and download stored MIDI files.',
    icon: <LibraryMusicIcon />,
  },
  {
    view: 'piano-roll',
    label: 'Piano roll',
    caption: 'Play the loaded MIDI with the falling-note keyboard.',
    icon: <PianoIcon />,
  },
];

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function SynthesiaClone() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);

  const currentView = useSynthesiaStore((state) => state.currentView);
  const setCurrentView = useSynthesiaStore((state) => state.setCurrentView);
  const refreshStoredMidis = useSynthesiaStore((state) => state.refreshStoredMidis);
  const saveUploadedMidiFile = useSynthesiaStore((state) => state.saveUploadedMidiFile);
  const notes = useSynthesiaStore((state) => state.notes);
  const midiName = useSynthesiaStore((state) => state.midiName);
  const duration = useSynthesiaStore((state) => state.duration);
  const trackCount = useSynthesiaStore((state) => state.trackCount);
  const tempo = useSynthesiaStore((state) => state.tempo);

  const {
    playbackRate,
    setPlaybackRate,
    currentTime,
    isPlaying,
    warmUpAudio,
    startPlayback,
    pausePlayback,
    stopPlayback,
    handleSeek,
    handleSeekCommitted,
    handleJump,
  } = useSynthesiaAudioPlayer({ notes, duration });

  const [controlsOpen, setControlsOpen] = useState(false);
  const [pianoRollHeight, setPianoRollHeight] = useState(MIN_PIANO_ROLL_HEIGHT);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const saved = await saveUploadedMidiFile(file);
    if (saved) {
      setControlsOpen(false);
    }

    event.target.value = '';
  };

  const hasNotes = notes.length > 0;

  useEffect(() => {
    void refreshStoredMidis();
  }, [refreshStoredMidis]);

  useEffect(() => {
    if (isDesktop) {
      setMobileNavOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (currentView !== 'piano-roll' || typeof window === 'undefined') {
      return;
    }

    const containerEl = containerRef.current;
    const headerEl = headerRef.current;

    if (!containerEl || !headerEl) {
      return;
    }

    const updatePianoRollHeight = () => {
      const containerHeight = containerEl.clientHeight;
      const headerHeight = headerEl.offsetHeight;
      const computedStyles = window.getComputedStyle(containerEl);
      const gap = Number.parseFloat(computedStyles.gap || '0') || 0;
      const availableHeight = containerHeight - headerHeight - gap;

      setPianoRollHeight(Math.max(MIN_PIANO_ROLL_HEIGHT, Math.floor(availableHeight)));
    };

    updatePianoRollHeight();

    const resizeObserver = new ResizeObserver(() => updatePianoRollHeight());
    resizeObserver.observe(containerEl);
    resizeObserver.observe(headerEl);
    window.addEventListener('resize', updatePianoRollHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePianoRollHeight);
    };
  }, [currentView]);

  return (
    <Box className={styles.synthesiaShell} sx={{ height: 'calc(100dvh - 90px)', minHeight: 0, flexDirection: 'row', gap: 0 }}>
      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop ? true : mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            height: '100%',
            boxSizing: 'border-box',
            position: 'relative',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Synthesia workspace</Typography>
          <Typography variant="body2" color="text.secondary">
            Switch between preparing MIDI files and playing them in the piano roll.
          </Typography>
        </Box>

        <Divider />

        <List sx={{ px: 1, py: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.view}
              selected={currentView === item.view}
              onClick={() => {
                setCurrentView(item.view);
                setMobileNavOpen(false);
              }}
              sx={{ borderRadius: 2, alignItems: 'flex-start', mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} secondary={item.caption} />
            </ListItemButton>
          ))}
        </List>

        <Divider />

        <Box sx={{ p: 2, mt: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom>
            Current MIDI
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {midiName || 'No MIDI loaded yet'}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {trackCount ? <Chip size="small" label={`${trackCount} track${trackCount === 1 ? '' : 's'}`} /> : null}
            {duration ? <Chip size="small" label={formatTime(duration)} /> : null}
            {tempo ? <Chip size="small" label={`${tempo} BPM`} /> : null}
          </Stack>
        </Box>
      </Drawer>

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: '1px', sm: 1.5 },
          p: { xs: '1px', sm: 1, md: 2 },
          overflow: 'hidden',
        }}
      >
        <Box
          ref={headerRef}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: '1px', sm: 1.5 },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
              {!isDesktop ? (
                <IconButton aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}>
                  <MenuIcon />
                </IconButton>
              ) : null}
              <Typography variant="h5" fontWeight={700}>
                {currentView === 'browser' ? 'MIDI browser & download' : 'Piano roll'}
              </Typography>
            </Stack>

            {currentView === 'piano-roll' ? (
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  aria-label={`Rewind ${SYNTHESIA_PLAYBACK_CONFIG.seekStepSeconds} seconds`}
                  onClick={() => {
                    void handleJump(-SYNTHESIA_PLAYBACK_CONFIG.seekStepSeconds);
                  }}
                  disabled={!hasNotes || currentTime <= 0}
                >
                  <FastRewindIcon />
                </IconButton>
                <IconButton
                  aria-label={isPlaying ? 'Pause playback' : currentTime > 0 ? 'Resume playback' : 'Start playback'}
                  onClick={() => {
                    if (isPlaying) {
                      pausePlayback();
                    } else {
                      void startPlayback(currentTime);
                    }
                  }}
                  disabled={!hasNotes}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton
                  aria-label={`Forward ${SYNTHESIA_PLAYBACK_CONFIG.seekStepSeconds} seconds`}
                  onClick={() => {
                    void handleJump(SYNTHESIA_PLAYBACK_CONFIG.seekStepSeconds);
                  }}
                  disabled={!hasNotes || currentTime >= duration}
                >
                  <FastForwardIcon />
                </IconButton>
                <IconButton aria-label="Open controls and settings" onClick={() => setControlsOpen(true)}>
                  <SettingsIcon />
                </IconButton>
              </Stack>
            ) : null}
          </Stack>
        </Box>

        {currentView === 'browser' ? (
          <MidiBrowser
            onOpenControls={() => setControlsOpen(true)}
            onWarmUpAudio={warmUpAudio}
            formatTime={formatTime}
          />
        ) : (
          <PianoRoll
            pianoRollHeight={pianoRollHeight}
            notes={notes}
            currentTime={currentTime}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
          />
        )}
      </Box>

      <ControlsDialog
        open={controlsOpen}
        onClose={() => setControlsOpen(false)}
        onFileUpload={handleFileUpload}
        isPlaying={isPlaying}
        hasNotes={hasNotes}
        midiName={midiName}
        trackCount={trackCount}
        currentTime={currentTime}
        duration={duration}
        tempo={tempo}
        playbackRate={playbackRate}
        seekStepSeconds={SYNTHESIA_PLAYBACK_CONFIG.seekStepSeconds}
        formatTime={formatTime}
        onPlayPause={() => {
          if (isPlaying) {
            pausePlayback();
          } else {
            void startPlayback(currentTime);
          }
        }}
        onStop={() => stopPlayback()}
        onJump={handleJump}
        onPlaybackRateChange={setPlaybackRate}
        onSeek={handleSeek}
        onSeekCommitted={handleSeekCommitted}
      />
    </Box>
  );
}
