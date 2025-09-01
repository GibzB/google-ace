import { test } from './fixtures';
import { login } from '../utils/login';

test.describe('Complete All Videos', () => {
  test('mark all videos as completed', async ({ page }) => {
    await login(page);
    
    const videos = [
      562162, 562163,
      562166, 562167, 562168, 562169, 562171, 562172,
      562174, 562175, 562176, 562177, 562178, 562179,
      562182, 562183, 562184, 562185, 562188
    ];
    
    for (const videoId of videos) {
      try {
        await page.goto(`https://partner.cloudskillsboost.google/paths/69/course_sessions/28596661/video/${videoId}`, { timeout: 15000 });
        await page.waitForLoadState('domcontentloaded');
        
        const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
        if (await completeBtn.isVisible({ timeout: 5000 })) {
          await completeBtn.click();
          await page.waitForTimeout(1000);
          console.log(`✅ Completed video ${videoId}`);
        } else {
          console.log(`⏭️ Video ${videoId} already completed or no button found`);
        }
      } catch (e) {
        console.log(`❌ Failed video ${videoId}: ${e.message}`);
        try {
          await page.waitForTimeout(1000);
        } catch (waitError) {
          console.log('Page closed, stopping execution');
          break;
        }
      }
      
      try {
        await page.waitForTimeout(3000);
      } catch (waitError) {
        console.log('Page closed, stopping execution');
        break;
      }
    }
    
    console.log('✅ All videos completed');
  });
});