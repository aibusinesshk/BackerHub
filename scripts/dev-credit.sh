#!/bin/bash
# Credit test funds to a user's wallet via Supabase directly
# Usage: ./scripts/dev-credit.sh <email> <amount>
#
# Example: ./scripts/dev-credit.sh evpoker2467@gmail.com 5000

SUPABASE_URL="https://kydwembfilbmjiqscgwj.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5ZHdlbWJmaWxibWppcXNjZ3dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM4NjMwMSwiZXhwIjoyMDg4OTYyMzAxfQ.LePfKfZTck6qghuibY5zZQjrnEVW5BdCvMw1JMHsdgc"

EMAIL="${1:-evpoker2467@gmail.com}"
AMOUNT="${2:-5000}"

echo "==> Looking up user: $EMAIL"

# Step 1: Find user in profiles table
USER_ID=$(curl -s "$SUPABASE_URL/rest/v1/profiles?email=eq.$EMAIL&select=id" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -z "$USER_ID" ]; then
  echo "==> Not found in profiles, checking auth.users..."
  # Step 2: Find in auth.users via admin API
  USER_ID=$(curl -s "$SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
users = data.get('users', data) if isinstance(data, dict) else data
for u in users:
    if u.get('email') == '$EMAIL':
        print(u['id'])
        break
" 2>/dev/null)
fi

if [ -z "$USER_ID" ]; then
  echo "ERROR: No user found with email $EMAIL"
  exit 1
fi

echo "==> Found user: $USER_ID"

# Step 3: Check current balance
echo "==> Current wallet balance:"
curl -s "$SUPABASE_URL/rest/v1/profiles?id=eq.$USER_ID&select=wallet_balance" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY"
echo ""

# Step 4: Credit wallet using RPC
echo "==> Crediting \$$AMOUNT..."
RESULT=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/adjust_wallet_balance" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"p_user_id\": \"$USER_ID\", \"p_amount\": $AMOUNT}")

echo "==> New balance: $RESULT"

# Step 5: Create transaction record
echo "==> Creating transaction record..."
curl -s -X POST "$SUPABASE_URL/rest/v1/transactions" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"type\": \"deposit\",
    \"amount\": $AMOUNT,
    \"currency\": \"USD\",
    \"status\": \"completed\",
    \"payment_method\": \"dev-credit\",
    \"description\": \"Dev test credit of \$$AMOUNT\",
    \"description_zh\": \"開發測試充值 \$$AMOUNT\"
  }"

echo ""
echo "==> Done! $EMAIL now has \$$AMOUNT added to their wallet."
