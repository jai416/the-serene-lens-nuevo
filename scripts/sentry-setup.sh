#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/sentry-setup.sh <dsn>
# Run this after adding SENTRY_DSN to your environment

DSN="${1:-}"

if [ -z "$DSN" ]; then
  echo "Usage: $0 <sentry-dsn>"
  echo ""
  echo "1. Create a Sentry account at https://sentry.io"
  echo "2. Create a new project (Next.js)"
  echo "3. Copy the DSN and run: $0 <your-dsn>"
  exit 1
fi

echo "Adding @sentry/nextjs..."
npx @sentry/nextjs

echo ""
echo "Done! Add SENTRY_DSN=$DSN to your .env"
echo "The SDK will automatically instrument errors and performance."
