/**
 * Helper functions for the ScheduleFinder Playwright tests
 */

import { Page, Locator } from '@playwright/test';

/**
 * Helper class for manipulating the MUI date-time picker in tests
 */
export class DateTimePickerHelper {
  private readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  /**
   * Sets a specific time in an MUI DateTimePicker
   */
  async setTime(picker: Locator, hour: number, minute: number, isPM: boolean = true): Promise<void> {
    // Click to open the picker
    await picker.click();
    
    // Wait for the clock to appear
    await this.page.waitForSelector('[role="dialog"] .MuiClock-root');
    
    // Click the "clock" icon to switch to time picker if needed
    const clockIcon = this.page.locator('[role="dialog"] button[aria-label="clock"]');
    if (await clockIcon.isVisible()) {
      await clockIcon.click();
    }
    
    // Set hours first
    // In MUI, the hours are displayed in a circle, so we need to find the right hour element
    let displayHour = hour;
    if (isPM && hour < 12) {
      // For PM, convert to 24-hour format for the clock 
      displayHour += 12;
    } else if (!isPM && hour === 12) {
      // For 12 AM, it's 0 in 24-hour format
      displayHour = 0;
    }
    
    // Find and click the hour button
    const hourSelector = `[role="dialog"] .MuiClock-root [aria-label="${displayHour} hours"]`;
    await this.page.click(hourSelector);
    
    // Wait a moment for the transition to minutes
    await this.page.waitForTimeout(300);
    
    // Find and click the minute button
    const minuteSelector = `[role="dialog"] .MuiClock-root [aria-label="${minute} minutes"]`;
    await this.page.click(minuteSelector);
    
    // Set AM/PM if needed
    if (isPM) {
      const pmButton = this.page.locator('[role="dialog"] button:has-text("PM")');
      await pmButton.click();
    } else {
      const amButton = this.page.locator('[role="dialog"] button:has-text("AM")');
      await amButton.click();
    }
    
    // Click OK to apply the time
    await this.page.click('[role="dialog"] button:has-text("OK")');
  }
  
  /**
   * Sets a specific date in an MUI DateTimePicker
   */
  async setDate(picker: Locator, year: number, month: number, day: number): Promise<void> {
    // Click to open the picker
    await picker.click();
    
    // Wait for the date picker to appear
    await this.page.waitForSelector('[role="dialog"] .MuiCalendarPicker-root');
    
    // Switch to year selection first
    const dateSelector = this.page.locator('[role="dialog"] .MuiPickersCalendarHeader-label button');
    await dateSelector.click();
    
    // Click the year
    await this.page.click(`[role="dialog"] [aria-label="${year}"]`);
    
    // Get current month and navigate to the target month
    const monthElements = this.page.locator('[role="dialog"] .MuiPickersCalendarHeader-label');
    const currentMonthText = await monthElements.textContent();
    
    // Convert month number to name for comparison (1-indexed month)
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const targetMonthName = monthNames[month - 1];
    
    // Navigate to correct month
    if (currentMonthText && !currentMonthText.includes(targetMonthName)) {
      const nextButton = this.page.locator('[role="dialog"] button[aria-label="next month"]');
      const prevButton = this.page.locator('[role="dialog"] button[aria-label="previous month"]');
      
      // Loop through months until we reach target
      for (let i = 0; i < 12; i++) {
        const headerText = await monthElements.textContent();
        if (headerText && headerText.includes(targetMonthName)) break;
        
        // Determine whether to go forward or backward
        const currentMonthIndex = monthNames.findIndex(name => headerText!.includes(name));
        const targetMonthIndex = month - 1;
        
        // Handle wrapping around the year
        if (currentMonthIndex < targetMonthIndex || 
            (currentMonthIndex === 11 && targetMonthIndex === 0)) {
          await nextButton.click();
        } else {
          await prevButton.click();
        }
        
        await this.page.waitForTimeout(100);
      }
    }
    
    // Click the day
    await this.page.click(`[role="dialog"] [aria-label*="${day},"][aria-label*="${year}"]`);
    
    // Click OK to apply the date
    await this.page.click('[role="dialog"] button:has-text("OK")');
  }
}

/**
 * Helper function to simulate online/offline network state
 */
export async function setNetworkState(page: Page, isOnline: boolean): Promise<void> {
  if (isOnline) {
    // Set network online
    await page.context().setOffline(false);
  } else {
    // Set network offline
    await page.context().setOffline(true);
  }
}

/**
 * Helper to generate fixed test dates for consistent testing
 */
export function getTestDate(dayOffset: number = 0, hour: number = 12): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date;
}

/**
 * Format date for assertion comparisons
 */
export function formatDateForTest(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}