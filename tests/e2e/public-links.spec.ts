import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = ['/', '/book', '/login', '/tech/apply', '/affiliate/register', '/forgot-password', '/reset-password', '/signup'];

for (const path of PUBLIC_PAGES) {
  test(`public page loads: ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status(), `status for ${path}`).toBeLessThan(400);
  });
}

test('home page has primary CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Find an Artist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Apply as Artist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign Up to Refer →' })).toBeVisible();
});
