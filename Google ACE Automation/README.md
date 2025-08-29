# Google ACE Automation Tool

Automated Google Cloud Skills Boost course completion using Playwright.

## Features

- ✅ Automatic login to Google Cloud Skills Boost
- ✅ Complete individual course videos
- ✅ Complete entire course modules
- ✅ Batch process multiple courses
- ✅ Progress tracking and reporting

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npm run install:browsers
```

3. Configure your credentials in `.env`:
```
LOGIN_URL=https://partner.cloudskillsboost.google/users/sign_in
EMAIL=your-email@example.com
PASSWORD=your-password
```

## Usage

### Complete a single course videos:
```bash
npm run complete:videos
```

### Complete all courses:
```bash
npm run complete:all
```

### Run with UI (for debugging):
```bash
npm run test:ui
```

### View test reports:
```bash
npm run report
```

## Project Structure

- `src/` - Core automation logic
- `tests/` - Playwright test files
- `utils/` - Helper functions
- `modules.json` - Course configuration

## Available Scripts

- `npm test` - Run all tests
- `npm run test:headed` - Run tests with browser UI
- `npm run complete:videos` - Complete videos in current course
- `npm run complete:all` - Complete all configured courses