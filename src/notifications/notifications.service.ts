import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async create(createNotificationDto: CreateNotificationDto) {
        return this.prisma.notification.create({
            data: createNotificationDto,
        });
    }

    async findAll(query: QueryNotificationsDto, userId?: string) {
        const { search, type, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where = {
            ...(search && {
                OR: [
                    { event: { contains: search } },
                    { details: { contains: search } },
                ],
            }),
            ...(type && { type }),
            // Filter by user or show system-wide notifications
            ...(userId ? {
                OR: [
                    { userId: userId },
                    { userId: null } // System-wide notifications
                ]
            } : {}),
        };

        const orderBy = {
            [sortBy]: sortOrder,
        };

        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy,
                skip,
                take,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true
                        }
                    }
                }
            }),
            this.prisma.notification.count({ where }),
        ]);

        return {
            data: notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        return this.prisma.notification.findUnique({ where: { id } });
    }

    async markAsRead(id: string, userId?: string) {
        if (userId) {
            // Scope by user; use updateMany to avoid unique constraint issues
            const result = await this.prisma.notification.updateMany({
                where: { id, userId },
                data: { isRead: true },
            });
            return { count: result.count };
        }
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId?: string) {
        const where = userId ? { userId } : {};

        return this.prisma.notification.updateMany({
            where,
            data: { isRead: true },
        });
    }

    async remove(id: string) {
        return this.prisma.notification.delete({ where: { id } });
    }

    async removeOwn(id: string, userId: string) {
        // Ensure provider can only delete their own notification
        const result = await this.prisma.notification.deleteMany({ where: { id, userId } });
        return { count: result.count };
    }

    async getNotificationStats(userId?: string) {
        const where = userId ? {
            OR: [
                { userId: userId },
                { userId: null } // System-wide notifications
            ]
        } : {};

        const [total, unread, byType] = await Promise.all([
            this.prisma.notification.count({ where }),
            this.prisma.notification.count({ where: { ...where, isRead: false } }),
            this.prisma.notification.groupBy({
                by: ['type'],
                where,
                _count: { type: true },
            }),
        ]);

        return {
            total,
            unread,
            byType: byType.map(item => ({
                type: item.type,
                count: item._count.type,
            })),
        };
    }

    // Helper method to create system notifications
    async createSystemNotification(event: string, details: string, type: string = 'SYSTEM') {
        return this.create({
            event,
            details,
            type,
            isRead: false,
        });
    }

    // Admin-specific methods
    async getNotifications(query: {
        page: number;
        limit: number;
        type?: string;
        isRead?: boolean;
        search?: string;
    }) {
        const { page, limit, type, isRead, search } = query;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { event: { contains: search } },
                { details: { contains: search } },
            ];
        }

        if (type) {
            where.type = type;
        }

        if (isRead !== undefined) {
            where.isRead = isRead;
        }

        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true
                        }
                    }
                }
            }),
            this.prisma.notification.count({ where }),
        ]);

        // Get stats
        const stats = await this.getNotificationStats();

        return {
            data: notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            stats
        };
    }

    async createNotification(data: {
        event: string;
        details: string;
        type: string;
    }) {
        return this.prisma.notification.create({
            data: {
                event: data.event,
                details: data.details,
                type: data.type,
                isRead: false,
            },
        });
    }

    async markNotificationAsRead(id: string) {
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    async markAllNotificationsAsRead() {
        return this.prisma.notification.updateMany({
            data: { isRead: true },
        });
    }

    async deleteNotification(id: string) {
        return this.prisma.notification.delete({
            where: { id },
        });
    }
}
