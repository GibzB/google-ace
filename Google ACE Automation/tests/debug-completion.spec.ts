import { test } from './fixtures';
import { login, saveCookies } from '../utils/login';

test.describe('Debug Completion', () => {
  test('debug single activity completion', async ({ page }) => {
    test.setTimeout(300000);
    
    // Go to a specific document
    const url = 'https://www.cloudskillsboost.google/paths/1951/course_sessions/30840598/documents/562755';
    await login(page, url);
    console.log(`🎯 Testing completion for: ${url}`);
    
    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Handle cookie banner
    try {
      const cookieBtn = page.locator('button.glue-cookie-notification-bar__accept');
      if (await cookieBtn.isVisible({ timeout: 2000 })) {
        await cookieBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}
    
    console.log('📄 Page loaded, looking for completion mechanisms...');
    
    // For documents, simulate reading by scrolling slowly
    console.log('📖 Simulating document reading...');
    
    // Get page height and scroll gradually
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const scrollSteps = 5;
    const stepHeight = pageHeight / scrollSteps;
    
    for (let i = 0; i <= scrollSteps; i++) {
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), i * stepHeight);
      await page.waitForTimeout(1000); // Wait 1 second at each scroll position
    }
    
    console.log('📄 Finished reading document, waiting for auto-completion...');
    await page.waitForTimeout(5000); // Wait longer for auto-completion
    
    // Look for any buttons
    const allButtons = await page.locator('button').all();
    console.log(`🔘 Found ${allButtons.length} buttons on page`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const btn = allButtons[i];
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      console.log(`Button ${i + 1}: "${text}" (aria-label: "${ariaLabel}")`);
    }
    
    // Try different completion methods
    const completionSelectors = [
      'button:has-text("Mark as Completed")',
      'button[aria-label="Mark as completed"]',
      'button:has-text("Continue")',
      'button:has-text("Next")',
      'button:has-text("Complete")',
      '[data-testid="complete"]',
      '.complete-button'
    ];
    
    let found = false;
    for (const selector of completionSelectors) {
      const btn = page.locator(selector);
      if (await btn.count() > 0) {
        console.log(`✅ Found completion button with selector: ${selector}`);
        try {
          await btn.click();
          console.log('🎯 Clicked completion button');
          found = true;
          break;
        } catch (e) {
          console.log(`❌ Failed to click: ${e.message}`);
        }
      }
    }
    
    if (!found) {
      console.log('📖 No completion button found - document may auto-complete');
      
      // Try clicking anywhere on the document to trigger completion
      try {
        await page.locator('body').click();
        await page.waitForTimeout(2000);
      } catch (e) {}
    }
    
    await page.waitForTimeout(5000); // Wait longer for completion to register
    
    // Go back to course outline to check status
    await page.goto('https://www.cloudskillsboost.google/paths/1951/course_templates/1265');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Check completion status in drawer
    const modulesData = await page.getAttribute('ql-course-outline', 'modules');
    if (modulesData) {
      const modules = JSON.parse(modulesData);
      const responsibleAI = modules.find(m => m.title === 'Building AI securely and responsibly');
      if (responsibleAI) {
        const activity = responsibleAI.steps.find(s => s.activities.some(a => a.title === 'Responsible AI'));
        if (activity) {
          const responsibleAIActivity = activity.activities.find(a => a.title === 'Responsible AI');
          console.log(`📊 Responsible AI completion status: ${responsibleAIActivity.isComplete}`);
        }
      }
    }
    
    // Save cookies to maintain session
    await saveCookies(page);
    
    console.log('🔍 Debug complete - check browser for visual confirmation');
  });
});