import { test } from './fixtures';
import { login, saveCookies } from '../utils/login';

test.describe('Complete Document', () => {
  test('complete document by various methods', async ({ page }) => {
    test.setTimeout(300000);
    
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
    
    console.log('📄 Document loaded, trying multiple completion methods...');
    
    // Method 1: Look for any completion-related elements
    const completionElements = await page.locator('[data-testid*="complete"], [class*="complete"], [id*="complete"]').all();
    console.log(`🔍 Found ${completionElements.length} completion-related elements`);
    
    // Method 2: Simulate thorough document reading
    console.log('📖 Method 1: Thorough document reading simulation...');
    
    // Get all content sections and scroll through them
    const contentSections = await page.locator('section, article, .content, .document-content, main').all();
    console.log(`📑 Found ${contentSections.length} content sections`);
    
    // Scroll through each section slowly
    for (let i = 0; i < contentSections.length; i++) {
      try {
        await contentSections[i].scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        console.log(`📖 Read section ${i + 1}/${contentSections.length}`);
      } catch (e) {}
    }
    
    // Method 3: Scroll to absolute bottom and wait
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(5000);
    
    // Method 4: Look for hidden completion triggers
    console.log('🔍 Method 2: Looking for completion triggers...');
    
    const possibleTriggers = [
      'button[onclick*="complete"]',
      'a[onclick*="complete"]',
      '[data-action*="complete"]',
      '[data-track*="complete"]',
      '.completion-trigger',
      '.mark-complete',
      '.activity-complete'
    ];
    
    for (const selector of possibleTriggers) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`✅ Found trigger: ${selector}`);
        try {
          await elements[0].click();
          await page.waitForTimeout(2000);
        } catch (e) {}
      }
    }
    
    // Method 5: Try keyboard shortcuts that might trigger completion
    console.log('⌨️ Method 3: Trying keyboard shortcuts...');
    await page.keyboard.press('End'); // Go to end of document
    await page.waitForTimeout(1000);
    await page.keyboard.press('Space'); // Sometimes space triggers completion
    await page.waitForTimeout(1000);
    
    // Method 6: Click on the document content to ensure focus
    try {
      await page.locator('body').click();
      await page.waitForTimeout(2000);
    } catch (e) {}
    
    // Method 7: Wait longer for auto-completion
    console.log('⏳ Method 4: Waiting for auto-completion (15 seconds)...');
    await page.waitForTimeout(15000);
    
    // Method 8: Try to navigate away and back (sometimes triggers completion)
    console.log('🔄 Method 5: Navigate away and back...');
    await page.goto('https://www.cloudskillsboost.google/paths/1951/course_templates/1265');
    await page.waitForTimeout(3000);
    await page.goto(url);
    await page.waitForTimeout(5000);
    
    // Final check: Go back to course outline
    console.log('🔍 Final check: Returning to course outline...');
    await page.goto('https://www.cloudskillsboost.google/paths/1951/course_templates/1265');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    
    // Check completion status
    const modulesData = await page.getAttribute('ql-course-outline', 'modules');
    if (modulesData) {
      const modules = JSON.parse(modulesData);
      const responsibleAI = modules.find(m => m.title === 'Building AI securely and responsibly');
      if (responsibleAI) {
        const activity = responsibleAI.steps.find(s => s.activities.some(a => a.title === 'Responsible AI'));
        if (activity) {
          const responsibleAIActivity = activity.activities.find(a => a.title === 'Responsible AI');
          console.log(`📊 Final status - Responsible AI completion: ${responsibleAIActivity.isComplete}`);
          
          if (responsibleAIActivity.isComplete) {
            console.log('🎉 SUCCESS: Document marked as complete!');
          } else {
            console.log('❌ Document still not marked as complete');
          }
        }
      }
    }
    
    await saveCookies(page);
    console.log('🔍 Completion test finished');
  });
});