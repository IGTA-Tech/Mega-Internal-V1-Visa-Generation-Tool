#!/bin/bash
#=============================================================================
# CLEAN START SCRIPT - Clears Environment Pollution
# Mega Internal V1 Visa Petition Generator
#=============================================================================

echo "=========================================="
echo "Starting Clean Supabase Environment Setup"
echo "=========================================="

# Step 1: Unset ALL Supabase environment variables
echo "[1/5] Clearing environment pollution..."
unset NEXT_PUBLIC_SUPABASE_URL
unset NEXT_PUBLIC_SUPABASE_ANON_KEY
unset SUPABASE_SERVICE_ROLE_KEY
unset VITE_SUPABASE_URL
unset VITE_SUPABASE_ANON_KEY

# Step 2: Navigate to project
echo "[2/5] Navigating to project directory..."
cd "/home/innovativeautomations/Mega Working - Visa Petition Generator/mega-internal-v1-visa-tool"

# Step 3: Verify .env.local has correct credentials
echo "[3/5] Verifying .env.local credentials..."
if grep -q "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .env.local; then
    echo "✅ .env.local has JWT tokens (correct format)"
else
    echo "⚠️  WARNING: .env.local might have incorrect key format!"
    echo "    Keys should start with: eyJh..."
    echo "    NOT with: sb_publishable_ or sb_secret_"
fi

# Step 4: Kill existing processes and clear cache
echo "[4/5] Killing existing Node processes and clearing cache..."
pkill -9 node 2>/dev/null
killall -9 node 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
sleep 2
rm -rf .next

# Step 5: Start server (will read ONLY from .env.local)
echo "[5/5] Starting server with clean environment..."
echo "=========================================="
echo "Server will ONLY read from .env.local"
echo "=========================================="
npm run dev
