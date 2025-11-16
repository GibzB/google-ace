import { test } from './fixtures';
import * as fs from 'fs';

// Enable parallel execution for this file
test.describe.configure({ mode: 'parallel' });

test.describe('Complete Courses in Parallel', () => {
  // Read URLs and create individual tests for each
  const fileContent = fs.readFileSync('videos.txt', 'utf-8');
  const urls = fileContent.split('\n').filter(line => line.trim());
  
  urls.forEach((url, index) => {
    test(`complete course ${index + 1}: ${url}`, async ({ page }) => {
      // Load saved cookies
      try {
        if (fs.existsSync('auth.json')) {
          const authData = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
          await page.context().addCookies(authData.cookies);
          console.log(`🍪 Worker ${test.info().workerIndex}: Loaded authentication`);
        } else {
          throw new Error('No auth.json found');
        }
      } catch (e) {
        console.log(`❌ Worker ${test.info().workerIndex}: Auth failed`);
        return;
      }
      
      console.log(`🎯 Worker ${test.info().workerIndex}: Processing ${url}`);
      
      try {
        await page.goto(url, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        
        // Handle cookie banner
        try {
          const cookieBtn = page.locator('button.glue-cookie-notification-bar__accept');
          if (await cookieBtn.isVisible({ timeout: 2000 })) {
            await cookieBtn.click();
            await page.waitForTimeout(1000);
          }
        } catch (e) {}
        
        // Get course data
        const modulesData = await page.getAttribute('ql-course-outline', 'modules');
        if (!modulesData) {
          console.log(`❌ Worker ${test.info().workerIndex}: No course data found`);
          return;
        }
        
        const modules = JSON.parse(modulesData);
        const incompleteActivities = [];
        let totalActivities = 0;
        let completedActivities = 0;
        
        // Find incomplete activities
        for (const module of modules) {
          for (const step of module.steps) {
            for (const activity of step.activities) {
              if (['link', 'document', 'video', 'quiz'].includes(activity.type) && activity.href) {
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
        
        console.log(`📊 Worker ${test.info().workerIndex}: ${completedActivities}/${totalActivities} completed`);
        console.log(`🎯 Worker ${test.info().workerIndex}: ${incompleteActivities.length} to complete`);
        
        // Process incomplete activities
        for (const activity of incompleteActivities) {
          try {
            console.log(`📍 Worker ${test.info().workerIndex}: ${activity.title} (${activity.type})`);
            
            const activityUrl = `https://www.cloudskillsboost.google${activity.href}`;
            await page.goto(activityUrl, { timeout: 30000 });
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
            
            if (activity.type === 'video') {
              await page.waitForTimeout(3000);
              const videoSelectors = [
                'ql-button:has-text("Mark as completed")',
                'button:has-text("Mark as Completed")',
                'button[aria-label="Mark as completed"]',
                'button:has-text("Mark as Complete")'
              ];
              
              let completed = false;
              for (const selector of videoSelectors) {
                try {
                  const btn = page.locator(selector);
                  if (await btn.isVisible({ timeout: 5000 })) {
                    await btn.click();
                    console.log(`🎥 Worker ${test.info().workerIndex}: Completed ${activity.title}`);
                    completed = true;
                    break;
                  }
                } catch (e) {}
              }
              
              if (!completed) {
                console.log(`🎥 Worker ${test.info().workerIndex}: Viewed ${activity.title}`);
              }
              
            } else if (activity.type === 'link' || activity.type === 'document') {
              await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
              await page.waitForTimeout(3000);
              
              const completionSelectors = [
                'ql-button:has-text("Mark as completed")',
                'button:has-text("Mark as Completed")',
                'button[aria-label="Mark as completed"]',
                'button:has-text("Continue")'
              ];
              
              let completed = false;
              for (const selector of completionSelectors) {
                try {
                  const btn = page.locator(selector);
                  if (await btn.isVisible({ timeout: 2000 })) {
                    await btn.click();
                    console.log(`📖 Worker ${test.info().workerIndex}: Completed ${activity.title}`);
                    completed = true;
                    break;
                  }
                } catch (e) {}
              }
              
              if (!completed) {
                console.log(`📖 Worker ${test.info().workerIndex}: Viewed ${activity.title}`);
              }
            }
            
            await page.waitForTimeout(1000);
            
          } catch (e) {
            console.log(`❌ Worker ${test.info().workerIndex}: Failed ${activity.title}`);
          }
        }
        
        console.log(`✅ Worker ${test.info().workerIndex}: Course completed!`);
        
      } catch (e) {
        console.log(`❌ Worker ${test.info().workerIndex}: Course failed`);
      }
    });
  });
});