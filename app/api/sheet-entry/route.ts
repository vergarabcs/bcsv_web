import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1mPd-WUmyrwC5MEtBbADzyTmJJpOqr7MZPueloFUYyHo';
const SHEET_RANGE = 'RawLogs!A:F';
const GOOGLE_SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

let cachedSheets: ReturnType<typeof google.sheets> | null = null;

async function getSheetsClient(): Promise<ReturnType<typeof google.sheets>> {
  if (cachedSheets) return cachedSheets;

  if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable');
  }

  let credentials: { client_email?: string; private_key?: string };
  try {
    credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_KEY);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON');
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is missing client_email or private_key');
  }

  // Some env inputs preserve escaped newlines; normalize for JWT signing.
  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  cachedSheets = google.sheets({ version: 'v4', auth });
  return cachedSheets;
}

export async function POST(request: Request) {
  try {
    const sheets = await getSheetsClient();

    const body = await request.json();
    const { date, team1p1, team1p2, team2p1, team2p2, winner } = body;

    if (!team1p1 || !team1p2 || !team2p1 || !team2p2 || !winner) {
      return NextResponse.json({ error: 'All player fields and winner are required' }, { status: 400 });
    }

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
      updatedRange: response.data.updates?.updatedRange,
      updatedRows: response.data.updates?.updatedRows,
    });
  } catch (error) {
    console.error('Sheet entry error:', error);
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to write to Google Sheet', detail }, { status: 500 });
  }
}
