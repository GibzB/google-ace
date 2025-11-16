# Oracle Course Automation

Automated tool for completing Oracle certification courses.

## Setup

1. Install dependencies:
```bash
npm install
npm run install:browsers
```

2. Configure credentials in `.env` file (already created)

## Usage

### Test Login
```bash
npm run login:test
```

### Complete Courses
```bash
npm run complete:courses
```

## Scripts

- `login:test` - Test Oracle login functionality
- `complete:courses` - Automatically complete available courses
- `test:headed` - Run tests with browser visible

## Notes

- Credentials are stored in `.env` file
- All tests run with browser visible for monitoring
- Screenshots are taken on failures for debugging