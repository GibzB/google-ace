import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

test('Debug Oracle Login', async ({ page }) => {
  const email = process.env.ORACLE_EMAIL!;
  const password = process.env.ORACLE_PASSWORD!;

  console.log('Starting Oracle login debug...');
  
  // Go directly to course URL
  await page.goto('https://mylearn.oracle.com/ou/course/oracle-cloud-infrastructure-ai-foundations/147805');
  await page.waitForTimeout(5000);
  
  console.log('Current URL:', page.url());
  await page.screenshot({ path: 'oracle-step1.png' });
  
  // Look for login elements
  const signInButton = page.locator('text=Sign In').first();
  const loginButton = page.locator('text=Login').first();
  
  if (await signInButton.isVisible()) {
    console.log('Found Sign In button');
    await signInButton.click();
    await page.waitForTimeout(3000);
  } else if (await loginButton.isVisible()) {
    console.log('Found Login button');
    await loginButton.click();
    await page.waitForTimeout(3000);
  }
  
  console.log('After login click URL:', page.url());
  await page.screenshot({ path: 'oracle-step2.png' });
  
  // Check what login fields are available
  const emailField = page.locator('input[type="email"]');
  const usernameField = page.locator('input[type="text"], input[name="username"], input[id*="username"]');
  const passwordField = page.locator('input[type="password"]');
  
  console.log('Email field visible:', await emailField.isVisible());
  console.log('Username field visible:', await usernameField.isVisible());
  console.log('Password field visible:', await passwordField.isVisible());
  
  // Try different field selectors
  if (await emailField.isVisible()) {
    await emailField.fill(email);
  } else if (await usernameField.isVisible()) {
    await usernameField.fill(email);
  }
  
  if (await passwordField.isVisible()) {
    await passwordField.fill(password);
  }
  
  await page.screenshot({ path: 'oracle-step3.png' });
  
  // Look for submit button
  const submitBtn = page.locator('button[type="submit"], input[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
    await page.waitForTimeout(5000);
  }
  
  console.log('After submit URL:', page.url());
  await page.screenshot({ path: 'oracle-step4.png' });
  
  // Check if we're on course page
  const playlist = page.locator('.playlistComponent').first();
  if (await playlist.isVisible()) {
    console.log('SUCCESS: Course page loaded!');
  } else {
    console.log('Course page not loaded, current URL:', page.url());
  }
  
  await page.screenshot({ path: 'oracle-final.png' });
});