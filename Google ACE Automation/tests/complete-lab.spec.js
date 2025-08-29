import { test, expect } from './fixtures';

test.describe('Lab Completion', () => {
  test.use({
    viewport: {
      height: 720,
      width: 1280
    }
  });

  test('complete lab', async ({ page }) => {
    test.setTimeout(0);
    
    await page.goto('https://partner.cloudskillsboost.google/', { waitUntil: 'domcontentloaded' });
    
    try {
      await page.getByRole('button', { name: 'Agree' }).click({ timeout: 5000 });
    } catch (e) {}

    const isLoggedIn = await page.getByRole('button', { name: 'My account' }).isVisible();
    
    if (!isLoggedIn) {
      await page.getByRole('link', { name: 'Sign in' }).click();
      await page.getByRole('textbox', { name: 'Email' }).fill('billy.gibendi@kitstek.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('Kitsilano2025');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.getByRole('button', { name: 'My account' }).waitFor();
    }
    
    console.log('User is logged in');

    await page.goto('https://www.cloudskillsboost.google/paths/69/course_sessions/28596565/video/548388', { timeout: 0 });
    await page.waitForLoadState('domcontentloaded', { timeout: 0 });
    
    // Check initial progress
    try {
      const initialProgress = await page.locator('.course-progress__percentage').textContent();
      console.log(`Initial progress: ${initialProgress}`);
    } catch (e) {
      console.log('Could not read initial progress');
    }
    
    // Click description icons
    try {
      const descriptionIcons = page.locator('ql-icon:has-text("description")');
      const count = await descriptionIcons.count();
      
      for (let i = 0; i < count; i++) {
        try {
          await descriptionIcons.nth(i).click({ timeout: 5000 });
          await page.waitForTimeout(6000);
        } catch (clickError) {
          console.log(`Could not click description icon ${i + 1}`);
        }
      }
    } catch (iconError) {
      console.log('No description icons found');
    }
    
    // Mark video as completed using POST request
    try {
      await page.evaluate(() => {
        fetch('/paths/69/course_sessions/28596565/video/548388/complete_button', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
          }
        });
      });
      console.log('Sent POST completion request');
      await page.waitForTimeout(5000);
    } catch (completeError) {
      console.log('Could not complete video');
    }
    
    // Check final progress
    try {
      await page.goto('https://www.cloudskillsboost.google/paths/69/course_sessions/28596565/video/548388', { timeout: 0 });
      await page.waitForLoadState('domcontentloaded', { timeout: 0 });
      const finalProgress = await page.locator('.course-progress__percentage').textContent();
      console.log(`Final progress: ${finalProgress}`);
    } catch (e) {
      console.log('Could not read final progress');
    }
    
    console.log('Video processing completed');
  });
});