import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('Complete Videos from Drawer', () => {
  test('complete all videos using course drawer', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes
    await login(page);
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const videoUrls = fileContent.split('\n').filter(line => line.trim());
    
    for (const url of videoUrls) {
      console.log(`🎯 Processing course from: ${url}`);
      
      try {
        await page.goto(url);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
        
        // Parse JSON from ql-course-outline modules attribute
        const modulesData = await page.getAttribute('ql-course-outline', 'modules');
        if (modulesData) {
          const modules = JSON.parse(modulesData);
          
          // Extract all video activities
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
          
          // Process videos in smaller batches
          const batchSize = 5;
          for (let i = 0; i < videoActivities.length; i += batchSize) {
            const batch = videoActivities.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(videoActivities.length/batchSize)}`);
            
            for (const video of batch) {
              try {
                await page.goto(`https://partner.cloudskillsboost.google${video.href}`, { timeout: 30000 });
                await page.waitForLoadState('domcontentloaded');
                
                const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
                if (await completeBtn.isVisible({ timeout: 10000 })) {
                  await completeBtn.click({ timeout: 10000 });
                  console.log(`✅ Completed: ${video.title}`);
                } else {
                  console.log(`⏭️ No complete button: ${video.title}`);
                }
                
                await page.waitForTimeout(200);
              } catch (e) {
                console.log(`❌ Failed: ${video.title}`);
                if (e.message.includes('Target page, context or browser has been closed')) {
                  return;
                }
              }
            }
            
            // Short break between batches
            await page.waitForTimeout(1000);
          }
        }
        
        await page.waitForTimeout(500);
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