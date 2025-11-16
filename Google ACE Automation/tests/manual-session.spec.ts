import { test } from './fixtures';
import * as fs from 'fs';

test.describe('Manual Session', () => {
  test('use manual session for course completion', async ({ page }) => {
    test.setTimeout(1800000); // 30 minutes
    
    // Load existing cookies if available
    try {
      if (fs.existsSync('auth.json')) {
        const authData = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
        await page.context().addCookies(authData.cookies);
        console.log('🍪 Loaded existing cookies');
      }
    } catch (e) {
      console.log('No existing cookies found');
    }
    
    console.log('🎯 Manual session started');
    console.log('📝 Instructions:');
    console.log('1. Login manually if needed');
    console.log('2. Navigate to your courses');
    console.log('3. Complete activities manually');
    console.log('4. The script will save your session cookies');
    console.log('5. Close browser when finished');
    
    // Start at your target URL
    const targetUrl = 'https://www.cloudskillsboost.google/paths/1951/course_templates/1265';
    await page.goto(targetUrl, { timeout: 30000 });
    
    // Save cookies periodically
    const saveInterval = setInterval(async () => {
      try {
        const cookies = await page.context().cookies();
        const authData = { cookies };
        fs.writeFileSync('auth.json', JSON.stringify(authData, null, 2));
        console.log('💾 Cookies saved');
      } catch (e) {
        console.log('Failed to save cookies');
      }
    }, 30000); // Save every 30 seconds
    
    // Wait for manual completion
    try {
      await page.waitForEvent('close', { timeout: 1800000 });
    } catch (e) {
      console.log('⏰ Session timeout or browser closed');
    }
    
    clearInterval(saveInterval);
    
    // Final cookie save
    try {
      const cookies = await page.context().cookies();
      const authData = { cookies };
      fs.writeFileSync('auth.json', JSON.stringify(authData, null, 2));
      console.log('🎉 Final session saved!');
    } catch (e) {
      console.log('Failed to save final cookies');
    }
  });
});