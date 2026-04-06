export const SYNTHESIA_AUDIO_CONFIG = {
	// Small startup buffer so scheduled notes begin cleanly.
	lookAheadSeconds: 0.03,
	// Piano sample release to reduce abrupt cutoff.
	releaseSeconds: 1.1,
	// Overall output level for the sampled piano.
	volumeDb: -6,
	// Slightly boost MIDI velocity so quieter notes remain audible.
	velocityMultiplier: 1.15,
	// Salamander piano samples used by Tone.js for more realistic playback.
	sampleBaseUrl: 'https://tonejs.github.io/audio/salamander/',
	sampleUrls: {
		A0: 'A0.mp3',
		C1: 'C1.mp3',
		'D#1': 'Ds1.mp3',
		'F#1': 'Fs1.mp3',
		A1: 'A1.mp3',
		C2: 'C2.mp3',
		'D#2': 'Ds2.mp3',
		'F#2': 'Fs2.mp3',
		A2: 'A2.mp3',
		C3: 'C3.mp3',
		'D#3': 'Ds3.mp3',
		'F#3': 'Fs3.mp3',
		A3: 'A3.mp3',
		C4: 'C4.mp3',
		'D#4': 'Ds4.mp3',
		'F#4': 'Fs4.mp3',
		A4: 'A4.mp3',
		C5: 'C5.mp3',
		'D#5': 'Ds5.mp3',
		'F#5': 'Fs5.mp3',
		A5: 'A5.mp3',
		C6: 'C6.mp3',
		'D#6': 'Ds6.mp3',
		'F#6': 'Fs6.mp3',
		A6: 'A6.mp3',
		C7: 'C7.mp3',
		'D#7': 'Ds7.mp3',
		'F#7': 'Fs7.mp3',
		A7: 'A7.mp3',
		C8: 'C8.mp3',
	},
} as const;

export const SYNTHESIA_PLAYBACK_CONFIG = {
	// Quick seek distance used by the rewind/forward controls.
	seekStepSeconds: 5,
} as const;

export const SYNTHESIA_ROLL_CONFIG = {
	// Visual-only speed multiplier for falling bars.
	// Higher values make bars appear longer/faster without changing playback duration.
	speed: 0.8,
} as const;
