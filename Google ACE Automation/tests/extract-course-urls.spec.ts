import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

test('Extract course URLs', async ({ context, page }) => {
  // Load authentication from auth.json
  const authFile = path.join(__dirname, '..', 'auth.json');
  if (fs.existsSync(authFile)) {
    const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    await context.addCookies(authData.cookies);
    console.log('✓ Loaded authentication from auth.json');
  }
  
  // Test authentication by visiting a protected page
  await page.goto('https://partner.skills.google/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Check if we're still on login page (cookies failed)
  const isLoginPage = await page.locator('h1:has-text("Sign in")').isVisible().catch(() => false);
  if (isLoginPage) {
    console.log('⚠ Cookie authentication failed, using manual login');
    
    await page.evaluate(() => {
      const button = document.querySelector('#use-email-and-password-button');
      const shadowButton = button?.shadowRoot?.querySelector('md-text-button')?.shadowRoot?.querySelector('button');
      if (shadowButton) shadowButton.click();
    });
    await page.waitForTimeout(1000);
    
    await page.evaluate(({ email, password }: { email: string; password: string }) => {
      const emailField = document.querySelector('md-outlined-text-field[name="user[email]"]');
      const emailInput = emailField?.shadowRoot?.querySelector('input');
      if (emailInput) {
        emailInput.value = email;
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      const passwordField = document.querySelector('md-outlined-text-field[name="user[password]"]');
      const passwordInput = passwordField?.shadowRoot?.querySelector('input');
      if (passwordInput) {
        passwordInput.value = password;
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { email: process.env.EMAIL || '', password: process.env.PASSWORD || '' });
    
    await page.evaluate(() => {
      const form = document.querySelector('form#new_user') as HTMLFormElement;
      if (form) form.submit();
    });
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }
  
  console.log('✓ Authenticated successfully');

  // Navigate to dashboard first to ensure we're authenticated
  await page.goto('https://partner.skills.google/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Read URLs from videos.txt
  const videosFile = path.join(__dirname, '..', 'videos.txt');
  const allUrls = fs.readFileSync(videosFile, 'utf-8')
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
  
  // Extract course template URLs from video URLs
  const courseUrls = allUrls
    .filter((url: string) => url.includes('/course_templates/'))
    .map((url: string) => {
      const match = url.match(/(\/paths\/\d+\/course_templates\/\d+)/);
      return match ? `https://partner.skills.google${match[1]}` : url;
    })
    .filter((url: string, index: number, arr: string[]) => arr.indexOf(url) === index);

  console.log(`Found ${courseUrls.length} course URLs to process\n`);

  let allActivities: Array<{ url: string, title: string, type: string, isComplete: boolean }> = [];

  // Process each course URL
  for (const courseUrl of courseUrls) {
    console.log(`📋 Extracting from: ${courseUrl}`);
    
    await page.goto(courseUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const activities = await page.evaluate(() => {
      function findElementInShadowDOM(root: Document | ShadowRoot, selector: string): Element | null {
        let element = root.querySelector(selector);
        if (element) return element;

        const elementsWithShadow = root.querySelectorAll('*');
        for (const el of Array.from(elementsWithShadow)) {
          if (el.shadowRoot) {
            element = findElementInShadowDOM(el.shadowRoot, selector);
            if (element) return element;
          }
        }
        return null;
      }

      const contentsMenu = findElementInShadowDOM(document, 'ql-contents-menu');
      if (!contentsMenu) throw new Error('Could not find ql-contents-menu');

      const modulesAttr = contentsMenu.getAttribute('modules');
      if (!modulesAttr) throw new Error('Could not find modules attribute');

      const moduleData = JSON.parse(modulesAttr) as any;
      const results: Array<{ url: string, title: string, type: string, isComplete: boolean }> = [];

      for (const module of moduleData as any[]) {
        if (module.steps) {
          for (const step of module.steps) {
            if (step.activities) {
              for (const activity of step.activities) {
                if (activity.href) {
                  const type = activity.href.includes('/video/') ? 'video' : 
                              activity.href.includes('/quiz') ? 'quiz' : 'other';
                  results.push({
                    url: activity.href,
                    title: activity.title || 'Untitled',
                    type: type,
                    isComplete: activity.isComplete || false
                  });
                }
              }
            }
          }
        }
      }

      return results;
    });

    console.log(`  Found ${activities.length} activities (${activities.filter(a => !a.isComplete).length} incomplete)`);
    allActivities = allActivities.concat(activities);
  }

  console.log(`\n📊 Total Statistics:`);
  console.log(`Total activities: ${allActivities.length}`);
  console.log(`Videos: ${allActivities.filter(a => a.type === 'video').length}`);
  console.log(`Quizzes: ${allActivities.filter(a => a.type === 'quiz').length}`);
  console.log(`Other: ${allActivities.filter(a => a.type === 'other').length}`);
  console.log(`Completed: ${allActivities.filter(a => a.isComplete).length}`);
  console.log(`Incomplete: ${allActivities.filter(a => !a.isComplete).length}`);

  // Write incomplete URLs to videos.txt
  const incompleteUrls = allActivities
    .filter(a => !a.isComplete)
    .map(a => `https://partner.skills.google${a.url}`)
    .join('\n');

  fs.writeFileSync(videosFile, incompleteUrls + '\n');

  console.log(`\n✓ Wrote ${allActivities.filter(a => !a.isComplete).length} incomplete URLs to videos.txt`);
});
