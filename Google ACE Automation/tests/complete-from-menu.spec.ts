import { test } from '@playwright/test';
import { login } from '../utils/login';

test('Complete activities from navigation menu', async ({ page }) => {
  await login(page);
  
  // Navigate to the course overview page
  await page.goto('https://partner.skills.google/paths/75/course_templates/946');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Get all activity links from the course content
  const activityLinks = await page.$$eval('a[href*="/video/"], a[href*="/quizzes/"]', 
    links => links.map(link => ({
      href: link.getAttribute('href'),
      title: link.querySelector('h3')?.textContent?.trim() || link.textContent?.trim(),
      hasCheck: false
    }))
  ).catch(() => []);

  console.log(`Found ${activityLinks.length} activities`);

  for (const activity of activityLinks) {
    console.log(`Processing: ${activity.title}`);
    
    try {
      // Navigate to the activity
      await page.goto(`https://partner.skills.google${activity.href}`);
      await page.waitForLoadState('networkidle');
      
      // Wait a moment for the page to fully load
      await page.waitForTimeout(2000);

      // Look for "Mark as completed" button using the specific selector
      const markCompleteButton = page.locator('ql-button[href*="complete_button"]').first();
      
      if (await markCompleteButton.isVisible({ timeout: 5000 })) {
        await markCompleteButton.click();
        console.log(`✓ Marked as completed: ${activity.title}`);
        await page.waitForTimeout(1000);
      } else {
        console.log(`⚠ No "Mark as completed" button found for: ${activity.title}`);
      }

    } catch (error) {
      console.log(`✗ Error processing ${activity.title}:`, error.message);
    }

    // Small delay between activities
    await page.waitForTimeout(1000);
  }

  console.log('Completed processing all activities');
});