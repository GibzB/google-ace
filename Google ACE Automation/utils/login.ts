import { Page } from '@playwright/test';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

// Also save cookies after each successful navigation
export async function saveCookies(page: Page) {
  try {
    const cookies = await page.context().cookies();
    const authData = { cookies };
    fs.writeFileSync('auth.json', JSON.stringify(authData, null, 2));
  } catch (e) {
    console.log('Failed to save cookies:', e.message);
  }
}

export async function login(page: Page, targetUrl?: string) {
  // Determine which domain to use
  const isPartnerDomain = targetUrl?.includes('partner.cloudskillsboost.google') || false;
  const baseUrl = isPartnerDomain ? 'https://partner.cloudskillsboost.google' : 'https://www.cloudskillsboost.google';
  
  console.log(`🌐 Using domain: ${baseUrl}`);
  
  // Try to load existing cookies first
  try {
    if (fs.existsSync('auth.json')) {
      const authData = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
      await page.context().addCookies(authData.cookies);
      console.log('Loaded existing cookies');
      
      // Test if cookies work by going to a test page
      const testUrl = isPartnerDomain ? `${baseUrl}/dashboard` : `${baseUrl}/catalog`;
      await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      
      // Check if we're logged in by looking for user elements or profile
      const userElement = await page.locator('[data-testid="user-menu"], .user-menu, .profile-menu, [aria-label*="profile"], [aria-label*="account"]').count();
      if (userElement > 0) {
        console.log('Successfully logged in using stored cookies');
        return;
      }
    }
  } catch (e) {
    console.log('Stored cookies failed, proceeding with manual login');
  }
  
  // Manual login if cookies don't work
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  
  try {
    await page.getByRole('button', { name: 'Agree' }).click();
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log('No cookie consent dialog found');
  }

  // Look for sign in button
  try {
    await page.getByRole('link', { name: 'Sign in' }).click();
  } catch (e) {
    // Try alternative selectors
    const signInSelectors = [
      'a:has-text("Sign in")',
      'button:has-text("Sign in")',
      '[href*="signin"]',
      '[href*="login"]'
    ];
    
    let signInFound = false;
    for (const selector of signInSelectors) {
      try {
        await page.locator(selector).first().click();
        signInFound = true;
        break;
      } catch (e) {}
    }
    
    if (!signInFound) {
      throw new Error('Could not find sign in button');
    }
  }
  
  await page.waitForTimeout(2000);
  
  await page.getByRole('textbox', { name: 'Email' }).fill(process.env.EMAIL || '');
  await page.getByRole('textbox', { name: 'Password' }).fill(process.env.PASSWORD || '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  
  // Wait for successful login
  const urlPattern = isPartnerDomain ? /partner\.cloudskillsboost\.google\/(dashboard|$)/ : /www\.cloudskillsboost\.google\/(catalog|dashboard|$)/;
  await page.waitForURL(urlPattern, { timeout: 60000 });
  await page.waitForLoadState('domcontentloaded');
  
  // Save cookies after successful login
  const cookies = await page.context().cookies();
  const authData = { cookies };
  fs.writeFileSync('auth.json', JSON.stringify(authData, null, 2));
  
  console.log('Successfully logged in and saved cookies');
}