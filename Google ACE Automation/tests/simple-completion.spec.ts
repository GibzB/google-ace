import { test } from './fixtures';
import { login } from '../utils/login';

test.describe('Simple Course Completion', () => {
  test('complete course 2', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes
    
    await login(page);
    
    const courseUrl = 'https://www.cloudskillsboost.google/paths/69/course_templates/2/video/562167';
    console.log(`🎯 Processing: ${courseUrl}`);
    
    await page.goto(courseUrl, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    const modulesData = await page.getAttribute('ql-course-outline', 'modules');
    if (modulesData) {
      const modules = JSON.parse(modulesData);
      
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
      
      for (let i = 0; i < videoActivities.length; i++) {
        const video = videoActivities[i];
        console.log(`Processing ${i+1}/${videoActivities.length}: ${video.title}`);
        
        try {
          await page.goto(`https://partner.cloudskillsboost.google${video.href}`, { 
            timeout: 60000,
            waitUntil: 'networkidle'
          });
          
          await page.waitForTimeout(2000);
          
          const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
          
          if (await completeBtn.isVisible({ timeout: 10000 })) {
            await completeBtn.click({ timeout: 10000 });
            console.log(`✅ Completed: ${video.title}`);
          } else {
            console.log(`⏭️ No button: ${video.title}`);
          }
          
          await page.waitForTimeout(1000);
          
        } catch (e) {
          console.log(`❌ Failed: ${video.title}`);
        }
      }
    }
    
    console.log('🎉 Course 2 completed!');
  });
});