import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

test('Oracle Login Test', async ({ page }) => {
  const email = process.env.ORACLE_EMAIL!;
  const password = process.env.ORACLE_PASSWORD!;

  await page.goto('/race-to-certification-2025?path=afterActivation');
  
  // Look for login button or sign in link
  const loginButton = page.locator('text=Sign In').or(page.locator('text=Login')).or(page.locator('[data-testid="login"]')).first();
  
  if (await loginButton.isVisible()) {
    await loginButton.click();
    
    // Fill login form
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL('**/race-to-certification-2025**', { timeout: 30000 });
    
    console.log('Login successful!');
  } else {
    console.log('Already logged in or login button not found');
  }
  
  // Take screenshot for verification
  await page.screenshot({ path: 'oracle-login-success.png' });
});