#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing .env file for Railway database...');

const envPath = path.join(__dirname, '.env');

// Read current .env content
let envContent = fs.readFileSync(envPath, 'utf8');

// Check current DATABASE_URL
const currentMatch = envContent.match(/DATABASE_URL="([^"]*)"/);
if (currentMatch) {
    console.log('📋 Current DATABASE_URL:', currentMatch[1]);

    // Check if it's already properly formatted
    if (currentMatch[1].startsWith('postgresql://') || currentMatch[1].startsWith('postgres://')) {
        console.log('✅ DATABASE_URL is already properly formatted');
    } else {
        console.log('❌ DATABASE_URL needs to be updated');
        console.log('\n🔧 Please update your .env file manually with the complete Railway connection string.');
        console.log('\n📝 You need to replace the current DATABASE_URL with:');
        console.log('DATABASE_URL="postgresql://username:password@host:port/database?schema=public"');
        console.log('\n💡 Get the complete connection string from your Railway dashboard:');
        console.log('1. Go to your Railway project');
        console.log('2. Click on your database service');
        console.log('3. Go to the "Connect" tab');
        console.log('4. Copy the "Postgres Connection URL"');
        console.log('5. Replace the DATABASE_URL in your .env file');
    }
} else {
    console.log('❌ DATABASE_URL not found in .env file');
}

console.log('\n✅ After updating the DATABASE_URL, run:');
console.log('node seed-test-accounts.js');
