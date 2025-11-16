import { test } from './fixtures';
import * as fs from 'fs';

test.describe('List Activities', () => {
  test('list all activities and their completion status', async ({ page }) => {
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
      console.log(`🎯 Analyzing course: ${url}`);
      
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
        
        console.log('\n📋 COURSE ACTIVITIES STATUS:');
        console.log('=' .repeat(60));
        
        // Find all activity cards
        const activityCards = await page.locator('ql-activity-card').all();
        
        let completedCount = 0;
        let incompleteCount = 0;
        let lockedCount = 0;
        
        for (let i = 0; i < activityCards.length; i++) {
          const card = activityCards[i];
          
          try {
            // Get activity details from attributes
            const name = await card.getAttribute('name') || 'Unknown';
            const type = await card.getAttribute('type') || 'unknown';
            const duration = await card.getAttribute('duration') || 'N/A';
            const path = await card.getAttribute('path') || '';
            
            // Check completion status using multiple indicators
            const isCompleted = await card.getAttribute('completed') !== null;
            const hasActivityCompletedClass = await card.locator('.link-button.activity-completed').count() > 0;
            const hasCheckIcon = await card.locator('ql-icon').filter({ hasText: 'check' }).count() > 0;
            const isDisabled = await card.locator('.link-button[disabled]').count() > 0;
            
            let status = '❌ INCOMPLETE';
            let fullUrl = '';
            
            if (isDisabled) {
              status = '🔒 LOCKED';
              lockedCount++;
            } else if (isCompleted || hasActivityCompletedClass || hasCheckIcon) {
              status = '✅ COMPLETED';
              completedCount++;
            } else {
              status = '❌ INCOMPLETE';
              incompleteCount++;
              // Show URL for incomplete activities
              if (path) {
                const domain = url.includes('partner.skills.google') ? 'partner.skills.google' : 'www.cloudskillsboost.google';
                fullUrl = `https://${domain}${path}`;
              }
            }
            
            console.log(`${i + 1}. ${status} - ${name} (${type}) - ${duration}`);
            if (fullUrl) {
              console.log(`   🔗 ${fullUrl}`);
            }
            
          } catch (e) {
            console.log(`⚠️ ERROR reading activity ${i + 1}: ${e.message}`);
          }
        }
        
        console.log('=' .repeat(60));
        console.log(`📊 SUMMARY:`);
        console.log(`   ✅ Completed: ${completedCount}`);
        console.log(`   ❌ Incomplete: ${incompleteCount}`);
        console.log(`   🔒 Locked: ${lockedCount}`);
        console.log(`   📋 Total: ${activityCards.length}`);
        console.log('=' .repeat(60));
        
      } catch (e) {
        console.log(`❌ Failed to analyze course: ${url} - ${e.message}`);
      }
    }
  });
});