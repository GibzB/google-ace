import { test } from './fixtures';
import { login } from '../utils/login';

test.describe('Course 2 Video Completion', () => {
  test('complete all videos in course template 2', async ({ page }) => {
    await login(page);
    
    await page.goto('https://partner.cloudskillsboost.google/paths/69/course_templates/2');
    await page.waitForLoadState('networkidle');
    
    const resumeBtn = page.locator('text=Resume course');
    const startBtn = page.locator('text=Start course');
    
    if (await resumeBtn.isVisible()) {
      await resumeBtn.click();
    } else if (await startBtn.isVisible()) {
      await startBtn.click();
    }
    
    await page.waitForLoadState('networkidle');
    
    // Expand all modules
    const moduleHeaders = page.locator('ql-course-outline .ql-module-header');
    const count = await moduleHeaders.count();
    
    for (let i = 0; i < count; i++) {
      const header = moduleHeaders.nth(i);
      const expandIcon = header.locator('ql-icon[icon="expand_more"]');
      if (await expandIcon.isVisible()) {
        await header.click();
      }
    }
    
    // Complete all videos
    let videos = page.locator('ql-course-outline a[href*="/video/"]:not([data-complete="true"])');
    
    while (await videos.count() > 0) {
      const video = videos.first();
      await video.click({ force: true });
      
      const completeBtn = page.getByRole('button', { name: 'Mark as Completed' });
      await completeBtn.waitFor({ state: 'visible' });
      await completeBtn.click();
      
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      videos = page.locator('ql-course-outline a[href*="/video/"]:not([data-complete="true"])');
    }
    
    console.log('✅ All videos completed');
  });
});