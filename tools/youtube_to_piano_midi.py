#!/usr/bin/env python3
"""Download YouTube audio, optionally trim it, and transcribe it to piano MIDI.

This script uses yt-dlp to fetch audio, ffmpeg to trim/convert it, and
Spotify's basic-pitch model to estimate a piano-style MIDI transcription.

Examples:
    /usr/bin/python3 tools/youtube_to_piano_midi.py \
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
        --start 30 \
        --end 75 \
        --output output.mid

    /usr/bin/python3 tools/youtube_to_piano_midi.py \
        "https://youtu.be/dQw4w9WgXcQ" \
        --start 12.5 \
        --minimum-frequency 27.5 \
        --maximum-frequency 4186.0
"""

from __future__ import annotations

import argparse
import csv
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download YouTube audio, trim by second offsets, and convert it to piano MIDI."
    )
    parser.add_argument("url", help="YouTube URL to download")
    parser.add_argument(
        "--start",
        type=float,
        default=0.0,
        help="Start time in seconds for the source audio trim (default: 0)",
    )
    parser.add_argument(
        "--end",
        type=float,
        default=None,
        help="End time in seconds for the source audio trim",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output MIDI path. Defaults to ./<video-title>.mid",
    )
    parser.add_argument(
        "--save-note-events",
        type=Path,
        default=None,
        help="Optional CSV output path for the detected note events",
    )
    parser.add_argument(
        "--minimum-note-length-ms",
        type=float,
        default=170.0,
        help="Minimum note length for MIDI events in milliseconds (higher values reduce short noise notes)",
    )
    parser.add_argument(
        "--onset-threshold",
        type=float,
        default=0.58,
        help="Minimum onset confidence from 0 to 1. Higher values reduce false notes.",
    )
    parser.add_argument(
        "--frame-threshold",
        type=float,
        default=0.35,
        help="Minimum sustain confidence from 0 to 1. Higher values reduce faint notes.",
    )
    parser.add_argument(
        "--minimum-note-amplitude",
        type=float,
        default=0.12,
        help="Drop detected notes with amplitudes below this value from 0 to 1.",
    )
    parser.add_argument(
        "--minimum-frequency",
        type=float,
        default=None,
        help="Discard notes below this frequency in Hz",
    )
    parser.add_argument(
        "--maximum-frequency",
        type=float,
        default=None,
        help="Discard notes above this frequency in Hz",
    )
    parser.add_argument(
        "--midi-tempo",
        type=float,
        default=120.0,
        help="Tempo to encode in the resulting MIDI file",
    )
    parser.add_argument(
        "--digital-piano",
        action="store_true",
        help="Use a cleaner preset for rendered or digital piano audio to reduce harmonic over-detection.",
    )
    parser.add_argument(
        "--no-melodia",
        action="store_true",
        help="Disable melodia post-processing. This can reduce extra notes on noisy audio.",
    )
    parser.add_argument(
        "--keep-intermediate",
        action="store_true",
        help="Keep the downloaded and trimmed audio files in a temp folder for inspection",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing output files",
    )
    return parser.parse_args()


def sanitize_stem(value: str) -> str:
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", value).strip("._")
    return stem or "youtube_audio"


def require_ffmpeg() -> str:
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        return ffmpeg_path

    raise RuntimeError(
        "ffmpeg was not found on PATH. Install ffmpeg first, then re-run this script."
    )


def apply_input_presets(args: argparse.Namespace) -> None:
    if args.digital_piano:
        if args.minimum_note_length_ms == 170.0:
            args.minimum_note_length_ms = 210.0
        if args.onset_threshold == 0.58:
            args.onset_threshold = 0.68
        if args.frame_threshold == 0.35:
            args.frame_threshold = 0.40
        if args.minimum_note_amplitude == 0.12:
            args.minimum_note_amplitude = 0.16
        if args.minimum_frequency is None:
            args.minimum_frequency = 55.0
        if args.maximum_frequency is None:
            args.maximum_frequency = 1760.0
        args.no_melodia = True


