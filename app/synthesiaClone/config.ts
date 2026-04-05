export const SYNTHESIA_AUDIO_CONFIG = {
	// Extra tail time added after each MIDI note to reduce choppy cutoff.
	sustainSeconds: 0.08,
	// Master gain multiplier for synth output.
	volume: 1,
} as const;

export const SYNTHESIA_ROLL_CONFIG = {
	// Visual-only speed multiplier for falling bars.
	// Higher values make bars appear longer/faster without changing playback duration.
	speed: 0.8,
} as const;
