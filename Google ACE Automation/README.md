# Google Cloud Skills Boost Automation

Automated completion tool for Google Cloud Skills Boost courses using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install browsers:
```bash
npm run install:browsers
```

3. Create `.env` file:
```
EMAIL=your-email@example.com
PASSWORD=your-password
```

## Components

### Core Files
- `utils/login.ts` - Handles authentication to Google Cloud Skills Boost
- `src/courseManager.ts` - Course management class with video completion logic
- `modules.json` - Contains course module data with links and completion status

### Test Scripts
- `complete-all-videos.spec.ts` - Completes all videos in course template 2
- `complete-modules.spec.ts` - Processes all modules from JSON file
- `check-specific-module.spec.ts` - Checks specific course template 2 module
- `enhanced-module-checker.spec.ts` - Enhanced module status checker
- `scrape-module-info.spec.ts` - Updates modules.json with proper titles

### Configuration
- `package.json` - NPM scripts and dependencies
- `playwright.config.js` - Playwright test configuration
- `tsconfig.json` - TypeScript configuration

## Execution Commands

### Complete Videos
```bash
npm run complete:videos
```
Marks all videos in course template 2 as completed.

### Check Module Status
```bash
npm run check:modules
```
Checks completion status of all modules.

### Check Specific Module
```bash
npm run check:specific
```
Checks course template 2 module specifically.

### Update Module Titles
```bash
npm run scrape:titles
```
Updates modules.json with proper module titles.

### Complete All Modules
```bash
npm run complete:all
```
Processes and completes all modules from JSON.

### Run with UI
```bash
npm run test:headed
```
Runs tests with browser UI visible.

### View Reports
```bash
npm run report
```
Opens Playwright test report.

## How It Works

1. **Login**: Authenticates using credentials from `.env`
2. **Navigation**: Goes to specific course/video URLs
3. **Completion**: Clicks "Mark as Completed" buttons
4. **Progress**: Logs completion status for each item
5. **Error Handling**: Continues execution if individual items fail

## Course Template 2 Structure

- **Course Introduction** (2 activities)
- **Introduction to Google Cloud** (10 activities)
- **Introduction to Containers and Kubernetes** (8 activities)
- **Kubernetes Architecture** (8 activities)
- **Kubernetes Operations** (6 activities)
- **Course Summary** (1 activity)
- **Course Resources** (1 activity)

Total: 36 activities (23 videos, 3 labs, 3 quizzes, 2 documents, 2 badges/surveys)

## Troubleshooting

- **Timeout errors**: Reduce navigation timeout or increase wait times
- **Login issues**: Verify credentials in `.env` file
- **Rate limiting**: Increase wait times between requests
- **Page closure**: Script handles graceful shutdown on page close