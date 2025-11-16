import { test, expect } from '@playwright/test';

test('Simple Oracle Course Completion', async ({ page }) => {
  const email = process.env.ORACLE_EMAIL || 'ralphgibendi01@gmail.com';
  const password = process.env.ORACLE_PASSWORD || 'Rgibesh2016^';

  console.log('Starting Oracle login process...');
  
  // Go directly to Oracle login page
  await page.goto('https://login.oracle.com/mysso/signon.jsp');
  await page.waitForTimeout(3000);
  
  // Fill login form
  try {
    await page.fill('input[name="username"]', email);
    console.log('Email filled');
    
    await page.fill('input[name="password"]', password);
    console.log('Password filled');
    
    // Submit login
    await page.click('input[name="signin"]');
    console.log('Login submitted');
    
    // Wait for redirect after login
    await page.waitForTimeout(8000);
    console.log('Login completed, current URL:', page.url());
    
  } catch (error) {
    console.log('Direct login failed, trying alternative method...');
    
    // Go to MyLearn and try the sign-in button method
    await page.goto('https://mylearn.oracle.com');
    await page.waitForTimeout(3000);
    
    const signInButton = page.locator('text=Sign in to my account').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(3000);
      
      await page.fill('input[name="username"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('input[name="signin"]');
      await page.waitForTimeout(8000);
    }
  }

  // Now navigate to the course
  console.log('Navigating to course...');
  await page.goto('https://mylearn.oracle.com/ou/course/oracle-cloud-infrastructure-ai-foundations/147805');
  await page.waitForTimeout(5000);

  // Check current state
  console.log('Final URL:', page.url());
  console.log('Page title:', await page.title());
  
  const playlist = page.locator('.playlistComponent').first();
  const guestMode = page.url().includes('arrivals-gate');
  
  if (guestMode) {
    console.log('Still in guest mode - login failed');
    await page.screenshot({ path: 'oracle-guest-mode.png' });
  } else if (await playlist.isVisible()) {
    console.log('Course accessible! Starting completion...');
    
    // Get all components
    const components = await page.locator('.playlistComponent a.playlist-component-href').all();
    console.log(`Found ${components.length} components`);

    for (let i = 0; i < components.length; i++) {
      try {
        const href = await components[i].getAttribute('href');
        const title = await components[i].getAttribute('title');
        
        if (!href || (title && title.includes('Skill Check'))) {
          console.log(`Skipping: ${title}`);
          continue;
        }

        const url = `https://mylearn.oracle.com${href}`;
        console.log(`${i + 1}. Processing: ${title}`);

        await page.goto(url);
        await page.waitForTimeout(3000);

        // Skip video to end
        const video = page.locator('video.vjs-tech').first();
        if (await video.isVisible()) {
          await page.evaluate(() => {
            const videoEl = document.querySelector('video.vjs-tech') as HTMLVideoElement;
            if (videoEl && videoEl.duration) {
              videoEl.currentTime = videoEl.duration - 0.1;
            }
          });
          await page.waitForTimeout(2000);
          console.log(`   ✓ Video completed`);
        }

      } catch (error) {
        console.error(`Error with component ${i + 1}:`, error);
      }
    }

    console.log('All components processed!');
  } else {
    console.log('Course not accessible');
    await page.screenshot({ path: 'oracle-not-accessible.png' });
  }
});