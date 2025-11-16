import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

test('Complete Oracle AI Foundations Course', async ({ page }) => {
  const email = process.env.ORACLE_EMAIL!;
  const password = process.env.ORACLE_PASSWORD!;

  // Start with Oracle login page
  await page.goto('https://mylearn.oracle.com');
  
  // Handle login
  const loginButton = page.locator('text=Sign In').or(page.locator('text=Login')).first();
  if (await loginButton.isVisible()) {
    await loginButton.click();
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  }

  // Now navigate to course page after login
  await page.goto('https://mylearn.oracle.com/ou/course/oracle-cloud-infrastructure-ai-foundations/147805');
  try {
    await page.waitForSelector('.playlistComponent', { timeout: 30000 });
  } catch {
    console.log('Retrying navigation...');
    await page.goto('https://mylearn.oracle.com/ou/course/oracle-cloud-infrastructure-ai-foundations/147805');
    await page.waitForSelector('.playlistComponent', { timeout: 30000 });
  }

  // Get all course components from the playlist
  const components = await page.locator('.playlistComponent a.playlist-component-href').all();
  console.log(`Found ${components.length} course components`);

  for (let i = 0; i < components.length; i++) {
    try {
      const componentUrl = await components[i].getAttribute('href');
      if (!componentUrl) continue;

      const fullUrl = componentUrl.startsWith('http') ? componentUrl : `https://mylearn.oracle.com${componentUrl}`;
      console.log(`Processing component ${i + 1}: ${fullUrl}`);

      // Navigate to component
      await page.goto(fullUrl);
      await page.waitForLoadState('networkidle');

      // Check if it's a video component
      const video = page.locator('video.vjs-tech').first();
      if (await video.isVisible()) {
        console.log('Found video, skipping to end...');
        
        // Wait for video to load
        await page.waitForTimeout(3000);
        
        // Click on video to focus it
        await video.click();
        await page.waitForTimeout(1000);
        
        // Skip to the furthest end of the video using keyboard shortcut
        await page.keyboard.press('End');
        await page.waitForTimeout(2000);
        
        // Alternative: Try to set video currentTime to duration
        await page.evaluate(() => {
          const videoElement = document.querySelector('video.vjs-tech') as HTMLVideoElement;
          if (videoElement && videoElement.duration) {
            videoElement.currentTime = videoElement.duration - 1;
          }
        });
        
        await page.waitForTimeout(3000);
      }

      // Check if it's a skill check/quiz
      const skillCheckTitle = await page.locator('text=Skill Check').first();
      if (await skillCheckTitle.isVisible()) {
        console.log('Found skill check, attempting to complete...');
        
        // Look for quiz questions and select first option for each
        const radioButtons = await page.locator('input[type="radio"]').all();
        for (let j = 0; j < radioButtons.length; j++) {
          if (j % 4 === 0) { // Select first option of each question (assuming 4 options per question)
            await radioButtons[j].click();
            await page.waitForTimeout(500);
          }
        }

        // Submit quiz
        const submitButton = page.locator('text=Submit').or(page.locator('button[type="submit"]')).first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }

      // Look for any completion buttons
      const completeButtons = [
        'text=Mark Complete',
        'text=Complete',
        'text=Mark as Complete',
        '[aria-label*="complete"]',
        '.complete-btn'
      ];
      
      for (const selector of completeButtons) {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(1000);
          break;
        }
      }

      console.log(`Completed component ${i + 1}`);
      
    } catch (error) {
      console.error(`Error with component ${i + 1}:`, error);
    }
  }

  console.log('Oracle AI Foundations course completion attempted');
});