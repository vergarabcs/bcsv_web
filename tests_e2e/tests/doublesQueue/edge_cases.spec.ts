import { test, expect } from '@playwright/test';

test.describe('Doubles Queue Edge Cases', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/doublesQueue');
  });

  test('Player Input Validation', async ({ page }) => {
    await page.getByRole('tab', { name: 'Players' }).click();
    await page.getByRole('button', { name: 'add player' }).click();
    
    const addDialog = page.getByRole('dialog');
    const nameInput = addDialog.getByLabel('Player Name');
    const addButton = addDialog.getByRole('button', { name: 'Add Player' });

    // Test empty name
    await nameInput.fill('');
    await expect(addButton).toBeDisabled();

    // Test whitespace name
    await nameInput.fill('   ');
    await expect(addButton).toBeDisabled();

    // Test valid name
    await nameInput.fill('Valid Player');
    await expect(addButton).toBeEnabled();
    
    // Close dialog
    await addDialog.getByRole('button', { name: 'Cancel' }).click();
  });

  test('End Session with Active Games', async ({ page }) => {
    // Ensure session is started
    const startButton = page.getByRole('button', { name: 'Start', exact: true });
    if (await startButton.isVisible()) {
        await startButton.click();
    }

    // Add 4 players
    await page.getByRole('tab', { name: 'Players' }).click();
    for (let i = 1; i <= 4; i++) {
        await page.getByRole('button', { name: 'add player' }).click();
      const addDialog = page.getByRole('dialog');
      await addDialog.getByLabel('Player Name').fill(`Player ${i}`);
      await addDialog.getByRole('button', { name: 'Add Player' }).click();
    }

    // Check them in
    await page.getByRole('tab', { name: 'Queue' }).click();
    // Wait for list to update
    await page.waitForTimeout(500);
    
    // Check in all 4 players
    // Note: Depending on UI, "Check In" might disappear or move. 
    // We assume standard flow where we can check in available players.
    for (let i = 0; i < 4; i++) {
        const checkInBtn = page.getByRole('button', { name: 'Check In' }).first();
        await checkInBtn.click();
        await page.waitForTimeout(200); // Small delay for UI update
    }

    // Start match
    await page.getByRole('tab', { name: 'Dashboard' }).click();
    
    // Wait for "Start Next Match" to appear
    const startMatchBtn = page.getByRole('button', { name: 'Start Next Match' }).first();
    await expect(startMatchBtn).toBeVisible({ timeout: 5000 });
    await startMatchBtn.click();

    // Verify match is running (e.g., "Team 1 Wins" button exists)
    await expect(page.getByRole('button', { name: 'Team 1 Wins' }).first()).toBeVisible();

    // End Session
    await page.getByRole('button', { name: 'End', exact: true }).click();
    
    // Verify confirmation dialog
    await expect(page.getByText('End Session?')).toBeVisible();
    
    // Confirm
    await page.getByRole('button', { name: 'End Session' }).click();

    // Verify session ended and games cleared
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Team 1 Wins' })).toBeHidden();
  });

  test('Manual Match Validation (Insufficient Players)', async ({ page }) => {
    // Ensure session is started
    const startButton = page.getByRole('button', { name: 'Start', exact: true });
    if (await startButton.isVisible()) {
        await startButton.click();
    }

    // Add 3 players (not enough for a match)
    await page.getByRole('tab', { name: 'Players' }).click();
    for (let i = 1; i <= 3; i++) {
        await page.getByRole('button', { name: 'add player' }).click();
      const addDialog = page.getByRole('dialog');
      await addDialog.getByLabel('Player Name').fill(`Player ${i}`);
      await addDialog.getByRole('button', { name: 'Add Player' }).click();
    }

    // Go to Dashboard and try Manual Match
    await page.getByRole('tab', { name: 'Dashboard' }).click();
    await page.getByRole('button', { name: 'Manual Match' }).click();
    
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Select all 3 players
    const playerItems = dialog.getByRole('button').filter({ has: page.getByRole('checkbox') });
    const count = await playerItems.count();
    
    for (let i = 0; i < count; i++) {
        await playerItems.nth(i).click();
    }

    // Verify "Create Match" is disabled (assuming validation exists)
    // If validation doesn't exist in the UI yet, this test might fail or need adjustment.
    // Based on standard requirements, a doubles match needs 4 players.
    const createBtn = dialog.getByRole('button', { name: 'Create Match' });
    await expect(createBtn).toBeDisabled();
  });
});
