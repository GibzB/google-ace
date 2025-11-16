import { test } from './fixtures';
import * as fs from 'fs';

test.describe('Complete With Navigation', () => {
  test('complete activities using navigation buttons', async ({ page }) => {
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
        
        // Find first incomplete activity
        const activityCards = await page.locator('ql-activity-card').all();
        let startIndex = -1;
        
        for (let i = 0; i < activityCards.length; i++) {
          const card = activityCards[i];
          const isCompleted = await card.getAttribute('completed') !== null;
          const hasActivityCompletedClass = await card.locator('.link-button.activity-completed').count() > 0;
          const isDisabled = await card.locator('.link-button[disabled]').count() > 0;
          
          if (!isCompleted && !hasActivityCompletedClass && !isDisabled) {
            startIndex = i;
            break;
          }
        }
        
        if (startIndex === -1) {
          console.log('✅ All activities already completed');
          continue;
        }
        
        // Click on first incomplete activity
        const firstCard = activityCards[startIndex];
        const name = await firstCard.getAttribute('name') || 'Unknown';
        console.log(`🎯 Starting with: ${name}`);
        
        const startButton = firstCard.locator('.link-button');
        await startButton.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        
        // Now iterate through activities using navigation
        let activityCount = 0;
        const maxActivities = 50; // Safety limit
        
        while (activityCount < maxActivities) {
          try {
            // Try to find and click "Mark as completed" button
            const markCompleteSelectors = [
              'ql-button:has-text("Mark as completed")',
              'button:has-text("Mark as completed")',
              'ql-button[href*="complete_button"]',
              '.next-navigation-buttons ql-button[outlined]'
            ];
            
            let completed = false;
            for (const selector of markCompleteSelectors) {
              try {
                const btn = page.locator(selector);
                if (await btn.isVisible({ timeout: 2000 })) {
                  await btn.click();
                  console.log(`✅ Marked as completed`);
                  completed = true;
                  await page.waitForTimeout(1000);
                  break;
                }
              } catch (e) {}
            }
            
            if (!completed) {
              console.log(`📖 Viewed activity (may auto-complete)`);
            }
            
            activityCount++;
            
            // Try to find and click Next button
            const nextSelectors = [
              '.next-button:not([disabled])',
              'ql-button.next-button:not([disabled])',
              'ql-button[href*="video"]:not([disabled]):has(ql-icon:text("navigate_next"))'
            ];
            
            let foundNext = false;
            for (const selector of nextSelectors) {
              try {
                const nextBtn = page.locator(selector);
                if (await nextBtn.isVisible({ timeout: 2000 })) {
                  const isDisabled = await nextBtn.getAttribute('disabled') !== null;
                  if (!isDisabled) {
                    await nextBtn.click();
                    await page.waitForLoadState('domcontentloaded');
                    await page.waitForTimeout(2000);
                    console.log(`➡️ Moved to next activity`);
                    foundNext = true;
                    break;
                  }
                }
              } catch (e) {}
            }
            
            if (!foundNext) {
              console.log(`🏁 No more activities or reached end`);
              break;
            }
            
          } catch (e) {
            console.log(`❌ Error in activity: ${e.message}`);
            break;
          }
        }
        
        console.log(`📊 Processed ${activityCount} activities for this course`);
        
      } catch (e) {
        console.log(`❌ Failed course: ${url} - ${e.message}`);
      }
    }
    
    console.log('🎉 All courses processed!');
  });
});