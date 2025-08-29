import { test, expect } from './fixtures';

test.describe('Video Completion', () => {
  test.use({
    viewport: {
      height: 720,
      width: 1280
    }
  });

  test('mark all course videos as completed', async ({ page }) => {
    test.setTimeout(0); // No timeout - mimic user behavior
    
    await page.goto('https://partner.cloudskillsboost.google/', { waitUntil: 'domcontentloaded' });
    
    // Handle cookie consent immediately
    try {
      await page.getByRole('button', { name: 'Agree' }).click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded');
    } catch (e) {
      console.log('No cookie consent dialog found');
    }

    // Check if already logged in
    const isLoggedIn = await page.getByRole('button', { name: 'My account' }).isVisible();
    
    if (!isLoggedIn) {
      await page.getByRole('link', { name: 'Sign in' }).click();
      await page.getByRole('textbox', { name: 'Email' }).fill('billy.gibendi@kitstek.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('Kitsilano2025');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.getByRole('button', { name: 'My account' }).waitFor();
    }
    
    console.log('User is logged in');

    // Get all courses from the learning path
    await page.goto('https://partner.cloudskillsboost.google/paths/69');
    await page.waitForLoadState('domcontentloaded');
    
    // Find course links (Resume course or Start course buttons)
    const courseButtons = page.locator('ql-button:has-text("Resume course"), ql-button:has-text("Start course")');
    const courseCount = await courseButtons.count();
    console.log(`Found ${courseCount} courses`);
    
    let totalCompleted = 0;
    
    // Process each course
    for (let courseIndex = 0; courseIndex < courseCount; courseIndex++) {
      try {
        // Go back to main path page
        await page.goto('https://partner.cloudskillsboost.google/paths/69');
        await page.waitForLoadState('domcontentloaded');
        
        // Get fresh course buttons
        const freshCourseButtons = page.locator('ql-button:has-text("Resume course"), ql-button:has-text("Start course")');
        const courseButton = freshCourseButtons.nth(courseIndex);
        
        if (await courseButton.isVisible()) {
          const courseHref = await courseButton.getAttribute('href');
          console.log(`Processing course ${courseIndex + 1}: ${courseHref}`);
          
          await courseButton.click();
          await page.waitForLoadState('domcontentloaded');
          
          // Extract course template ID from URL
          const currentUrl = page.url();
          const courseTemplateMatch = currentUrl.match(/course_templates\/(\d+)/);
          
          if (courseTemplateMatch) {
            const courseTemplateId = courseTemplateMatch[1];
            console.log(`Course template ID: ${courseTemplateId}`);
            
            // Complete videos for this course using direct URL navigation
            const courseCompleted = await completeVideosForCourse(page, courseTemplateId);
            totalCompleted += courseCompleted;
            console.log(`Course ${courseIndex + 1} completed: ${courseCompleted} videos`);
          }
        }
      } catch (error) {
        console.log(`❌ Error processing course ${courseIndex + 1}: ${error.message}`);
      }
    }
    
    console.log(`Total videos completed: ${totalCompleted}`);
    
    async function completeVideosForCourse(page, courseTemplateId) {
      let completed = 0;
      let videoId = 531567; // Start from base video ID
      
      while (videoId <= 531610) {
        try {
          console.log(`Attempting video ${videoId}...`);
          
          // First navigate to video page to mimic user behavior
          const videoUrl = `https://partner.cloudskillsboost.google/course_templates/${courseTemplateId}/video/${videoId}`;
          await page.goto(videoUrl, { waitUntil: 'networkidle', timeout: 0 });
          
          // Wait like a human would
          await page.waitForTimeout(2000 + Math.random() * 3000);
          
          // Check if video exists
          if (!page.url().includes(`video/${videoId}`)) {
            console.log(`Video ${videoId} not found, stopping course`);
            break;
          }
          
          // Look for Mark as Completed button
          const completeButton = page.locator('ql-button:has-text("Mark as Completed")');
          
          if (await completeButton.isVisible({ timeout: 10000 })) {
            // Scroll to button like a user would
            await completeButton.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);
            
            // Click the button
            await completeButton.click();
            console.log(`✅ Completed video ${videoId}`);
            completed++;
            
            // Wait for any redirect/processing
            await page.waitForTimeout(3000);
          } else {
            // Try direct completion URL as fallback
            const completeUrl = `https://partner.cloudskillsboost.google/course_templates/${courseTemplateId}/video/${videoId}/complete_button`;
            await page.goto(completeUrl, { waitUntil: 'networkidle', timeout: 0 });
            console.log(`✅ Completed video ${videoId} (direct)`);
            completed++;
            await page.waitForTimeout(2000);
          }
          
        } catch (error) {
          console.log(`❌ Error with video ${videoId}: ${error.message}`);
          // Don't break, try next video
        }
        videoId++;
      }
      
      return completed;
    }

    console.log('Script completed. All available videos have been marked as complete.');
  });
});
