import { test, expect } from './fixtures';
import fs from 'fs';

test.describe('CloudSkills', () => {
  test('login, scrape modules, and resume/complete them', async ({ page }) => {
  // --- 1. Login ---
  await page.goto('https://partner.cloudskillsboost.google/');

  await page.locator('#user_email').fill('billy.gibendi@kitstek.com');
  await page.locator('#user_password').fill('Kitsilano2025');

  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard');

  // --- 2. Go to the learning path page ---
  await page.goto('https://partner.cloudskillsboost.google/paths/69');
  await page.waitForLoadState('networkidle');

  // --- 3. Scrape all module cards ---
  const modules = await page.$$eval('.ql-card', cards =>
    cards.map(card => {
      const link = card.querySelector('a')?.getAttribute('href') || '';
      const name = card.querySelector('h3,h2,h1')?.textContent?.trim() || 'Untitled';
      return { name, url: link.startsWith('http') ? link : `https://partner.cloudskillsboost.google${link}` };
    })
  );

  console.log(`Found ${modules.length} modules`);
  fs.writeFileSync('modules.json', JSON.stringify(modules, null, 2));

  // --- 4. Resume incomplete modules first ---
  for (const module of modules) {
    console.log(`Opening module: ${module.name}`);
    await page.goto(module.url);
    await page.waitForLoadState('networkidle');

    // Try to click "Resume"
    const resumeBtn = page.getByRole('button', { name: /Resume/i });
    if (await resumeBtn.isVisible().catch(() => false)) {
      console.log(`▶️ Resuming "${module.name}"`);
      await resumeBtn.click();
      await page.waitForTimeout(5000); // let it load the course
      continue; // skip completion attempt for resumed modules
    }

    // If not resuming, check for "Mark as Completed"
    const markBtn = page.getByRole('button', { name: 'Mark as Completed' });
    if (await markBtn.isVisible().catch(() => false)) {
      console.log(`Marking "${module.name}" as completed`);
      await markBtn.click();
      await page.waitForTimeout(2000);
    } else {
      console.log(`[Warning] No Resume or Complete button for "${module.name}"`);
    }
  }
});
