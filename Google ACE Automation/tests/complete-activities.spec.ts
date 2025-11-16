import { test } from '@playwright/test';
import { login } from '../utils/login';
import { readFileSync } from 'fs';

test('Complete activities from videos.txt', async ({ page }) => {
  await login(page);
  
  // Read URLs from videos.txt
  const videosContent = readFileSync('videos.txt', 'utf-8');
  const urls = videosContent.split('\n').filter(url => url.trim());
  
  console.log(`Found ${urls.length} URLs to process`);

  for (const url of urls) {
    if (!url.trim()) continue;
    
    console.log(`Processing: ${url}`);
    
    try {
      // Navigate to the activity
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Try multiple selectors for the Mark as completed button
      const selectors = [
        'ql-button:has-text("Mark as completed")',
        'button:has-text("Mark as completed")',
        'ql-button[href*="complete_button"]',
        '[aria-label="Mark as completed"]',
        'ql-button:has(ql-icon[slot="icon"]:has-text("arrow_forward"))'
      ];

      let buttonFound = false;
      for (const selector of selectors) {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          console.log(`✓ Marked as completed using selector: ${selector}`);
          buttonFound = true;
          break;
        }
      }

      if (!buttonFound) {
        console.log(`⚠ No "Mark as completed" button found for: ${url}`);
      }

    } catch (error) {
      console.log(`✗ Error processing ${url}:`, error.message);
    }

    // Small delay between activities
    await page.waitForTimeout(2000);
  }

  console.log('Completed processing all activities');
});