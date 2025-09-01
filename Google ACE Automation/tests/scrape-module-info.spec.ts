import { test } from './fixtures';
import { login } from '../utils/login';
import * as fs from 'fs';

test.describe('Module Info Scraper', () => {
  test('get module titles and update modules.json', async ({ page }) => {
    await login(page);
    
    const modules = JSON.parse(fs.readFileSync('modules.json', 'utf8'));
    const updatedModules = [];
    
    for (const module of modules) {
      if (module.link) {
        await page.goto(module.link);
        await page.waitForLoadState('networkidle');
        
        const title = await page.locator('h1').first().textContent();
        updatedModules.push({
          title: title?.trim() || 'Unknown',
          link: module.link
        });
        
        console.log(`📚 ${title}`);
        await page.waitForTimeout(1000);
      }
    }
    
    fs.writeFileSync('modules.json', JSON.stringify(updatedModules, null, 2));
    console.log('✅ Updated modules.json with proper titles');
  });
});