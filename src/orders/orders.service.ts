import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from '@prisma/client';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    async create(createOrderDto: CreateOrderDto): Promise<Order> {
        const { userId, items } = createOrderDto;

        // Use transaction to ensure atomicity
        return this.prisma.$transaction(async (tx) => {
            const medicineIds = items.map(item => item.medicineId);
            const medicines = await tx.medicine.findMany({
                where: { id: { in: medicineIds } },
            });

            if (medicines.length !== medicineIds.length) {
                const foundIds = medicines.map(m => m.id);
                const notFoundIds = medicineIds.filter(id => !foundIds.includes(id));
                throw new NotFoundException(`Medicines with IDs ${notFoundIds.join(', ')} not found.`);
            }

            const medicineMap = new Map(medicines.map(m => [m.id, m]));
            let totalPrice = 0;
            const orderItemsData = [];

            // Validate stock and calculate total
            for (const item of items) {
                const medicine = medicineMap.get(item.medicineId)!;

                if (medicine.quantity < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for ${medicine.name}. Available: ${medicine.quantity}, Requested: ${item.quantity}`
                    );
                }

                const itemPrice = medicine.price * item.quantity;
                totalPrice += itemPrice;

                orderItemsData.push({
                    medicineId: item.medicineId,
                    quantity: item.quantity,
                    price: medicine.price,
                });
            }

            // Create order
            const order = await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    status: 'PENDING',
                    items: {
                        create: orderItemsData,
                    },
                },
                include: {
                    items: true,
                },
            });

            // Decrement stock for each medicine
            for (const item of items) {
                await tx.medicine.update({
                    where: { id: item.medicineId },
                    data: { quantity: { decrement: item.quantity } },
                });
            }

            return order;
        });
    }

    async findAllForUser(userId: string): Promise<Order[]> {
        return this.prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        medicine: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async updateStatus(orderId: string, status: string): Promise<Order> {
        return this.prisma.order.update({
            where: { id: orderId },
            data: { status },
        });
    }

    async findAll(query: { page?: number; limit?: number; status?: string; userId?: string }) {
        const { page = 1, limit = 10, status, userId } = query;
        const skip = (page - 1) * limit;

        const where = {
            ...(userId && { userId }),
            ...(status && { status }),
        };

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: { name: true, email: true },
                    },
                    items: {
                        include: {
                            medicine: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            data: orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async findPastOrders(query: { page?: number; limit?: number; userId?: string }) {
        const { page = 1, limit = 10, userId } = query;
        const skip = (page - 1) * limit;

        const where = {
            ...(userId && { userId }),
            status: {
                in: ['DELIVERED', 'CANCELLED']
            },
        };

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: { name: true, email: true },
                    },
                    items: {
                        include: {
                            medicine: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            data: orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async getOrderStats(userId?: string) {
        const where = userId ? { userId } : {};

        const [
            totalOrders,
            pendingOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            totalRevenue,
        ] = await Promise.all([
            this.prisma.order.count({ where }),
            this.prisma.order.count({ where: { ...where, status: 'PENDING' } }),
            this.prisma.order.count({ where: { ...where, status: 'PROCESSING' } }),
            this.prisma.order.count({ where: { ...where, status: 'SHIPPED' } }),
            this.prisma.order.count({ where: { ...where, status: 'DELIVERED' } }),
            this.prisma.order.count({ where: { ...where, status: 'CANCELLED' } }),
            this.prisma.order.aggregate({
                where: { ...where, status: 'DELIVERED' },
                _sum: { totalPrice: true },
            }),
        ]);

        return {
            totalOrders,
            pendingOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            totalRevenue: totalRevenue._sum.totalPrice || 0,
        };
    }
}
