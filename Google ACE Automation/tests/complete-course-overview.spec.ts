import { test } from './fixtures';
import * as fs from 'fs';

test.describe('Complete Course Overview', () => {
  test('complete activities from course overview page', async ({ page }) => {
    // Load saved cookies
    try {
      if (fs.existsSync('auth.json')) {
        const authData = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
        await page.context().addCookies(authData.cookies);
        console.log('🍪 Loaded saved authentication');
      } else {
        throw new Error('No auth.json found');
      }
    } catch (e) {
      console.log('❌ Authentication failed:', e.message);
      return;
    }
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const urls = fileContent.split('\n').filter(line => line.trim());
    
    for (const url of urls) {
      console.log(`🎯 Processing course overview: ${url}`);
      
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
        
        // Find all incomplete activity cards (those without completed="" attribute)
        const activityCards = await page.locator('ql-activity-card').all();
        console.log(`📋 Found ${activityCards.length} total activities`);
        
        let completedCount = 0;
        let processedCount = 0;
        
        for (const card of activityCards) {
          try {
            const isCompleted = await card.getAttribute('completed');
            const activityName = await card.getAttribute('name');
            const activityType = await card.getAttribute('type');
            const activityPath = await card.getAttribute('path');
            
            if (isCompleted !== null) {
              console.log(`✅ Already completed: ${activityName} (${activityType})`);
              completedCount++;
              continue;
            }
            
            // Skip badges and surveys as they can't be auto-completed
            if (activityType === 'badge' || activityType === 'survey') {
              console.log(`⏭️ Skipping: ${activityName} (${activityType}) - requires manual completion`);
              continue;
            }
            
            console.log(`🎯 Processing: ${activityName} (${activityType})`);
            
            // Click on the activity card to navigate to it
            await card.click();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
            
            // Look for completion button on the activity page
            const completionSelectors = [
              'ql-button:has-text("Mark as completed")',
              'button:has-text("Mark as Completed")',
              'button[aria-label="Mark as completed"]'
            ];
            
            let completed = false;
            for (const selector of completionSelectors) {
              try {
                const btn = page.locator(selector);
                if (await btn.isVisible({ timeout: 3000 })) {
                  await btn.click();
                  console.log(`✅ Completed: ${activityName}`);
                  completed = true;
                  processedCount++;
                  break;
                }
              } catch (e) {}
            }
            
            if (!completed) {
              console.log(`📖 Viewed: ${activityName} (may auto-complete)`);
              processedCount++;
            }
            
            // Go back to course overview
            await page.goBack();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
            
          } catch (e) {
            console.log(`❌ Failed processing activity: ${e.message}`);
          }
        }
        
        console.log(`📊 Summary: ${completedCount} already completed, ${processedCount} processed`);
        
        // Refresh page to see updated completion status
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        
        // Count final completion status
        const finalCards = await page.locator('ql-activity-card').all();
        let finalCompleted = 0;
        
        for (const card of finalCards) {
          const isCompleted = await card.getAttribute('completed');
          if (isCompleted !== null) {
            finalCompleted++;
          }
        }
        
        console.log(`🎉 Final status: ${finalCompleted}/${finalCards.length} activities completed`);
        
      } catch (e) {
        console.log(`❌ Failed course: ${url} - ${e.message}`);
      }
    }
    
    console.log('🎉 All courses processed!');
  });
});