// Production readiness smoke test (runs against a base URL)
// Usage:
//   BASE_URL=https://beautymeetapp.com node scripts/smoke-prod.mjs
//   BASE_URL=http://127.0.0.1:3000 node scripts/smoke-prod.mjs

const base = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const adminPin = process.env.ADMIN_PIN;

async function req(path, opts = {}) {
  const url = base + path;
  const res = await fetch(url, {
    redirect: 'manual',
    ...opts,
    headers: {
      ...(opts.headers || {}),
    },
  });
  const text = await res.text().catch(() => '');
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { res, text, json, url };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function rand(n=6){
  return Math.random().toString(16).slice(2,2+n);
}

(async () => {
  console.log('Smoke testing:', base);

  // 1) Public pages
  for (const p of ['/', '/book', '/tech/apply', '/affiliate/register', '/login']) {
    const r = await req(p);
    assert(r.res.status === 200, `GET ${p} expected 200, got ${r.res.status}`);
  }
  console.log('✓ Public pages OK');

  // 2) Create tech application
  const email = `smoke-tech-${Date.now()}@example.com`;
  const phone = `555${String(Math.floor(Math.random()*9000000)+1000000)}`;
  let r = await req('/api/apply', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Smoke Tech',
      phone,
      email,
      city: 'Pittsburgh',
      state: 'PA',
      zip: '15001',
      mode: 'BOTH',
    }),
  });
  assert(r.res.ok, `POST /api/apply failed ${r.res.status} ${r.text.slice(0,200)}`);
  console.log('✓ Tech apply submitted');

  // 3) Admin approve latest application
  assert(adminPin, 'ADMIN_PIN must be set in environment to approve applications');
  r = await req('/api/admin/applications', {
    headers: { 'x-admin-pin': adminPin },
  });
  assert(r.res.ok, `GET /api/admin/applications failed ${r.res.status}`);
  const appId = r.json?.applications?.[0]?.id;
  assert(appId, 'No applications returned from admin list');

  r = await req('/api/admin/approve', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-pin': adminPin },
    body: JSON.stringify({ id: appId }),
  });
  assert(r.res.ok, `POST /api/admin/approve failed ${r.res.status} ${r.text.slice(0,200)}`);
  const token = r.json?.provider?.accessToken;
  const providerId = r.json?.provider?.id;
  assert(token && providerId, 'Approve did not return provider token/id');
  console.log('✓ Admin approve OK');

  // 4) Provider adds a service
  r = await req(`/api/provider/${token}/service`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      category: 'LASHES_BROWS',
      name: `Smoke Service ${rand(4)}`,
      durationMin: 60,
      priceCents: 9900,
    }),
  });
  assert(r.res.ok, `POST provider service failed ${r.res.status} ${r.text.slice(0,200)}`);
  const serviceId = r.json?.service?.id;
  assert(serviceId, 'Provider service create did not return serviceId');
  console.log('✓ Provider service create OK');

  // 5) Customer search providers
  r = await req('/api/search/providers?zip=15001&radius=50&category=ALL');
  assert(r.res.ok, `GET search providers failed ${r.res.status}`);
  const found = r.json?.providers?.some?.((p) => p.id === providerId);
  assert(found, 'Newly-approved provider not found in search results');
  console.log('✓ Customer search OK');

  // 6) Create booking -> must return checkoutUrl
  r = await req('/api/bookings', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      providerId,
      fullName: 'Smoke Customer',
      phone: `555${String(Math.floor(Math.random()*9000000)+1000000)}`,
      customerZip: '15001',
      serviceId,
      startAt: '2026-03-01 10:00',
      isMobile: false,
    }),
  });
  assert(r.res.ok, `POST booking failed ${r.res.status} ${r.text.slice(0,200)}`);
  assert(r.json?.checkoutUrl, 'Booking did not return checkoutUrl');
  console.log('✓ Booking -> checkoutUrl OK');

  // 7) Affiliate registration + validate code
  const affEmail = `smoke-aff-${Date.now()}@example.com`;
  r = await req('/api/auth/register-affiliate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Smoke Affiliate',
      email: affEmail,
      password: 'TemporaryPassw0rd!',
      code: `SMK${String(Date.now()).slice(-6)}`,
    }),
  });
  assert(r.res.ok, `Affiliate register failed ${r.res.status} ${r.text.slice(0,200)}`);
  const code = r.json?.affiliate?.code;
  assert(code, 'Affiliate register did not return code');

  r = await req(`/api/affiliate/validate?code=${encodeURIComponent(code)}`);
  assert(r.res.ok, `Affiliate validate failed ${r.res.status}`);
  assert(r.json?.ok === true, 'Affiliate validate did not return ok:true');
  console.log('✓ Affiliate register + validate OK');

  console.log('\nALL SMOKE TESTS PASSED');
})().catch((e) => {
  console.error('\nSMOKE TEST FAILED:', e?.stack || e);
  process.exit(1);
});
