#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    console.log('🔍 Testing Railway database connection...');

    const prisma = new PrismaClient();

    try {
        await prisma.$connect();
        console.log('✅ Database connection successful!');

        // Test a simple query
        const userCount = await prisma.user.count();
        console.log(`📊 Current users in database: ${userCount}`);

        // Check if test accounts exist
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@swrfph.com' }
        });

        const provider = await prisma.user.findUnique({
            where: { email: 'provider@swrfph.com' }
        });

        if (admin) {
            console.log('✅ Admin account exists:', admin.email);
        } else {
            console.log('❌ Admin account not found');
        }

        if (provider) {
            console.log('✅ Provider account exists:', provider.email);
        } else {
            console.log('❌ Provider account not found');
        }

        if (!admin || !provider) {
            console.log('\n🌱 Run the seeding script to create test accounts:');
            console.log('node seed-test-accounts.js');
        }

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);

        if (error.message.includes('the URL must start with the protocol')) {
            console.log('\n🔧 Fix: Update your .env file with the complete Railway DATABASE_URL');
            console.log('The DATABASE_URL should start with "postgresql://" or "postgres://"');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 Fix: Check your Railway database connection string');
            console.log('Make sure the host, port, username, and password are correct');
        }

        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
