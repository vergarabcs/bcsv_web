import { test, expect, type Page } from '@playwright/test';

import { clickWin, mockPlayersApi } from '../helpers/doublesQueue.utils';

const STORE_KEY = 'doubles-queue-store';
const SESSION_START = '2026-04-11T18:00:00.000Z';
const MIN_GAME_DURATION_MINUTES = 18;
const MAX_GAME_DURATION_MINUTES = 21;
const TOTAL_GAMES = 18;
const LATE_ARRIVAL_AFTER_GAMES = 6;
const EARLY_DEPARTURE_AFTER_MS = 2 * 60 * 60 * 1000;
const PARTIAL_MANUAL_GAME_NUMBER = 12;
const POST_GAME_SETTLE_MS = 200;
const COURT_NAMES = ['Court 1', 'Court 2'] as const;
const simulationPlayers = Array.from({ length: 18 }, (_, index) => ({
  name: `Player ${index + 1}`,
  rating: 1500,
}));

type CourtName = typeof COURT_NAMES[number];

interface ActiveGameSchedule {
  courtName: CourtName;
  remainingDurationMs: number;
}

const createDeterministicRandom = (seed: number) => {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const nextGameDurationMs = (random: () => number) => {
  const durationMinutes = Math.floor(random() * (MAX_GAME_DURATION_MINUTES - MIN_GAME_DURATION_MINUTES + 1))
    + MIN_GAME_DURATION_MINUTES;

  return durationMinutes * 60 * 1000;
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

const getQueueTabPlayerRow = (page: Page, playerName: string) => {
  const queueTabPanel = page.locator('#simple-tabpanel-1');

  return queueTabPanel
    .locator('li')
    .filter({ hasText: playerName })
    .first();
};

const assertGamesPlayedPriorityMode = async (page: Page) => {
  const playersPanel = page.locator('#simple-tabpanel-3');
  const priorityScheme = playersPanel.getByLabel('Priority Scheme');
  const queuePanel = page.locator('#simple-tabpanel-1');
  const oneGameRow = queuePanel
    .locator('li')
    .filter({ hasText: 'Session games: 1' })
    .filter({ has: queuePanel.getByRole('button', { name: 'Remove' }) })
    .first();

  await expect(priorityScheme).toContainText('By number of games');
  await expect(oneGameRow).toBeVisible();
  await expect(oneGameRow).toContainText('Priority: -20');
};

const clickActionForPlayer = async (page: Page, playerName: string, actionName: 'Check In' | 'Remove') => {
  const row = getQueueTabPlayerRow(page, playerName);
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: actionName }).click();
};

const getHighestPriorityPlayerName = async (page: Page) => {
  const queuePanel = page.locator('#simple-tabpanel-1');
  const firstRemoveButton = queuePanel.getByRole('button', { name: 'Remove' }).first();
  await expect(firstRemoveButton).toBeVisible();

  const highestPriorityRow = firstRemoveButton.locator('xpath=ancestor::li[1]');

  const rowText = await highestPriorityRow.textContent();
  const playerName = rowText?.match(/Player \d+/)?.[0];

  expect(playerName).toBeDefined();
  return playerName!;
};

const removePlayerIfQueued = async (page: Page, playerName: string) => {
  const row = getQueueTabPlayerRow(page, playerName);
  const removeButton = row.getByRole('button', { name: 'Remove' });

  if (!(await row.isVisible()) || !(await removeButton.isVisible())) {
    return false;
  }

  await removeButton.click();
  return true;
};

const isPlayerInGame = async (page: Page, playerName: string) => {
  const queueTabPanel = page.locator('#simple-tabpanel-1');
  const playingRow = queueTabPanel
    .locator('li')
    .filter({ hasText: playerName })
    .filter({ hasText: 'playing' })
    .first();

  return playingRow.isVisible();
};

const startNextAvailableGame = async (page: Page) => {
  const startButtons = page.getByRole('button', { name: 'Start Game' });
  await expect(startButtons.first()).toBeVisible();
  await startButtons.first().click();
};

