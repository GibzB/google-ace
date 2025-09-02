import { test } from './fixtures';
import { login } from '../utils/login';

test.describe('Single Course Completion', () => {
  test('complete one course at a time', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes per course
    
    await login(page);
    
    const courseUrl = 'https://www.cloudskillsboost.google/paths/69/course_templates/50/video/578266';
    console.log(`🎯 Processing: ${courseUrl}`);
    
    await page.goto(courseUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
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
        try {
          await page.goto(`https://partner.cloudskillsboost.google${video.href}`, { timeout: 20000 });
          await page.waitForLoadState('domcontentloaded');
          
          const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
          if (await completeBtn.isVisible({ timeout: 5000 })) {
            await completeBtn.click();
            console.log(`✅ ${i+1}/${videoActivities.length}: ${video.title}`);
          } else {
            console.log(`⏭️ ${i+1}/${videoActivities.length}: ${video.title}`);
          }
          
          await page.waitForTimeout(300);
        } catch (e) {
          console.log(`❌ ${i+1}/${videoActivities.length}: ${video.title}`);
        }
      }
    }
    
    console.log('🎉 Course completed!');
  });
});