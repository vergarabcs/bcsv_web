'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Midi } from '@tonejs/midi';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import PianoIcon from '@mui/icons-material/Piano';
import SettingsIcon from '@mui/icons-material/Settings';
import styles from './SynthesiaClone.module.css';
import { ControlsDialog } from './components/ControlsDialog';
import { PianoRoll } from './components/PianoRoll';
import { SYNTHESIA_AUDIO_CONFIG, SYNTHESIA_ROLL_CONFIG } from './config';
import type { MidiNote, PianoKey, VisibleBar } from './types';

const MIDI_LOW = 21;
const MIDI_HIGH = 108;
const BLACK_KEY_WIDTH_RATIO = 0.65;
const KEYBOARD_HEIGHT = 92;
const MIN_PIANO_ROLL_HEIGHT = 320;
const PIXELS_PER_SECOND = 140;
const BAR_COLORS = ['#7dd3fc', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22d3ee'];
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

const isBlackKey = (midi: number) => BLACK_KEYS.has(midi % 12);

const midiToFrequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scheduledTimeoutsRef = useRef<number[]>([]);
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);
  const playStartWallClockRef = useRef(0);
  const playStartOffsetRef = useRef(0);

  const [notes, setNotes] = useState<MidiNote[]>([]);
  const [midiName, setMidiName] = useState('');
  const [duration, setDuration] = useState(0);
  const [trackCount, setTrackCount] = useState(0);
  const [tempo, setTempo] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [controlsOpen, setControlsOpen] = useState(false);
  const [pianoRollHeight, setPianoRollHeight] = useState(MIN_PIANO_ROLL_HEIGHT);

  const stopScheduledAudio = useCallback(() => {
    scheduledTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    scheduledTimeoutsRef.current = [];

    activeOscillatorsRef.current.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // Ignore oscillators that have already ended.
      }
    });
    activeOscillatorsRef.current = [];

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const ensureAudioContext = useCallback(async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!audioContextRef.current) {
      const AudioContextCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextCtor) {
        return null;
      }

      audioContextRef.current = new AudioContextCtor();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  const stopPlayback = useCallback((resetToStart = true) => {
    stopScheduledAudio();
    setIsPlaying(false);

    if (resetToStart) {
      setCurrentTime(0);
    }
  }, [stopScheduledAudio]);

  const tickPlayback = useCallback(() => {
    const elapsed = ((performance.now() - playStartWallClockRef.current) / 1000) * playbackRate;
    const nextTime = Math.min(playStartOffsetRef.current + elapsed, duration);

    setCurrentTime(nextTime);

    if (nextTime >= duration) {
      stopScheduledAudio();
      setIsPlaying(false);
      setCurrentTime(duration);
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(tickPlayback);
  }, [duration, playbackRate, stopScheduledAudio]);

  const scheduleAudioFrom = useCallback(async (startFrom: number) => {
    const audioContext = await ensureAudioContext();

    if (!audioContext) {
      setError('This browser does not support Web Audio playback.');
      return false;
    }

    notes.forEach((note) => {
      const noteEnd = note.time + note.duration;
      if (noteEnd <= startFrom) {
        return;
      }

      const startsIn = Math.max(note.time - startFrom, 0);
      const remainingDuration = Math.max(noteEnd - Math.max(startFrom, note.time), 0.05);

      const timeoutId = window.setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const playDuration = Math.max(remainingDuration / playbackRate, 0.05);
        const sustainedDuration = playDuration + SYNTHESIA_AUDIO_CONFIG.sustainSeconds;
        const peakVolume = (0.03 + note.velocity * 0.1) * SYNTHESIA_AUDIO_CONFIG.volume;

        oscillator.type = note.track % 2 === 0 ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(midiToFrequency(note.midi), audioContext.currentTime);

        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(peakVolume, audioContext.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + sustainedDuration);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + sustainedDuration + 0.03);

        activeOscillatorsRef.current.push(oscillator);
        oscillator.onended = () => {
          activeOscillatorsRef.current = activeOscillatorsRef.current.filter((active) => active !== oscillator);
        };
      }, (startsIn * 1000) / playbackRate);

      scheduledTimeoutsRef.current.push(timeoutId);
    });

    return true;
  }, [ensureAudioContext, notes, playbackRate]);

  const startPlayback = useCallback(async (startFrom = currentTime) => {
    if (!notes.length) {
      return;
    }

    stopScheduledAudio();
    setError('');
    playStartOffsetRef.current = startFrom;
    playStartWallClockRef.current = performance.now();
    setCurrentTime(startFrom);

    const playbackStarted = await scheduleAudioFrom(startFrom);
    if (!playbackStarted) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    animationFrameRef.current = window.requestAnimationFrame(tickPlayback);
  }, [currentTime, notes.length, scheduleAudioFrom, stopScheduledAudio, tickPlayback]);

  const pausePlayback = useCallback(() => {
    const elapsed = ((performance.now() - playStartWallClockRef.current) / 1000) * playbackRate;
    const pausedAt = Math.min(playStartOffsetRef.current + elapsed, duration);

    stopScheduledAudio();
    setIsPlaying(false);
    setCurrentTime(pausedAt);
  }, [duration, playbackRate, stopScheduledAudio]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    stopPlayback();
    setError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const midi = new Midi(arrayBuffer);
      const parsedNotes = midi.tracks
        .flatMap((track, trackIndex) =>
          track.notes.map((note, noteIndex) => ({
            id: `${trackIndex}-${noteIndex}`,
            midi: note.midi,
            time: note.time,
            duration: note.duration,
            velocity: note.velocity,
            track: trackIndex,
            name: note.name,
          }))
        )
        .sort((left, right) => left.time - right.time || left.midi - right.midi);

      if (!parsedNotes.length) {
        throw new Error('No note data found');
      }

      const parsedDuration = Math.max(
        midi.duration,
        ...parsedNotes.map((note) => note.time + note.duration)
      );

      setMidiName(file.name);
      setNotes(parsedNotes);
      setDuration(parsedDuration);
      setTrackCount(midi.tracks.length);
      setTempo(midi.header.tempos[0] ? Math.round(midi.header.tempos[0].bpm) : null);
      setCurrentTime(0);
    } catch {
      setNotes([]);
      setMidiName('');
      setDuration(0);
      setTrackCount(0);
      setTempo(null);
      setCurrentTime(0);
      setError('Unable to read that MIDI file. Please upload a standard .mid or .midi file.');
    }
  };

  const handleSeek = (_event: Event, value: number | number[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    setCurrentTime(nextValue);
  };

  const handleSeekCommitted = async (_event: Event | React.SyntheticEvent, value: number | number[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    setCurrentTime(nextValue);

    if (isPlaying) {
      await startPlayback(nextValue);
    }
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
      const left = black
        ? Math.max(whiteIndex * whiteKeyWidth - blackKeyWidth / 2, 0)
        : whiteIndex * whiteKeyWidth;

      result.push({
        midi,
        isBlack: black,
        left,
        width: black ? blackKeyWidth : whiteKeyWidth,
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

        const barWidth = Math.max(key.width * (key.isBlack ? 0.88 : 0.92), 0.35);

        return {
          id: note.id,
          left: key.left + (key.width - barWidth) / 2,
          width: barWidth,
          bottom,
          height,
          color: BAR_COLORS[note.track % BAR_COLORS.length],
        };
      })
      .filter((bar): bar is NonNullable<typeof bar> => Boolean(bar));
  }, [currentTime, keyMap, notes, pianoRollHeight, playbackRate]);

  useEffect(() => {
    if (typeof window === 'undefined') {
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
      stopScheduledAudio();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, [error, stopScheduledAudio]);

  return (
    <Box ref={containerRef} className={styles.synthesiaShell} sx={{ height: 'calc(100dvh - 90px)', minHeight: 0 }}>
      <Box ref={headerRef}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={() => setControlsOpen(true)}
          >
            Controls & Settings
          </Button>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}
      </Box>

      <ControlsDialog
        open={controlsOpen}
        onClose={() => setControlsOpen(false)}
        onFileUpload={handleFileUpload}
        isPlaying={isPlaying}
        hasNotes={hasNotes}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        formatTime={formatTime}
        onPlayPause={() => {
          if (isPlaying) {
            pausePlayback();
          } else {
            void startPlayback(currentTime);
          }
        }}
        onStop={() => stopPlayback()}
        onPlaybackRateChange={setPlaybackRate}
        onSeek={handleSeek}
        onSeekCommitted={handleSeekCommitted}
      />

      <PianoRoll
        hasNotes={hasNotes}
        pianoRollHeight={pianoRollHeight}
        keys={keys}
        activeNoteSet={activeNoteSet}
        visibleBars={visibleBars}
      />
    </Box>
  );
}
