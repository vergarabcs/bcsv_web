import { test, expect } from '@playwright/test';

test('Create a Session', async ({ page }) => {
  // Start a Playwright session and navigate to the scheduleFinder page
  await page.goto('http://localhost:3000/scheduleFinder');
});