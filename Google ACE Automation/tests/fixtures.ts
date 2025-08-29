import { test as base } from '@playwright/test';

// Declare test fixtures
export const test = base.extend({
  // You can add shared fixtures here
});

// Export expect for convenience
export { expect } from '@playwright/test';
