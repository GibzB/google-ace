import { chromium, FullConfig } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Since we are using ES modules, __dirname is not available. This is the modern equivalent.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path where the authentication state will be saved.
export const AUTH_FILE = path.join(__dirname, '.auth/user.json');

async function globalSetup(config: FullConfig) {
  // IMPORTANT: Use environment variables for credentials.
  const udacityEmail = process.env.UDACITY_EMAIL;
  const udacityPassword = process.env.UDACITY_PASSWORD;

  if (!udacityEmail || !udacityPassword) {
    throw new Error('UDACITY_EMAIL and UDACITY_PASSWORD environment variables must be set.');
  }

  // Use a persistent context to better mimic a real user's browser and handle cookies.
  const userDataDir = path.join(__dirname, '.playwright/user_data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Run in headed mode to observe the login process.
  });
  const page = context.pages().length ? context.pages()[0] : await context.newPage();

  // 1. Navigate to the Udacity sign-in page
  await page.goto('https://auth.udacity.com/sign-in');

  // 2. Fill in the standard email and password fields
  // Using data-testid is the most robust way to select these elements.
  await page.locator('input[data-testid="signin-email"]').fill(udacityEmail);
  await page.locator('input[data-testid="signin-password"]').fill(udacityPassword);

  // 3. Click the "Sign in" button
  // The previous selector was too generic. This one targets the specific
  // "Sign in" button within the main login form.
  await page.locator('[data-testid="signin-form"] button:has-text("Sign in")').click();

  // 4. Wait for successful login and redirection to the Udacity classroom
  // After login, the user lands on the dashboard. We'll wait for that URL to confirm success.
  await page.waitForURL('**/dashboard', { timeout: 60000 });

  // 5. Save the authentication state to the file
  await context.storageState({ path: AUTH_FILE });
  await context.close();
}

export default globalSetup;