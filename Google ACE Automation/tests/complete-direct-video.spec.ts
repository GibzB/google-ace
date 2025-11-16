import { test } from './fixtures';
import * as fs from 'fs';

test.describe('Complete Direct Video', () => {
  test('complete video directly', async ({ page }) => {
    // Load saved cookies
    try {
      if (fs.existsSync('auth.json')) {
        const authData = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
        await page.context().addCookies(authData.cookies);
        console.log('🍪 Loaded saved authentication');
      } else {
        throw new Error('No auth.json found');
      }
    } catch (e) {
      console.log('❌ Authentication failed:', e.message);
      return;
    }
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const urls = fileContent.split('\n').filter(line => line.trim());
    
    for (const url of urls) {
      console.log(`🎯 Processing video: ${url}`);
      
      try {
        await page.goto(url, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        
        // Handle cookie banner
        try {
          const cookieBtn = page.locator('button.glue-cookie-notification-bar__accept');
          if (await cookieBtn.isVisible({ timeout: 2000 })) {
            await cookieBtn.click();
            await page.waitForTimeout(1000);
          }
        } catch (e) {}
        
        // Look for the completion button
        const completionSelectors = [
          'ql-button:has-text("Mark as completed")',
          'button:has-text("Mark as Completed")',
          'button[aria-label="Mark as completed"]'
        ];
        
        let completed = false;
        for (const selector of completionSelectors) {
          try {
            const btn = page.locator(selector);
            if (await btn.isVisible({ timeout: 5000 })) {
              await btn.click();
              console.log(`✅ Completed: ${url}`);
              completed = true;
              break;
            }
          } catch (e) {}
        }
        
        if (!completed) {
          console.log(`⏭️ No completion button found: ${url}`);
        }
        
        await page.waitForTimeout(2000);
        
      } catch (e) {
        console.log(`❌ Failed: ${url} - ${e.message}`);
      }
    }
    
    console.log('🎉 All videos processed!');
  });
});