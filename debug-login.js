#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function debugLogin() {
    console.log('🔍 Debugging login issue...');

    try {
        // Test 1: Database connection
        console.log('\n1️⃣ Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connected');

        // Test 2: Check if users exist
        console.log('\n2️⃣ Checking users in database...');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        console.log(`📊 Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) - ID: ${user.id}`);
        });

        // Test 3: Test admin login specifically
        console.log('\n3️⃣ Testing admin login...');
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@swrfph.com' }
        });

        if (admin) {
            console.log('✅ Admin user found');
            console.log(`📧 Email: ${admin.email}`);
            console.log(`👤 Name: ${admin.name}`);
            console.log(`🔑 Role: ${admin.role}`);
            console.log(`🆔 ID: ${admin.id}`);

            // Test password
            const isValid = await argon2.verify(admin.password, 'admin123');
            console.log(`🔐 Password check: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

            if (!isValid) {
                console.log('🔧 Re-hashing admin password...');
                const newHash = await argon2.hash('admin123');
                await prisma.user.update({
                    where: { id: admin.id },
                    data: { password: newHash }
                });
                console.log('✅ Admin password updated');
            }
        } else {
            console.log('❌ Admin user not found');
        }

        // Test 4: Check if there are any issues with the user data
        console.log('\n4️⃣ Checking user data integrity...');
        const allUsers = await prisma.user.findMany();
        for (const user of allUsers) {
            console.log(`\n👤 User: ${user.email}`);
            console.log(`  - ID: ${user.id}`);
            console.log(`  - Role: ${user.role}`);
            console.log(`  - Created: ${user.createdAt}`);
            console.log(`  - Password hash length: ${user.password.length}`);

            // Test password for each user
            const testPassword = user.email === 'admin@swrfph.com' ? 'admin123' : 'provider123';
            const passwordValid = await argon2.verify(user.password, testPassword);
            console.log(`  - Password valid: ${passwordValid ? '✅' : '❌'}`);
        }

        console.log('\n🎯 Debug Summary:');
        console.log('If all checks pass, the issue is likely:');
        console.log('1. CORS configuration');
        console.log('2. API URL mismatch');
        console.log('3. Backend not running');
        console.log('4. Network connectivity');

    } catch (error) {
        console.error('❌ Debug error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

debugLogin();
