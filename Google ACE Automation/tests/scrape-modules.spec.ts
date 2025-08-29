import { test, expect } from './fixtures';
import * as fs from 'fs';
import { login } from '../utils/login';

test.describe('Module Scraping', () => {
  test('scrape module card names', async ({ page }) => {
  // Step 1: Login
  await login(page);

  // Step 2: Go to ACE learning path
  await page.goto('https://partner.cloudskillsboost.google/paths/69');

  // Step 3: Scrape module card titles
  const cards = page.locator('.card .card-title, .join-card__body h2');
  const count = await cards.count();
  const names: string[] = [];

  for (let i = 0; i < count; i++) {
    names.push(await cards.nth(i).innerText());
  }

  // Save to file
  fs.writeFileSync('modules.txt', names.join('\n'), 'utf-8');
  console.log('✅ Modules saved to modules.txt');
});
