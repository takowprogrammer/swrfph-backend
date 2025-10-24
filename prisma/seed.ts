import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log(`Start seeding ...`);

    // --- Create Users ---
    const adminPassword = await argon2.hash('admin123');
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@swrfph.com',
            name: 'Admin User',
            password: adminPassword,
            role: UserRole.ADMIN,
        },
    });
    console.log(`Created admin user: ${adminUser.email}`);

    const providerPassword = await argon2.hash('provider123');
    const providerUser = await prisma.user.create({
        data: {
            email: 'provider@swrfph.com',
            name: 'Provider User',
            password: providerPassword,
            role: UserRole.PROVIDER,
        },
    });
    console.log(`Created provider user: ${providerUser.email}`);

    // --- Create Medicines ---
    const medicine1 = await prisma.medicine.create({
        data: {
            name: 'Paracetamol 500mg',
            description: 'For fever and pain relief.',
            quantity: 1000,
            price: 5.50,
            category: 'Pain Relief',
        },
    });

    const medicine2 = await prisma.medicine.create({
        data: {
            name: 'Ibuprofen 200mg',
            description: 'Anti-inflammatory drug.',
            quantity: 500,
            price: 8.75,
            category: 'Pain Relief',
        },
    });

    const medicine3 = await prisma.medicine.create({
        data: {
            name: 'Amoxicillin 250mg',
            description: 'Broad-spectrum antibiotic.',
            quantity: 300,
            price: 12.00,
            category: 'Antibiotics',
        },
    });

    const medicine4 = await prisma.medicine.create({
        data: {
            name: 'Vitamin C 1000mg',
            description: 'Immune system support.',
            quantity: 2000,
            price: 3.25,
            category: 'Vitamins',
        },
    });
    console.log(`Created 4 medicines.`);

    // --- Create an Order for the Provider ---
    const order1 = await prisma.order.create({
        data: {
            userId: providerUser.id,
            status: 'PENDING',
            totalPrice: 43.75,
            items: {
                create: [
                    {
                        medicineId: medicine1.id,
                        quantity: 5,
                        price: medicine1.price,
                    },
                    {
                        medicineId: medicine2.id,
                        quantity: 2,
                        price: medicine2.price,
                    },
                ],
            },
        },
    });
    console.log(`Created order ${order1.id} for provider.`);

    // --- Create Notifications ---
    await prisma.notification.create({
        data: {
            userId: providerUser.id,
            event: 'New Order Received',
            details: `Order #${order1.id.substring(0, 8)} has been placed.`,
            type: 'ORDER'
        }
    });
    await prisma.notification.create({
        data: {
            event: 'System Maintenance',
            details: 'A system-wide maintenance is scheduled for tonight at 11 PM.',
            type: 'SYSTEM'
        }
    });
    console.log(`Created 2 notifications.`);


    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
