'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Midi } from '@tonejs/midi';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import PianoIcon from '@mui/icons-material/Piano';
import styles from './SynthesiaClone.module.css';

type MidiNote = {
  id: string;
  midi: number;
  time: number;
  duration: number;
  velocity: number;
  track: number;
  name: string;
};

type PianoKey = {
  midi: number;
  isBlack: boolean;
  left: number;
  width: number;
  label: string;
};

const MIDI_LOW = 21;
const MIDI_HIGH = 108;
const WHITE_KEY_WIDTH = 28;
const BLACK_KEY_WIDTH = 18;
const KEYBOARD_HEIGHT = 92;
const PIANO_ROLL_HEIGHT = 430;
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
        const peakVolume = 0.03 + note.velocity * 0.1;

        oscillator.type = note.track % 2 === 0 ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(midiToFrequency(note.midi), audioContext.currentTime);

        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(peakVolume, audioContext.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + playDuration);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + playDuration + 0.03);

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
    let whiteIndex = 0;
    const result: PianoKey[] = [];

    for (let midi = visibleRange.start; midi <= visibleRange.end; midi += 1) {
      const black = isBlackKey(midi);
      const left = black
        ? Math.max(whiteIndex * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2, 0)
        : whiteIndex * WHITE_KEY_WIDTH;

      result.push({
        midi,
        isBlack: black,
        left,
        width: black ? BLACK_KEY_WIDTH : WHITE_KEY_WIDTH,
        label: getNoteLabel(midi),
      });

      if (!black) {
        whiteIndex += 1;
      }
    }

    return result;
  }, [visibleRange.end, visibleRange.start]);

  const keyMap = useMemo(() => new Map(keys.map((key) => [key.midi, key])), [keys]);

  const keyboardWidth = useMemo(() => {
    const whiteKeyCount = keys.filter((key) => !key.isBlack).length;
    return Math.max(whiteKeyCount * WHITE_KEY_WIDTH, 720);
  }, [keys]);

  const activeNoteSet = useMemo(() => {
    const activeNotes = new Set<number>();

    notes.forEach((note) => {
      if (currentTime >= note.time && currentTime <= note.time + note.duration) {
        activeNotes.add(note.midi);
      }
    });

    return activeNotes;
  }, [currentTime, notes]);

  const visibleBars = useMemo(() => {
    const scaledPixelsPerSecond = PIXELS_PER_SECOND * playbackRate;

    return notes
      .map((note) => {
        const key = keyMap.get(note.midi);
        if (!key) {
          return null;
        }

        const height = Math.max(note.duration * scaledPixelsPerSecond, 12);
        const bottom = KEYBOARD_HEIGHT + (note.time - currentTime) * scaledPixelsPerSecond;

        if (bottom + height < KEYBOARD_HEIGHT || bottom > PIANO_ROLL_HEIGHT) {
          return null;
        }

        return {
          id: note.id,
          left: key.left + 1,
          width: Math.max(key.width - 2, 8),
          bottom,
          height,
          color: BAR_COLORS[note.track % BAR_COLORS.length],
        };
      })
      .filter((bar): bar is NonNullable<typeof bar> => Boolean(bar));
  }, [currentTime, keyMap, notes, playbackRate]);

  useEffect(() => {
    return () => {
      stopScheduledAudio();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, [stopScheduledAudio]);

  return (
    <Box className={styles.synthesiaShell}>
      <Box>
        <Typography variant="h4" gutterBottom>
          MIDI Synthesia Clone
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload a MIDI file to preview it with a falling-note piano roll and built-in synth playback.
        </Typography>
      </Box>

      <Paper className={styles.controlsCard} sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
            <Button component="label" variant="contained" startIcon={<UploadFileIcon />}>
              Upload MIDI
              <input hidden type="file" accept=".mid,.midi,audio/midi,audio/x-midi" onChange={handleFileUpload} />
            </Button>

            <Button
              variant="outlined"
              startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              onClick={() => {
                if (isPlaying) {
                  pausePlayback();
                } else {
                  void startPlayback(currentTime);
                }
              }}
              disabled={!notes.length}
            >
              {isPlaying ? 'Pause' : currentTime > 0 ? 'Resume' : 'Play'}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={<StopIcon />}
              onClick={() => stopPlayback()}
              disabled={!notes.length}
            >
              Stop
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap">
            <Chip icon={<PianoIcon />} label={midiName || 'No MIDI loaded'} color={midiName ? 'primary' : 'default'} />
            <Chip label={`${notes.length} notes`} variant="outlined" />
            <Chip label={`${trackCount} tracks`} variant="outlined" />
            <Chip label={`Length ${formatTime(duration)}`} variant="outlined" />
            {tempo ? <Chip label={`${tempo} BPM`} variant="outlined" /> : null}
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
              onChange={(_event, value) => setPlaybackRate(Array.isArray(value) ? value[0] : value)}
              disabled={isPlaying}
              sx={{ maxWidth: 280 }}
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
              onChange={handleSeek}
              onChangeCommitted={handleSeekCommitted}
              disabled={!notes.length}
            />
            <Typography variant="body2" className={styles.progressLabel}>
              {formatTime(duration)}
            </Typography>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {!notes.length && !error ? (
            <Alert severity="info">
              Try a simple piano MIDI first. The keyboard automatically zooms to the notes used in your file.
            </Alert>
          ) : null}
        </Stack>
      </Paper>

      <Paper className={styles.rollCard} sx={{ p: 1.5 }}>
        <div className={styles.rollViewport}>
          <div className={styles.rollInner} style={{ width: keyboardWidth }}>
            <div className={styles.laneOverlay} />
            <div className={styles.nowLine} />

            {notes.length ? (
              visibleBars.map((bar) => (
                <div
                  key={bar.id}
                  className={styles.noteBar}
                  style={{
                    left: bar.left,
                    width: bar.width,
                    bottom: bar.bottom,
                    height: bar.height,
                    background: bar.color,
                  }}
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                <Typography variant="h6">Upload a MIDI file to begin</Typography>
                <Typography variant="body2">You&apos;ll see falling notes here with a playable piano keyboard at the bottom.</Typography>
              </div>
            )}

            <div className={styles.keyboard} style={{ width: keyboardWidth }}>
              {keys.filter((key) => !key.isBlack).map((key) => (
                <div
                  key={key.midi}
                  className={`${styles.whiteKey} ${activeNoteSet.has(key.midi) ? styles.whiteKeyActive : ''}`}
                  style={{ left: key.left, width: key.width }}
                >
                  <span className={styles.keyLabel}>{key.label}</span>
                </div>
              ))}

              {keys.filter((key) => key.isBlack).map((key) => (
                <div
                  key={key.midi}
                  className={`${styles.blackKey} ${activeNoteSet.has(key.midi) ? styles.blackKeyActive : ''}`}
                  style={{ left: key.left, width: key.width }}
                />
              ))}
            </div>
          </div>
        </div>
      </Paper>
    </Box>
  );
}
