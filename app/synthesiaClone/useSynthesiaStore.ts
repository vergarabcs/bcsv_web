'use client';

import { Midi } from '@tonejs/midi';
import { create } from 'zustand';
import {
  buildStoredMidiId,
  deleteStoredMidi as deleteStoredMidiFromLibrary,
  findStoredMidiBySourceUrl,
  listStoredMidis,
  normalizeYoutubeUrl,
  saveStoredMidi,
  type StoredMidiRecord,
} from './browserMidiStore';
import type { MidiNote } from './types';

export type SynthesiaView = 'browser' | 'piano-roll';

type ConvertMidiResponse = {
  fileName?: string;
  midiBase64?: string;
  sourceUrl?: string;
  usedLambda?: boolean;
  lambdaError?: string;
  error?: string;
};

type SynthesiaStore = {
  currentView: SynthesiaView;
  youtubeUrl: string;
  storedMidis: StoredMidiRecord[];
  selectedStoredId: string | null;
  isLibraryReady: boolean;
  isConverting: boolean;
  error: string;
  statusMessage: string;
  notes: MidiNote[];
  midiName: string;
  duration: number;
  trackCount: number;
  tempo: number | null;
  setCurrentView: (view: SynthesiaView) => void;
  setYoutubeUrl: (value: string) => void;
  clearMessages: () => void;
  refreshStoredMidis: () => Promise<void>;
  loadMidiFromArrayBuffer: (arrayBuffer: ArrayBuffer, fileName: string) => Promise<boolean>;
  loadStoredMidiRecord: (record: StoredMidiRecord) => Promise<boolean>;
  saveUploadedMidiFile: (file: File) => Promise<boolean>;
  convertYoutubeToMidi: () => Promise<boolean>;
  deleteStoredMidiRecord: (record: StoredMidiRecord) => Promise<void>;
  downloadStoredMidiRecord: (record: StoredMidiRecord) => void;
};

const base64ToArrayBuffer = (value: string) => {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return bytes.buffer;
};

