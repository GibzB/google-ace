import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('Complete Videos from URLs', () => {
  test('complete all videos from videos.txt', async ({ page }) => {
    await login(page);
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const videoUrls = fileContent.split('\n').filter(line => line.trim());
    
    for (const url of videoUrls) {
      console.log(`🎥 Processing: ${url}`);
      
      try {
        await page.goto(url, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);
        
        const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
        if (await completeBtn.isVisible({ timeout: 5000 })) {
          await completeBtn.click();
          console.log(`✅ Completed video`);
          await page.waitForTimeout(500);
        } else {
          console.log(`⏭️ Video already completed or no button found`);
        }
        
        await page.waitForTimeout(Math.random() * 2000 + 1000);
      } catch (e) {
        console.log(`❌ Failed: ${e.message}`);
        if (e.message.includes('Target page, context or browser has been closed')) {
          break;
        }
      }
    }
    
    console.log('🎉 All videos processed!');
  });
});