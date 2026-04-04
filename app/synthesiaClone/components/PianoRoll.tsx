'use client';

import { Paper, Typography } from '@mui/material';
import styles from '../SynthesiaClone.module.css';
import type { PianoKey, VisibleBar } from '../types';

type PianoRollProps = {
  hasNotes: boolean;
  pianoRollHeight: number;
  keys: PianoKey[];
  activeNoteSet: Set<number>;
  visibleBars: VisibleBar[];
};

export function PianoRoll({
  hasNotes,
  pianoRollHeight,
  keys,
  activeNoteSet,
  visibleBars,
}: PianoRollProps) {
  return (
    <Paper className={styles.rollCard} sx={{ p: { xs: '1px', sm: 1 }, flex: 1, display: 'flex', minHeight: 0, height: '100%' }}>
      <div className={styles.rollViewport} style={{ height: '100%' }}>
        <div className={styles.rollInner} style={{ height: `${pianoRollHeight}px`, minHeight: `${pianoRollHeight}px` }}>
          <div className={styles.laneOverlay} />
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
              <Typography variant="h6">Upload a MIDI file to begin</Typography>
              <Typography variant="body2">
                You&apos;ll see falling notes here with a playable piano keyboard at the bottom.
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
