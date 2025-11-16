import { test, expect, Page } from '@playwright/test';

// This is the main test suite for our video checker.
test.describe('Udacity Course Video Checker', () => {
  // This test will navigate through the course and check for videos.
  test('should navigate through lessons and check for videos', async ({ page }) => {
    // The setup script logs us in. Now, navigate directly to the course classroom.
    // This is more reliable than clicking through the dashboard.
    await page.goto('https://learn.udacity.com/courses/ud065');

    // Wait for the main navigation drawer to be visible.
    // We're using the aria-label which is a good, stable selector.
    const lessonNav = page.locator('aside[aria-label="Lesson Navigation"]');
    await expect(lessonNav).toBeVisible({ timeout: 30000 }); // Increased timeout for page load

    // Get all lesson items. Each lesson is in an <ol> with role="list".
    const lessons = lessonNav.locator('div.chakra-accordion__item');
    const lessonCount = await lessons.count();
    console.log(`Found ${lessonCount} lessons.`);

    // Loop through each lesson.
    for (let i = 0; i < lessonCount; i++) {
      const lesson = lessons.nth(i);

      // Find the button that expands/collapses the lesson.
      const lessonButton = lesson.locator('button[aria-expanded]');
      const lessonTitle = await lessonButton.locator('span[id^="progress-"]').textContent();
      console.log(`\nProcessing Lesson ${i + 1}: ${lessonTitle?.trim()}`);

      // Check if the lesson is expanded. If not, click the button to expand it.
      const isExpanded = await lessonButton.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        console.log('  Expanding lesson...');
        await lessonButton.click();
        await page.waitForTimeout(500); // Wait for animation
      }

      // Find all incomplete concepts within this lesson.
      // The selector targets the SVG icon that indicates a concept is not yet completed.
      const incompleteConcepts = lesson.locator('li button:has(svg[aria-label="Concept has not been completed."])');
      const conceptsCount = await incompleteConcepts.count();

      if (conceptsCount === 0) {
        console.log('  All concepts in this lesson are complete. Skipping.');
        continue;
      }

      console.log(`  Found ${conceptsCount} incomplete concepts.`);

      // Loop through each concept in the lesson.
      for (let j = 0; j < conceptsCount; j++) {
        // Re-query for the incomplete concepts inside the loop to avoid stale element issues.
        const conceptButton = lesson.locator('li button:has(svg[aria-label="Concept has not been completed."])').nth(j);

        const conceptTitle = await conceptButton.locator('p').textContent();
        const conceptNumber = await conceptButton.locator('span').first().textContent();

        console.log(`    Checking Concept ${conceptNumber}: ${conceptTitle?.trim()}`);

        // Click the concept to navigate to its page.
        await conceptButton.click();

        // Wait for the main content area to potentially update after navigation.
        await page.waitForTimeout(2000);

        try {
          // Wait for a video element to appear on the page.
          const videoFrame = page.frameLocator('iframe[title*="video player"], iframe[src*="youtube.com"], iframe[src*="vimeo.com"]').first();
          const video = videoFrame.locator('video').first();

          // Wait for the video element to be present in the DOM.
          await video.waitFor({ state: 'attached', timeout: 10000 });
          const videoSrc = await video.getAttribute('src');

          if (videoSrc) {
            console.log(`      ✅ VIDEO FOUND with src: ${videoSrc.substring(0, 50)}...`);
          } else if (videoSrc !== null) { // Check if the attribute exists but is empty
            console.log('      ⚠️  VIDEO FOUND but has no src attribute.');
          }
        } catch (error) {
          // If no video element is found after the timeout, we assume it's not a video concept.
          console.log('      ℹ️  No video player found for this concept.');
        }
      }
    }
  });
});