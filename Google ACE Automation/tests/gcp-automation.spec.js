const { test, expect } = require('./fixtures');
const fs = require('fs');
const path = require('path');

// Configuration
const COURSE_URL = 'https://partner.cloudskillsboost.google/paths/69';
const AUTH_FILE = 'auth.json';
const ACTIONS_FILE = 'recorded-actions.json';

test.describe('GCP Course Automation', () => {
  
  // Step 1: Record initial authentication and first module completion
  test('record-workflow', async ({ page }) => {
    const actions = [];
    let actionId = 0;

    // Function to record actions
    const recordAction = (type, data) => {
      actions.push({
        id: ++actionId,
        type,
        timestamp: Date.now(),
        url: page.url(),
        ...data
      });
    };

    // Set up action recording listeners
    page.on('request', request => {
      if (request.url().includes('cloudskillsboost')) {
        recordAction('request', {
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType()
        });
      }
    });

    // Record page navigations
    page.on('framenavigated', () => {
      recordAction('navigation', { url: page.url() });
    });

    // Start recording
    console.log('Starting recording session...');
    console.log('Complete one full module manually - all your actions will be recorded');
    console.log('The test will timeout after 10 minutes, or you can manually stop it');

    await page.goto(COURSE_URL);
    await page.waitForLoadState('networkidle');

    // Record clicks on important elements
    await page.addInitScript(() => {
      window.recordedActions = [];
      
      // Override click to record
      const originalClick = HTMLElement.prototype.click;
      HTMLElement.prototype.click = function() {
        window.recordedActions.push({
          type: 'click',
          selector: getUniqueSelector(this),
          text: this.textContent?.trim().substring(0, 50),
          className: this.className,
          timestamp: Date.now()
        });
        return originalClick.call(this);
      };

      // Helper to generate unique selectors
      function getUniqueSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) {
          const classes = element.className.split(' ').filter(c => c.length > 0);
          if (classes.length > 0) return `.${classes[0]}`;
        }
        
        // Generate path-based selector
        let path = [];
        let current = element;
        while (current && current !== document.body) {
          let selector = current.tagName.toLowerCase();
          if (current.className) {
            const mainClass = current.className.split(' ')[0];
            if (mainClass) selector += `.${mainClass}`;
          }
          path.unshift(selector);
          current = current.parentElement;
        }
        return path.join(' > ');
      }
    });

    // Wait for user to complete actions (10 minutes timeout)
    try {
      await page.waitForTimeout(600000); // 10 minutes
    } catch (e) {
      console.log('Recording session ended');
    }

    // Extract recorded actions from page
    const pageActions = await page.evaluate(() => window.recordedActions || []);
    actions.push(...pageActions);

    // Save recorded actions
    fs.writeFileSync(ACTIONS_FILE, JSON.stringify(actions, null, 2));
    console.log(`Recorded ${actions.length} actions to ${ACTIONS_FILE}`);

    // Save authentication state
    await page.context().storageState({ path: AUTH_FILE });
    console.log(`Authentication state saved to ${AUTH_FILE}`);
  });

  // Step 2: Replay recorded actions for remaining modules
  test.describe('replay workflow', () => {
    test.use({ storageState: AUTH_FILE });
    
    test('replay actions', async ({ page }) => {
      // Load recorded actions
    if (!fs.existsSync(ACTIONS_FILE)) {
      console.log('No recorded actions found. Run the recording test first.');
      return;
    }

    const recordedActions = JSON.parse(fs.readFileSync(ACTIONS_FILE, 'utf8'));
    console.log(`📖 Loaded ${recordedActions.length} recorded actions`);

    await page.goto(COURSE_URL);
    await page.waitForLoadState('networkidle');

    // Get all incomplete modules
    const modules = await getIncompleteModules(page);
    console.log(`Found ${modules.length} modules to complete`);

    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      console.log(`\nProcessing module ${moduleIndex + 1}/${modules.length}`);
      
      // Navigate to module
      await navigateToModule(page, moduleIndex);
      
      // Replay the recorded workflow
      await replayActions(page, recordedActions);
      
      // Return to main course page
      await page.goto(COURSE_URL);
      await page.waitForLoadState('networkidle');
      await randomDelay();
    }

    console.log('All modules processed!');
  });
});

// Helper functions
async function getIncompleteModules(page) {
  return await page.evaluate(() => {
    const modules = [];
    
    // Various selectors for module elements
    const moduleSelectors = [
      '.learning-path-item',
      '.module-item', 
      '.course-module',
      '[data-testid="module"]',
      '.path-item'
    ];
    
    for (const selector of moduleSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el, index) => {
        // Check if not completed (no checkmark, incomplete status, etc.)
        const isCompleted = el.querySelector('.checkmark, .completed, .done, [data-testid="complete"]') ||
                           el.classList.contains('completed') ||
                           el.textContent.includes('✓') ||
                           el.textContent.includes('Complete');
        
        if (!isCompleted) {
          modules.push({
            index,
            text: el.textContent?.trim().substring(0, 100),
            selector: `${selector}:nth-child(${index + 1})`
          });
        }
      });
      
      if (modules.length > 0) break; // Found modules with this selector
    }
    
    return modules;
  });
}

