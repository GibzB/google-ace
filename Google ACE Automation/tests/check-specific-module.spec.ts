import { test, expect } from './fixtures';
import { login } from '../utils/login';

test.describe('Specific Module Checker', () => {
  test('check course template 2 module', async ({ page }) => {
    await login(page);
    
    const moduleUrl = 'https://partner.cloudskillsboost.google/paths/69/course_templates/2';
    await page.goto(moduleUrl);
    await page.waitForLoadState('networkidle');
    
    // Check if module is accessible and get status
    const moduleTitle = await page.locator('h1').first().textContent();
    console.log(`📚 Module: ${moduleTitle}`);
    
    // Check completion status
    const resumeButton = page.locator('text=Resume course');
    const startButton = page.locator('text=Start course');
    
    if (await resumeButton.isVisible()) {
      console.log('✅ Module in progress - can resume');
      await resumeButton.click();
    } else if (await startButton.isVisible()) {
      console.log('🆕 Module not started');
      await startButton.click();
    } else {
      console.log('✅ Module may be completed');
    }
    
    await page.waitForTimeout(3000);
  });
});