import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

test('Complete Specific Oracle Courses', async ({ page }) => {
  const email = process.env.ORACLE_EMAIL!;
  const password = process.env.ORACLE_PASSWORD!;

  // Oracle AI Foundations courses
  const courseUrls = [
    'https://mylearn.oracle.com/ou/learning-path/become-a-oci-ai-foundations-associate-2025/147781',
    'https://mylearn.oracle.com/ou/course/oracle-cloud-infrastructure-ai-foundations/147805'
  ];

  // Login
  await page.goto('/race-to-certification-2025?path=afterActivation');
  
  const loginButton = page.locator('text=Sign In').or(page.locator('text=Login')).first();
  if (await loginButton.isVisible()) {
    await loginButton.click();
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/race-to-certification-2025**', { timeout: 30000 });
  }

  // Process each specific course
  for (const courseUrl of courseUrls) {
    try {
      console.log(`Processing course: ${courseUrl}`);
      await page.goto(courseUrl);
      await page.waitForLoadState('networkidle');

      // Auto-complete course content
      await autoCompleteCourse(page);
      
      console.log(`Completed course: ${courseUrl}`);
    } catch (error) {
      console.error(`Error with course ${courseUrl}:`, error);
    }
  }
});

async function autoCompleteCourse(page: any) {
  // Look for different types of content to complete
  
  // 1. Videos
  const videos = await page.locator('video, [data-testid*="video"], .video-player').all();
  for (const video of videos) {
    if (await video.isVisible()) {
      await video.click();
      await page.waitForTimeout(1000);
      
      // Try to skip or complete video
      const skipBtn = page.locator('text=Skip, text=Next, [aria-label*="skip"]').first();
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
      }
    }
  }

  // 2. Modules/Lessons
  const modules = await page.locator('[data-testid*="module"], .module, .lesson').all();
  for (const module of modules) {
    if (await module.isVisible()) {
      await module.click();
      await page.waitForTimeout(500);
    }
  }

  // 3. Quizzes/Assessments
  const quizzes = await page.locator('[data-testid*="quiz"], .quiz, .assessment').all();
  for (const quiz of quizzes) {
    if (await quiz.isVisible()) {
      await quiz.click();
      await page.waitForTimeout(500);
      
      // Try to answer quiz questions (basic approach)
      const answers = await page.locator('input[type="radio"], input[type="checkbox"]').all();
      for (const answer of answers.slice(0, 1)) { // Select first option
        await answer.click();
      }
      
      const submitBtn = page.locator('text=Submit, text=Next, [type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }
  }

  // 4. Mark as complete
  const completeBtn = page.locator('text=Complete, text=Mark Complete, text=Finish').first();
  if (await completeBtn.isVisible()) {
    await completeBtn.click();
  }
}