export const useSynthesiaStore = create<SynthesiaStore>((set, get) => ({
  currentView: 'browser',
  youtubeUrl: '',
  storedMidis: [],
  selectedStoredId: null,
  isLibraryReady: false,
  isConverting: false,
  error: '',
  statusMessage: '',
  notes: [],
  midiName: '',
  duration: 0,
  trackCount: 0,
  tempo: null,

  setCurrentView: (view) => set({ currentView: view }),
  setYoutubeUrl: (value) => set({ youtubeUrl: value }),
  clearMessages: () => set({ error: '', statusMessage: '' }),

  refreshStoredMidis: async () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const items = await listStoredMidis();
      set({ storedMidis: items, isLibraryReady: true });
    } catch (libraryError) {
      console.error('Unable to load the browser MIDI library.', libraryError);
      set({
        error: 'Unable to access browser storage for saved MIDI files.',
        statusMessage: '',
        isLibraryReady: true,
      });
    }
  },

  loadMidiFromArrayBuffer: async (arrayBuffer, fileName) => {
    set({ error: '' });

    try {
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

      set({
        midiName: fileName,
        notes: parsedNotes,
        duration: parsedDuration,
        trackCount: midi.tracks.length,
        tempo: midi.header.tempos[0] ? Math.round(midi.header.tempos[0].bpm) : null,
      });
      return true;
    } catch (loadError) {
      set({
        notes: [],
        midiName: '',
        duration: 0,
        trackCount: 0,
        tempo: null,
        error:
          loadError instanceof Error
            ? loadError.message
            : 'Unable to read that MIDI file. Please upload a standard .mid or .midi file.',
        statusMessage: '',
      });
      return false;
    }
  },

  loadStoredMidiRecord: async (record) => {
    set({ error: '', statusMessage: '', selectedStoredId: record.id });
    const loaded = await get().loadMidiFromArrayBuffer(record.bytes.slice(0), record.name);

    if (loaded) {
      set({
        statusMessage: `Loaded ${record.name} from browser storage.`,
        currentView: 'piano-roll',
      });
    }

    return loaded;
  },

  saveUploadedMidiFile: async (file) => {
    set({ error: '', statusMessage: '' });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loaded = await get().loadMidiFromArrayBuffer(arrayBuffer, file.name);

      if (!loaded) {
        return false;
      }

      const record: StoredMidiRecord = {
        id: buildStoredMidiId({ sourceType: 'upload', name: file.name }),
        name: file.name,
        createdAt: new Date().toISOString(),
        sourceType: 'upload',
        size: file.size,
        bytes: arrayBuffer.slice(0),
      };

      await saveStoredMidi(record);
      await get().refreshStoredMidis();

      set({
        selectedStoredId: record.id,
        statusMessage: `Saved ${file.name} to browser storage.`,
        currentView: 'piano-roll',
      });
      return true;
    } catch (uploadError) {
      set({
        error: uploadError instanceof Error ? uploadError.message : 'Unable to save that MIDI file locally.',
        statusMessage: '',
      });
      return false;
    }
  },

  convertYoutubeToMidi: async () => {
    const normalizedUrl = normalizeYoutubeUrl(get().youtubeUrl);

    if (!normalizedUrl) {
      set({ error: 'Paste a YouTube URL first.', statusMessage: '' });
      return false;
    }

    set({
      youtubeUrl: normalizedUrl,
      error: '',
      statusMessage: '',
      isConverting: true,
    });

    try {
      const cachedRecord = await findStoredMidiBySourceUrl(normalizedUrl);

      if (cachedRecord) {
        return await get().loadStoredMidiRecord(cachedRecord);
      }

      const response = await fetch('/api/synthesia/youtube-to-midi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const payload = (await response.json()) as ConvertMidiResponse;

      if (!response.ok || !payload.midiBase64 || !payload.fileName) {
        throw new Error(payload.error ?? 'Unable to convert that YouTube URL to MIDI.');
      }

      const arrayBuffer = base64ToArrayBuffer(payload.midiBase64);
      const record: StoredMidiRecord = {
        id: buildStoredMidiId({
          sourceType: 'youtube',
          sourceUrl: normalizedUrl,
          name: payload.fileName,
        }),
        name: payload.fileName,
        createdAt: new Date().toISOString(),
        sourceType: 'youtube',
        sourceUrl: payload.sourceUrl ?? normalizedUrl,
        size: arrayBuffer.byteLength,
        bytes: arrayBuffer.slice(0),
      };

      await saveStoredMidi(record);
      await get().refreshStoredMidis();
      set({ selectedStoredId: record.id });

      const loaded = await get().loadMidiFromArrayBuffer(arrayBuffer, record.name);
      if (!loaded) {
        return false;
      }

      set({
        statusMessage: payload.lambdaError
          ? `Saved the MIDI locally after falling back from Lambda: ${payload.lambdaError}`
          : `${payload.usedLambda ? 'Lambda' : 'Server'} conversion complete. MIDI saved to browser storage.`,
        currentView: 'piano-roll',
      });
      return true;
    } catch (conversionError) {
      set({
        error: conversionError instanceof Error ? conversionError.message : 'Unable to convert that YouTube URL.',
        statusMessage: '',
      });
      return false;
    } finally {
      set({ isConverting: false });
    }
  },

  deleteStoredMidiRecord: async (record) => {
    try {
      await deleteStoredMidiFromLibrary(record.id);
      await get().refreshStoredMidis();

      set((state) => ({
        selectedStoredId: state.selectedStoredId === record.id ? null : state.selectedStoredId,
        statusMessage: `Deleted ${record.name} from browser storage.`,
        error: '',
      }));
    } catch (deleteError) {
      set({
        error: deleteError instanceof Error ? deleteError.message : 'Unable to delete that saved MIDI file.',
        statusMessage: '',
      });
    }
  },

  downloadStoredMidiRecord: (record) => {
    const fileName = /\.mid(i)?$/i.test(record.name) ? record.name : `${record.name}.mid`;
    const blob = new Blob([record.bytes], { type: 'audio/midi' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);

    set({ error: '', statusMessage: `Downloaded ${fileName}.` });
  },
}));
