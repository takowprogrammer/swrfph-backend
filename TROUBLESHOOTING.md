# 🔧 Admin Dashboard Login Troubleshooting Guide

## 🚨 Issue: "Login failed please check your credentials"

### ✅ What We've Verified:
- ✅ Railway database connection is working
- ✅ Test accounts exist in database
- ✅ Password verification is working correctly
- ✅ Admin: `admin@swrfph.com` / `admin123`
- ✅ Provider: `provider@swrfph.com` / `provider123`

### 🔍 Possible Causes & Solutions:

#### 1. **CORS Configuration Issue**
**Problem**: Frontend can't reach backend due to CORS restrictions

**Solution**: Update your Railway backend environment variables:
```bash
CORS_ORIGINS="https://your-frontend.netlify.app,https://your-admin.netlify.app,http://localhost:3000,http://localhost:3001"
```

#### 2. **Backend API URL Mismatch**
**Problem**: Admin dashboard is calling wrong API URL

**Check**: In your admin dashboard, verify the API URL in:
- `apps/admin-dashboard/lib/api.ts`
- Environment variables in Netlify

**Should be**: `https://your-railway-backend-url.railway.app`

#### 3. **Backend Not Running**
**Problem**: Railway backend service is down

**Check**: 
1. Go to Railway dashboard
2. Check if backend service is running
3. Check logs for errors

#### 4. **Environment Variables Missing**
**Problem**: Backend missing required environment variables

**Required in Railway**:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
CORS_ORIGINS="https://your-frontend.netlify.app,https://your-admin.netlify.app"
NODE_ENV="production"
```

### 🧪 Testing Steps:

#### Step 1: Test Database Connection
```bash
node test-connection.js
```

#### Step 2: Test Login Credentials
```bash
node test-login.js
```

#### Step 3: Test API Endpoint
```bash
# Replace with your actual Railway URL
API_URL=https://your-railway-backend-url.railway.app node test-api.js
```

#### Step 4: Check Railway Logs
1. Go to Railway dashboard
2. Click on your backend service
3. Check the "Logs" tab
4. Look for any error messages

### 🔧 Quick Fixes:

#### Fix 1: Update CORS in Railway
1. Go to Railway dashboard
2. Select your backend service
3. Go to "Variables" tab
4. Add/Update: `CORS_ORIGINS=https://your-frontend.netlify.app,https://your-admin.netlify.app`
5. Redeploy the service

#### Fix 2: Verify API URL in Frontend
Check that your admin dashboard is calling the correct API URL:
```typescript
// In apps/admin-dashboard/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
```

#### Fix 3: Check Network Tab
1. Open browser dev tools
2. Go to Network tab
3. Try to login
4. Check if the login request is being made
5. Check the response status and error

### 📞 Common Error Messages:

- **"Network Error"**: Backend not accessible, check Railway deployment
- **"CORS Error"**: Update CORS_ORIGINS in Railway
- **"401 Unauthorized"**: Credentials issue, but we've verified they work
- **"404 Not Found"**: Wrong API URL or endpoint

### 🎯 Next Steps:
1. Update CORS_ORIGINS in Railway
2. Verify API URL in admin dashboard
3. Check Railway backend logs
4. Test API endpoint directly
