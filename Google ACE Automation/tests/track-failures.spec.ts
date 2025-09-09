import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('Track Failed Videos', () => {
  test('complete courses and track failures', async ({ page }) => {
    test.setTimeout(1800000); // 30 minutes
    
    await login(page);
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const videoUrls = fileContent.split('\n').filter(line => line.trim());
    const failedVideos = [];
    
    for (let courseIndex = 0; courseIndex < videoUrls.length; courseIndex++) {
      const url = videoUrls[courseIndex];
      console.log(`\n🎯 Course ${courseIndex + 1}/${videoUrls.length}: ${url}`);
      

      
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
              } else {
                console.log(`⏭️ ${i+1}/${videoActivities.length}: ${video.title}`);
              }
              
            } catch (e) {
              console.log(`❌ ${i+1}/${videoActivities.length}: ${video.title}`);
              
              // Track failed video
              failedVideos.push({
                course: url,
                videoTitle: video.title,
                videoHref: video.href,
                error: e.message.substring(0, 100)
              });
            }
            
            await page.waitForTimeout(200);
          }
          
          console.log(`🎉 Course ${courseIndex + 1} completed! (${completed}/${videoActivities.length} videos)`);
        }
        
      } catch (e) {
        console.log(`❌ Failed to load course ${courseIndex + 1}: ${e.message}`);
      }
      
      await page.waitForTimeout(3000);
    }
    
    // Save failed videos to file
    if (failedVideos.length > 0) {
      const failedContent = failedVideos.map(f => 
        `${f.course}\n  Video: ${f.videoTitle}\n  URL: https://partner.cloudskillsboost.google${f.videoHref}\n  Error: ${f.error}\n`
      ).join('\n');
      
      fs.writeFileSync('failed-videos.txt', failedContent);
      console.log(`\n📝 Saved ${failedVideos.length} failed videos to failed-videos.txt`);
    }
    
    console.log('🏆 All courses processed!');
  });
});