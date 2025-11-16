import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('Complete Direct Links', () => {
  test('complete activities from direct URLs', async ({ page }) => {
    test.setTimeout(600000);
    await login(page);
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const urls = fileContent.split('\n').filter(line => line.trim());
    
    console.log(`🎯 Processing ${urls.length} direct URLs`);
    
    for (const url of urls) {
      try {
        console.log(`📍 Processing: ${url}`);
        
        await page.goto(url, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        
        // Handle cookie banner
        try {
          const cookieBtn = page.locator('button.glue-cookie-notification-bar__accept');
          if (await cookieBtn.isVisible({ timeout: 2000 })) {
            await cookieBtn.click();
            await page.waitForTimeout(1000);
          }
        } catch (e) {}
        
        // Check if this is a course outline page with activity links
        const activityLinks = await page.locator('a.activity[href*="/documents/"], a.activity[href*="/video/"], a.activity[href*="/lab/"], a.activity[href*="/quiz/"]').all();
        
        if (activityLinks.length > 0) {
          console.log(`📋 Found ${activityLinks.length} activities in course outline`);
          
          for (const link of activityLinks) {
            try {
              const href = await link.getAttribute('href');
              const title = await link.locator('.activity-title').textContent();
              
              // Check if already completed (has completed status)
              const statusIcon = link.locator('ql-icon.status.complete');
              if (await statusIcon.count() > 0) {
                console.log(`✅ Already completed: ${title}`);
                continue;
              }
              
              console.log(`🎯 Processing activity: ${title}`);
              
              // Navigate to the activity
              const activityUrl = href.startsWith('http') ? href : `https://www.cloudskillsboost.google${href}`;
              await page.goto(activityUrl, { timeout: 30000 });
              await page.waitForLoadState('domcontentloaded');
              await page.waitForTimeout(1000);
              
              // For documents/readings, scroll to bottom to trigger completion
              if (href.includes('/documents/') || href.includes('/reading/')) {
                try {
                  // Scroll to bottom of page to trigger auto-completion
                  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                  await page.waitForTimeout(2000);
                  
                  // Look for completion indicators or buttons
                  const completionSelectors = [
                    'button:has-text("Mark as Completed")',
                    'button[aria-label="Mark as completed"]',
                    'button:has-text("Continue")',
                    '.completion-button',
                    '[data-testid="complete"]'
                  ];
                  
                  let completed = false;
                  for (const selector of completionSelectors) {
                    try {
                      const btn = page.locator(selector);
                      if (await btn.isVisible({ timeout: 2000 })) {
                        await btn.click();
                        console.log(`✅ Completed: ${title}`);
                        completed = true;
                        break;
                      }
                    } catch (e) {}
                  }
                  
                  if (!completed) {
                    // Some documents auto-complete just by viewing
                    console.log(`📜 Viewed document: ${title} (may auto-complete)`);
                  }
                  
                  // Wait longer for auto-completion to register
                  await page.waitForTimeout(3000);
                  
                } catch (e) {
                  console.log(`❌ Error processing document: ${title}`);
                }
              } else {
                // For videos and other activities
                const buttonSelectors = [
                  'button:has-text("Mark as Completed")',
                  'button[aria-label="Mark as completed"]',
                  'button:has-text("Mark as Complete")',
                  'button:has-text("Continue")',
                  '.complete-button'
                ];
                
                let completed = false;
                for (const selector of buttonSelectors) {
                  try {
                    const btn = page.locator(selector);
                    if (await btn.isVisible({ timeout: 3000 })) {
                      await btn.click({ timeout: 10000 });
                      console.log(`✅ Completed: ${title}`);
                      completed = true;
                      break;
                    }
                  } catch (e) {}
                }
                
                if (!completed) {
                  console.log(`⏭️ No complete button: ${title}`);
                }
                
                // Wait for completion to register
                await page.waitForTimeout(2000);
              }
              
              // Wait a bit for status to update
              await page.waitForTimeout(1500);
              
            } catch (e) {
              console.log(`❌ Failed activity: ${e.message}`);
            }
          }
          
          // Go back to course outline to verify completion
          await page.goto(url, { timeout: 30000 });
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(2000);
          
          const updatedLinks = await page.locator('a.activity').all();
          let completedCount = 0;
          
          for (const link of updatedLinks) {
            const completedIcon = link.locator('ql-icon.status.complete');
            if (await completedIcon.count() > 0) {
              completedCount++;
            }
          }
          
          console.log(`📊 Course completion: ${completedCount}/${updatedLinks.length} activities`);
          
        } else {
          // Direct activity page - look for completion button
          const buttonSelectors = [
            'button:has-text("Mark as Completed")',
            'button[aria-label="Mark as completed"]',
            'button:has-text("Mark as Complete")',
            '.complete-button'
          ];
          
          let completed = false;
          for (const selector of buttonSelectors) {
            try {
              const btn = page.locator(selector);
              if (await btn.isVisible({ timeout: 3000 })) {
                await btn.click({ timeout: 10000 });
                console.log(`✅ Completed: ${url}`);
                completed = true;
                break;
              }
            } catch (e) {}
          }
          
          if (!completed) {
            console.log(`⏭️ No complete button found: ${url}`);
          }
        }
        
        await page.waitForTimeout(1000);
        
      } catch (e) {
        console.log(`❌ Failed: ${url} - ${e.message}`);
      }
    }
    
    console.log('🎉 All URLs processed!');
  });
});