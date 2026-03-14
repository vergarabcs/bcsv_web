import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const SPREADSHEET_ID = '1mPd-WUmyrwC5MEtBbADzyTmJJpOqr7MZPueloFUYyHo';
const SHEET_RANGE = 'RawLogs!A:F';
const SSM_PARAM_NAME =
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PARAM ??
  '/amplify/shared/d2i0ep7cpx287/GOOGLE_SERVICE_ACCOUNT_KEY';

let cachedSheets: ReturnType<typeof google.sheets> | null = null;
const ssmClient = new SSMClient({});

async function getSheetsClient(): Promise<ReturnType<typeof google.sheets>> {
  if (cachedSheets) return cachedSheets;

  const { Parameter } = await ssmClient.send(
    new GetParameterCommand({ Name: SSM_PARAM_NAME, WithDecryption: true })
  );

  if (!Parameter?.Value) {
    throw new Error(`SSM parameter not found or empty: ${SSM_PARAM_NAME}`);
  }

  const credentials = JSON.parse(Parameter.Value);
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
    return NextResponse.json({ error: 'Failed to write to Google Sheet' }, { status: 500 });
  }
}
