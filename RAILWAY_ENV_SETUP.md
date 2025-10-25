# 🚀 Railway Environment Variables Setup

## 🚨 The Problem
Your Railway backend is missing required environment variables, which is why the login is failing.

## 🔧 Required Environment Variables

### In Railway Backend Dashboard:
1. Go to your Railway project
2. Click on your backend service
3. Go to "Variables" tab
4. Add these variables:

```env
DATABASE_URL=postgresql://postgres:password@host:port/railway?schema=public
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
CORS_ORIGINS=https://your-admin.netlify.app,https://your-frontend.netlify.app
NODE_ENV=production
PORT=5000
```

### In Netlify Admin Dashboard:
1. Go to your Netlify admin dashboard site
2. Go to "Site settings" → "Environment variables"
3. Add this variable:

```env
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
```

## 🎯 Step-by-Step Fix

### Step 1: Get Your Railway Backend URL
1. Go to Railway dashboard
2. Click on your backend service
3. Go to "Settings" tab
4. Copy the "Domain" URL (e.g., `https://your-app.railway.app`)

### Step 2: Get Your Netlify URLs
1. Go to Netlify dashboard
2. Copy your admin dashboard URL (e.g., `https://your-admin.netlify.app`)
3. Copy your frontend URL (e.g., `https://your-frontend.netlify.app`)

### Step 3: Set Railway Environment Variables
In Railway backend service, add:
```
DATABASE_URL=postgresql://postgres:password@host:port/railway?schema=public
JWT_SECRET=AFSR35644@@#^GGFF@&#
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
CORS_ORIGINS=https://your-admin.netlify.app,https://your-frontend.netlify.app
NODE_ENV=production
PORT=5000
```

### Step 4: Set Netlify Environment Variables
In Netlify admin dashboard, add:
```
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
```

### Step 5: Redeploy Both Services
1. Railway will auto-redeploy when you save environment variables
2. Netlify will auto-redeploy when you save environment variables

## 🧪 Test After Setup

```bash
# Test your Railway backend
node diagnose-api.js https://your-railway-backend-url.railway.app

# Test login directly
curl -X POST https://your-railway-backend-url.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swrfph.com","password":"admin123"}'
```

## ✅ Expected Results

After setting these environment variables:
1. Railway backend will have proper CORS configuration
2. Admin dashboard will call the correct API URL
3. Login will work with the seeded credentials

## 🆘 Still Not Working?

If it's still not working:
1. Check Railway logs for errors
2. Check Netlify build logs
3. Test the API directly with curl
4. Check browser dev tools for network errors
