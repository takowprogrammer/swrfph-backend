# 🚨 Quick Fix for Admin Dashboard Login

## The Problem
Your admin dashboard is trying to call `http://localhost:5000` instead of your Railway backend URL.

## 🔧 Immediate Fix

### Step 1: Check Your Netlify Environment Variables
Go to your Netlify admin dashboard and add/update:
```
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
```

### Step 2: Check Your Railway Environment Variables
Go to your Railway backend dashboard and add/update:
```
CORS_ORIGINS=https://your-admin.netlify.app,https://your-frontend.netlify.app
```

### Step 3: Test the Connection
Run this command to test your API:
```bash
node diagnose-api.js https://your-railway-backend-url.railway.app
```

## 🔍 How to Find Your URLs

### Railway Backend URL:
1. Go to Railway dashboard
2. Click on your backend service
3. Go to "Settings" tab
4. Copy the "Domain" URL

### Netlify URLs:
1. Go to Netlify dashboard
2. Click on your site
3. Copy the site URL from the overview

## 🧪 Test Commands

```bash
# Test database (should work)
node debug-login.js

# Test API endpoint (replace with your Railway URL)
node diagnose-api.js https://your-railway-backend-url.railway.app

# Test specific login
curl -X POST https://your-railway-backend-url.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swrfph.com","password":"admin123"}'
```

## 🎯 Expected Results

After fixing the environment variables:
1. Admin dashboard should call the correct Railway URL
2. CORS should allow the request
3. Login should work with the seeded credentials

## 📞 Still Not Working?

If it's still not working after these fixes:
1. Check browser dev tools → Network tab
2. Look for the login request
3. Check the request URL and response
4. Share the error message you see
