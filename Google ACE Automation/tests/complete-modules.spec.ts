import { test, expect } from './fixtures';
import * as fs from 'fs';
import { login } from '../utils/login';

test.describe('Module Completion', () => {
  test('resume and complete modules', async ({ page }) => {
  // Step 1: Login
  await login(page);

  // Step 2: Go to ACE learning path
  await page.goto('https://partner.cloudskillsboost.google/paths/69');

  // Step 3: Resume first if available
  const resumeButton = page.locator('text=Resume');
  if (await resumeButton.count() > 0) {
    console.log('▶️ Resuming module...');
    await resumeButton.first().click();
    await page.waitForTimeout(5000);
    await page.goBack();
  }

  // Step 4: Load module list
  const modules = fs.readFileSync('modules.txt', 'utf-8').split('\n').filter(Boolean);

  for (const moduleName of modules) {
    const moduleCard = page.locator(`.card:has-text("${moduleName}")`);
    if (await moduleCard.count() > 0) {
      console.log(`▶️ Opening module: ${moduleName}`);
      await moduleCard.first().click();
      await page.waitForTimeout(5000);
      await page.goBack();
    }
  }
});
