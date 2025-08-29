import { test, expect } from './fixtures';

test.describe('Video Completion', () => {
  test.use({
    viewport: {
      height: 720,
      width: 1280
    }
  });

  test('mark videos as completed', async ({ page }) => {
    test.setTimeout(0);
    
    await page.goto('https://partner.cloudskillsboost.google/', { waitUntil: 'domcontentloaded' });
    
    // Handle cookie consent immediately
    try {
      await page.getByRole('button', { name: 'Agree' }).click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded');
    } catch (e) {
      console.log('No cookie consent dialog found');
    }

    // Check if already logged in
    const isLoggedIn = await page.getByRole('button', { name: 'My account' }).isVisible();
    
    if (!isLoggedIn) {
      await page.getByRole('link', { name: 'Sign in' }).click();
      await page.getByRole('textbox', { name: 'Email' }).fill('billy.gibendi@kitstek.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('Kitsilano2025');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.getByRole('button', { name: 'My account' }).waitFor();
    }
    
    console.log('User is logged in');

    // Process video range 562157-562188
    for (let videoId = 562157; videoId <= 562188; videoId++) {
      try {
        console.log(`Processing video ${videoId}...`);
        
        const videoUrl = `https://www.cloudskillsboost.google/paths/69/course_templates/2/video/${videoId}`;
        
        try {
          await page.goto(videoUrl, { timeout: 0 });
          await page.waitForLoadState('domcontentloaded', { timeout: 0 });
        } catch (navError) {
          console.log(`Navigation error for video ${videoId}, continuing...`);
          continue;
        }
        
        // Check if video exists
        if (!page.url().includes(`video/${videoId}`)) {
          console.log(`Video ${videoId} not found, skipping...`);
          continue;
        }
        
        // Click description icons and wait
        try {
          const descriptionIcons = page.locator('ql-icon:has-text("description")');
          const count = await descriptionIcons.count();
          
          for (let i = 0; i < count; i++) {
            try {
              await descriptionIcons.nth(i).click({ timeout: 5000 });
              await page.waitForTimeout(6000);
            } catch (clickError) {
              console.log(`Could not click description icon ${i + 1}, continuing...`);
            }
          }
        } catch (iconError) {
          console.log(`No description icons found for video ${videoId}`);
        }
        
        // Mark video as completed
        try {
          const completeButton = page.locator('ql-button:has-text("Mark as Completed")');
          
          if (await completeButton.isVisible({ timeout: 5000 })) {
            await completeButton.click({ timeout: 5000 });
            console.log(`Completed video ${videoId}`);
          } else {
            console.log(`Video ${videoId} already complete or button not found`);
          }
        } catch (completeError) {
          console.log(`Could not complete video ${videoId}, continuing...`);
        }
      } catch (error) {
        console.log(`Error with video ${videoId}, continuing to next video`);
      }
    }
    
    console.log('Script completed. All videos processed.');
  });
});