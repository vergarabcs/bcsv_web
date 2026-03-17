import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const SPREADSHEET_ID = '1mPd-WUmyrwC5MEtBbADzyTmJJpOqr7MZPueloFUYyHo';
const REGISTRY_RANGE = 'Registry!A:Z';
const DEFAULT_SSM_PARAM_NAME = '/amplify/shared/d2i0ep7cpx287/GOOGLE_SERVICE_ACCOUNT_KEY';
const ssmClient = new SSMClient({});

const getServiceAccountKey = async () => {
  const paramName = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PARAM ?? DEFAULT_SSM_PARAM_NAME;
  const response = await ssmClient.send(
    new GetParameterCommand({ Name: paramName, WithDecryption: true })
  );
  const value = response.Parameter?.Value;
  if (!value) throw new Error(`Missing or empty SSM parameter: ${paramName}`);
  return value;
};

const parseServiceAccountKey = (raw: string) => {
  const value = raw.trim();

  const tryJson = (input: string) => {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {}
    return null;
  };

  const direct = tryJson(value);
  if (direct) return direct;

  try {
    const parsedString = JSON.parse(value);
    if (typeof parsedString === 'string') {
      const nested = tryJson(parsedString);
      if (nested) return nested;
    }
  } catch {}

  try {
    const decodedJson = tryJson(Buffer.from(value, 'base64').toString('utf8'));
    if (decodedJson) return decodedJson;
  } catch {}

  throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON (raw, JSON-string, or base64)');
};

export async function GET() {
  try {
    const keyRaw = await getServiceAccountKey();
    const credentials = parseServiceAccountKey(keyRaw);

    if (!credentials.client_email || !credentials.private_key) {
      return NextResponse.json(
        { error: 'Service account key is missing client_email or private_key' },
        { status: 500 }
      );
    }

    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: REGISTRY_RANGE,
    });

    const rows = response.data.values ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ players: [] });
    }

    const headers: string[] = rows[0].map((h: string) => String(h).trim());
    const playerColIndex = headers.findIndex(
      (h) => h.toLowerCase() === 'player'
    );

    if (playerColIndex === -1) {
      return NextResponse.json(
        { error: "Could not find 'Player' column in Registry sheet" },
        { status: 500 }
      );
    }

    const players = rows
      .slice(1)
      .map((row: string[]) => String(row[playerColIndex] ?? '').trim())
      .filter((name: string) => name.length > 0);

    return NextResponse.json({ players });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
