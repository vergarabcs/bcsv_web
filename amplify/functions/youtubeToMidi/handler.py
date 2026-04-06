from __future__ import annotations

import base64
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any


DEFAULT_MINIMUM_NOTE_LENGTH_MS = 170.0
DEFAULT_ONSET_THRESHOLD = 0.58
DEFAULT_FRAME_THRESHOLD = 0.35
DEFAULT_MINIMUM_NOTE_AMPLITUDE = 0.12
DEFAULT_MIDI_TEMPO = 120.0


def sanitize_stem(value: str) -> str:
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", value).strip("._")
    return stem or "youtube_audio"


def require_ffmpeg() -> str:
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        return ffmpeg_path

    raise RuntimeError("ffmpeg was not found on PATH in the Lambda container.")


def apply_piano_presets(options: dict[str, Any]) -> None:
    if options.get("minimum_note_length_ms", DEFAULT_MINIMUM_NOTE_LENGTH_MS) == DEFAULT_MINIMUM_NOTE_LENGTH_MS:
        options["minimum_note_length_ms"] = 210.0
    if options.get("onset_threshold", DEFAULT_ONSET_THRESHOLD) == DEFAULT_ONSET_THRESHOLD:
        options["onset_threshold"] = 0.68
    if options.get("frame_threshold", DEFAULT_FRAME_THRESHOLD) == DEFAULT_FRAME_THRESHOLD:
        options["frame_threshold"] = 0.40
    if options.get("minimum_note_amplitude", DEFAULT_MINIMUM_NOTE_AMPLITUDE) == DEFAULT_MINIMUM_NOTE_AMPLITUDE:
        options["minimum_note_amplitude"] = 0.16
    if options.get("minimum_frequency") is None:
        options["minimum_frequency"] = 55.0
    if options.get("maximum_frequency") is None:
        options["maximum_frequency"] = 1760.0
    options["no_melodia"] = True


def validate_options(options: dict[str, Any]) -> None:
    start = float(options.get("start", 0.0))
    end = options.get("end")
    minimum_note_length_ms = float(options.get("minimum_note_length_ms", 210.0))
    onset_threshold = float(options.get("onset_threshold", 0.68))
    frame_threshold = float(options.get("frame_threshold", 0.40))
    minimum_note_amplitude = float(options.get("minimum_note_amplitude", 0.16))
    midi_tempo = float(options.get("midi_tempo", DEFAULT_MIDI_TEMPO))

    if start < 0:
        raise ValueError("start must be greater than or equal to 0")
    if end is not None and float(end) <= start:
        raise ValueError("end must be greater than start")
    if minimum_note_length_ms <= 0:
        raise ValueError("minimum_note_length_ms must be positive")
    if not 0 <= onset_threshold <= 1:
        raise ValueError("onset_threshold must be between 0 and 1")
    if not 0 <= frame_threshold <= 1:
        raise ValueError("frame_threshold must be between 0 and 1")
    if not 0 <= minimum_note_amplitude <= 1:
        raise ValueError("minimum_note_amplitude must be between 0 and 1")
    if midi_tempo <= 0:
        raise ValueError("midi_tempo must be positive")


def download_audio(url: str, working_dir: Path) -> tuple[Path, dict[str, Any]]:
    try:
        import yt_dlp
    except ImportError as exc:
        raise RuntimeError("Missing dependency 'yt-dlp' in the Lambda image.") from exc

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
        raise RuntimeError("Missing dependency 'basic-pitch' in the Lambda image.") from exc

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

    return len(filtered_note_events), len(note_events) - len(filtered_note_events)


def response(status_code: int, body: dict[str, Any]) -> dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
        "body": json.dumps(body),
    }


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or "POST"
    )
    if method == "OPTIONS":
        return response(200, {"ok": True})

    try:
        raw_body = event.get("body") or "{}"
        if event.get("isBase64Encoded") and isinstance(raw_body, str):
            raw_body = base64.b64decode(raw_body).decode("utf-8")
        payload = json.loads(raw_body) if isinstance(raw_body, str) else raw_body

        if not isinstance(payload, dict):
            raise ValueError("Expected a JSON object payload")

        url = str(payload.get("url") or "").strip()
        if not url:
            return response(400, {"error": "Missing required field: url"})

        options: dict[str, Any] = {
            "start": float(payload.get("start", 0.0) or 0.0),
            "end": payload.get("end"),
            "minimum_note_length_ms": float(payload.get("minimum_note_length_ms", DEFAULT_MINIMUM_NOTE_LENGTH_MS)),
            "onset_threshold": float(payload.get("onset_threshold", DEFAULT_ONSET_THRESHOLD)),
            "frame_threshold": float(payload.get("frame_threshold", DEFAULT_FRAME_THRESHOLD)),
            "minimum_note_amplitude": float(payload.get("minimum_note_amplitude", DEFAULT_MINIMUM_NOTE_AMPLITUDE)),
            "minimum_frequency": payload.get("minimum_frequency"),
            "maximum_frequency": payload.get("maximum_frequency"),
            "midi_tempo": float(payload.get("midi_tempo", DEFAULT_MIDI_TEMPO)),
            "no_melodia": bool(payload.get("no_melodia", True)),
        }
        if options["minimum_frequency"] is not None:
            options["minimum_frequency"] = float(options["minimum_frequency"])
        if options["maximum_frequency"] is not None:
            options["maximum_frequency"] = float(options["maximum_frequency"])
        if options["end"] is not None:
            options["end"] = float(options["end"])

        apply_piano_presets(options)
        validate_options(options)
        ffmpeg_path = require_ffmpeg()

        temp_root = Path(tempfile.mkdtemp(prefix="youtube_to_piano_midi_"))

        try:
            downloaded_audio_path, info = download_audio(url, temp_root)
            title = str(info.get("title") or info.get("id") or "youtube_audio")
            midi_output_path = temp_root / f"{sanitize_stem(title)}.mid"
            trimmed_audio_path = temp_root / "trimmed_input.wav"

            trim_audio(
                ffmpeg_path,
                downloaded_audio_path,
                trimmed_audio_path,
                float(options["start"]),
                options["end"],
            )
            note_count, filtered_out_count = transcribe_to_midi(
                trimmed_audio_path,
                midi_output_path,
                float(options["minimum_note_length_ms"]),
                float(options["onset_threshold"]),
                float(options["frame_threshold"]),
                float(options["minimum_note_amplitude"]),
                options["minimum_frequency"],
                options["maximum_frequency"],
                float(options["midi_tempo"]),
                not bool(options["no_melodia"]),
            )
            midi_base64 = base64.b64encode(midi_output_path.read_bytes()).decode("utf-8")

            return response(
                200,
                {
                    "fileName": midi_output_path.name,
                    "title": title,
                    "sourceUrl": url,
                    "noteCount": note_count,
                    "filteredOutCount": filtered_out_count,
                    "midiBase64": midi_base64,
                },
            )
        finally:
            shutil.rmtree(temp_root, ignore_errors=True)
    except Exception as exc:
        return response(500, {"error": str(exc)})
