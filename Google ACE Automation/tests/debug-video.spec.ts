import { test } from './fixtures';
import { login } from '../utils/login';

test.describe('Debug Specific Video', () => {
  test('check video 567821 completion status', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes
    
    await login(page);
    
    const videoUrl = 'https://www.cloudskillsboost.google/paths/69/course_templates/178/video/567821';
    console.log(`🔍 Checking video: ${videoUrl}`);
    
    try {
      await page.goto(videoUrl, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      // Check if "Mark as Completed" button exists
      const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
      const isCompleteVisible = await completeBtn.isVisible({ timeout: 5000 });
      
      if (isCompleteVisible) {
        console.log('✅ "Mark as Completed" button found - video is not completed yet');
        await completeBtn.click();
        console.log('🎯 Clicked "Mark as Completed" button');
        await page.waitForTimeout(2000);
      } else {
        console.log('❌ "Mark as Completed" button not found - video might already be completed');
      }
      
      // Check for any completion indicators
      const completedIndicator = await page.locator('[data-testid="completed"], .completed, [aria-label*="completed"]').count();
      console.log(`📊 Found ${completedIndicator} completion indicators`);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-video-567821.png', fullPage: true });
      console.log('📸 Screenshot saved as debug-video-567821.png');
      
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
  });
});