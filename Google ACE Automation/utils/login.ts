import { Page } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export async function login(page: Page) {
  await page.goto('https://partner.cloudskillsboost.google/', { waitUntil: 'domcontentloaded' });
  
  try {
    await page.getByRole('button', { name: 'Agree' }).click();
  } catch (e) {
    console.log('No cookie consent dialog found');
  }

  await page.getByRole('link', { name: 'Sign in' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(process.env.EMAIL || '');
  await page.getByRole('textbox', { name: 'Password' }).fill(process.env.PASSWORD || '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  
  await page.waitForURL(/partner\.cloudskillsboost\.google\/(dashboard|$)/, { timeout: 60000 });
  await page.waitForLoadState('domcontentloaded');
  console.log('Successfully logged in');
}