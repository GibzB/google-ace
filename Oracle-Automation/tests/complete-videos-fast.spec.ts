import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

test('Fast Complete Oracle Videos', async ({ page }) => {
  const email = process.env.ORACLE_EMAIL!;
  const password = process.env.ORACLE_PASSWORD!;

  // Try direct course access first
  try {
    await page.goto('https://mylearn.oracle.com/ou/course/oracle-cloud-infrastructure-ai-foundations/147805');
  } catch {
    // If blocked, login first
    await page.goto('https://mylearn.oracle.com');
    
    const loginButton = page.locator('text=Sign In').or(page.locator('text=Login')).first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // Try course URL again after login
      await page.goto('https://mylearn.oracle.com/ou/course/oracle-cloud-infrastructure-ai-foundations/147805');
    }
  }

  await page.waitForSelector('.playlistComponent', { timeout: 30000 });

  // Get all video/demo components (skip skill checks for now)
  const allComponents = await page.locator('.playlistComponent a.playlist-component-href').all();
  const videoComponents = [];
  
  for (const component of allComponents) {
    const title = await component.getAttribute('title');
    if (title && !title.includes('Skill Check')) {
      const href = await component.getAttribute('href');
      if (href) {
        videoComponents.push(`https://mylearn.oracle.com${href}`);
      }
    }
  }

  console.log(`Found ${videoComponents.length} video components to complete`);

  for (let i = 0; i < videoComponents.length; i++) {
    try {
      const url = videoComponents[i];
      console.log(`Processing video ${i + 1}/${videoComponents.length}: ${url}`);

      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Look for video element
      const video = page.locator('video.vjs-tech').first();
      if (await video.isVisible()) {
        console.log('Video found, skipping to end...');
        
        // Method 1: Use JavaScript to skip to end
        await page.evaluate(() => {
          const videoEl = document.querySelector('video.vjs-tech') as HTMLVideoElement;
          if (videoEl) {
            // Wait for video metadata to load
            if (videoEl.readyState >= 1) {
              videoEl.currentTime = videoEl.duration - 0.1;
            } else {
              videoEl.addEventListener('loadedmetadata', () => {
                videoEl.currentTime = videoEl.duration - 0.1;
              });
            }
          }
        });

        await page.waitForTimeout(5000);

        // Method 2: Try keyboard shortcuts
        await video.click();
        await page.keyboard.press('End');
        await page.waitForTimeout(2000);
        
        // Method 3: Try seeking to end via video controls
        const progressBar = page.locator('.vjs-progress-control').first();
        if (await progressBar.isVisible()) {
          const box = await progressBar.boundingBox();
          if (box) {
            // Click at the far right of progress bar
            await page.mouse.click(box.x + box.width - 5, box.y + box.height / 2);
          }
        }

        await page.waitForTimeout(3000);
        console.log(`Video ${i + 1} completed`);
      } else {
        console.log('No video found, might be text content');
      }

    } catch (error) {
      console.error(`Error with video ${i + 1}:`, error);
    }
  }

  console.log('All videos processed!');
});