const startPartialManualFilledGame = async (page: Page, playerName: string) => {
  await page.getByRole('button', { name: 'Manual' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const playerRow = dialog.getByRole('row').filter({ hasText: playerName }).first();
  await expect(playerRow).toBeVisible();
  await playerRow.click();

  await expect(dialog.getByText('Select Players (1/4)', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Fill' }).click();
  await expect(dialog.getByText('Select Players (4/4)', { exact: false })).toBeVisible();

  const createAndStartButton = dialog.getByRole('button', { name: 'Create & Start' });
  await expect(createAndStartButton).toBeEnabled();
  await createAndStartButton.click();
  await expect(dialog).toBeHidden();
};

const getWinnerForGame = (completedGames: number, courtName: CourtName): 1 | 2 => {
  const isEvenGame = completedGames % 2 === 0;

  if (courtName === 'Court 1') {
    return isEvenGame ? 1 : 2;
  }

  return isEvenGame ? 2 : 1;
};

const completeScheduledGame = async (page: Page, completedGames: number, courtName: CourtName) => {
  await clickWin(page, courtName, getWinnerForGame(completedGames, courtName));
  await page.clock.fastForward(POST_GAME_SETTLE_MS);
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
  const random = createDeterministicRandom(18021);

  await clearPersistedState(page);
  await mockPlayersApi(page, simulationPlayers);
  await page.clock.install({ time: new Date(SESSION_START) });
  await page.goto('http://localhost:3000/doublesQueue');

  await test.step('Start session and load mocked players', async () => {
    await page.getByRole('button', { name: 'Start Session' }).click();
    await page.getByRole('tab', { name: 'Players' }).click();
    await expect(page.getByText('Player 18', { exact: true })).toBeVisible();
    await setPriorityScheme(page, 'By number of games');
  });

  await test.step('Check in the initial 17 players', async () => {
    await page.getByRole('tab', { name: 'Queue' }).click();

    for (let index = 1; index <= 17; index += 1) {
      await clickActionForPlayer(page, `Player ${index}`, 'Check In');
    }
  });

  const activeGames: ActiveGameSchedule[] = [];
  let startedGames = 0;
  let completedGames = 0;
  let elapsedSessionMs = 0;
  let player17Removed = false;
  let player17RemovalPending = false;

  await test.step('Start the first two games', async () => {
    await page.getByRole('tab', { name: 'Dashboard' }).click();

    for (const courtName of COURT_NAMES) {
      await startNextAvailableGame(page);
      activeGames.push({
        courtName,
        remainingDurationMs: nextGameDurationMs(random),
      });
      startedGames += 1;
    }
  });

  while (completedGames < TOTAL_GAMES) {
    await test.step(`Complete game ${completedGames + 1}`, async () => {
      activeGames.sort((left, right) => left.remainingDurationMs - right.remainingDurationMs);
      const nextCompletedGame = activeGames.shift();

      expect(nextCompletedGame).toBeDefined();

      const elapsedMs = nextCompletedGame!.remainingDurationMs;
      await page.clock.fastForward(elapsedMs);

      activeGames.forEach(game => {
        game.remainingDurationMs -= elapsedMs;
      });

      await page.getByRole('tab', { name: 'Dashboard' }).click();
      await completeScheduledGame(page, completedGames, nextCompletedGame!.courtName);
      completedGames += 1;
      elapsedSessionMs += elapsedMs + POST_GAME_SETTLE_MS;

      await page.getByRole('tab', { name: 'Queue' }).click();

      if (completedGames === LATE_ARRIVAL_AFTER_GAMES) {
        await clickActionForPlayer(page, 'Player 18', 'Check In');
      }

      if (!player17RemovalPending && elapsedSessionMs >= EARLY_DEPARTURE_AFTER_MS) {
        player17RemovalPending = true;
      }

      if (player17RemovalPending && !player17Removed && !(await isPlayerInGame(page, 'Player 17'))) {
        player17Removed = await removePlayerIfQueued(page, 'Player 17');
      }

      if (startedGames < TOTAL_GAMES) {
        const nextGameNumber = startedGames + 1;
        await page.getByRole('tab', { name: 'Dashboard' }).click();

        if (completedGames === PARTIAL_MANUAL_GAME_NUMBER) {
          await test.step('Partial Manual Test', async () => {
            // await page.pause();
            await page.getByRole('tab', { name: 'Queue' }).click();
            const highestPriorityPlayerName = await getHighestPriorityPlayerName(page);
            await page.getByRole('tab', { name: 'Dashboard' }).click();
            await startPartialManualFilledGame(page, highestPriorityPlayerName);
          })

        } else {
          await startNextAvailableGame(page);
        }

        activeGames.push({
          courtName: nextCompletedGame!.courtName,
          remainingDurationMs: nextGameDurationMs(random),
        });
        startedGames += 1;
      }
    });
  }

  expect(player17Removed).toBe(true);

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