async function navigateToModule(page, moduleIndex) {
  const moduleSelectors = [
    `.learning-path-item:nth-child(${moduleIndex + 1})`,
    `.module-item:nth-child(${moduleIndex + 1})`,
    `.course-module:nth-child(${moduleIndex + 1})`
  ];

  for (const selector of moduleSelectors) {
    try {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.hover();
        await randomDelay(500, 1000);
        await element.click();
        await page.waitForLoadState('networkidle');
        await randomDelay();
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  
  console.log(`[Warning] Could not navigate to module ${moduleIndex + 1}`);
  return false;
}

async function replayActions(page, actions) {
  console.log('🎭 Replaying recorded actions...');
  
  // Filter actions to replay (exclude navigation to specific URLs)
  const replayableActions = actions.filter(action => 
    action.type === 'click' && 
    !action.url?.includes('/modules/') && // Don't replay module-specific navigation
    action.text && 
    (action.text.toLowerCase().includes('complete') ||
     action.text.toLowerCase().includes('next') ||
     action.text.toLowerCase().includes('continue') ||
     action.text.toLowerCase().includes('done'))
  );

  for (const action of replayableActions) {
    try {
      console.log(`🎯 Replaying: ${action.type} on "${action.text}"`);
      
      if (action.type === 'click') {
        // Try multiple selector strategies
        const selectors = [
          action.selector,
          `button:has-text("${action.text}")`,
          `[role="button"]:has-text("${action.text}")`,
          `*:has-text("${action.text}")`
        ].filter(Boolean);

        let clicked = false;
        for (const selector of selectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 5000 })) {
              await element.hover();
              await randomDelay(300, 800);
              await element.click();
              await randomDelay();
              clicked = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!clicked) {
          console.log(`[Warning] Could not replay action: ${action.text}`);
        }
      }
      
    } catch (e) {
      console.log(`[Error] Error replaying action: ${e.message}`);
    }
  }
}

// Human-like delay function
async function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Advanced action replay with pattern recognition
async function smartReplay(page) {
  console.log('🧠 Using smart replay patterns...');
  
  // Common patterns in learning platforms
  const patterns = [
    // Video completion pattern
    {
      name: 'video_completion',
      steps: [
        { action: 'wait_for', selector: 'video, iframe[src*="youtube"], .video-player', timeout: 10000 },
        { action: 'click', selector: '.play-button, .ytp-play-button', optional: true },
        { action: 'wait', duration: 3000 },
        { action: 'seek_end', selector: 'video' },
        { action: 'click', selector: 'button:has-text("Complete"), button:has-text("Next"), .complete-btn' }
      ]
    },
    
    // Reading material pattern  
    {
      name: 'reading_completion',
      steps: [
        { action: 'scroll', times: 3 },
        { action: 'wait', duration: 2000 },
        { action: 'click', selector: 'button:has-text("Complete"), button:has-text("Mark as Complete")' }
      ]
    }
  ];

  for (const pattern of patterns) {
    console.log(`🔍 Trying pattern: ${pattern.name}`);
    
    let patternWorked = true;
    for (const step of pattern.steps) {
      try {
        switch (step.action) {
          case 'wait_for':
            await page.waitForSelector(step.selector, { timeout: step.timeout || 5000 });
            break;
            
          case 'click':
            const element = page.locator(step.selector).first();
            if (await element.isVisible({ timeout: 3000 })) {
              await element.hover();
              await randomDelay(200, 500);
              await element.click();
              await randomDelay();
            } else if (!step.optional) {
              throw new Error(`Required element not found: ${step.selector}`);
            }
            break;
            
          case 'scroll':
            for (let i = 0; i < (step.times || 1); i++) {
              await page.mouse.wheel(0, 300);
              await randomDelay(1000, 2000);
            }
            break;
            
          case 'wait':
            await page.waitForTimeout(step.duration);
            break;
            
          case 'seek_end':
            await page.evaluate((sel) => {
              const video = document.querySelector(sel);
              if (video && video.duration) {
                video.currentTime = video.duration - 2;
              }
            }, step.selector);
            break;
        }
      } catch (e) {
        console.log(`[Warning] Pattern ${pattern.name} failed at step ${step.action}: ${e.message}`);
        patternWorked = false;
        break;
      }
    }
    
    if (patternWorked) {
      console.log(`Successfully applied pattern: ${pattern.name}`);
      return true;
    }
  }
  
  console.log('No patterns worked, manual intervention may be needed');
  return false;
}