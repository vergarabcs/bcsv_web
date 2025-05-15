/**
 * Pauses execution for the specified amount of time.
 * 
 * @param ms - The number of milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}