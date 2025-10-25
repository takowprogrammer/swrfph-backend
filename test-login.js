#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function testLogin() {
    console.log('🔐 Testing login functionality...');

    try {
        await prisma.$connect();
        console.log('✅ Database connection successful');

        // Test admin login
        console.log('\n🧪 Testing admin login...');
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@swrfph.com' }
        });

        if (admin) {
            console.log('✅ Admin user found:', admin.email);
            console.log('📧 Email:', admin.email);
            console.log('👤 Name:', admin.name);
            console.log('🔑 Role:', admin.role);
            console.log('🆔 ID:', admin.id);

            // Test password verification
            const isPasswordValid = await argon2.verify(admin.password, 'admin123');
            console.log('🔐 Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

            if (!isPasswordValid) {
                console.log('⚠️  Password verification failed - this might be the issue!');
                console.log('🔧 Re-hashing password...');
                const newPassword = await argon2.hash('admin123');
                await prisma.user.update({
                    where: { id: admin.id },
                    data: { password: newPassword }
                });
                console.log('✅ Password re-hashed successfully');
            }
        } else {
            console.log('❌ Admin user not found');
        }

        // Test provider login
        console.log('\n🧪 Testing provider login...');
        const provider = await prisma.user.findUnique({
            where: { email: 'provider@swrfph.com' }
        });

        if (provider) {
            console.log('✅ Provider user found:', provider.email);
            console.log('📧 Email:', provider.email);
            console.log('👤 Name:', provider.name);
            console.log('🔑 Role:', provider.role);
            console.log('🆔 ID:', provider.id);

            // Test password verification
            const isPasswordValid = await argon2.verify(provider.password, 'provider123');
            console.log('🔐 Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

            if (!isPasswordValid) {
                console.log('⚠️  Password verification failed - this might be the issue!');
                console.log('🔧 Re-hashing password...');
                const newPassword = await argon2.hash('provider123');
                await prisma.user.update({
                    where: { id: provider.id },
                    data: { password: newPassword }
                });
                console.log('✅ Password re-hashed successfully');
            }
        } else {
            console.log('❌ Provider user not found');
        }

        console.log('\n🎯 Test Summary:');
        console.log('If password verification failed, the passwords have been re-hashed.');
        console.log('Try logging in again with the admin dashboard.');

    } catch (error) {
        console.error('❌ Error testing login:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
