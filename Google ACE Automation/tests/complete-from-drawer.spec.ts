import { test } from './fixtures';
import * as fs from 'fs';

test.describe('Complete From Drawer Data', () => {
  test('complete activities using drawer JSON data', async ({ page }) => {
    
    // Load saved cookies
    try {
      if (fs.existsSync('auth.json')) {
        const authData = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
        await page.context().addCookies(authData.cookies);
        console.log('🍪 Loaded saved authentication');
      } else {
        throw new Error('No auth.json found - run manual:session first');
      }
    } catch (e) {
      console.log('❌ Authentication failed:', e.message);
      return;
    }
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const urls = fileContent.split('\n').filter(line => line.trim());
    
    for (const url of urls) {
      console.log(`🎯 Processing course: ${url}`);
      
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
        
        // Get modules data from ql-course-outline
        const modulesData = await page.getAttribute('ql-course-outline', 'modules');
        if (!modulesData) {
          console.log('❌ No course outline data found');
          continue;
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
        
        console.log(`📊 Status: ${completedActivities}/${totalActivities} completed`);
        console.log(`🎯 Found ${incompleteActivities.length} activities to complete`);
        
        // Process incomplete activities
        for (const activity of incompleteActivities) {
          try {
            console.log(`📍 Processing: ${activity.title} (${activity.type})`);
            
            const activityUrl = `https://www.cloudskillsboost.google${activity.href}`;
            await page.goto(activityUrl, { timeout: 30000 });
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
            
            if (activity.type === 'video') {
              // For videos, wait for video to load and look for completion button
              await page.waitForTimeout(3000);
              
              // Look for video completion button
              const videoSelectors = [
                'ql-button:has-text("Mark as completed")',
                'button:has-text("Mark as Completed")',
                'button[aria-label="Mark as completed"]',
                'button:has-text("Mark as Complete")',
                '.complete-button',
                '[data-testid="complete-button"]'
              ];
              
              let completed = false;
              for (const selector of videoSelectors) {
                try {
                  const btn = page.locator(selector);
                  if (await btn.isVisible({ timeout: 5000 })) {
                    await btn.click();
                    console.log(`🎥 Completed video: ${activity.title}`);
                    completed = true;
                    break;
                  }
                } catch (e) {}
              }
              
              if (!completed) {
                console.log(`🎥 Video viewed: ${activity.title} (may auto-complete)`);
              }
              
            } else if (activity.type === 'link' || activity.type === 'document') {
              // For documents, scroll to bottom and wait
              await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
              await page.waitForTimeout(3000);
              
              // Look for completion button
              const completionSelectors = [
                'ql-button:has-text("Mark as completed")',
                'button:has-text("Mark as Completed")',
                'button[aria-label="Mark as completed"]',
                'button:has-text("Continue")',
                'button:has-text("Next")'
              ];
              
              let completed = false;
              for (const selector of completionSelectors) {
                try {
                  const btn = page.locator(selector);
                  if (await btn.isVisible({ timeout: 2000 })) {
                    await btn.click();
                    console.log(`📖 Completed: ${activity.title}`);
                    completed = true;
                    break;
                  }
                } catch (e) {}
              }
              
              if (!completed) {
                console.log(`📖 Viewed: ${activity.title} (may auto-complete)`);
              }
              
            } else if (activity.type === 'quiz') {
              console.log(`🧠 Quiz found: ${activity.title} (manual completion required)`);
            }
            
            await page.waitForTimeout(2000);
            
          } catch (e) {
            console.log(`❌ Failed: ${activity.title} - ${e.message}`);
          }
        }
        
        // Return to course page and verify completion
        console.log('🔄 Refreshing course page to check completion...');
        await page.goto(url, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        
        // Get updated completion status
        const updatedModulesData = await page.getAttribute('ql-course-outline', 'modules');
        if (updatedModulesData) {
          const updatedModules = JSON.parse(updatedModulesData);
          let finalCompleted = 0;
          let finalTotal = 0;
          
          for (const module of updatedModules) {
            for (const step of module.steps) {
              for (const activity of step.activities) {
                if (['link', 'document', 'video', 'quiz'].includes(activity.type) && activity.href) {
                  finalTotal++;
                  if (activity.isComplete) {
                    finalCompleted++;
                  }
                }
              }
            }
          }
          
          const percentage = Math.round((finalCompleted / finalTotal) * 100);
          console.log(`🎉 Final status: ${finalCompleted}/${finalTotal} completed (${percentage}%)`);
          
          // Check progress bar
          const progressBar = await page.locator('ql-progress-bar').getAttribute('progress');
          if (progressBar) {
            const progressPercentage = Math.round(parseFloat(progressBar) * 100);
            console.log(`📊 Progress bar shows: ${progressPercentage}%`);
          }
        }
        
      } catch (e) {
        console.log(`❌ Failed course: ${e.message}`);
      }
    }
    
    console.log('🎉 All courses processed!');
  });
});