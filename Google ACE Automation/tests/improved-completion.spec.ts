import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('Improved Video Completion', () => {
  test('complete videos with better error handling', async ({ page }) => {
    test.setTimeout(1800000); // 30 minutes
    
    await login(page);
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const videoUrls = fileContent.split('\n').filter(line => line.trim());
    
    for (const url of videoUrls) {
      console.log(`🎯 Processing course: ${url}`);
      
      try {
        await page.goto(url, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        
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
              console.log(`Processing ${i+1}/${videoActivities.length}: ${video.title}`);
              
              await page.goto(`https://partner.cloudskillsboost.google${video.href}`, { 
                timeout: 30000,
                waitUntil: 'domcontentloaded'
              });
              
              await page.waitForTimeout(2000);
              
              // Try multiple selectors for the complete button
              const selectors = [
                'button:has-text("Mark as Completed")',
                '[data-testid="mark-complete"]',
                'button[aria-label*="complete"]',
                '.complete-button',
                'button:has-text("Complete")'
              ];
              
              let buttonFound = false;
              for (const selector of selectors) {
                try {
                  const button = page.locator(selector).first();
                  if (await button.isVisible({ timeout: 3000 })) {
                    await button.click({ timeout: 10000 });
                    console.log(`✅ ${i+1}/${videoActivities.length}: ${video.title}`);
                    buttonFound = true;
                    break;
                  }
                } catch (e) {
                  // Continue to next selector
                }
              }
              
              if (!buttonFound) {
                console.log(`⏭️ ${i+1}/${videoActivities.length}: ${video.title} (already completed or no button)`);
              }
              
            } catch (e) {
              console.log(`❌ ${i+1}/${videoActivities.length}: ${video.title} - ${e.message.substring(0, 50)}`);
            }
            
            await page.waitForTimeout(500);
          }
        }
        
      } catch (e) {
        console.log(`❌ Failed to process course: ${e.message}`);
      }
    }
    
    console.log('🏆 Processing complete!');
  });
});