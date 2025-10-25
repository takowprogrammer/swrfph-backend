#!/usr/bin/env node

console.log('🔍 Configuration Checker');
console.log('========================');
console.log('');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
console.log(`JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Not set'}`);
console.log(`CORS_ORIGINS: ${process.env.CORS_ORIGINS ? '✅ Set' : '❌ Not set'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`PORT: ${process.env.PORT || 'Not set'}`);

if (process.env.CORS_ORIGINS) {
    console.log(`CORS Origins: ${process.env.CORS_ORIGINS}`);
}

console.log('');
console.log('🎯 Next Steps:');
console.log('1. Make sure your Railway backend has these environment variables:');
console.log('   - DATABASE_URL (Railway PostgreSQL URL)');
console.log('   - JWT_SECRET (any secure string)');
console.log('   - JWT_REFRESH_SECRET (any secure string)');
console.log('   - CORS_ORIGINS (your Netlify URLs)');
console.log('');
console.log('2. Make sure your Netlify admin dashboard has:');
console.log('   - NEXT_PUBLIC_API_URL (your Railway backend URL)');
console.log('');
console.log('3. Test your API with:');
console.log('   node diagnose-api.js https://your-railway-backend-url.railway.app');
