import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('Sequential Course Completion', () => {
  test('complete courses sequentially', async ({ page }) => {
    test.setTimeout(1800000); // 30 minutes total
    
    await login(page);
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const videoUrls = fileContent.split('\n').filter(line => line.trim());
    
    for (let courseIndex = 0; courseIndex < videoUrls.length; courseIndex++) {
      const url = videoUrls[courseIndex];
      console.log(`\n🎯 Course ${courseIndex + 1}/${videoUrls.length}: ${url}`);
      
      // Skip course 178 (mark as completed)
      if (url.includes('course_templates/178')) {
        console.log('✅ Course 178 already completed, skipping...');
        continue;
      }
      
      try {
        await page.goto(url);
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
        
        console.log(`🎉 Course ${courseIndex + 1} completed!`);
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log(`❌ Failed course ${courseIndex + 1}: ${e.message}`);
        if (e.message.includes('Target page, context or browser has been closed')) {
          break;
        }
      }
    }
    
    console.log('🏆 All courses processed!');
  });
});