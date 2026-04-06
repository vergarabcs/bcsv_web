'use client';

import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import MenuIcon from '@mui/icons-material/Menu';
import PianoIcon from '@mui/icons-material/Piano';
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
import { SYNTHESIA_PLAYBACK_CONFIG, SYNTHESIA_ROLL_CONFIG } from './config';
import type { PianoKey, VisibleBar } from './types';
import { useSynthesiaAudioPlayer } from './useSynthesiaAudioPlayer';
import { useSynthesiaStore, type SynthesiaView } from './useSynthesiaStore';

type NavItem = {
  view: SynthesiaView;
  label: string;
  caption: string;
  icon: ReactNode;
};

const DRAWER_WIDTH = 280;
const MIDI_LOW = 21;
const MIDI_HIGH = 108;
const BLACK_KEY_WIDTH_RATIO = 0.65;
const KEYBOARD_HEIGHT = 92;
const MIN_PIANO_ROLL_HEIGHT = 320;
const PIXELS_PER_SECOND = 140;
const BAR_COLORS = ['#7dd3fc', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22d3ee'];
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

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

const isBlackKey = (midi: number) => BLACK_KEYS.has(midi % 12);

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getNoteLabel = (midi: number) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  return `${noteNames[midi % 12]}${octave}`;
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

  const visibleRange = useMemo(() => {
    if (!notes.length) {
      return { start: 48, end: 72 };
    }

    const minMidi = Math.min(...notes.map((note) => note.midi));
    const maxMidi = Math.max(...notes.map((note) => note.midi));

    let start = Math.max(MIDI_LOW, minMidi - 2);
    let end = Math.min(MIDI_HIGH, maxMidi + 2);

    if (end - start < 18) {
      const midpoint = Math.round((start + end) / 2);
      start = Math.max(MIDI_LOW, midpoint - 10);
      end = Math.min(MIDI_HIGH, midpoint + 10);
    }

    return { start, end };
  }, [notes]);

  const keys = useMemo<PianoKey[]>(() => {
    const whiteKeyCount = Array.from(
      { length: visibleRange.end - visibleRange.start + 1 },
      (_, index) => visibleRange.start + index
    ).filter((midi) => !isBlackKey(midi)).length || 1;

    const whiteKeyWidth = 100 / whiteKeyCount;
    const blackKeyWidth = whiteKeyWidth * BLACK_KEY_WIDTH_RATIO;
    let whiteIndex = 0;
    const result: PianoKey[] = [];

    for (let midi = visibleRange.start; midi <= visibleRange.end; midi += 1) {
      const black = isBlackKey(midi);
      const width = black ? blackKeyWidth : whiteKeyWidth;
      const rawLeft = black
        ? whiteIndex * whiteKeyWidth - blackKeyWidth / 2
        : whiteIndex * whiteKeyWidth;
      const left = Math.min(Math.max(rawLeft, 0), Math.max(100 - width, 0));

      result.push({
        midi,
        isBlack: black,
        left,
        width: Math.max(Math.min(width, 100 - left), 0),
        label: getNoteLabel(midi),
      });

      if (!black) {
        whiteIndex += 1;
      }
    }

    return result;
  }, [visibleRange.end, visibleRange.start]);

  const keyMap = useMemo(() => new Map(keys.map((key) => [key.midi, key])), [keys]);
  const hasNotes = notes.length > 0;

  const activeNoteSet = useMemo(() => {
    const activeNotes = new Set<number>();

    notes.forEach((note) => {
      if (currentTime >= note.time && currentTime <= note.time + note.duration) {
        activeNotes.add(note.midi);
      }
    });

    return activeNotes;
  }, [currentTime, notes]);

  const visibleBars = useMemo<VisibleBar[]>(() => {
    const scaledPixelsPerSecond = PIXELS_PER_SECOND * SYNTHESIA_ROLL_CONFIG.speed * playbackRate;

    return notes
      .map((note) => {
        const key = keyMap.get(note.midi);
        if (!key) {
          return null;
        }

        const height = Math.max(note.duration * scaledPixelsPerSecond, 12);
        const bottom = KEYBOARD_HEIGHT + (note.time - currentTime) * scaledPixelsPerSecond;

        if (bottom + height < KEYBOARD_HEIGHT || bottom > pianoRollHeight) {
          return null;
        }

        const barWidth = Math.min(Math.max(key.width * (key.isBlack ? 0.88 : 0.92), 0.35), key.width);
        const left = Math.min(
          Math.max(key.left + (key.width - barWidth) / 2, 0),
          Math.max(100 - barWidth, 0)
        );

        return {
          id: note.id,
          left,
          width: barWidth,
          bottom,
          height,
          color: BAR_COLORS[note.track % BAR_COLORS.length],
        };
      })
      .filter((bar): bar is NonNullable<typeof bar> => Boolean(bar));
  }, [currentTime, keyMap, notes, pianoRollHeight, playbackRate]);

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
              <IconButton aria-label="Open controls and settings" onClick={() => setControlsOpen(true)}>
                <SettingsIcon />
              </IconButton>
            ) : null}
          </Stack>
        </Box>

        {currentView === 'browser' ? (
          <MidiBrowser
            onOpenControls={() => setControlsOpen(true)}
            formatTime={formatTime}
          />
        ) : (
          <PianoRoll
            hasNotes={hasNotes}
            pianoRollHeight={pianoRollHeight}
            keys={keys}
            activeNoteSet={activeNoteSet}
            visibleBars={visibleBars}
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
