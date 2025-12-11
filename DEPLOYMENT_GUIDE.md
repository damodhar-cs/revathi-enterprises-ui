# Deployment Guide - Contentstack

## Issue You Were Facing

**Problem:** Frontend deployed to Contentstack (https://revathi-enterprises-ui-main.contentstackapps.com/) couldn't login or fetch data from backend.

**Root Cause:** The frontend was using a Vite proxy configuration (`/api`) which only works in development mode. In production, the proxy doesn't exist, so API calls were failing.

---

## Solution Applied

### 1. Updated API Configuration

**File:** `src/services/api.ts`

**Before:**
```typescript
const API_BASE_URL = "/api"; // Only works with Vite dev proxy
```

**After:**
```typescript
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "/api";
// Uses environment variable in production, falls back to proxy in dev
```

---

## Deployment Steps for Contentstack

### Step 1: Configure Environment Variable in Contentstack Launch

In your Contentstack Launch configuration, add:

**Variable Name:** `VITE_BACKEND_URL`  
**Value:** `https://revathi-enterprises-core.contentstackapps.com`

**⚠️ Important:** 
- Must use `VITE_` prefix (required by Vite)
- Must NOT have trailing slash
- Must use HTTPS protocol

---

### Step 2: Rebuild and Deploy

After updating the code:

```bash
cd /Users/damodhar.reddy/Personal/projects/revathi-enterprises-ui

# Build for production
npm run build

# The dist/ folder is ready for deployment
```

---

### Step 3: Backend CORS Configuration

Your backend must allow requests from the Contentstack frontend domain.

**Check backend file:** `src/main.ts`

**Required CORS configuration:**
```typescript
app.enableCors({
  origin: [
    'http://localhost:8000',
    'https://revathi-enterprises-ui-main.contentstackapps.com',
    'https://revathi-enterprises-ui-main.contentstackapps.com/',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

## Environment Files Created

### `.env` (Local Development)
```env
VITE_BACKEND_URL=http://localhost:3000
```
- Used when running `npm run dev`
- Ignored by git

### `.env.production` (Production Build)
```env
VITE_BACKEND_URL=https://revathi-enterprises-core.contentstackapps.com
```
- Used when running `npm run build`
- Ignored by git
- Can be overridden by Contentstack environment variables

### `.env.example` (Template)
```env
VITE_BACKEND_URL=http://localhost:3000
# VITE_BACKEND_URL=https://revathi-enterprises-core.contentstackapps.com
```
- Committed to git
- Template for other developers

---

## Testing Locally

### Test Local Development:
```bash
npm run dev
# Should use: http://localhost:3000 (from .env)
```

### Test Production Build:
```bash
npm run build
# Should use: https://revathi-enterprises-core.contentstackapps.com (from .env.production)
npm run preview
# Open: http://localhost:4173
```

---

## Contentstack Launch Configuration

### Environment Variables to Set:

| Variable Name | Value |
|---------------|-------|
| `VITE_BACKEND_URL` | `https://revathi-enterprises-core.contentstackapps.com` |

### Build Settings:

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node Version | 18.x or higher |

---

## Troubleshooting

### Issue 1: Login Not Working
**Symptom:** "Cannot connect to server" or CORS errors

**Solutions:**
1. ✅ Check backend CORS allows the frontend domain
2. ✅ Verify `VITE_BACKEND_URL` is set in Contentstack Launch
3. ✅ Check backend is deployed and running
4. ✅ Test backend directly: `curl https://revathi-enterprises-core.contentstackapps.com/auth/login`

---

### Issue 2: API Calls Failing
**Symptom:** 404 errors or "Network Error"

**Solutions:**
1. ✅ Open browser console (F12) → Network tab
2. ✅ Check the API request URL - should go to `https://revathi-enterprises-core.contentstackapps.com`
3. ✅ If going to same domain, environment variable is not set correctly
4. ✅ Verify `.env.production` exists and has correct URL

---

### Issue 3: Environment Variable Not Working
**Symptom:** API calls still go to `/api` instead of backend URL

**Solutions:**
1. ✅ Check Contentstack Launch environment variables are set
2. ✅ Rebuild the application: `npm run build`
3. ✅ Verify build output includes the environment variable
4. ✅ Check `dist/assets/*.js` - search for your backend URL

---

## Verification Steps

### 1. Check Environment Variable in Build:
```bash
cd /Users/damodhar.reddy/Personal/projects/revathi-enterprises-ui
npm run build
grep -r "revathi-enterprises-core" dist/assets/*.js
# Should find the backend URL in the built files
```

### 2. Test Backend is Accessible:
```bash
curl https://revathi-enterprises-core.contentstackapps.com/
# Should return: "Hello from Revathi Enterprises API!"
```

### 3. Test Backend CORS:
```bash
curl -H "Origin: https://revathi-enterprises-ui-main.contentstackapps.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://revathi-enterprises-core.contentstackapps.com/auth/login -v
# Should return CORS headers allowing the origin
```

---

## Git Workflow

### Commit and Push:
```bash
cd /Users/damodhar.reddy/Personal/projects/revathi-enterprises-ui

# Add changes
git add .

# Commit
git commit -m "Configure backend URL for production deployment"

# Push to GitHub
git push -u origin main
```

---

## Next Steps After Deployment

1. ✅ Push latest code to GitHub
2. ✅ Trigger rebuild in Contentstack Launch
3. ✅ Verify environment variable is set in Contentstack
4. ✅ Test login at: https://revathi-enterprises-ui-main.contentstackapps.com/
5. ✅ Check browser console for any errors

---

## Expected Behavior After Fix

| Scenario | API Calls Go To |
|----------|----------------|
| **Local Dev** (`npm run dev`) | `http://localhost:3000` (via proxy) |
| **Local Preview** (`npm run build && preview`) | `https://revathi-enterprises-core.contentstackapps.com` |
| **Contentstack Production** | `https://revathi-enterprises-core.contentstackapps.com` |

---

**Status:** ✅ Code fixed and ready to deploy!

