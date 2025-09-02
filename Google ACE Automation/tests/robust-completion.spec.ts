import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('Robust Course Completion', () => {
  test('complete courses with error handling', async ({ page }) => {
    test.setTimeout(1800000); // 30 minutes
    
    await login(page);
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const videoUrls = fileContent.split('\n').filter(line => line.trim());
    
    for (let courseIndex = 0; courseIndex < videoUrls.length; courseIndex++) {
      const url = videoUrls[courseIndex];
      console.log(`\n🎯 Course ${courseIndex + 1}/${videoUrls.length}: ${url}`);
      
      // Skip course 178
      if (url.includes('course_templates/178')) {
        console.log('✅ Course 178 already completed, skipping...');
        continue;
      }
      
      try {
        await page.goto(url, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        
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
          let completed = 0;
          
          for (let i = 0; i < videoActivities.length; i++) {
            const video = videoActivities[i];
            
            try {
              await page.goto(`https://partner.cloudskillsboost.google${video.href}`, { 
                timeout: 15000,
                waitUntil: 'domcontentloaded'
              });
              
              const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
              
              if (await completeBtn.isVisible({ timeout: 3000 })) {
                await completeBtn.click({ timeout: 5000 });
                completed++;
                console.log(`✅ ${i+1}/${videoActivities.length}: ${video.title}`);
                await page.waitForTimeout(500);
              } else {
                console.log(`⏭️ ${i+1}/${videoActivities.length}: ${video.title}`);
              }
              
            } catch (e) {
              console.log(`❌ ${i+1}/${videoActivities.length}: ${video.title} - ${e.message.substring(0, 50)}`);
              
              // If too many consecutive failures, skip to next course
              if (i > 10 && completed === 0) {
                console.log('Too many failures, moving to next course...');
                break;
              }
            }
            
            // Small delay between videos
            await page.waitForTimeout(200);
          }
          
          console.log(`🎉 Course ${courseIndex + 1} completed! (${completed}/${videoActivities.length} videos)`);
        }
        
      } catch (e) {
        console.log(`❌ Failed to load course ${courseIndex + 1}: ${e.message}`);
      }
      
      // Break between courses
      await page.waitForTimeout(3000);
    }
    
    console.log('🏆 All courses processed!');
  });
});