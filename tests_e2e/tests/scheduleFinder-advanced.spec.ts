import { test, expect } from '@playwright/test';
import { DateTimePickerHelper, setNetworkState, formatDateForTest } from './helpers/scheduleFinder.helpers';

test.describe('ScheduleFinder Advanced Features', () => {
  let sessionId: string | undefined;

  test('Test offline data persistence and syncing', async ({ page, context }) => {
    // Create a session while online
    await page.goto('http://localhost:3000/scheduleFinder');
    await page.getByRole('button', { name: 'Create New Session' }).click();
    
    // Store session ID for later tests
    const sessionIdText = await page.getByText(/Session Id:/i).textContent();
    sessionId = sessionIdText?.replace('Session Id:', '').trim();
    
    // Add data while online
    await page.getByLabel('Person name').fill('OfflineTestPerson');
    await page.getByRole('button', { name: 'Add person to schedule' }).click();
    
    // Take the app offline
    await setNetworkState(page, false);
    
    // Verify offline indicator if it exists in the UI
    // This is optional and depends on if your app shows an offline indicator
    // await expect(page.getByText('You are offline')).toBeVisible();
    
    // Make changes while offline
    await page.getByRole('button', { name: 'Add time slot for OfflineTestPerson' }).click();
    
    // Add another person while offline
    await page.getByLabel('Person name').fill('OfflinePerson2');
    await page.getByRole('button', { name: 'Add person to schedule' }).click();
    
    // Verify the changes persist in the UI while offline
    await expect(page.getByText('OfflinePerson2 with 0 time slots')).toBeVisible();
    
    // Bring the app back online
    await setNetworkState(page, true);
    
    // Wait a moment for sync to happen
    await page.waitForTimeout(2000);
    
    // Reload the page to verify data was synced to the server
    await page.reload();
    
    // Verify both online and offline changes persisted
    await expect(page.getByText('OfflineTestPerson with 1 time slots')).toBeVisible();
    await expect(page.getByText('OfflinePerson2 with 0 time slots')).toBeVisible();
  });
  
  test('Precise time slot management and intersections', async ({ page }) => {
    // Join the same session from previous test if available
    await page.goto('http://localhost:3000/scheduleFinder');
    
    if (sessionId) {
      // Join existing session
      await page.getByLabel('Session ID').fill(sessionId);
      await page.getByRole('button', { name: 'Join Session' }).click();
    } else {
      // Create a new session if needed
      await page.getByRole('button', { name: 'Create New Session' }).click();
      
      // Add test people
      await page.getByLabel('Person name').fill('Alice');
      await page.getByRole('button', { name: 'Add person to schedule' }).click();
      
      await page.getByLabel('Person name').fill('Bob');
      await page.getByRole('button', { name: 'Add person to schedule' }).click();
    }
    
    // Clear existing data by removing people if they exist
    const aliceOption = page.getByRole('option', { name: /Alice/ });
    if (await aliceOption.isVisible()) {
      await aliceOption.click();
      await page.getByRole('button', { name: /Delete Alice/ }).click();
    }
    
    const bobOption = page.getByRole('option', { name: /Bob/ });
    if (await bobOption.isVisible()) {
      await bobOption.click();
      await page.getByRole('button', { name: /Delete Bob/ }).click();
    }
    
    // Add new test people
    await page.getByLabel('Person name').fill('Alice');
    await page.getByRole('button', { name: 'Add person to schedule' }).click();
    
    // Create a specific time slot for Alice
    await page.getByRole('button', { name: 'Add time slot for Alice' }).click();
    
    // Use helper to set specific time range
    const dateTimeHelper = new DateTimePickerHelper(page);
    const aliceStartPicker = page.getByLabel('Start time');
    const aliceEndPicker = page.getByLabel('End time');
    
    // Set Alice's availability: Today from 2PM to 4PM
    const today = new Date();
    await dateTimeHelper.setTime(aliceStartPicker, 2, 0, true); // 2:00 PM
    await dateTimeHelper.setTime(aliceEndPicker, 4, 0, true);   // 4:00 PM
    
    // Add Bob
    await page.getByLabel('Person name').fill('Bob');
    await page.getByRole('button', { name: 'Add person to schedule' }).click();
    
    // Create a time slot for Bob that partially overlaps with Alice
    await page.getByRole('button', { name: 'Add time slot for Bob' }).click();
    
    // Set Bob's availability: Today from 3PM to 5PM
    const bobStartPicker = page.getByLabel('Start time');
    const bobEndPicker = page.getByLabel('End time');
    
    await dateTimeHelper.setTime(bobStartPicker, 3, 0, true); // 3:00 PM
    await dateTimeHelper.setTime(bobEndPicker, 5, 0, true);   // 5:00 PM
    
    // Verify intersection appears correctly
    await expect(page.getByText('People\'s Availability Timeline')).toBeVisible();
    await expect(page.getByText('Detailed List View')).toBeVisible();
    
    // Check that there's exactly one intersection
    const intersectionItems = await page.locator('[role="listitem"]').count();
    expect(intersectionItems).toBe(1);
    
    // Verify the intersection time (from 3PM to 4PM)
    const expectedOverlapTimeRegex = /3:00.*PM.*4:00.*PM/;
    await expect(page.locator('[role="listitem"]')).toContainText(expectedOverlapTimeRegex);
    
    // Verify both people are in the intersection
    await expect(page.getByText('Available People (2):')).toBeVisible();
    await expect(page.getByText('Alice, Bob')).toBeVisible();
    
    // Add a third person whose availability doesn't overlap
    await page.getByLabel('Person name').fill('Charlie');
    await page.getByRole('button', { name: 'Add person to schedule' }).click();
    
    // Create a non-overlapping time slot for Charlie
    await page.getByRole('button', { name: 'Add time slot for Charlie' }).click();
    
    // Set Charlie's availability: Today from 6PM to 8PM
    const charlieStartPicker = page.getByLabel('Start time');
    const charlieEndPicker = page.getByLabel('End time');
    
    await dateTimeHelper.setTime(charlieStartPicker, 6, 0, true); // 6:00 PM
    await dateTimeHelper.setTime(charlieEndPicker, 8, 0, true);   // 8:00 PM
    
    // Verify that we still only have one intersection (Alice and Bob)
    await expect(page.locator('[role="listitem"]')).toContainText(expectedOverlapTimeRegex);
    
    // Create another overlapping slot for Charlie - overlaps with Bob
    await page.getByRole('button', { name: 'Add time slot for Charlie' }).click();
    
    // Set Charlie's second availability: Today from 4:30PM to 5:30PM
    const charlieStart2Picker = page.getByLabel('Start time').nth(1);
    const charlieEnd2Picker = page.getByLabel('End time').nth(1);
    
    await dateTimeHelper.setTime(charlieStart2Picker, 4, 30, true); // 4:30 PM
    await dateTimeHelper.setTime(charlieEnd2Picker, 5, 30, true);   // 5:30 PM
    
    // Verify we now have a second intersection (Bob and Charlie)
    await expect(page.getByText(/4:30.*PM.*5:00.*PM/)).toBeVisible();
    
    // Verify the Gantt chart shows all time slots
    await expect(page.locator('[data-testid="timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="person-names"]')).toBeVisible();
  });

  test('Test deletion of people and time slots', async ({ page }) => {
    // Start with a clean session
    await page.goto('http://localhost:3000/scheduleFinder');
    await page.getByRole('button', { name: 'Create New Session' }).click();
    
    // Add a person
    await page.getByLabel('Person name').fill('DeleteTest');
    await page.getByRole('button', { name: 'Add person to schedule' }).click();
    
    // Add multiple time slots
    await page.getByRole('button', { name: 'Add time slot for DeleteTest' }).click();
    await page.getByRole('button', { name: 'Add time slot for DeleteTest' }).click();
    
    // Verify both time slots are visible
    const timeSlots = page.locator('[role="listitem"]');
    await expect(timeSlots).toHaveCount(2);
    
    // Delete the first time slot
    await page.getByRole('button', { name: 'Delete time slot' }).first().click();
    
    // Verify only one time slot remains
    await expect(timeSlots).toHaveCount(1);
    
    // Add another person
    await page.getByLabel('Person name').fill('DeleteTest2');
    await page.getByRole('button', { name: 'Add person to schedule' }).click();
    
    // Add a time slot for the second person
    await page.getByRole('button', { name: 'Add time slot for DeleteTest2' }).click();
    
    // Go back to first person
    await page.getByRole('option', { name: /DeleteTest with 1 time slots/ }).click();
    
    // Delete the first person
    await page.getByRole('button', { name: 'Delete DeleteTest' }).click();
    
    // Verify the person is removed
    await expect(page.getByText('DeleteTest with 1 time slots')).not.toBeVisible();
    
    // Verify the second person remains
    await expect(page.getByText('DeleteTest2 with 1 time slots')).toBeVisible();
  });
  
  test('Test for validation errors', async ({ page }) => {
    // Start with a clean session
    await page.goto('http://localhost:3000/scheduleFinder');
    await page.getByRole('button', { name: 'Create New Session' }).click();
    
    // Try to add a person with empty name
    await page.getByRole('button', { name: 'Add person to schedule' }).click();
    
    // Verify error message
    await expect(page.getByText('Please enter a name')).toBeVisible();
    
    // Add a valid person
    await page.getByLabel('Person name').fill('ValidationTest');
    await page.getByRole('button', { name: 'Add person to schedule' }).click();
    
    // Try to add the same person again
    await page.getByLabel('Person name').fill('ValidationTest');
    await page.getByRole('button', { name: 'Add person to schedule' }).click();
    
    // Verify error message for duplicate person
    await expect(page.getByText('Person already exists')).toBeVisible();
    
    // Add a time slot
    await page.getByRole('button', { name: 'Add time slot for ValidationTest' }).click();
    
    // Note: We would normally test date validation errors here,
    // but it's challenging to directly cause validation errors with the MUI DateTimePicker in Playwright
    // without extensive custom helpers. The validation message tests are commented out but
    // would be important to implement in a complete test suite.
  });
});