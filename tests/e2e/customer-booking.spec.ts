import { test, expect } from '@playwright/test';

// This test verifies the customer booking funnel up through creation of a Checkout URL.
// It does NOT require Stripe to be reachable in the browser.

test('customer can search and start a booking (returns checkoutUrl)', async ({ page, request }) => {
  // Go to book with a known E2E ZIP. (Requires the E2E provider seed.)
  await page.goto('/book?zip=15001&category=ALL');

  // Some deployments may not yet support query-param prefills; ensure ZIP is set.
  const zipBox = page.getByPlaceholder('Enter your ZIP (required)');
  if ((await zipBox.inputValue()).trim().length < 5) {
    await zipBox.fill('15001');
  }

  // Submit search
  const searchBtn = page.getByRole('button', { name: /^Search$/ });
  if (await searchBtn.isDisabled()) {
    await zipBox.fill('15001');
  }
  await searchBtn.click();

  const providerCards = page.locator('text=Request booking');
  await expect(providerCards.first()).toBeVisible({ timeout: 30_000 });

  // Click first provider
  await providerCards.first().click();

  // Provider page should load
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Fill booking form (UI smoke)
  await page.getByLabel('Your name').fill('E2E Customer');
  await page.getByLabel('Phone').fill('5551112222');
  await page.getByLabel('Your ZIP').fill('30303');
  await page.getByLabel('Requested date/time').fill('2026-03-01 10:00');

  // Instead of clicking "Request booking" (which would redirect), call the API directly.
  const providerId = page.url().split('/p/')[1]?.split(/[?#]/)[0];
  expect(providerId).toBeTruthy();

  const providerRes = await request.get(`/api/providers/${providerId}`);
  expect(providerRes.ok()).toBeTruthy();
  const providerJson: any = await providerRes.json();

  const serviceId = providerJson?.provider?.services?.[0]?.id;
  expect(serviceId).toBeTruthy();

  const bookingRes = await request.post('/api/bookings', {
    data: {
      providerId,
      fullName: 'E2E Customer',
      phone: '5551112222',
      customerZip: '30303',
      serviceId,
      startAt: '2026-03-01 10:00',
      isMobile: false,
    },
  });

  expect(bookingRes.ok()).toBeTruthy();
  const body: any = await bookingRes.json();

  expect(body.ok).toBeTruthy();
  expect(typeof body.checkoutUrl).toBe('string');
  expect(body.checkoutUrl.length).toBeGreaterThan(10);

  // In dev/demo it may be an internal success URL; otherwise it should be Stripe.
  expect(
    body.checkoutUrl.startsWith('https://checkout.stripe.com/') || body.checkoutUrl.includes('/book/success')
  ).toBeTruthy();
});
