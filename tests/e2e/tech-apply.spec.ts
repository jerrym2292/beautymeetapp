import { test, expect } from '@playwright/test';

function uniqPhone() {
  // Not real SMS; just unique for DB.
  return `555${Math.floor(1000000 + Math.random() * 9000000)}`;
}

test('tech can submit an application', async ({ page }) => {
  await page.goto('/tech/apply');

  await page.getByLabel('Full name').fill('E2E Tech');
  await page.getByLabel('Phone').fill(uniqPhone());
  await page.getByLabel('Email (optional)').fill('e2e-tech@example.com');

  await page.getByLabel('Address line 1').fill('123 Test St');
  await page.getByLabel('City').fill('Atlanta');
  await page.getByLabel('State (2 letters)').fill('GA');
  await page.getByLabel('ZIP').fill('30303');

  await page.getByRole('button', { name: 'Submit application' }).click();

  await expect(page.getByText("Application submitted", { exact: false })).toBeVisible();
});
