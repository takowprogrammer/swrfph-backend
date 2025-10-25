# 🚨 Railway Backend Deployment Checklist

## Current Status: Backend is returning 502 Bad Gateway

Your backend at `https://swrfph-backend-production.up.railway.app/health` is returning a 502 error, which means the service is not running or not reachable.

## ✅ Step-by-Step Debugging:

### 1. Check Railway Backend Service Status

Go to your Railway Dashboard and check:
- ✅ Is the service **deployed**?
- ✅ Is the service **running** (not crashed)?
- ✅ Are there any **build errors**?
- ✅ Are there any **runtime errors** in the logs?

### 2. Check Railway Environment Variables

Your backend MUST have these variables:
```
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-admin.netlify.app
NODE_ENV=production
PORT=5000
```

### 3. Check Railway Logs

Look for these specific errors in Railway logs:
- ❌ "Connection dial timeout" - Server not listening on 0.0.0.0
- ❌ "Database connection failed" - Wrong DATABASE_URL
- ❌ "Port already in use" - Port conflict
- ❌ "Module not found" - Missing dependencies

### 4. Verify the 0.0.0.0 Fix Was Deployed

The backend MUST have this line in `src/main.ts`:
```typescript
await app.listen(port, '0.0.0.0');
```

NOT:
```typescript
await app.listen(port); // ❌ WRONG - won't work in Railway
```

### 5. Force Redeploy Backend

If the code looks correct but service is down:
1. Go to Railway Dashboard
2. Click on your backend service
3. Go to "Deployments" tab
4. Click "Redeploy" on the latest deployment
5. Watch the logs for errors

### 6. Test Endpoints After Backend is Running

Once backend is up, test these URLs:
```bash
# Health check
curl https://swrfph-backend-production.up.railway.app/health

# Should return: 200 OK

# API docs
curl https://swrfph-backend-production.up.railway.app/docs

# Should return: HTML page

# Login endpoint (OPTIONS for CORS check)
curl -X OPTIONS https://swrfph-backend-production.up.railway.app/auth/login

# Should return: 200 OK with CORS headers
```

## 🎯 Most Likely Causes:

1. **Backend build failed** - Check Railway build logs
2. **Backend crashed on startup** - Check Railway runtime logs  
3. **Database connection error** - Check DATABASE_URL format
4. **Port binding issue** - Make sure listening on 0.0.0.0
5. **Missing dependencies** - Check package.json includes all deps

## 📋 What to Share with Me:

If you need help, share:
1. Screenshot of Railway service status (running/crashed/building)
2. Last 50 lines of Railway deployment logs
3. Any error messages you see in Railway logs
4. The result of `curl https://swrfph-backend-production.up.railway.app/health`

