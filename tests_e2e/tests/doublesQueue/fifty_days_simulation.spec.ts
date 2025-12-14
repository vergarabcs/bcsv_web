import { test, expect } from '@playwright/test';

test('Fifty Days Simulation', async ({ page }) => {
  // Disable timeout for long simulation
  test.setTimeout(0);
  
  // Install the clock API to control time
  await page.clock.install();
  
  // Navigate to the doubles queue page
  await page.goto('http://localhost:3000/doublesQueue');

  // --- Initial Setup: Add Players ---
  await test.step('Add players', async () => {
    // Go to the Players tab
    await page.getByRole('tab', { name: 'Players' }).click();

    for (let i = 1; i <= 18; i++) {
      // Click the floating action button to add a player
      await page.getByRole('button', { name: 'add player' }).click();
  
      // Wait for the dialog to open
      await page.waitForSelector('text=Add New Player');
  
      // Fill in the player name
      await page.locator('input').first().fill(`Player ${i}`);
  
      // Fill in the rating (randomize slightly between 1400 and 1800)
      const rating = Math.floor(Math.random() * 400) + 1400;
      await page.locator('input').nth(1).fill(rating.toString());
  
      // Click the Add Player button
      await page.getByRole('button', { name: 'Add Player' }).click();
  
      // Verify the player is added
      await expect(page.getByText(`Player ${i}`, {exact: true})).toBeVisible();
    }
  });

  // --- Simulation Loop: 50 Days ---
  for (let day = 1; day <= 50; day++) {
    console.log(`Starting Day ${day}`);

    await test.step(`Day ${day}: Start session`, async () => {
      // The button might be "Start Session" or "Start" depending on state/updates
      // We look for a button that contains "Start"
      const startBtn = page.getByRole('button', { name: /Start( Session)?/ }).first();
      await expect(startBtn).toBeVisible();
      await startBtn.click();
    });

    await test.step(`Day ${day}: Check in players`, async () => {
      await page.getByRole('tab', { name: 'Queue' }).click();
      
      // Check in all players
      while (true) {
        const checkInButton = page.getByRole('button', { name: 'Check In' }).first();
        if (await checkInButton.count() === 0) break;
        await checkInButton.click();
      }
    });

    await test.step(`Day ${day}: Play games`, async () => {
      await page.getByRole('tab', { name: 'Dashboard' }).click();

      // Simulate 3 hours of games (approx 9 rounds of 20 mins)
      const rounds = 9;
      for (let round = 0; round < rounds; round++) {
        
        // Start all available matches
        while (true) {
          const startButton = page.getByRole('button', { name: 'Start Next Match' }).first();
          if (await startButton.count() === 0) break;
          await startButton.click();
        }

        // Simulate game duration (20 minutes)
        await page.clock.fastForward(20 * 60 * 1000);

        // Record results for all active games
        // We randomly pick a winner for each game
        while (true) {
          // Check for any win buttons
          const team1Btn = page.getByRole('button', { name: 'Team 1 Wins' }).first();
          const team2Btn = page.getByRole('button', { name: 'Team 2 Wins' }).first();
          
          const hasTeam1 = await team1Btn.count() > 0;
          const hasTeam2 = await team2Btn.count() > 0;

          if (!hasTeam1 && !hasTeam2) break;

          // If we have buttons, click one to resolve a game
          // Note: Clicking one resolves that specific game card.
          // We just need to click *a* win button.
          
          if (Math.random() < 0.5) {
            if (hasTeam1) await team1Btn.click();
            else if (hasTeam2) await team2Btn.click();
          } else {
            if (hasTeam2) await team2Btn.click();
            else if (hasTeam1) await team1Btn.click();
          }
          
          // Small wait to allow UI to update if needed, though Playwright auto-waits for clicks
        }
      }
    });

    await test.step(`Day ${day}: End session`, async () => {
      // Click the End button in the header
      await page.getByRole('button', { name: 'End', exact: true }).click();
      
      // Verify confirmation dialog appears
      await expect(page.getByText('End Session?')).toBeVisible();
      
      // Confirm ending the session
      await page.getByRole('button', { name: 'End Session' }).click();
      
      // Verify session is inactive (Start button should be visible)
      // This ensures we are ready for the next day
      await expect(page.getByRole('button', { name: /Start( Session)?/ }).first()).toBeVisible();
    });

    // Advance time to the next day (e.g., 21 hours later, assuming 3h session)
    // Or just 24 hours from start of session? 
    // Let's just add 21 hours to be safe and move to "tomorrow"
    await page.clock.fastForward(21 * 60 * 60 * 1000);
  }
});
