import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('Complete All Courses', () => {
  test('complete all videos in all courses', async ({ page }) => {
    await login(page);
    
    let courseIds: string[] = [];
    
    try {
      const fileContent = fs.readFileSync('courses.txt', 'utf-8');
      courseIds = fileContent.split('\n').filter(line => line.trim());
    } catch {
      courseIds = ['77', '60', '50', '49', '178', '2', '99', '864', '443', '648', '637', '625', '636'];
    }
    
    for (const courseId of courseIds) {
      console.log(`📚 Processing course template ${courseId}...`);
      
      // Go to course template page
      await page.goto(`https://partner.cloudskillsboost.google/paths/69/course_templates/${courseId}`);
      await page.waitForSelector('h1', { timeout: 30000 });
      
      // Try to start/resume course
      const resumeBtn = page.locator('text=Resume course');
      const startBtn = page.locator('text=Start course');
      
      if (await resumeBtn.isVisible()) {
        await resumeBtn.click();
      } else if (await startBtn.isVisible()) {
        await startBtn.click();
      }
      
      await page.waitForTimeout(2000);
      
      // Find all incomplete videos
      const videos = page.locator('ql-course-outline a[href*="/video/"]:not([data-complete="true"])');
      const videoCount = await videos.count();
      
      console.log(`Found ${videoCount} incomplete videos in course ${courseId}`);
      
      for (let i = 0; i < videoCount; i++) {
        try {
          const video = videos.nth(i);
          await video.click({ force: true });
          
          await page.waitForSelector('h1', { timeout: 15000 });
          await page.waitForTimeout(Math.random() * 1000 + 500);
          
          const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
          if (await completeBtn.isVisible()) {
            await completeBtn.scrollIntoViewIfNeeded();
            await page.waitForTimeout(300);
            await completeBtn.click();
            console.log(`✅ Completed video ${i + 1} in course ${courseId}`);
            await page.waitForTimeout(1000);
          }
          
          await page.goBack();
          await page.waitForTimeout(Math.random() * 1000 + 500);
        } catch (e) {
          console.log(`❌ Failed video ${i + 1} in course ${courseId}: ${e.message}`);
          if (e.message.includes('Target page, context or browser has been closed')) {
            console.log('Page closed, stopping video processing');
            return;
          }
          continue;
        }
      }
      
      console.log(`🎉 Finished course ${courseId}`);
      
      try {
        await page.waitForTimeout(Math.random() * 2000 + 1000);
      } catch (e) {
        console.log('Page closed, stopping execution');
        break;
      }
    }
    
    console.log('🏆 All courses completed!');
  });
});