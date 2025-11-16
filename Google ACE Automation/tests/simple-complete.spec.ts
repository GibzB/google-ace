import { test } from './fixtures';
import * as fs from 'fs';

test.describe('Simple Complete', () => {
  test('complete activities by visiting URLs', async ({ page }) => {
    // Load saved cookies
    try {
      if (fs.existsSync('auth.json')) {
        const authData = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
        await page.context().addCookies(authData.cookies);
        console.log('🍪 Loaded saved authentication');
      } else {
        throw new Error('No auth.json found');
      }
    } catch (e) {
      console.log('❌ Authentication failed:', e.message);
      return;
    }
    
    const fileContent = fs.readFileSync('videos.txt', 'utf-8');
    const urls = fileContent.split('\n').filter(line => line.trim());
    
    for (const url of urls) {
      console.log(`🎯 Processing course: ${url}`);
      
      try {
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
        
        // Get all incomplete activity cards
        const activityCards = await page.locator('ql-activity-card').all();
        console.log(`📋 Found ${activityCards.length} total activities`);
        
        let processedCount = 0;
        
        for (let i = 0; i < activityCards.length; i++) {
          const card = activityCards[i];
          
          try {
            const name = await card.getAttribute('name') || 'Unknown';
            const type = await card.getAttribute('type') || 'unknown';
            const path = await card.getAttribute('path') || '';
            
            // Skip if already completed
            const isCompleted = await card.getAttribute('completed') !== null;
            const hasActivityCompletedClass = await card.locator('.link-button.activity-completed').count() > 0;
            const isDisabled = await card.locator('.link-button[disabled]').count() > 0;
            
            if (isCompleted || hasActivityCompletedClass) {
              console.log(`✅ Already completed: ${name}`);
              continue;
            }
            
            if (isDisabled) {
              console.log(`🔒 Skipping locked: ${name}`);
              continue;
            }
            
            if (path) {
              console.log(`🎯 Processing: ${name} (${type})`);
              
              const domain = url.includes('partner.skills.google') ? 'partner.skills.google' : 'www.cloudskillsboost.google';
              const fullUrl = `https://${domain}${path}`;
              
              // Visit the activity
              await page.goto(fullUrl, { timeout: 30000 });
              await page.waitForLoadState('domcontentloaded');
              await page.waitForTimeout(3000);
              
              console.log(`📖 Visited: ${name}`);
              processedCount++;
              
              // Wait a bit before next activity
              await page.waitForTimeout(1000);
            }
          } catch (e) {
            console.log(`❌ Failed processing activity: ${e.message}`);
          }
        }
        
        console.log(`📊 Processed ${processedCount} activities for this course`);
        
      } catch (e) {
        console.log(`❌ Failed course: ${url} - ${e.message}`);
      }
    }
    
    console.log('🎉 All courses processed!');
  });
});