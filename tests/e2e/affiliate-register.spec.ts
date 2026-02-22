import { test, expect } from '@playwright/test';

function uniqEmail() {
  const n = Date.now();
  return `e2e_aff_${n}@example.com`;
}

test('affiliate can register and then log in', async ({ page }) => {
  const email = uniqEmail();
  const password = 'Password123!';
  const code = `E2E${String(Date.now()).slice(-6)}`;

  await page.goto('/affiliate/register');
  await page.getByLabel('Full name').fill('E2E Affiliate');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Desired Referral Code (e.g. JANE10)').fill(code);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Join as Affiliate' }).click();

  await expect(page.getByText('Welcome to the team!', { exact: false })).toBeVisible();

  // Login
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Should land on home; menu contains dashboard link when logged in (not perfect, but smoke check)
  await expect(page).toHaveURL(/\/$/);
});
