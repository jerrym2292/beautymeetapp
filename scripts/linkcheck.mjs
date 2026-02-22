#!/usr/bin/env node
/**
 * Simple internal link checker for Beauty Meet.
 * - Crawls same-origin HTML pages starting from BASE_URL.
 * - Reports non-2xx/3xx responses.
 *
 * Usage:
 *   BASE_URL=https://beautymeetapp.com node scripts/linkcheck.mjs
 */

const BASE_URL = process.env.BASE_URL || "https://beautymeetapp.com";
const ORIGIN = new URL(BASE_URL).origin;
const MAX_PAGES = Number(process.env.MAX_PAGES || 250);

const seen = new Set();
const queue = [new URL("/", ORIGIN).toString()];
const results = [];

async function fetchText(url) {
  const res = await fetch(url, { redirect: "manual" });
  const contentType = res.headers.get("content-type") || "";
  const text = contentType.includes("text/html") ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location"), contentType, text };
}

function extractLinks(html, base) {
  const links = new Set();
  const re = /href\s*=\s*"([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = (m[1] || "").trim();
    if (!href) continue;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    try {
      const u = new URL(href, base);
      if (u.origin !== ORIGIN) continue;
      u.hash = "";
      links.add(u.toString());
    } catch {}
  }
  return [...links];
}

while (queue.length && seen.size < MAX_PAGES) {
  const url = queue.shift();
  if (!url || seen.has(url)) continue;
  seen.add(url);

  let r;
  try {
    r = await fetchText(url);
  } catch (e) {
    results.push({ url, ok: false, status: "FETCH_ERR", err: String(e) });
    continue;
  }

  const ok = r.status >= 200 && r.status < 400;
  results.push({ url, ok, status: r.status, location: r.location || null });

  if (ok && r.contentType.includes("text/html")) {
    const links = extractLinks(r.text, url);
    for (const l of links) if (!seen.has(l)) queue.push(l);
  }
}

const bad = results.filter((x) => !x.ok);
console.log(`BASE_URL=${BASE_URL}`);
console.log(`Checked ${results.length} URLs (max ${MAX_PAGES}).`);
console.log(`Bad: ${bad.length}`);
for (const b of bad.slice(0, 200)) {
  console.log(`- ${b.url} => ${b.status}${b.location ? ` (loc: ${b.location})` : ""}${b.err ? ` (${b.err})` : ""}`);
}

if (bad.length) process.exit(2);
