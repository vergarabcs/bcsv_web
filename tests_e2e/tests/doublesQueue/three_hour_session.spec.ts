import { test, expect, type Page } from '@playwright/test';

import { clickWin } from '../helpers/doublesQueue.utils';

const STORE_KEY = 'doubles-queue-store';
const SESSION_START = '2026-04-11T18:00:00.000Z';
const ROUND_DURATION_MS = 20 * 60 * 1000;
const ROUNDS = 9;

const addPlayer = async (page: Page, name: string, rating = '1500') => {
  await page.getByRole('button', { name: 'add player' }).click();
  const addDialog = page.getByRole('dialog');
  await addDialog.waitFor();
  await addDialog.getByLabel('Player Name').fill(name);
  await addDialog.getByLabel('Initial Rating').fill(rating);
  await addDialog.getByRole('button', { name: 'Add Player' }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
};

const setPriorityScheme = async (page: Page, optionName: 'By wait time' | 'By number of games') => {
  const playersPanel = page.locator('#simple-tabpanel-3');
  const priorityScheme = playersPanel.getByLabel('Priority Scheme');

  await expect(priorityScheme).toBeVisible();
  await priorityScheme.click();
  await page.getByRole('option', { name: optionName }).click();
  await expect(priorityScheme).toContainText(optionName);
};

const clearPersistedState = async (page: Page) => {
  await page.addInitScript((key) => {
    window.localStorage.removeItem(key);
  }, STORE_KEY);
};

const clickActionForPlayer = async (page: Page, playerName: string, actionName: 'Check In' | 'Remove') => {
  const row = page.locator('li').filter({ hasText: playerName }).first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: actionName }).click();
};

const startAvailableGames = async (page: Page) => {
  for (let index = 0; index < 2; index += 1) {
    const startButtons = page.getByRole('button', { name: 'Start Game' });
    await expect(startButtons.first()).toBeVisible();
    await startButtons.first().click();
  }
};

const completeRoundGames = async (page: Page, round: number) => {
  if (round % 2 === 0) {
    await clickWin(page, 'Court 1', 1);
    await clickWin(page, 'Court 2', 2);
  } else {
    await clickWin(page, 'Court 1', 2);
    await clickWin(page, 'Court 2', 1);
  }

  await page.clock.fastForward(200);
};

const readPersistedState = async (page: Page) => {
  return page.evaluate((key) => {
    const persisted = window.localStorage.getItem(key);
    if (!persisted) {
      return null;
    }

    return JSON.parse(persisted) as {
      state?: {
        players?: Array<{ name: string; gamesPlayed: number }>;
        currentSession?: { totalGames?: number };
        settings?: { queuePriorityScheme?: string };
      };
    };
  }, STORE_KEY);
};

test('simulates a 3 hour session with one 1-hour-late arrival and one 1-hour-early departure', async ({ page }) => {
  test.setTimeout(120000);

  await clearPersistedState(page);
  await page.clock.install({ time: new Date(SESSION_START) });
  await page.goto('http://localhost:3000/doublesQueue');

  await test.step('Start session and add players', async () => {
    await page.getByRole('button', { name: 'Start Session' }).click();
    await page.getByRole('tab', { name: 'Players' }).click();
    await setPriorityScheme(page, 'By number of games');

    for (let index = 1; index <= 18; index += 1) {
      await addPlayer(page, `Player ${index}`);
    }
  });

  await test.step('Check in the initial 17 players', async () => {
    await page.getByRole('tab', { name: 'Queue' }).click();

    for (let index = 1; index <= 17; index += 1) {
      await clickActionForPlayer(page, `Player ${index}`, 'Check In');
    }
  });

  for (let round = 0; round < ROUNDS; round += 1) {
    await test.step(`Play round ${round + 1}`, async () => {
      await page.getByRole('tab', { name: 'Queue' }).click();

      if (round === 3) {
        await clickActionForPlayer(page, 'Player 18', 'Check In');
      }

      if (round === 6) {
        await clickActionForPlayer(page, 'Player 17', 'Remove');
      }

      await page.getByRole('tab', { name: 'Dashboard' }).click();
      await startAvailableGames(page);
      await page.clock.fastForward(ROUND_DURATION_MS);
      await completeRoundGames(page, round);
    });
  }

  const persistedState = await readPersistedState(page);
  expect(persistedState?.state?.currentSession?.totalGames).toBe(18);
  expect(persistedState?.state?.settings?.queuePriorityScheme).toBe('gamesPlayed');

  const players = persistedState?.state?.players ?? [];
  const gameCounts = Object.fromEntries(
    players
      .map(player => [player.name, player.gamesPlayed])
      .sort(([leftName], [rightName]) => leftName.localeCompare(rightName, undefined, { numeric: true }))
  );

  console.log('3-hour Playwright simulation game counts:', gameCounts);

  expect(Object.values(gameCounts).reduce((sum, gamesPlayed) => sum + gamesPlayed, 0)).toBe(72);
  expect(gameCounts['Player 18']).toBeDefined();
  expect(gameCounts['Player 17']).toBeDefined();
});