def validate_args(args: argparse.Namespace) -> None:
    if args.start < 0:
        raise ValueError("--start must be greater than or equal to 0")

    if args.end is not None and args.end <= args.start:
        raise ValueError("--end must be greater than --start")

    if args.minimum_note_length_ms <= 0:
        raise ValueError("--minimum-note-length-ms must be positive")

    if not 0 <= args.onset_threshold <= 1:
        raise ValueError("--onset-threshold must be between 0 and 1")

    if not 0 <= args.frame_threshold <= 1:
        raise ValueError("--frame-threshold must be between 0 and 1")

    if not 0 <= args.minimum_note_amplitude <= 1:
        raise ValueError("--minimum-note-amplitude must be between 0 and 1")

    if args.midi_tempo <= 0:
        raise ValueError("--midi-tempo must be positive")


def ensure_output_path(path: Path, force: bool) -> None:
    if path.exists() and not force:
        raise FileExistsError(f"Output already exists: {path}. Use --force to overwrite it.")
    path.parent.mkdir(parents=True, exist_ok=True)


def download_audio(url: str, working_dir: Path) -> tuple[Path, dict[str, Any]]:
    try:
        import yt_dlp
    except ImportError as exc:
        raise RuntimeError(
            "Missing dependency 'yt-dlp'. Run `python -m pip install -r tools/requirements.txt` inside the repo venv."
        ) from exc

    output_template = str(working_dir / "downloaded.%(ext)s")
    ydl_opts = {
        "format": "bestaudio/best",
        "noplaylist": True,
        "outtmpl": {"default": output_template},
        "quiet": False,
        "no_warnings": False,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)

    if isinstance(info, dict) and info.get("entries"):
        info = info["entries"][0]

    candidates = [
        path
        for path in working_dir.iterdir()
        if path.is_file() and path.name.startswith("downloaded.") and not path.name.endswith(".part")
    ]
    if not candidates:
        raise RuntimeError("yt-dlp completed without leaving a downloadable audio file behind.")

    audio_path = max(candidates, key=lambda path: path.stat().st_size)
    return audio_path, info


def trim_audio(
    ffmpeg_path: str,
    source_path: Path,
    target_path: Path,
    start_seconds: float,
    end_seconds: float | None,
) -> None:
    command = [ffmpeg_path, "-y", "-i", str(source_path)]
    if start_seconds > 0:
        command.extend(["-ss", f"{start_seconds:.3f}"])
    if end_seconds is not None:
        command.extend(["-t", f"{end_seconds - start_seconds:.3f}"])
    command.extend([
        "-vn",
        "-ac",
        "1",
        "-ar",
        "22050",
        str(target_path),
    ])

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(exc.stderr.strip() or "ffmpeg failed to trim the downloaded audio") from exc


def write_note_events_csv(note_events: list[tuple[Any, ...]], output_path: Path) -> None:
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["start_time_s", "end_time_s", "pitch_midi", "amplitude", "pitch_bends"])
        writer.writerows(note_events)


def filter_note_events(
    note_events: list[tuple[Any, ...]],
    minimum_note_amplitude: float,
) -> list[tuple[Any, ...]]:
    if minimum_note_amplitude <= 0:
        return note_events

    return [note for note in note_events if float(note[3]) >= minimum_note_amplitude]


