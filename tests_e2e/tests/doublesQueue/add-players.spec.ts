import { test, expect } from '@playwright/test';

test('add players to doubles queue', async ({ page }) => {
  // Install the clock API to control time
  await page.clock.install();
  
  // Navigate to the doubles queue page
  await page.goto('http://localhost:3000/doublesQueue');

  // Go to the Players tab first
  await page.getByRole('tab', { name: 'Players' }).click();
  
  await test.step('Add players', async () => {
    for (let i = 1; i <= 18; i++) {
      // Click the floating action button to add a player
      await page.getByRole('button', { name: 'add player' }).click();
  
      // Wait for the dialog to open
      await page.waitForSelector('text=Add New Player');
  
      // Fill in the player name
      await page.locator('input').first().fill(`Test Player ${i}`);
  
      // Fill in the rating (optional, default is 1500)
      await page.locator('input').nth(1).fill('1600');
  
      // Click the Add Player button
      await page.getByRole('button', { name: 'Add Player' }).click();
  
      // Verify the player is added by checking if the name appears
      await expect(page.getByText(`Test Player ${i}`, {exact: true})).toBeVisible();
    }

  })

  await test.step('Start session', async () => {
    await page.getByRole('button', { name: 'Start Session' }).click();
  });

  await test.step('Go to Queue and check in all players', async () => {
    await page.getByRole('tab', { name: 'Queue' }).click();
    
    // Check in all players by clicking Check In buttons until none left
    while (true) {
      const checkInButton = page.getByRole('button', { name: 'Check In' }).first();
      if (await checkInButton.count() === 0) break;
      await checkInButton.click();
    }
  });

  await page.getByRole('tab', { name: 'Dashboard' }).click();
  // Simulate multiple games (about 3 hours worth)
  for (let gameRound = 0; gameRound < 10; gameRound++) {
    // Start available matches (buttons may appear/disappear dynamically)
    while (true) {
      const startButton = page.getByRole('button', { name: 'Start Next Match' }).first();
      if (await startButton.count() === 0) break;
      await startButton.click();
    }
    
    // Simulate game duration (20 minutes per game)
    await page.clock.fastForward(20 * 60 * 1000);
    
    // Record results (now handled on Dashboard)
    await page.getByRole('tab', { name: 'Dashboard' }).click();
    
    // Click all available win buttons (buttons may vanish after clicking)
    while (true) {
      const team1Button = page.getByRole('button', { name: 'Team 1 Wins' }).first();
      if (await team1Button.count() === 0) break;
      await team1Button.click();
    }
    
    while (true) {
      const team2Button = page.getByRole('button', { name: 'Team 2 Wins' }).first();
      if (await team2Button.count() === 0) break;
      await team2Button.click();
    }
    
    // Back to dashboard for next round
    await page.getByRole('tab', { name: 'Dashboard' }).click();
  }

  await test.step('Verify state persistence after refresh', async () => {
    const tabs = ['Dashboard', 'Queue', 'Results', 'Players'];
    const snapshots: Record<string, string> = {};

    // Capture state
    for (let i = 0; i < tabs.length; i++) {
      const tabName = tabs[i];
      await page.getByRole('tab', { name: tabName }).click();
      // Wait for the tab panel to be visible using specific ID
      const tabPanel = page.locator(`#simple-tabpanel-${i}`);
      await expect(tabPanel).toBeVisible();
      // Small wait to ensure content is rendered
      await page.waitForTimeout(500); 
      snapshots[tabName] = await tabPanel.innerText();
    }

    await page.pause();
    // Refresh page
    await page.reload();

    // Verify state
    for (let i = 0; i < tabs.length; i++) {
      const tabName = tabs[i];
      await page.getByRole('tab', { name: tabName }).click();
      const tabPanel = page.locator(`#simple-tabpanel-${i}`);
      await expect(tabPanel).toBeVisible();
      await page.waitForTimeout(500);
      const currentContent = await tabPanel.innerText();
      expect(currentContent).toBe(snapshots[tabName]);
    }
  });
});