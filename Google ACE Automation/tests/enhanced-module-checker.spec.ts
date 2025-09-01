import { test, expect } from './fixtures';
import * as fs from 'fs';
import { login } from '../utils/login';

test.describe('Enhanced Module Checker', () => {
  test('check and process all modules', async ({ page }) => {
    await login(page);
    
    const modules = JSON.parse(fs.readFileSync('modules.json', 'utf8'))
      .filter((m: any) => m.link);
    
    for (const module of modules) {
      console.log(`🎯 Checking: ${module.title || 'Unknown'}`);
      await page.goto(module.link);
      await page.waitForLoadState('networkidle');
      
      const resumeBtn = page.locator('text=Resume course');
      const startBtn = page.locator('text=Start course');
      
      if (await resumeBtn.isVisible()) {
        console.log('✅ Module in progress');
        await resumeBtn.click();
        await page.waitForTimeout(2000);
      } else if (await startBtn.isVisible()) {
        console.log('🆕 Module not started');
        await startBtn.click();
        await page.waitForTimeout(2000);
      } else {
        console.log('✅ Module completed or unavailable');
      }
    }
  });
});