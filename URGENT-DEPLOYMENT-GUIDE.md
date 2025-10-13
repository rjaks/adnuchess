# 🚨 URGENT: Fix Registration Issue Deployment Guide

## Current Status
✅ **Fixed import errors** - h3 `getRequestIP` function now correctly imported
✅ **Build successful** - All production improvements working
❌ **User registration failing** - Users can't complete signup on live site

## Priority 1: Deploy Debug Tools (URGENT)

### 1. Quick Deploy to Production
```bash
# Push current fixes to your production environment
git add .
git commit -m "fix: resolved h3 import errors for production features"
git push origin main

# If using automated deployment, trigger it now
# If manual deployment, sync files to production server
```

### 2. Access Debug Dashboard
Once deployed, visit: **https://www.adnuchess.tech/debug-auth**

### 3. Debug API Endpoint
Test authentication flow: **https://www.adnuchess.tech/api/auth/debug**

## Priority 2: Google OAuth Production Setup

### Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Find your OAuth 2.0 Client ID
4. Add these authorized origins:
   ```
   https://www.adnuchess.tech
   https://adnuchess.tech
   ```
5. Add these redirect URIs:
   ```
   https://www.adnuchess.tech/api/auth/google
   https://adnuchess.tech/api/auth/google
   ```

## Priority 3: Environment Variables Check

### On your production server, verify these exist:
```bash
echo $CONVEX_DEPLOYMENT
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
echo $SESSION_SECRET
echo $NODE_ENV  # should be "production"
```

## Debugging Process

### Step 1: Check Google OAuth
1. Visit your debug dashboard after deployment
2. Test Google login button
3. Check console for any OAuth redirect errors

### Step 2: Monitor Logs
The new structured logging will show in your server logs:
```bash
# Look for authentication errors in production logs
grep -i "auth" /path/to/your/logs
```

### Step 3: Test Registration Flow
1. Open new incognito window
2. Go to your site
3. Try to register with Google
4. Note exactly where it fails
5. Check debug dashboard for user status

## Expected Fix Timeline
- **5 minutes**: Deploy code fixes
- **5 minutes**: Update Google OAuth settings
- **10 minutes**: Test and verify registration works

## Contact Points
- **Debug Dashboard**: https://www.adnuchess.tech/debug-auth
- **Health Check**: https://www.adnuchess.tech/api/health
- **Debug API**: https://www.adnuchess.tech/api/auth/debug

## Post-Fix Cleanup
Once registration is working:
1. Run through full `PRODUCTION-CHECKLIST.md`
2. Set up monitoring alerts
3. Enable rate limiting
4. Review security headers

---
**Time-sensitive**: New users are blocked from registering. Deploy ASAP!
