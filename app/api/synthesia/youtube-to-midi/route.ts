import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import amplifyOutputs from '../../../../amplify_outputs.json';

const execFileAsync = promisify(execFile);
const YOUTUBE_URL_PATTERN = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i;
const LOCAL_TIMEOUT_MS = 4 * 60 * 1000;

type ConvertRequestBody = {
  url?: string;
  start?: number;
  end?: number;
};

type ConversionResponsePayload = {
  fileName: string;
  midiBase64: string;
  sourceUrl: string;
  usedLambda: boolean;
};

export const runtime = 'nodejs';
export const maxDuration = 300;

const parseNumber = (value: unknown) => {
  if (typeof value !== 'number') {
    return undefined;
  }

  return Number.isFinite(value) ? value : undefined;
};

const buildPythonCommand = (url: string, start?: number, end?: number) => {
  const pythonPath = existsSync(path.join(process.cwd(), '.venv', 'bin', 'python'))
    ? path.join(process.cwd(), '.venv', 'bin', 'python')
    : 'python3';

  const scriptPath = path.join(process.cwd(), 'tools', 'youtube_to_piano_midi.py');
  const args = [scriptPath, url, '--force'];

  if (typeof start === 'number' && start > 0) {
    args.push('--start', `${start}`);
  }

  if (typeof end === 'number' && end > (start ?? 0)) {
    args.push('--end', `${end}`);
  }

  return { pythonPath, args };
};

const convertWithLocalScript = async (
  url: string,
  start?: number,
  end?: number
): Promise<ConversionResponsePayload> => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'synthesia-youtube-midi-'));

  try {
    const { pythonPath, args } = buildPythonCommand(url, start, end);

    await execFileAsync(pythonPath, args, {
      cwd: tempDir,
      timeout: LOCAL_TIMEOUT_MS,
      maxBuffer: 20 * 1024 * 1024,
    });

    const generatedFiles = (await readdir(tempDir)).filter((name) => /\.mid(i)?$/i.test(name));
    const midiFileName = generatedFiles[0];

    if (!midiFileName) {
      throw new Error('The conversion finished without producing a MIDI file.');
    }

    const midiBuffer = await readFile(path.join(tempDir, midiFileName));

    return {
      fileName: midiFileName,
      midiBase64: midiBuffer.toString('base64'),
      sourceUrl: url,
      usedLambda: false,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

const resolveLambdaUrl = () => {
  const configuredUrl = (amplifyOutputs as { custom?: { youtubeToMidiFunctionUrl?: string } }).custom?.youtubeToMidiFunctionUrl;

  return process.env.YOUTUBE_TO_MIDI_LAMBDA_URL || process.env.AMPLIFY_YOUTUBE_TO_MIDI_FUNCTION_URL || configuredUrl;
};

const convertWithLambda = async (
  url: string,
  start?: number,
  end?: number
): Promise<ConversionResponsePayload | null> => {
  const lambdaUrl = resolveLambdaUrl();

  if (!lambdaUrl) {
    return null;
  }

  const response = await fetch(lambdaUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ url, start, end }),
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as Partial<ConversionResponsePayload> & {
    error?: string;
  } | null;

  if (!response.ok || !payload?.midiBase64 || !payload.fileName) {
    throw new Error(payload?.error ?? 'The Lambda conversion request failed.');
  }

  return {
    fileName: payload.fileName,
    midiBase64: payload.midiBase64,
    sourceUrl: payload.sourceUrl ?? url,
    usedLambda: true,
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConvertRequestBody;
    const url = body.url?.trim() ?? '';
    const start = parseNumber(body.start);
    const end = parseNumber(body.end);

    if (!url || !YOUTUBE_URL_PATTERN.test(url)) {
      return NextResponse.json(
        { error: 'Please provide a valid YouTube URL.' },
        { status: 400 }
      );
    }

    let payload: ConversionResponsePayload | null = null;
    let lambdaError = '';

    try {
      payload = await convertWithLambda(url, start, end);
    } catch (error) {
      lambdaError = error instanceof Error ? error.message : 'Unknown Lambda conversion failure.';
    }

    if (!payload) {
      payload = await convertWithLocalScript(url, start, end);
    }

    return NextResponse.json(
      {
        ...payload,
        lambdaError: lambdaError || undefined,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected conversion error.',
      },
      { status: 500 }
    );
  }
}
