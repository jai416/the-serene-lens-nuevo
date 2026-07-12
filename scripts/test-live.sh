#!/bin/bash
# Comprehensive live site test
# Usage: BASE_URL="https://the-serene-lens-nuevo.onrender.com" bash scripts/test-live.sh

BASE_URL="${BASE_URL:-https://the-serene-lens-nuevo.onrender.com}"
PASS=0
FAIL=0

green() { echo "✅ $1"; ((PASS++)); }
red() { echo "❌ $1"; ((FAIL++)); }
check_status() {
  local url="$1" expected="$2" label="$3"
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  if [ "$status" = "$expected" ]; then
    green "$label ($status)"
  else
    red "$label - expected $expected got $status"
  fi
}
check_post_status() {
  local url="$1" expected="$2" label="$3"
  local status=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' "$url" 2>/dev/null)
  if [ "$status" = "$expected" ]; then
    green "$label ($status)"
  else
    red "$label - expected $expected got $status"
  fi
}
check_nested_json() {
  local url="$1" parent_key="$2" child_key="$3" label="$4"
  local json=$(curl -s "$url" 2>/dev/null)
  local ok=$(echo "$json" | python3 -c "
import sys, json
d = json.load(sys.stdin)
ok = '$child_key' in d.get('$parent_key', {})
sys.exit(0 if ok else 1)
" 2>/dev/null && echo "yes" || echo "no")
  if [ "$ok" = "yes" ]; then
    green "$label"
  else
    red "$label"
  fi
}

echo "=================================="
echo "🌐 The Serene Lens — Live Tests"
echo "URL: $BASE_URL"
echo "=================================="

# --- Page Loads ---
echo ""
echo "--- Page Loads ---"
check_status "$BASE_URL/" 200 "Landing page"
check_status "$BASE_URL/pricing" 200 "Pricing page"
check_status "$BASE_URL/login" 200 "Login page"
check_status "$BASE_URL/guides" 200 "Guides store"
check_status "$BASE_URL/blog" 200 "Blog"
check_status "$BASE_URL/contact" 200 "Contact"
check_status "$BASE_URL/terms" 200 "Terms"
check_status "$BASE_URL/privacy" 200 "Privacy"
check_status "$BASE_URL/ingredients-analyzer" 200 "Ingredients analyzer"

# --- API Endpoints (GET) ---
echo ""
echo "--- API GET ---"
check_nested_json "$BASE_URL/api/guides" "data" "guides" "GET /api/guides returns guides"
check_status "$BASE_URL/api/health" 200 "GET /api/health"

# --- POST API (no auth) - expect 401 ---
echo ""
echo "--- API Auth Guards (POST no auth → 401) ---"
check_post_status "$BASE_URL/api/payments/create" 401 "POST /api/payments/create"
check_post_status "$BASE_URL/api/payments/create-transfer" 401 "POST /api/payments/create-transfer"
check_post_status "$BASE_URL/api/payments/create-pack" 401 "POST /api/payments/create-pack"

# --- GET API (no auth) - expect 401 ---
echo ""
echo "--- API Auth Guards (GET no auth → 401) ---"
check_status "$BASE_URL/api/admin/transfers" 401 "GET /api/admin/transfers"
check_status "$BASE_URL/api/user/guides" 401 "GET /api/user/guides"
check_status "$BASE_URL/api/user/payments" 401 "GET /api/user/payments"
check_status "$BASE_URL/api/user/usage" 401 "GET /api/user/usage"

# --- Transfer Payment Flow ---
echo ""
echo "--- Transfer Payment Flow (no auth) ---"
check_post_status "$BASE_URL/api/payments/validate-transfer" 401 "POST validate-transfer"
check_post_status "$BASE_URL/api/payments/activate-transfer" 401 "POST activate-transfer"

# --- 404 test ---
echo ""
echo "--- 404 Handling ---"
check_status "$BASE_URL/nonexistent-page" 404 "Nonexistent page"
check_status "$BASE_URL/api/nonexistent" 404 "Nonexistent API"

# --- Guide file URLs ---
echo ""
echo "--- Guide File URLs ---"
GUIDES_JSON=$(curl -s "$BASE_URL/api/guides" 2>/dev/null)
echo "$GUIDES_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
guides = d.get('data', {}).get('guides', [])
if not guides:
  print('No guides found')
  sys.exit(0)
print(f'Found {len(guides)} guides')
for g in guides:
  file_url = g.get('fileUrl')
  title = g.get('title', '?')
  if file_url:
    print(f'  ✅ {title}: URL present ({file_url[:60]}...)')
  else:
    print(f'  ⚠️  {title}: No file URL set')
" 2>&1

echo ""
echo "=================================="
echo "Results: $PASS passed, $FAIL failed"
echo "=================================="
exit $FAIL
