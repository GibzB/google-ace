import { test } from './fixtures';
import * as fs from 'fs';

test.describe('Test Authentication', () => {
  test('verify saved cookies work', async ({ page }) => {
    test.setTimeout(120000);
    
    // Load saved cookies
    try {
      if (fs.existsSync('auth.json')) {
        const authData = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
        await page.context().addCookies(authData.cookies);
        console.log('🍪 Loaded saved cookies');
      } else {
        console.log('❌ No auth.json file found');
        return;
      }
    } catch (e) {
      console.log('❌ Failed to load cookies:', e.message);
      return;
    }
    
    // Test access to your course
    const courseUrl = 'https://www.cloudskillsboost.google/paths/1951/course_templates/1265';
    console.log(`🎯 Testing access to: ${courseUrl}`);
    
    await page.goto(courseUrl, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Check if we can access the course outline
    const modulesData = await page.getAttribute('ql-course-outline', 'modules');
    if (modulesData) {
      const modules = JSON.parse(modulesData);
      console.log(`✅ Successfully accessed course with ${modules.length} modules`);
      
      // Count activities
      let totalActivities = 0;
      let completedActivities = 0;
      
      for (const module of modules) {
        for (const step of module.steps) {
          for (const activity of step.activities) {
            if (['link', 'document', 'video', 'quiz'].includes(activity.type) && activity.href) {
              totalActivities++;
              if (activity.isComplete) {
                completedActivities++;
              }
            }
          }
        }
      }
      
      console.log(`📊 Course status: ${completedActivities}/${totalActivities} activities completed`);
      console.log('🎉 Authentication is working! Ready for automated completion.');
      
    } else {
      console.log('❌ Could not access course data - authentication may have failed');
    }
  });
});