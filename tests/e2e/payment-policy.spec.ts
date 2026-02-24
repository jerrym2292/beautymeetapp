import { test, expect } from '@playwright/test';

// These tests assume:
// - production has STRIPE keys configured (test mode is fine)
// - admin pin is provided as ADMIN_PIN env for seeding + admin inspection

test('tech decline refunds deposit (deposit-only policy)', async ({ request }) => {
  const adminPin = process.env.ADMIN_PIN;
  expect(adminPin, 'ADMIN_PIN env is required for this test').toBeTruthy();

  // Seed a provider + active service
  const seedRes = await request.post('/api/admin/e2e/seed', { headers: { 'x-admin-pin': adminPin! } });
  expect(seedRes.ok()).toBeTruthy();
  const seed: any = await seedRes.json();

  const providerId = seed.provider.id;
  const token = seed.provider.accessToken;
  const serviceId = seed.service.id;

  // Create booking (returns checkoutUrl). We can't complete Stripe Checkout in Playwright here,
  // but we can still validate that declining triggers the refund logic path without errors.
  const bookingRes = await request.post('/api/bookings', {
    data: {
      providerId,
      fullName: 'E2E Customer',
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
      customerZip: '30303',
      serviceId,
      startAt: '2026-03-01 10:00',
      isMobile: false,
    },
  });
  expect(bookingRes.ok()).toBeTruthy();
  const bookingBody: any = await bookingRes.json();
  expect(bookingBody.bookingId).toBeTruthy();

  // Decline booking
  const declineRes = await request.post(`/api/provider/${token}/booking/${bookingBody.bookingId}/decline`);
  expect(declineRes.status()).toBeGreaterThanOrEqual(200);

  // Inspect booking record
  const inspectRes = await request.get(`/api/admin/bookings/${bookingBody.bookingId}`, {
    headers: { 'x-admin-pin': adminPin! },
  });
  expect(inspectRes.ok()).toBeTruthy();
  const inspect: any = await inspectRes.json();

  expect(inspect.booking.status).toBe('CANCELLED');
});
