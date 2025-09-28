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

### Complete Videos (Recommended)
```bash
npm run fixed:completion
```
Completes all videos with cookie handling and improved error handling.

### Alternative Completion Methods
```bash
npm run complete:drawer
```
Completes videos using course drawer extraction.

```bash
npm run improved:completion
```
Improved completion with multiple button selectors.

```bash
npm run track:failures
```
Tracks failed videos and saves to failed-videos.txt.

### Debug and Verification
```bash
npm run debug:video
```
Debug specific video completion.

```bash
npm run debug:buttons
```
Check what buttons exist on video pages.

```bash
npm run verify:completion
```
Verify course completion status.

### Legacy Commands
```bash
npm run complete:videos
```
Marks all videos in course template 2 as completed.

```bash
npm run check:modules
```
Checks completion status of all modules.

### View Reports
```bash
npm run report
```
Opens Playwright test report.

## How It Works

1. **Login**: Authenticates using credentials from `.env`
2. **Course Processing**: Reads URLs from `videos.txt`
3. **Module Extraction**: Parses JSON from course outline to find incomplete videos
4. **Cookie Handling**: Automatically handles cookie consent popups
5. **Video Completion**: Clicks "Mark as Completed" buttons using multiple selectors
6. **Error Handling**: Continues execution if individual items fail
7. **Progress Tracking**: Logs completion status and saves failed videos

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