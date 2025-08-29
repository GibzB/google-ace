import { test, expect } from './fixtures';

test.describe('Hello World', () => {
  test('hello world', async ({ page }) => {
    await page.goto('https://example.com');
    const title = await page.title();
    expect(title).toBe('Example Domain');
});