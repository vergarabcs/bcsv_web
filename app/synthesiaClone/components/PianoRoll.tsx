'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Paper, Typography } from '@mui/material';
import styles from '../SynthesiaClone.module.css';
import { SYNTHESIA_ROLL_CONFIG } from '../config';
import type { MidiNote, PianoKey, VisibleBar } from '../types';

type PianoRollProps = {
  pianoRollHeight: number;
  notes: MidiNote[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  onSeekToTime: (nextTime: number) => void | Promise<void>;
};

const MIDI_LOW = 21;
const MIDI_HIGH = 108;
const BLACK_KEY_WIDTH_RATIO = 0.65;
const KEYBOARD_HEIGHT = 92;
const PIXELS_PER_SECOND = 140;
const BAR_COLORS = ['#7dd3fc', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22d3ee'];
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);
const SEEK_VISUAL_ANIMATION_MS = 220;
const SEEK_VISUAL_MIN_DELTA_SECONDS = 0.18;

const isBlackKey = (midi: number) => BLACK_KEYS.has(midi % 12);

const getNoteLabel = (midi: number) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  return `${noteNames[midi % 12]}${octave}`;
};

export function PianoRoll({
  pianoRollHeight,
  notes,
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  onSeekToTime,
}: PianoRollProps) {
  const visualAnimationFrameRef = useRef<number | null>(null);
  const scrubAnimationFrameRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragAnchorYRef = useRef(0);
  const dragAnchorTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const pendingSeekTimeRef = useRef<number | null>(null);
  const [visualCurrentTime, setVisualCurrentTime] = useState(0);
  const visualCurrentTimeRef = useRef(0);
  const hasNotes = notes.length > 0;
  const scaledPixelsPerSecond = PIXELS_PER_SECOND * SYNTHESIA_ROLL_CONFIG.speed * playbackRate;

  const clampTime = useCallback((nextTime: number) => {
    return Math.min(Math.max(nextTime, 0), duration);
  }, [duration]);

  const flushPendingSeek = useCallback(() => {
    scrubAnimationFrameRef.current = null;

    const pendingSeek = pendingSeekTimeRef.current;
    if (pendingSeek === null) {
      return;
    }

    pendingSeekTimeRef.current = null;
    currentTimeRef.current = pendingSeek;
    void onSeekToTime(pendingSeek);
  }, [onSeekToTime]);

  const scheduleSeek = useCallback((nextTime: number) => {
    pendingSeekTimeRef.current = clampTime(nextTime);

    if (scrubAnimationFrameRef.current !== null) {
      return;
    }

    scrubAnimationFrameRef.current = window.requestAnimationFrame(flushPendingSeek);
  }, [clampTime, flushPendingSeek]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!hasNotes) {
      return;
    }

    event.preventDefault();
    const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    const deltaSeconds = dominantDelta / scaledPixelsPerSecond;
    scheduleSeek(currentTimeRef.current + deltaSeconds);
  }, [hasNotes, scaledPixelsPerSecond, scheduleSeek]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasNotes) {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    dragAnchorYRef.current = event.clientY;
    dragAnchorTimeRef.current = currentTimeRef.current;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [hasNotes]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const deltaPixels = event.clientY - dragAnchorYRef.current;
    const deltaSeconds = deltaPixels / scaledPixelsPerSecond;
    scheduleSeek(dragAnchorTimeRef.current + deltaSeconds);
  }, [scaledPixelsPerSecond, scheduleSeek]);

  const clearPointerTracking = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    activePointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const stopVisualPlayheadAnimation = useCallback(() => {
    if (visualAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(visualAnimationFrameRef.current);
      visualAnimationFrameRef.current = null;
    }
  }, []);

  const rollCurrentTime = isPlaying ? currentTime : visualCurrentTime;

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

  const activeNoteSet = useMemo(() => {
    const activeNotes = new Set<number>();

    notes.forEach((note) => {
      if (rollCurrentTime >= note.time && rollCurrentTime <= note.time + note.duration) {
        activeNotes.add(note.midi);
      }
    });

    return activeNotes;
  }, [notes, rollCurrentTime]);

  const visibleBars = useMemo<VisibleBar[]>(() => {
    return notes
      .map((note) => {
        const key = keyMap.get(note.midi);
        if (!key) {
          return null;
        }

        const height = Math.max(note.duration * scaledPixelsPerSecond, 12);
        const bottom = KEYBOARD_HEIGHT + (note.time - rollCurrentTime) * scaledPixelsPerSecond;

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
  }, [keyMap, notes, pianoRollHeight, playbackRate, rollCurrentTime]);

  useEffect(() => {
    visualCurrentTimeRef.current = visualCurrentTime;
  }, [visualCurrentTime]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isPlaying) {
      stopVisualPlayheadAnimation();
      visualCurrentTimeRef.current = currentTime;
      return;
    }

    const from = visualCurrentTimeRef.current;
    const delta = Math.abs(currentTime - from);
    const shouldAnimate = delta >= SEEK_VISUAL_MIN_DELTA_SECONDS;

    if (!shouldAnimate) {
      stopVisualPlayheadAnimation();
      visualCurrentTimeRef.current = currentTime;
      setVisualCurrentTime(currentTime);
      return;
    }

    stopVisualPlayheadAnimation();
    const startTime = performance.now();

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - startTime) / SEEK_VISUAL_ANIMATION_MS, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = from + (currentTime - from) * easedProgress;

      visualCurrentTimeRef.current = nextValue;
      setVisualCurrentTime(nextValue);

      if (progress < 1) {
        visualAnimationFrameRef.current = window.requestAnimationFrame(animate);
        return;
      }

      visualAnimationFrameRef.current = null;
    };

    visualAnimationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      stopVisualPlayheadAnimation();
    };
  }, [currentTime, isPlaying, stopVisualPlayheadAnimation]);

  useEffect(() => {
    return () => {
      stopVisualPlayheadAnimation();

      if (scrubAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(scrubAnimationFrameRef.current);
        scrubAnimationFrameRef.current = null;
      }
    };
  }, [stopVisualPlayheadAnimation]);

  const whiteKeyCount = useMemo(() => keys.filter((key) => !key.isBlack).length || 1, [keys]);
  const rollInnerStyle = {
    height: `${pianoRollHeight}px`,
    minHeight: `${pianoRollHeight}px`,
    '--white-key-width': `${100 / whiteKeyCount}%`,
  } as React.CSSProperties;

  return (
    <Paper
      className={styles.rollCard}
      sx={{ px: { xs: '1px', sm: 1 }, py: '1px', flex: 1, display: 'flex', minHeight: 0, height: '100%' }}
    >
      <div className={styles.rollViewport} style={{ height: '100%' }}>
        <div className={styles.rollInner} style={rollInnerStyle}>
          <div className={styles.laneOverlay} />
          <div
            className={styles.scrubSurface}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={clearPointerTracking}
            onPointerCancel={clearPointerTracking}
            onLostPointerCapture={clearPointerTracking}
          />
          <div className={styles.nowLine} />

          {hasNotes ? (
            visibleBars.map((bar) => (
              <div
                key={bar.id}
                className={styles.noteBar}
                style={{
                  left: `${bar.left}%`,
                  width: `${bar.width}%`,
                  bottom: bar.bottom,
                  height: bar.height,
                  background: bar.color,
                }}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <Typography variant="h6">Load or upload a MIDI file to begin</Typography>
              <Typography variant="body2">
                Upload a `.mid` file, then play it here with the falling-note keyboard.
              </Typography>
            </div>
          )}

          <div className={styles.keyboard}>
            {keys.filter((key) => !key.isBlack).map((key) => (
              <div
                key={key.midi}
                className={`${styles.whiteKey} ${activeNoteSet.has(key.midi) ? styles.whiteKeyActive : ''}`}
                style={{ left: `${key.left}%`, width: `${key.width}%` }}
              >
                <span className={styles.keyLabel}>{key.label}</span>
              </div>
            ))}

            {keys.filter((key) => key.isBlack).map((key) => (
              <div
                key={key.midi}
                className={`${styles.blackKey} ${activeNoteSet.has(key.midi) ? styles.blackKeyActive : ''}`}
                style={{ left: `${key.left}%`, width: `${key.width}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </Paper>
  );
}
