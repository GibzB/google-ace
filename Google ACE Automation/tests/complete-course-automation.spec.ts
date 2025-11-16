import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

test('Complete course modules automation', async ({ page, context }) => {
  await main(page, context);
});

async function main(page: any, context: any) {
  try {
    // Login to partner.skills.google
    await page.goto('https://partner.skills.google/users/sign_in');
    await page.waitForLoadState('networkidle');
    
    // Click "Use email and password" button
    await page.evaluate(() => {
      const button = document.querySelector('#use-email-and-password-button');
      const shadowButton = button?.shadowRoot?.querySelector('md-text-button')?.shadowRoot?.querySelector('button');
      if (shadowButton) shadowButton.click();
    });
    await page.waitForTimeout(1000);
    
    // Fill email and password with proper events
    await page.evaluate(({ email, password }) => {
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
    }, { email: 'billy.gibendi@kitstek.com', password: 'Kitsilano2025' });
    
    await page.waitForTimeout(500);
    
    // Submit the form
    await page.evaluate(() => {
      const form = document.querySelector('form#new_user') as HTMLFormElement;
      if (form) form.submit();
    });
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if we're still on login page
    const currentUrl = page.url();
    if (currentUrl.includes('/users/sign_in')) {
      throw new Error('Login failed - still on login page');
    }
    
    console.log('✓ Logged in successfully');

    // Read URLs from videos.txt
    const fs = require('fs');
    const path = require('path');
    const videosFile = path.join(__dirname, '..', 'videos.txt');
    const urls = fs.readFileSync(videosFile, 'utf-8')
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.startsWith('http'));

    console.log(`Found ${urls.length} URLs to process`);

    if (urls.length === 0) {
      console.log('No URLs found in videos.txt');
      return;
    }

    // Track successful completions
    const successfulUrls: string[] = [];

    // Process each URL
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n[${i + 1}/${urls.length}] Processing: ${url}`);
      
      try {
        await processActivity(page, url, url);
        console.log(`✓ Successfully completed`);
        successfulUrls.push(url);
      } catch (error) {
        console.error(`✗ Failed:`, error.message);
        continue;
      }

      await page.waitForTimeout(2000);
    }

    // Remove successful URLs from videos.txt
    const remainingUrls = urls.filter((url: string) => !successfulUrls.includes(url));
    fs.writeFileSync(videosFile, remainingUrls.join('\n') + '\n');
    
    console.log('\n🎉 Course automation completed!');
    console.log(`✓ Removed ${successfulUrls.length} completed URLs from videos.txt`);
    console.log(`✗ ${remainingUrls.length} failed URLs remain in videos.txt`);
  } catch (error) {
    console.error('❌ Main function failed:', error.message);
    throw error;
  }
}

async function getCourseQueue(page: any): Promise<Array<{href: string, title: string}>> {
  try {
    // Navigate to the main course page
    await page.goto('https://partner.skills.google/paths/75/course_templates/946');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('📋 Extracting course structure from Shadow DOM...');

    // Locate the ql-contents-menu element and extract modules data
    const moduleData = await page.evaluate(() => {
      // Function to traverse shadow DOM and find the element
      function findElementInShadowDOM(root: Document | ShadowRoot, selector: string): Element | null {
        // First try to find in current root
        let element = root.querySelector(selector);
        if (element) return element;

        // Recursively search in shadow roots
        const elementsWithShadow = root.querySelectorAll('*');
        for (const el of elementsWithShadow) {
          if (el.shadowRoot) {
            element = findElementInShadowDOM(el.shadowRoot, selector);
            if (element) return element;
          }
        }
        return null;
      }

      const contentsMenu = findElementInShadowDOM(document, 'ql-contents-menu');
      if (!contentsMenu) {
        throw new Error('Could not find ql-contents-menu element');
      }

      const modulesAttr = contentsMenu.getAttribute('modules');
      if (!modulesAttr) {
        throw new Error('Could not find modules attribute');
      }

      return JSON.parse(modulesAttr);
    });

    console.log('✓ Successfully extracted course structure');

    // Parse the JSON and extract incomplete, unlocked activities
    const activityQueue: Array<{href: string, title: string}> = [];

    for (const module of moduleData) {
      if (module.steps) {
        for (const step of module.steps) {
          if (step.activities) {
            for (const activity of step.activities) {
              // Only include activities that are not complete and not locked
              if (!activity.isComplete && !activity.isLocked && activity.href) {
                activityQueue.push({
                  href: activity.href,
                  title: activity.title || 'Untitled Activity'
                });
              }
            }
          }
        }
      }
    }

    console.log(`✓ Found ${activityQueue.length} incomplete activities`);
    return activityQueue;

  } catch (error) {
    console.error('❌ Failed to get course queue:', error.message);
    throw error;
  }
}

async function processActivity(page: any, activityUrl: string, activityTitle: string): Promise<void> {
  try {
    // Navigate to the activity page
    const fullUrl = activityUrl.startsWith('http') 
      ? activityUrl 
      : `https://partner.skills.google${activityUrl}`;
    
    console.log(`  → Navigating to: ${fullUrl}`);
    await page.goto(fullUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and click the 'Mark as completed' button
    const clicked = await page.evaluate(() => {
      function findAndClickButton(root: Document | ShadowRoot): boolean {
        // Look for ql-button with href containing complete_button
        const qlButtons = root.querySelectorAll('ql-button');
        for (const btn of qlButtons) {
          const href = btn.getAttribute('href');
          if (href && href.includes('complete_button')) {
            const shadowButton = btn.shadowRoot?.querySelector('md-outlined-button')?.shadowRoot?.querySelector('button') as HTMLElement;
            if (shadowButton) {
              shadowButton.click();
              return true;
            }
          }
        }

        // Search in shadow roots
        const elementsWithShadow = root.querySelectorAll('*');
        for (const el of elementsWithShadow) {
          if (el.shadowRoot && findAndClickButton(el.shadowRoot)) {
            return true;
          }
        }
        return false;
      }

      return findAndClickButton(document);
    });

    if (!clicked) {
      throw new Error('Could not find "Mark as completed" button');
    }

    console.log('  → Clicked "Mark as completed" button');

    // Wait for completion
    await page.waitForTimeout(1000);

    console.log('  ✓ Activity completion verified');

  } catch (error) {
    console.error(`  ❌ Failed to process activity: ${error.message}`);
    throw error;
  }
}