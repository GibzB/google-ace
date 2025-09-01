import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('User-like Video Completion', () => {
  test('complete videos like a human user', async ({ page }) => {
    await login(page);
    
    let videoIds: string[] = [];
    
    // Try to read from videos.txt, fallback to hardcoded list
    try {
      const fileContent = fs.readFileSync('videos.txt', 'utf-8');
      videoIds = fileContent.split('\n').filter(line => line.trim());
    } catch {
      videoIds = [
        '562162', '562163', '562166', '562167', '562168', '562169', 
        '562171', '562172', '562174', '562175', '562176', '562177', 
        '562178', '562179', '562182', '562183', '562184', '562185', '562188'
      ];
    }
    
    for (const courseId of videoIds) {
      console.log(`📚 Opening course ${courseId}...`);
      
      await page.goto(`https://partner.cloudskillsboost.google/paths/69/course_sessions/${courseId}`);
      
      // Wait for page to load naturally
      await page.waitForSelector('h1', { timeout: 30000 });
      
      // Human-like pause to "read" the page
      await page.waitForTimeout(Math.random() * 2000 + 1000);
      
      // Find all incomplete videos in this course
      const videos = page.locator('ql-course-outline a[href*="/video/"]:not([data-complete="true"])');
      const videoCount = await videos.count();
      
      console.log(`Found ${videoCount} incomplete videos`);
      
      for (let i = 0; i < videoCount; i++) {
        const video = videos.nth(i);
        await video.click({ force: true });
        
        // Wait for video page to load
        await page.waitForSelector('h1', { timeout: 15000 });
        await page.waitForTimeout(Math.random() * 1000 + 500);
        
        // Mark as completed
        const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
        if (await completeBtn.isVisible()) {
          await completeBtn.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          await completeBtn.click();
          console.log(`✅ Completed video ${i + 1}`);
          await page.waitForTimeout(1000);
        }
        
        // Go back to course outline
        await page.goBack();
        await page.waitForTimeout(Math.random() * 1000 + 500);
      }
      
      console.log(`🎉 Finished course ${courseId}`);
      await page.waitForTimeout(Math.random() * 2000 + 1000);
    }
    
    console.log('🎉 All videos processed!');
  });
});