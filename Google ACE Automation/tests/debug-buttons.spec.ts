import { test } from './fixtures';
import { login } from '../utils/login';

test.describe('Debug Buttons', () => {
  test('check what buttons exist on video page', async ({ page }) => {
    test.setTimeout(300000);
    
    await login(page);
    
    // Go to first video from the course
    await page.goto('https://partner.cloudskillsboost.google/paths/1337/course_templates/593/video/586867');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Get modules data and find first video
    const modulesData = await page.getAttribute('ql-course-outline', 'modules');
    if (modulesData) {
      const modules = JSON.parse(modulesData);
      
      for (const module of modules) {
        for (const step of module.steps) {
          for (const activity of step.activities) {
            if (activity.type === 'video' && !activity.isComplete) {
              console.log(`🎯 Testing video: ${activity.title}`);
              
              const videoUrl = activity.href.startsWith('http') ? activity.href : `https://partner.cloudskillsboost.google${activity.href}`;
              await page.goto(videoUrl);
              await page.waitForLoadState('domcontentloaded');
              await page.waitForTimeout(2000);
              
              // Check all buttons on page
              const buttons = await page.locator('button').all();
              console.log(`📊 Found ${buttons.length} buttons:`);
              
              for (let i = 0; i < Math.min(buttons.length, 10); i++) {
                const text = await buttons[i].textContent();
                const visible = await buttons[i].isVisible();
                console.log(`  ${i+1}. "${text}" (visible: ${visible})`);
              }
              
              // Take screenshot
              await page.screenshot({ path: `debug-video-${activity.title.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
              
              return; // Only test first video
            }
          }
        }
      }
    }
  });
});