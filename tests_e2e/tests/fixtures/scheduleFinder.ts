import { Page, Locator, test as base, expect } from '@playwright/test';

// Define the interface for our scheduleFinder fixture
interface ScheduleFinderFixture {
  page: Page;
  sessionId: string;
  addPerson(name: string): Promise<string>;
  addTimeSlot(personName: string): Promise<void>;
  leaveSession(): Promise<void>;
}

// Extend the test fixtures with our custom fixture
export const test = base.extend<{ scheduleFinder: ScheduleFinderFixture }>({
  // Create a fixture that navigates to ScheduleFinder and creates a new session
  scheduleFinder: async ({ page }, use) => {
    // Navigate to the scheduleFinder page
    await page.goto('/scheduleFinder');
    
    // Click on "Create New Session" button in the dialog
    await page.getByRole('button', { name: 'Create New Session' }).click();
    
    // Wait for the session to be created and main UI to be visible
    await page.getByRole('main', { name: 'Schedule Finder Application' }).waitFor();
    
    // Get the session ID for later reference
    const sessionIdText = await page.getByText(/Session Id:/i).textContent();
    const sessionId = sessionIdText?.replace('Session Id:', '').trim() || '';
    
    // Create the fixture value - an object with useful references
    const scheduleFinder = {
      page,
      sessionId,
      
      // Helper method to add a person
      async addPerson(name: string) {
        await page.getByLabel('Person name').fill(name);
        await page.getByRole('button', { name: 'Add person to schedule' }).click();
        await page.getByText(`${name} with 0 time slots`).waitFor();
        return name;
      },
      
      // Helper method to add a time slot for the given person
      async addTimeSlot(personName: string) {
        // Make sure the person is selected
        await page.getByRole('option', { name: new RegExp(personName) }).click();
        
        // Add a time slot
        await page.getByRole('button', { name: `Add time slot for ${personName}` }).click();
        
        // Wait for the time slot UI to appear
        await page.getByText(`Time Slots for ${personName}`).waitFor();
      },
      
      // Helper to leave the current session
      async leaveSession() {
        await page.getByRole('button', { name: 'Leave current session' }).click();
        await page.getByRole('dialog').waitFor();
      },
    };
    
    await use(scheduleFinder);

    await page.getByRole('button', { name: 'Delete current session' }).click()
    await expect(scheduleFinder.page.getByRole('heading', { name: 'Session Required' })).toBeVisible();
  }
})