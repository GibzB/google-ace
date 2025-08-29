import { test } from './fixtures';
import { writeFileSync } from 'fs';

test('Scrape all labs and quizzes from Google ACE learning path', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes
  
  await page.goto('https://partner.cloudskillsboost.google/', { waitUntil: 'domcontentloaded' });
  
  // Handle cookie consent
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

  // Navigate to learning path
  await page.goto('https://partner.cloudskillsboost.google/paths/69');
  await page.waitForLoadState('domcontentloaded');
  
  const activities = [];
  
  // Get all course buttons
  const courseButtons = page.locator('ql-button:has-text("Resume course"), ql-button:has-text("Start course")');
  const courseCount = await courseButtons.count();
  console.log(`Found ${courseCount} courses to scrape`);
  
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
        console.log(`Scraping course ${courseIndex + 1}: ${courseHref}`);
        
        await courseButton.click();
        await page.waitForLoadState('domcontentloaded');
        
        // Get course title
        const courseTitle = await page.locator('h1, .course-title, .ql-title-large').first().textContent() || `Course ${courseIndex + 1}`;
        
        // Look for course outline or activity list
        const activityLinks = page.locator('a[href*="/focuses/"], a[href*="/quizzes/"], a[href*="/video/"]');
        const activityCount = await activityLinks.count();
        
        console.log(`Found ${activityCount} activities in ${courseTitle}`);
        
        for (let i = 0; i < activityCount; i++) {
          try {
            const link = activityLinks.nth(i);
            const href = await link.getAttribute('href');
            const title = await link.textContent() || 'Untitled Activity';
            
            let type = 'Unknown';
            if (href.includes('/focuses/')) type = 'Lab';
            else if (href.includes('/quizzes/')) type = 'Quiz';
            else if (href.includes('/video/')) type = 'Video';
            
            activities.push({
              course: courseTitle.trim(),
              type: type,
              title: title.trim(),
              url: href.startsWith('http') ? href : `https://partner.cloudskillsboost.google${href}`
            });
          } catch (error) {
            console.log(`Error processing activity ${i}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`Error processing course ${courseIndex + 1}: ${error.message}`);
    }
  }
  
  // Save to file
  const output = {
    scrapedAt: new Date().toISOString(),
    totalActivities: activities.length,
    activities: activities
  };
  
  writeFileSync('activities.json', JSON.stringify(output, null, 2));
  
  // Create readable text file
  let textOutput = `Google ACE Learning Path Activities\nScraped: ${new Date().toLocaleString()}\nTotal Activities: ${activities.length}\n\n`;
  
  const groupedByType = activities.reduce((acc, activity) => {
    if (!acc[activity.type]) acc[activity.type] = [];
    acc[activity.type].push(activity);
    return acc;
  }, {});
  
  Object.keys(groupedByType).forEach(type => {
    textOutput += `=== ${type.toUpperCase()}S ===\n`;
    groupedByType[type].forEach((activity, index) => {
      textOutput += `${index + 1}. ${activity.title}\n`;
      textOutput += `   Course: ${activity.course}\n`;
      textOutput += `   URL: ${activity.url}\n\n`;
    });
  });
  
  writeFileSync('activities.txt', textOutput);
  
  console.log(`✅ Scraped ${activities.length} activities`);
  console.log('📄 Saved to activities.json and activities.txt');
});