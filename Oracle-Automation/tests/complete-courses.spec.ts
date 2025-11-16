import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

test('Complete Oracle Courses', async ({ page }) => {
  const email = process.env.ORACLE_EMAIL!;
  const password = process.env.ORACLE_PASSWORD!;

  // Login first
  await page.goto('/race-to-certification-2025?path=afterActivation');
  
  // Handle login if needed
  const loginButton = page.locator('text=Sign In').or(page.locator('text=Login')).first();
  if (await loginButton.isVisible()) {
    await loginButton.click();
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/race-to-certification-2025**', { timeout: 30000 });
  }

  // Find available courses
  const courseLinks = await page.locator('a[href*="course"]').all();
  console.log(`Found ${courseLinks.length} courses`);

  for (let i = 0; i < courseLinks.length; i++) {
    try {
      // Get course URL
      const courseUrl = await courseLinks[i].getAttribute('href');
      if (!courseUrl) continue;

      console.log(`Starting course ${i + 1}: ${courseUrl}`);
      
      // Navigate to course
      await page.goto(courseUrl);
      await page.waitForLoadState('networkidle');

      // Look for course content (videos, modules, etc.)
      const videoElements = page.locator('video').or(page.locator('[data-testid*="video"]'));
      const moduleElements = page.locator('[data-testid*="module"]').or(page.locator('.module'));
      
      // Complete videos if present
      const videos = await videoElements.all();
      for (const video of videos) {
        if (await video.isVisible()) {
          await video.click();
          await page.waitForTimeout(2000); // Wait for video to load
          
          // Skip to end or mark as complete
          const skipButton = page.locator('text=Skip').or(page.locator('[data-testid="skip"]'));
          if (await skipButton.isVisible()) {
            await skipButton.click();
          }
        }
      }

      // Complete modules if present
      const modules = await moduleElements.all();
      for (const module of modules) {
        if (await module.isVisible()) {
          await module.click();
          await page.waitForTimeout(1000);
          
          // Look for completion button
          const completeButton = page.locator('text=Complete').or(page.locator('text=Mark Complete'));
          if (await completeButton.isVisible()) {
            await completeButton.click();
          }
        }
      }

      console.log(`Completed course ${i + 1}`);
      
    } catch (error) {
      console.error(`Error completing course ${i + 1}:`, error);
    }
  }

  console.log('All courses processing completed');
});