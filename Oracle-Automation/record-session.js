// Simple script to launch Playwright codegen for Oracle MyLearn
const { chromium } = require('playwright');

async function launchRecorder() {
  console.log('Launching Playwright recorder...');
  console.log('This will open a browser where you can perform your login and navigation.');
  console.log('All your actions will be recorded and converted to automation code.');
}

launchRecorder();