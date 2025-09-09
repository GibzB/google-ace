import { test } from './fixtures';
import { login } from '../utils/login';

test.describe('Verify Course Completion', () => {
  test('check course completion status', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes
    
    await login(page);
    
    const courseUrl = 'https://www.cloudskillsboost.google/paths/69/course_templates/178';
    console.log(`🔍 Checking course completion: ${courseUrl}`);
    
    await page.goto(courseUrl, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Check for completion indicators
    const completedBadge = await page.locator('.completed, [data-testid="completed"], .badge-completed').count();
    console.log(`📊 Found ${completedBadge} completion badges`);
    
    // Check progress indicators
    const progressElements = await page.locator('[data-testid="progress"], .progress, .completion-status').count();
    console.log(`📈 Found ${progressElements} progress elements`);
    
    // Check for checkmarks or completion icons
    const checkmarks = await page.locator('svg[data-testid="check"], .checkmark, .completed-icon').count();
    console.log(`✅ Found ${checkmarks} checkmark icons`);
    
    // Get module data to check completion status
    const modulesData = await page.getAttribute('ql-course-outline', 'modules');
    if (modulesData) {
      const modules = JSON.parse(modulesData);
      
      let totalVideos = 0;
      let completedVideos = 0;
      
      for (const module of modules) {
        for (const step of module.steps) {
          for (const activity of step.activities) {
            if (activity.type === 'video') {
              totalVideos++;
              if (activity.isComplete) {
                completedVideos++;
              }
            }
          }
        }
      }
      
      console.log(`📹 Video completion: ${completedVideos}/${totalVideos} (${Math.round(completedVideos/totalVideos*100)}%)`);
      
      if (completedVideos === totalVideos) {
        console.log('🎉 All videos are completed!');
      } else {
        console.log(`⚠️ ${totalVideos - completedVideos} videos still need completion`);
      }
    }
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'course-completion-status.png', fullPage: true });
    console.log('📸 Screenshot saved as course-completion-status.png');
  });
});