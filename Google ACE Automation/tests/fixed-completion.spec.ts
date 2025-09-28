import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('Fixed Video Completion', () => {
  test('complete videos with cookie handling', async ({ page }) => {
    test.setTimeout(600000);
    
    await login(page);
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const videoUrls = fileContent.split('\n').filter(line => line.trim());
    
    for (const url of videoUrls) {
      console.log(`🎯 Processing course: ${url}`);
      
      await page.goto(url);
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
        
        for (let i = 0; i < videoActivities.length; i++) {
          const video = videoActivities[i];
          
          try {
            const videoUrl = video.href.startsWith('http') ? video.href : `https://partner.cloudskillsboost.google${video.href}`;
            await page.goto(videoUrl);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(1000);
            
            // Handle cookie consent if present
            try {
              const agreeBtn = page.locator('button:has-text("Agree")');
              if (await agreeBtn.isVisible({ timeout: 2000 })) {
                await agreeBtn.click();
                await page.waitForTimeout(1000);
              }
            } catch (e) {}
            
            // Look for completion button with multiple selectors
            const selectors = [
              'button:has-text("Mark as Completed")',
              'button:has-text("Complete")',
              'button[aria-label*="complete"]',
              '[data-testid="complete"]'
            ];
            
            let completed = false;
            for (const selector of selectors) {
              try {
                const btn = page.locator(selector).first();
                if (await btn.isVisible({ timeout: 3000 })) {
                  await btn.click();
                  console.log(`✅ ${i+1}/${videoActivities.length}: ${video.title}`);
                  completed = true;
                  break;
                }
              } catch (e) {}
            }
            
            if (!completed) {
              console.log(`⏭️ ${i+1}/${videoActivities.length}: ${video.title} (no button found)`);
            }
            
          } catch (e) {
            console.log(`❌ ${i+1}/${videoActivities.length}: ${video.title}`);
          }
          
          await page.waitForTimeout(300);
        }
      }
    }
    
    console.log('🎉 Processing complete!');
  });
});