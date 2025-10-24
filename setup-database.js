#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Railway Database Setup Script');
console.log('================================');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
}

// Read current .env content
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('📋 Current DATABASE_URL in .env:');
const match = envContent.match(/DATABASE_URL="([^"]*)"/);
if (match) {
    console.log(match[1]);
} else {
    console.log('❌ DATABASE_URL not found in .env');
}

console.log('\n🔧 To fix the DATABASE_URL, you need to update your .env file with the complete Railway connection string.');
console.log('\n📝 The format should be:');
console.log('DATABASE_URL="postgresql://username:password@host:port/database?schema=public"');
console.log('\n🌐 For Railway, it typically looks like:');
console.log('DATABASE_URL="postgresql://postgres:your_password@your_host:your_port/railway?schema=public"');
console.log('\n💡 You can find the complete connection string in your Railway dashboard under the database service.');

console.log('\n✅ Once you update the DATABASE_URL, run:');
console.log('npx prisma db push');
console.log('npx prisma db seed');
