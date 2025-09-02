import { test } from './fixtures';
import { login } from '../utils/login';

test.describe('Resume Video Completion', () => {
  test('resume from specific course', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes
    
    await login(page);
    
    const courseUrl = 'https://www.cloudskillsboost.google/paths/69/course_templates/178/video/567824';
    console.log(`🎯 Resuming from: ${courseUrl}`);
    
    await page.goto(courseUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Parse JSON from ql-course-outline modules attribute
    const modulesData = await page.getAttribute('ql-course-outline', 'modules');
    if (modulesData) {
      const modules = JSON.parse(modulesData);
      
      // Extract all video activities
      const videoActivities = [];
      for (const module of modules) {
        for (const step of module.steps) {
          for (const activity of step.activities) {
            if (activity.type === 'video' && !activity.isComplete) {
              videoActivities.push(activity);
            }
          }
        }
      }
      
      console.log(`Found ${videoActivities.length} incomplete videos`);
      
      // Skip first 15 videos (already processed in batches 1-3)
      const remainingVideos = videoActivities.slice(15);
      console.log(`Processing ${remainingVideos.length} remaining videos`);
      
      // Process remaining videos in small batches
      const batchSize = 3;
      for (let i = 0; i < remainingVideos.length; i += batchSize) {
        const batch = remainingVideos.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(remainingVideos.length/batchSize)}`);
        
        for (const video of batch) {
          try {
            await page.goto(`https://partner.cloudskillsboost.google${video.href}`, { timeout: 30000 });
            await page.waitForLoadState('domcontentloaded');
            
            const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
            if (await completeBtn.isVisible({ timeout: 10000 })) {
              await completeBtn.click({ timeout: 10000 });
              console.log(`✅ Completed: ${video.title}`);
            } else {
              console.log(`⏭️ No complete button: ${video.title}`);
            }
            
            await page.waitForTimeout(500);
          } catch (e) {
            console.log(`❌ Failed: ${video.title}`);
            if (e.message.includes('Target page, context or browser has been closed')) {
              return;
            }
          }
        }
        
        // Break between batches
        await page.waitForTimeout(2000);
      }
    }
    
    console.log('🎉 Remaining videos processed!');
  });
});