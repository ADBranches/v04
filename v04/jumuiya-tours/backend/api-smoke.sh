#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:5000}"

# -------- Tokens (paste fresh ones) --------
export ADMIN_TOKEN="${ADMIN_TOKEN:-}"
export AUDITOR_TOKEN="${AUDITOR_TOKEN:-}"   # real auditor
export GUIDE_TOKEN="${GUIDE_TOKEN:-}"       # real guide (NOT auditor)
export USER_TOKEN="${USER_TOKEN:-}"         # real user

jq_present() { command -v jq >/dev/null 2>&1; }
assert_status() {
  local expected=$1 ; shift
  local status=$1   ; shift
  local name=$1     ; shift
  if [[ "$status" -ne "$expected" ]]; then
    echo "❌ $name – expected $expected, got $status"
    exit 1
  else
    echo "✅ $name ($status)"
  fi
}

call() {
  # usage: call METHOD PATH TOKEN JSON_BODY
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  local url="$BASE_URL$path"
  local auth_hdr=()
  [[ -n "$token" ]] && auth_hdr=(-H "Authorization: Bearer $token")

  if [[ -n "$body" ]]; then
    curl -sS -o /tmp/body.json -w "%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" "${auth_hdr[@]}" \
      -d "$body"
  else
    curl -sS -o /tmp/body.json -w "%{http_code}" -X "$method" "$url" \
      "${auth_hdr[@]}"
  fi
}

echo "▶ Base: $BASE_URL"

# -------- 0) Health --------
code=$(call GET /api/health)
assert_status 200 "$code" "Health"

# -------- 1) Auth: login/register/me --------
# Adjust these creds to your seed data
ADMIN_EMAIL="admin@jumuiya.com"
ADMIN_PASS="admin123"  # ensure this matches your seed

code=$(call POST /api/auth/login '' "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
assert_status 200 "$code" "Auth login (admin)"
admin_token=$(jq -r '.token // empty' /tmp/body.json || true)
if [[ -n "$admin_token" ]]; then export ADMIN_TOKEN="$admin_token"; fi

code=$(call GET /api/auth/me "$ADMIN_TOKEN")
assert_status 200 "$code" "Auth me (admin)"

# -------- 2) Public Destinations list --------
code=$(call GET /api/destinations)
assert_status 200 "$code" "Destinations list (public)"

# -------- 3) RBAC: Users list --------
code=$(call GET /api/admin/users "$ADMIN_TOKEN")
assert_status 200 "$code" "Admin users list (admin token)"

if [[ -n "${USER_TOKEN:-}" ]]; then
  code=$(call GET /api/admin/users "$USER_TOKEN")
  assert_status 403 "$code" "Admin users list (user token denied)"
fi

# -------- 4) Destination CRUD --------
# Create (admin)
create_body='{"name":"CLI Test Destination","description":"CLI smoke","location":"Uganda"}'
code=$(call POST /api/destinations "$ADMIN_TOKEN" "$create_body")
assert_status 201 "$code" "Destination create (admin)"
dest_id=$(jq -r '.destination.id // empty' /tmp/body.json)

# Update (admin)
code=$(call PUT /api/destinations/"$dest_id" "$ADMIN_TOKEN" '{"name":"CLI Test Destination Updated"}')
assert_status 200 "$code" "Destination update (admin)"

# Show (public)
code=$(call GET /api/destinations/"$dest_id")
assert_status 200 "$code" "Destination show (public)"

# -------- 5) Moderation (auditor/admin) --------
code=$(call GET /api/moderation/pending "$AUDITOR_TOKEN")
assert_status 200 "$code" "Moderation pending (auditor)"

# Optional approve/reject endpoints only if you implemented them:
# code=$(call POST /api/moderation/"$some_id"/approve "$AUDITOR_TOKEN" '{"notes":"ok"}')

# -------- 6) Bookings (user) --------
if [[ -n "${USER_TOKEN:-}" ]]; then
  # Align with your controller field names
  now_iso=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  book_body=$(jq -n --arg did "$dest_id" --arg dt "$now_iso" \
    '{destination_id: ($did|tonumber), booking_date: $dt, number_of_people: 2, total_amount: 100000, currency: "UGX"}')

  code=$(call POST /api/bookings "$USER_TOKEN" "$(echo "$book_body")")
  assert_status 200 "$code" "Booking create (user)"
fi

echo "🎉 Smoke suite passed."

