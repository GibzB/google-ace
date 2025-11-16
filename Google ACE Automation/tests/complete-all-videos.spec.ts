import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('Complete All Videos', () => {
  test('mark all videos as completed', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes
    await login(page);
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const videoUrls = fileContent.split('\n').filter(line => line.trim());
    
    for (const url of videoUrls) {
      console.log(`🎯 Processing course from: ${url}`);
      
      try {
        await page.goto(url);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        
        // Handle cookie banner if present
        try {
          const cookieBtn = page.locator('button.glue-cookie-notification-bar__accept');
          if (await cookieBtn.isVisible({ timeout: 2000 })) {
            await cookieBtn.click();
            await page.waitForTimeout(1000);
          }
        } catch (e) {
          // Cookie banner not present, continue
        }
        
        // Parse JSON from ql-course-outline modules attribute
        const modulesData = await page.getAttribute('ql-course-outline', 'modules');
        if (modulesData) {
          const modules = JSON.parse(modulesData);
          
          // Extract all activities (videos, documents, labs, etc.)
          const incompleteActivities = [];
          let totalActivities = 0;
          let completedActivities = 0;
          
          for (const module of modules) {
            for (const step of module.steps) {
              for (const activity of step.activities) {
                // Include videos, documents, labs, quizzes - anything that can be completed
                if (['video', 'document', 'lab', 'quiz', 'reading'].includes(activity.type)) {
                  totalActivities++;
                  if (activity.isComplete) {
                    completedActivities++;
                  } else {
                    incompleteActivities.push(activity);
                  }
                }
              }
            }
          }
          
          console.log(`📚 Activity status: ${completedActivities}/${totalActivities} completed`);
          console.log(`🎯 Found ${incompleteActivities.length} activities to complete`);
          
          // Process incomplete activities
          for (const activity of incompleteActivities) {
            try {
              const activityUrl = activity.href.startsWith('http') ? activity.href : `https://www.cloudskillsboost.google${activity.href}`;
              await page.goto(activityUrl, { timeout: 30000 });
              await page.waitForLoadState('domcontentloaded');
              await page.waitForTimeout(1000);
              
              const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
              if (await completeBtn.isVisible({ timeout: 5000 })) {
                await completeBtn.click({ timeout: 10000 });
                console.log(`✅ Completed: ${activity.title} (${activity.type})`);
              } else {
                console.log(`⏭️ No complete button: ${activity.title} (${activity.type})`);
              }
              
              await page.waitForTimeout(500);
            } catch (e) {
              console.log(`❌ Failed: ${activity.title} (${activity.type}) - ${e.message}`);
              if (e.message.includes('Target page, context or browser has been closed')) {
                return;
              }
            }
          }
          
          // Verify completion by going back to course page
          console.log('🔍 Verifying completion status...');
          await page.goto(url);
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(2000);
          
          const updatedModulesData = await page.getAttribute('ql-course-outline', 'modules');
          if (updatedModulesData) {
            const updatedModules = JSON.parse(updatedModulesData);
            let finalCompleted = 0;
            let finalTotal = 0;
            
            for (const module of updatedModules) {
              for (const step of module.steps) {
                for (const activity of step.activities) {
                  if (['video', 'document', 'lab', 'quiz', 'reading'].includes(activity.type)) {
                    finalTotal++;
                    if (activity.isComplete) {
                      finalCompleted++;
                    }
                  }
                }
              }
            }
            
            console.log(`🎉 Final status: ${finalCompleted}/${finalTotal} activities completed (${Math.round(finalCompleted/finalTotal*100)}%)`);
            
            if (finalCompleted === finalTotal) {
              console.log('✅ All activities have green ticks!');
            } else {
              console.log(`⚠️ ${finalTotal - finalCompleted} activities still missing green ticks`);
            }
          }
        }
        
      } catch (e) {
        console.log(`❌ Failed course: ${e.message}`);
        if (e.message.includes('Target page, context or browser has been closed')) {
          break;
        }
      }
    }
    
    console.log('🎉 All courses processed!');
  });
});