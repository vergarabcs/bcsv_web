import fs from 'fs';
import path from 'path';
import type { Page } from '@playwright/test';

/**
 * Save the persisted zustand store from localStorage to a timestamped file.
 * Returns the written filename.
 */
export async function saveZustandState(
	page: Page,
	outDir = 'tests_e2e/test-artifacts',
	key = 'doubles-queue-store'
): Promise<string> {
	const persisted = await page.evaluate((k) => localStorage.getItem(k), key);
	await fs.promises.mkdir(outDir, { recursive: true });
	const filename = path.join(outDir, `doubles-queue-state-${Date.now()}.json`);
	await fs.promises.writeFile(filename, persisted ?? '{}', 'utf8');
	return filename;
}

/**
 * Generate a stable test id for a Win button given a court name and team number.
 */
export function generateWinTestId(courtName: string, team: 1 | 2): string {
	return `win-team-${team}-${courtName.replace(/\s+/g, '_')}`;
}

/**
 * Click the Win button for a given court and team.
 */
export async function clickWin(page: Page, courtName: string, team: 1 | 2): Promise<void> {
	const tid = generateWinTestId(courtName, team);
	// Prefer the test-id selector helper when available
	// @ts-ignore - some Page types include getByTestId from Playwright test fixtures
	if (typeof (page as any).getByTestId === 'function') {
		// @ts-ignore
		await (page as any).getByTestId(tid).click();
	} else {
		await page.click(`[data-testid="${tid}"]`);
	}
}

export default saveZustandState;