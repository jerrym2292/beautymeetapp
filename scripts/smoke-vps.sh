#!/usr/bin/env bash
set -euo pipefail
cd /var/www/beauty-meet

BASE_URL=${BASE_URL:-http://127.0.0.1:3000}

# Extract secrets from .env without echoing them.
ADMIN_PIN=$(grep -E '^ADMIN_PIN=' .env | head -n1 | cut -d= -f2- | tr -d '"' || true)
ADMIN_BOOTSTRAP_EMAIL=$(grep -E '^ADMIN_BOOTSTRAP_EMAIL=' .env | head -n1 | cut -d= -f2- | tr -d '"' || true)
ADMIN_BOOTSTRAP_PASSWORD=$(grep -E '^ADMIN_BOOTSTRAP_PASSWORD=' .env | head -n1 | cut -d= -f2- | tr -d '"' || true)

export BASE_URL ADMIN_PIN ADMIN_BOOTSTRAP_EMAIL ADMIN_BOOTSTRAP_PASSWORD
node scripts/smoke-prod.mjs
