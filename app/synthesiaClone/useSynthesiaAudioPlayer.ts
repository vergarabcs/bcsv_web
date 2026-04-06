import type { SyntheticEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SYNTHESIA_AUDIO_CONFIG } from './config';
import type { MidiNote } from './types';

type ToneModule = typeof import('tone');
type ToneSampler = import('tone').Sampler;
type ScheduledToneNote = { time: number; note: MidiNote };
type TonePart = import('tone').Part<ScheduledToneNote>;

type UseSynthesiaAudioPlayerArgs = {
  notes: MidiNote[];
  duration: number;
};

type UseSynthesiaAudioPlayerResult = {
  playbackRate: number;
  setPlaybackRate: (value: number) => void;
  currentTime: number;
  isPlaying: boolean;
  startPlayback: (startFrom?: number) => Promise<void>;
  pausePlayback: () => void;
  stopPlayback: (resetToStart?: boolean) => void;
  handleSeek: (_event: Event, value: number | number[]) => void;
  handleSeekCommitted: (_event: Event | SyntheticEvent, value: number | number[]) => Promise<void>;
  handleJump: (deltaSeconds: number) => Promise<void>;
};

export function useSynthesiaAudioPlayer({ notes, duration }: UseSynthesiaAudioPlayerArgs): UseSynthesiaAudioPlayerResult {
  const toneRef = useRef<ToneModule | null>(null);
  const samplerRef = useRef<ToneSampler | null>(null);
  const partRef = useRef<TonePart | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playStartWallClockRef = useRef(0);
  const playStartOffsetRef = useRef(0);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopScheduledAudio = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    partRef.current?.dispose();
    partRef.current = null;

    samplerRef.current?.releaseAll();

    const tone = toneRef.current;
    if (tone) {
      const transport = tone.getTransport();
      transport.stop();
      transport.cancel(0);
    }
  }, []);

  const ensureSampler = useCallback(async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      if (!toneRef.current) {
        toneRef.current = await import('tone');
      }

      const Tone = toneRef.current;
      await Tone.start();

      if (!samplerRef.current) {
        const sampler = new Tone.Sampler({
          urls: SYNTHESIA_AUDIO_CONFIG.sampleUrls,
          baseUrl: SYNTHESIA_AUDIO_CONFIG.sampleBaseUrl,
          release: SYNTHESIA_AUDIO_CONFIG.releaseSeconds,
        }).toDestination();

        sampler.volume.value = SYNTHESIA_AUDIO_CONFIG.volumeDb;
        samplerRef.current = sampler;
        await Tone.loaded();
      }

      const sampler = samplerRef.current;
      if (!sampler) {
        return null;
      }

      return { Tone, sampler };
    } catch (samplerError) {
      console.error('Failed to initialize Synthesia piano sampler.', samplerError);
      return null;
    }
  }, []);

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
    const instrument = await ensureSampler();

    if (!instrument) {
      return false;
    }

    const { Tone, sampler } = instrument;
    const overlappingNotes = notes.filter((note) => note.time < startFrom && note.time + note.duration > startFrom);
    const futureNotes = notes.filter((note) => note.time >= startFrom);
    const transport = Tone.getTransport();

    transport.stop();
    transport.cancel(0);
    partRef.current?.dispose();

    const startAt = Tone.now() + SYNTHESIA_AUDIO_CONFIG.lookAheadSeconds;

    overlappingNotes.forEach((note) => {
      const remainingDuration = Math.max((note.time + note.duration - startFrom) / playbackRate, 0.05);
      const velocity = Math.min(1, Math.max(0.12, note.velocity * SYNTHESIA_AUDIO_CONFIG.velocityMultiplier));

      sampler.triggerAttackRelease(note.name, remainingDuration, startAt, velocity);
    });

    if (futureNotes.length) {
      const part = new Tone.Part<ScheduledToneNote>((time, event) => {
        const { note } = event;
        const velocity = Math.min(1, Math.max(0.12, note.velocity * SYNTHESIA_AUDIO_CONFIG.velocityMultiplier));

        sampler.triggerAttackRelease(note.name, Math.max(note.duration / playbackRate, 0.05), time, velocity);
      }, futureNotes.map((note) => ({
        time: Math.max((note.time - startFrom) / playbackRate, 0),
        note,
      })));

      part.start(0);
      partRef.current = part;
    } else {
      partRef.current = null;
    }

    transport.start(`+${SYNTHESIA_AUDIO_CONFIG.lookAheadSeconds.toFixed(2)}`);
    return true;
  }, [ensureSampler, notes, playbackRate]);

  const startPlayback = useCallback(async (startFrom = currentTime) => {
    if (!notes.length) {
      return;
    }

    stopScheduledAudio();
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

  const stopPlayback = useCallback((resetToStart = true) => {
    stopScheduledAudio();
    setIsPlaying(false);

    if (resetToStart) {
      setCurrentTime(0);
    }
  }, [stopScheduledAudio]);

  const handleSeek = useCallback((_event: Event, value: number | number[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    setCurrentTime(nextValue);
  }, []);

  const seekToTime = useCallback(async (nextValue: number) => {
    const clampedValue = Math.min(Math.max(nextValue, 0), duration);
    setCurrentTime(clampedValue);

    if (isPlaying) {
      await startPlayback(clampedValue);
    }
  }, [duration, isPlaying, startPlayback]);

  const handleSeekCommitted = useCallback(async (_event: Event | SyntheticEvent, value: number | number[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    await seekToTime(nextValue);
  }, [seekToTime]);

  const handleJump = useCallback(async (deltaSeconds: number) => {
    await seekToTime(currentTime + deltaSeconds);
  }, [currentTime, seekToTime]);

  useEffect(() => {
    stopScheduledAudio();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [notes, stopScheduledAudio]);

  useEffect(() => {
    return () => {
      stopScheduledAudio();
      samplerRef.current?.dispose();
      samplerRef.current = null;
    };
  }, [stopScheduledAudio]);

  return {
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
  };
}
