import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createHash } from 'node:crypto';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

type LogSheetEntryRequest = {
  date?: string;
  team1p1?: string;
  team1p2?: string;
  team2p1?: string;
  team2p2?: string;
  winner?: string;
};

const SPREADSHEET_ID = '1mPd-WUmyrwC5MEtBbADzyTmJJpOqr7MZPueloFUYyHo';
const SHEET_RANGE = 'RawLogs!A:F';
const DEFAULT_SSM_PARAM_NAME = '/amplify/shared/d2i0ep7cpx287/GOOGLE_SERVICE_ACCOUNT_KEY';
const ssmClient = new SSMClient({});

type ParsedKeyResult = {
  credentials: { client_email?: string; private_key?: string };
  format: 'raw-json' | 'json-string' | 'base64-json';
};

const buildSecretDiagnostics = (raw: string) => {
  const trimmed = raw.trim();
  const preview = trimmed.slice(0, 24).replace(/\s/g, ' ');
  const fingerprint = createHash('sha256').update(trimmed).digest('hex').slice(0, 12);

  return {
    source: 'ssm',
    exists: true,
    length: raw.length,
    trimmedLength: trimmed.length,
    startsWith: preview,
    hasNewline: /\n/.test(raw),
    hasEscapedNewline: /\\n/.test(raw),
    sha256_12: fingerprint,
  };
};

const getServiceAccountKeyFromSsm = async () => {
  const paramName = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PARAM ?? DEFAULT_SSM_PARAM_NAME;
  const response = await ssmClient.send(
    new GetParameterCommand({
      Name: paramName,
      WithDecryption: true,
    })
  );
  const value = response.Parameter?.Value;

  if (!value) {
    throw new Error(`Missing or empty SSM parameter: ${paramName}`);
  }

  return { value, paramName };
};

const parseServiceAccountKey = (raw: string): ParsedKeyResult => {
  const value = raw.trim();
  const attemptErrors: string[] = [];

  const tryParseJsonObject = (input: string) => {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as { client_email?: string; private_key?: string };
      }
      attemptErrors.push('parsed value is not a JSON object');
    } catch {
      attemptErrors.push('JSON.parse failed for object parse');
    }
    return null;
  };

  // 1) Most common: secret value is raw JSON object text.
  const direct = tryParseJsonObject(value);
  if (direct) return { credentials: direct, format: 'raw-json' };

  // 2) Sometimes secret is JSON-stringified once more, e.g. "{\"type\":...}".
  try {
    const parsedString = JSON.parse(value);
    if (typeof parsedString === 'string') {
      const nested = tryParseJsonObject(parsedString);
      if (nested) return { credentials: nested, format: 'json-string' };
    } else {
      attemptErrors.push('JSON string parse succeeded but result was not a string');
    }
  } catch {
    attemptErrors.push('JSON.parse failed for string-wrapper parse');
  }

  // 3) Sometimes secret is stored as base64(JSON).
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    const decodedJson = tryParseJsonObject(decoded);
    if (decodedJson) return { credentials: decodedJson, format: 'base64-json' };
  } catch {
    attemptErrors.push('base64 decode parse failed');
  }

  throw new Error(
    `GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON. Expected raw JSON, JSON string, or base64(JSON). parseAttempts=${attemptErrors.join('; ')}`
  );
};

export async function POST(request: NextRequest) {
  try {
    const body: LogSheetEntryRequest = await request.json();
    const { date, team1p1, team1p2, team2p1, team2p2, winner } = body;

    if (!team1p1 || !team1p2 || !team2p1 || !team2p2 || !winner) {
      return NextResponse.json(
        { error: 'All player fields and winner are required' },
        { status: 400 }
      );
    }

    const { value: keyRaw, paramName } = await getServiceAccountKeyFromSsm();

    const secretDiagnostics = buildSecretDiagnostics(keyRaw);

    const parsed = (() => {
      try {
        return parseServiceAccountKey(keyRaw);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown parse error';
        throw new Error(
          `${reason}. paramName=${paramName} diagnostics=${JSON.stringify(secretDiagnostics)}`
        );
      }
    })();

    const credentials = parsed.credentials;

    if (!credentials.client_email || !credentials.private_key) {
      return NextResponse.json(
        {
          error: `GOOGLE_SERVICE_ACCOUNT_KEY is missing client_email or private_key. paramName=${paramName} format=${parsed.format} diagnostics=${JSON.stringify(secretDiagnostics)}`,
        },
        { status: 500 }
      );
    }

    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const row = [date ?? new Date().toISOString(), team1p1, team1p2, team2p1, team2p2, winner];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_RANGE,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        majorDimension: 'ROWS',
        values: [row],
      },
    });

    return NextResponse.json({
      success: true,
      updatedRange: response.data.updates?.updatedRange ?? null,
      updatedRows: response.data.updates?.updatedRows ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
