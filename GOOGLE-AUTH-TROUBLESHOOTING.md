# Google OAuth Troubleshooting Guide

## Overview
This guide helps resolve Google Sign-In OAuth authentication issues in the AdNU Chess web application, particularly for production deployments.

## Common Issues and Solutions

### 1. "Origin Not Allowed" Errors

**Problem**: Google Cloud Console doesn't recognize your domain as authorized.

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID: `483719521553-ck9hlaj4s0lulaosqlv7ssa468e1rdph`
3. Add your production domain to "Authorized JavaScript origins":
   - For Vercel: `https://your-app-name.vercel.app`
   - For other platforms: `https://your-domain.com`
4. **Important**: Changes take 5-15 minutes to propagate

### 2. "Error Retrieving a Token" in Production

**Problem**: CORS/COOP headers preventing OAuth token retrieval.

**Solutions Applied**:
- ✅ Updated `nuxt.config.ts` with proper COOP headers
- ✅ Created `server/plugins/headers.ts` for automatic header setting
- ✅ Enhanced error handling in `AuthSignInPanel.vue`
- ✅ Added retry logic for production errors

### 3. "Request Aborted" Errors

**Problem**: Network timeouts or interrupted OAuth flow.

**Solutions Applied**:
- ✅ Implemented retry mechanism with exponential backoff
- ✅ Added cache clearing functionality
- ✅ Enhanced error messages with production-specific guidance

## Current Configuration

### Environment Variables
```bash
# .env
GOOGLE_CLIENT_ID=483719521553-ck9hlaj4s0lulaosqlv7ssa468e1rdph
```

### Authorized Origins (Google Cloud Console)
- ✅ `http://localhost:3000` (Development)
- ⚠️  `https://your-vercel-app.vercel.app` (Production - **ADD THIS**)

### COOP Headers Configuration
- Cross-Origin-Opener-Policy: `same-origin-allow-popups`
- Cross-Origin-Embedder-Policy: `require-corp`

## Testing Checklist

### Development (localhost:3000)
- [x] Google Sign-In button loads
- [x] OAuth popup opens
- [x] Successful authentication with @gbox.adnu.edu.ph
- [x] Proper redirect after login

### Production Deployment
- [ ] Add production domain to Google Cloud Console
- [ ] Wait 5-15 minutes for changes to propagate
- [ ] Test OAuth flow
- [ ] Verify retry functionality works
- [ ] Check debug information display

## Enhanced Features

### Retry Mechanism
The updated `AuthSignInPanel.vue` now includes:
- Automatic retry button for production errors
- Cache clearing functionality
- Debug information display
- Connection status indicators
- Maximum retry attempts (3)

### Error Handling
Enhanced error handling for:
- Token retrieval failures
- Request abortion errors
- Origin not allowed errors
- Network connectivity issues

## Manual Testing Steps

1. **Deploy to Production**
   ```bash
   npm run build
   # Deploy to your platform (Vercel, Netlify, etc.)
   ```

2. **Add Production Domain**
   - Copy your production URL
   - Add to Google Cloud Console authorized origins
   - Wait 15 minutes

3. **Test OAuth Flow**
   - Visit production site
   - Click "Sign in with Google"
   - Use @gbox.adnu.edu.ph account
   - Verify successful authentication

4. **Test Error Scenarios**
   - Test with non-@gbox.adnu.edu.ph account (should fail gracefully)
   - Test network interruption (should show retry option)
   - Test repeated failures (should show debug info)

## Debug Information

The enhanced sign-in panel now shows debug information including:
- Current domain
- Environment (Development/Production)
- Client ID status
- Retry count
- Error details

To access debug info, click "Show Debug Info" on the sign-in panel.

## Support Commands

### Clear Browser Cache
```javascript
// Console command to clear Google auth cache
if (window.google?.accounts?.id) {
  window.google.accounts.id.cancel();
}
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Test Connection
```bash
# Test if your domain is accessible
curl -I https://your-domain.com
```

## Contact Information

For additional support:
1. Check browser console for detailed error messages
2. Use the debug information panel in the sign-in component
3. Verify Google Cloud Console configuration
4. Ensure environment variables are properly set

## Last Updated
October 14, 2025 - Enhanced with retry mechanism and production error handling