def transcribe_to_midi(
    audio_path: Path,
    midi_path: Path,
    note_events_path: Path | None,
    minimum_note_length_ms: float,
    onset_threshold: float,
    frame_threshold: float,
    minimum_note_amplitude: float,
    minimum_frequency: float | None,
    maximum_frequency: float | None,
    midi_tempo: float,
    use_melodia: bool,
) -> tuple[int, int]:
    try:
        from basic_pitch import ICASSP_2022_MODEL_PATH
        from basic_pitch.inference import predict
        from basic_pitch.note_creation import note_events_to_midi
    except ImportError as exc:
        raise RuntimeError(
            "Missing dependency 'basic-pitch'. Run `python -m pip install -r tools/requirements.txt`, and on Python 3.12 also run `python -m pip install basic-pitch==0.4.0 --no-deps`."
        ) from exc

    _, _, note_events = predict(
        audio_path,
        model_or_model_path=ICASSP_2022_MODEL_PATH,
        onset_threshold=onset_threshold,
        frame_threshold=frame_threshold,
        minimum_note_length=minimum_note_length_ms,
        minimum_frequency=minimum_frequency,
        maximum_frequency=maximum_frequency,
        melodia_trick=use_melodia,
        midi_tempo=midi_tempo,
    )
    filtered_note_events = filter_note_events(note_events, minimum_note_amplitude)
    midi_data = note_events_to_midi(filtered_note_events, midi_tempo=midi_tempo)
    midi_data.write(str(midi_path))

    if note_events_path is not None:
        write_note_events_csv(filtered_note_events, note_events_path)

    return len(filtered_note_events), len(note_events) - len(filtered_note_events)


def build_default_output_path(info: dict[str, Any]) -> Path:
    title = str(info.get("title") or info.get("id") or "youtube_audio")
    return Path.cwd() / f"{sanitize_stem(title)}.mid"


def build_default_note_events_path(midi_path: Path) -> Path:
    return midi_path.with_name(f"{midi_path.stem}_note_events.csv")


def main() -> int:
    args = parse_args()
    apply_input_presets(args)

    try:
        validate_args(args)
        ffmpeg_path = require_ffmpeg()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    temp_root = Path(tempfile.mkdtemp(prefix="youtube_to_piano_midi_"))
    should_cleanup = not args.keep_intermediate

    try:
        print(f"Working directory: {temp_root}")
        print("Downloading audio...")
        downloaded_audio_path, info = download_audio(args.url, temp_root)

        midi_output_path = args.output.resolve() if args.output else build_default_output_path(info)
        note_events_output_path = None
        if args.save_note_events is not None:
            note_events_output_path = args.save_note_events.resolve()

        ensure_output_path(midi_output_path, args.force)
        if note_events_output_path is not None:
            ensure_output_path(note_events_output_path, args.force)

        trimmed_audio_path = temp_root / "trimmed_input.wav"
        print("Trimming and converting audio...")
        trim_audio(ffmpeg_path, downloaded_audio_path, trimmed_audio_path, args.start, args.end)

        if note_events_output_path is None and args.save_note_events is not None:
            note_events_output_path = build_default_note_events_path(midi_output_path)

        print("Running piano transcription...")
        if args.digital_piano:
            print("Using digital piano preset for cleaner note detection...")
        note_count, filtered_out_count = transcribe_to_midi(
            trimmed_audio_path,
            midi_output_path,
            note_events_output_path,
            args.minimum_note_length_ms,
            args.onset_threshold,
            args.frame_threshold,
            args.minimum_note_amplitude,
            args.minimum_frequency,
            args.maximum_frequency,
            args.midi_tempo,
            not args.no_melodia,
        )

        print(f"MIDI written to: {midi_output_path}")
        if note_events_output_path is not None:
            print(f"Note events written to: {note_events_output_path}")
        print(f"Detected note events: {note_count}")
        if filtered_out_count > 0:
            print(f"Filtered out weak note events: {filtered_out_count}")
        if args.end is None:
            print(f"Trimmed region: {args.start:.3f}s to end")
        else:
            print(f"Trimmed region: {args.start:.3f}s to {args.end:.3f}s")
        return 0
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    finally:
        if should_cleanup:
            shutil.rmtree(temp_root, ignore_errors=True)
        else:
            print(f"Intermediate files kept in: {temp_root}")


if __name__ == "__main__":
    sys.exit(main())