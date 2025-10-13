#!/bin/bash

# Production Environment Check Script
echo "🔍 AdNU Chess Production Environment Check"
echo "=========================================="

echo ""
echo "📋 Critical Environment Variables:"
echo "NODE_ENV: ${NODE_ENV:-'NOT SET'}"
echo "CONVEX_URL: ${CONVEX_URL:+'SET'}"
echo "GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:+'SET'}"
echo "GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:+'SET'}"
echo "SESSION_SECRET: ${SESSION_SECRET:+'SET'}"

echo ""
echo "🌐 URLs and Domains:"
echo "NUXT_PUBLIC_SITE_URL: ${NUXT_PUBLIC_SITE_URL:-'NOT SET'}"
echo "Current Domain: $(curl -s ifconfig.me 2>/dev/null || echo 'Cannot detect')"

echo ""
echo "🔗 Testing Connectivity:"

# Test Convex connection
if [ -n "$CONVEX_URL" ]; then
    echo -n "Convex connectivity: "
    if curl -s "$CONVEX_URL" > /dev/null; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
else
    echo "Convex connectivity: ❌ CONVEX_URL not set"
fi

# Test health endpoint
echo -n "Health endpoint: "
if curl -s -f http://localhost:3000/api/health > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# Test auth debug endpoint
echo -n "Auth debug endpoint: "
if curl -s -f http://localhost:3000/api/auth/debug > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo ""
echo "📁 File Permissions:"
ls -la logs/ 2>/dev/null || echo "❌ logs/ directory missing"
ls -la .output/ 2>/dev/null || echo "❌ .output/ directory missing"

echo ""
echo "🔧 Suggested Actions:"

if [ -z "$CONVEX_URL" ]; then
    echo "❗ Set CONVEX_URL environment variable"
fi

if [ -z "$NUXT_PUBLIC_SITE_URL" ]; then
    echo "❗ Set NUXT_PUBLIC_SITE_URL to https://www.adnuchess.tech"
fi

if [ "$NODE_ENV" != "production" ]; then
    echo "❗ Set NODE_ENV=production"
fi

echo ""
echo "🚀 Next Steps:"
echo "1. Fix any missing environment variables above"
echo "2. Restart the application: npm run pm2:restart"  
echo "3. Check debug page: https://www.adnuchess.tech/debug-auth"
echo "4. Monitor logs: npm run pm2:logs"
