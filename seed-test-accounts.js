#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function seedTestAccounts() {
    console.log('🌱 Seeding test accounts to Railway database...');

    try {
        // Test if database connection works
        await prisma.$connect();
        console.log('✅ Database connection successful');

        // Check if users already exist
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@swrfph.com' }
        });

        const existingProvider = await prisma.user.findUnique({
            where: { email: 'provider@swrfph.com' }
        });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists:', existingAdmin.email);
        } else {
            // Create admin user
            const adminPassword = await argon2.hash('admin123');
            const adminUser = await prisma.user.create({
                data: {
                    email: 'admin@swrfph.com',
                    name: 'Admin User',
                    password: adminPassword,
                    role: 'ADMIN',
                },
            });
            console.log('✅ Created admin user:', adminUser.email);
        }

        if (existingProvider) {
            console.log('⚠️  Provider user already exists:', existingProvider.email);
        } else {
            // Create provider user
            const providerPassword = await argon2.hash('provider123');
            const providerUser = await prisma.user.create({
                data: {
                    email: 'provider@swrfph.com',
                    name: 'Provider User',
                    password: providerPassword,
                    role: 'PROVIDER',
                },
            });
            console.log('✅ Created provider user:', providerUser.email);
        }

        // Create some test medicines
        const medicines = [
            {
                name: 'Paracetamol 500mg',
                description: 'For fever and pain relief.',
                quantity: 1000,
                price: 5.50,
                category: 'Pain Relief',
            },
            {
                name: 'Ibuprofen 200mg',
                description: 'Anti-inflammatory drug.',
                quantity: 500,
                price: 8.75,
                category: 'Pain Relief',
            },
            {
                name: 'Amoxicillin 250mg',
                description: 'Broad-spectrum antibiotic.',
                quantity: 300,
                price: 12.00,
                category: 'Antibiotics',
            },
        ];

        for (const medicine of medicines) {
            const existing = await prisma.medicine.findFirst({
                where: { name: medicine.name }
            });

            if (!existing) {
                await prisma.medicine.create({ data: medicine });
                console.log(`✅ Created medicine: ${medicine.name}`);
            } else {
                console.log(`⚠️  Medicine already exists: ${medicine.name}`);
            }
        }

        console.log('\n🎉 Test accounts seeded successfully!');
        console.log('\n📋 Test Credentials:');
        console.log('Admin: admin@swrfph.com / admin123');
        console.log('Provider: provider@swrfph.com / provider123');

    } catch (error) {
        console.error('❌ Error seeding database:', error.message);

        if (error.message.includes('the URL must start with the protocol')) {
            console.log('\n🔧 Fix: Update your .env file with the complete Railway DATABASE_URL');
            console.log('Format: DATABASE_URL="postgresql://username:password@host:port/database?schema=public"');
        }

        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seedTestAccounts();
