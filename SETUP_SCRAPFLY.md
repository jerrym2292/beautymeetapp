
# 💅 BeautyMeetApp: Professional License Verification Setup

Automated lookups are now enabled for **PA, GA, and CA** via **Scrapfly**.
Because these states use advanced bot-protection (Cloudflare/Turnstile), they require an external scraper API to handle JavaScript rendering and bypasses.

## 🚀 Step 1: Get an API Key
1. Sign up for a free account at [Scrapfly.io](https://scrapfly.io).
2. Go to your dashboard and copy your **Public API Key**.

## 🔑 Step 2: Update Environment Variables
Open your `.env` file and add the following line:

```env
SCRAPFLY_API_KEY=scp-live-your-key-here
```

## 🛠️ Step 3: Verify Implementation
The lookups are now handled in:
- `lib/verifyScrapfly.ts`: Contains the GA/CA scraping logic.
- `lib/licenseVerification.ts`: Main entry point for all state lookups.
- `lib/verifyPAGALicense.ts`: Contains the PA direct-API lookup.

## 📝 Important Notes
- **Free Tier:** Scrapfly's free tier allows for several hundred lookups/month. If your application volume grows, you may need a paid plan.
- **ASP (Anti-Scraping Protection):** The code has `asp: true` enabled, which uses Scrapfly's sophisticated proxy rotation to bypass most "Are you a human?" checks.
- **JS Rendering:** `render_js: true` is enabled, which simulates a browser environment to solve Turnstile challenges automatically.

---
**Status:** Implementation Complete. Ready to test once the API key is added.
