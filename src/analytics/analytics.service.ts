import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export interface OrderTrendData {
    period: string;
    orders: number;
    revenue: number;
}

export interface TopOrderedMedicine {
    medicineId: string;
    medicineName: string;
    totalQuantity: number;
    totalOrders: number;
    averageQuantity: number;
    lastOrdered: Date;
}

export interface SpendingAnalysis {
    category: string;
    totalSpent: number;
    percentage: number;
    orderCount: number;
    averageOrderValue: number;
}

export interface OrderFrequencyMetrics {
    averageOrdersPerWeek: number;
    averageOrdersPerMonth: number;
    totalOrders: number;
    period: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercentage: number;
}

export interface MedicineAvailabilityAlert {
    medicineId: string;
    medicineName: string;
    previousStatus: 'out_of_stock' | 'low_stock' | 'in_stock';
    currentStatus: 'out_of_stock' | 'low_stock' | 'in_stock';
    availableQuantity: number;
    alertDate: Date;
}

export interface PriceChangeNotification {
    medicineId: string;
    medicineName: string;
    oldPrice: number;
    newPrice: number;
    changePercentage: number;
    changeDate: Date;
}

export interface NewMedicineAnnouncement {
    medicineId: string;
    medicineName: string;
    description: string;
    category: string;
    price: number;
    addedDate: Date;
}

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    // Admin analytics (aggregate across system)
    async getRevenueTrends(months: number = 6) {
        const end = new Date()
        const start = new Date()
        start.setMonth(end.getMonth() - months + 1)

        const results: Array<{ month: string; revenue: number }> = []
        const cursor = new Date(start)
        while (cursor <= end) {
            const year = cursor.getFullYear()
            const month = cursor.getMonth()
            const periodStart = new Date(year, month, 1)
            const periodEnd = new Date(year, month + 1, 1)

            const agg = await this.prisma.order.aggregate({
                _sum: { totalPrice: true },
                where: {
                    createdAt: { gte: periodStart, lt: periodEnd },
                },
            })
            results.push({
                month: periodStart.toISOString(),
                revenue: Number(agg._sum.totalPrice) || 0,
            })
            cursor.setMonth(month + 1)
        }
        return results
    }

    async getUserGrowth(months: number = 6) {
        const end = new Date()
        const start = new Date()
        start.setMonth(end.getMonth() - months + 1)

        const data: Array<{ month: string; newUsers: number; activeUsers: number; totalUsers: number }> = []
        const cursor = new Date(start)
        let cumulative = 0
        while (cursor <= end) {
            const year = cursor.getFullYear()
            const month = cursor.getMonth()
            const periodStart = new Date(year, month, 1)
            const periodEnd = new Date(year, month + 1, 1)

            const newUsers = await this.prisma.user.count({
                where: { createdAt: { gte: periodStart, lt: periodEnd } },
            })
            cumulative += newUsers
            // Active users approximation: users with orders in period
            const activeUsers = await this.prisma.order.groupBy({
                by: ['userId'],
                where: { createdAt: { gte: periodStart, lt: periodEnd } },
                _count: { userId: true },
            })
            data.push({
                month: periodStart.toISOString(),
                newUsers,
                activeUsers: activeUsers.length,
                totalUsers: cumulative,
            })
            cursor.setMonth(month + 1)
        }
        return data
    }

    async getMedicinePerformance(limit: number = 10) {
        const items = await this.prisma.orderItem.groupBy({
            by: ['medicineId'],
            _sum: { quantity: true, price: true },
            _count: { medicineId: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: limit,
        })
        const medicineIds = items.map(i => i.medicineId)
        const medicines = await this.prisma.medicine.findMany({ where: { id: { in: medicineIds } } })
        const idToMed = new Map(medicines.map(m => [m.id, m]))
        return items.map(i => ({
            medicineId: i.medicineId,
            name: idToMed.get(i.medicineId)?.name || 'Unknown',
            category: idToMed.get(i.medicineId)?.category || 'Uncategorized',
            sales: i._sum.quantity || 0,
            revenue: (i._sum.quantity || 0) * (idToMed.get(i.medicineId)?.price || 0),
            profit: 0, // if margin not tracked
            margin: 0,
            stock: idToMed.get(i.medicineId)?.quantity || 0,
            turnover: 0,
        }))
    }

    async getProviderPerformance(limit: number = 10) {
        const providers = await this.prisma.user.findMany({
            where: { role: 'PROVIDER' as unknown as UserRole },
            take: limit,
        })
        const providerIds = providers.map(p => p.id)
        const ordersByProvider = await this.prisma.order.groupBy({
            by: ['userId'],
            where: { userId: { in: providerIds } },
            _sum: { totalPrice: true },
            _count: { userId: true },
        })
        const idToAgg = new Map(ordersByProvider.map(o => [o.userId, o]))
        return providers.map(p => ({
            providerId: p.id,
            name: p.name || p.email,
            orders: idToAgg.get(p.id)?._count.userId || 0,
            revenue: Number(idToAgg.get(p.id)?._sum.totalPrice) || 0,
            rating: 0,
            completionRate: 0,
            avgResponseTime: 0,
        }))
    }

    async getGeographicDistribution() {
        // If user addresses have region info; fallback to counts per domain as pseudo-regions
        const users = await this.prisma.user.findMany({ select: { email: true } })
        const regions = new Map<string, number>()
        users.forEach(u => {
            const domain = u.email.split('@')[1] || 'unknown'
            regions.set(domain, (regions.get(domain) || 0) + 1)
        })
        return Array.from(regions.entries()).map(([region, users]) => ({ region, users, orders: 0, revenue: 0 }))
    }

    async getSeasonalPatterns(year: number) {
        const start = new Date(year, 0, 1)
        const end = new Date(year + 1, 0, 1)
        const results: Array<{ month: string; orders: number; revenue: number; category: string }> = []
        for (let m = 0; m < 12; m++) {
            const ms = new Date(year, m, 1)
            const me = new Date(year, m + 1, 1)
            if (ms >= end) break
            const orders = await this.prisma.order.findMany({ where: { createdAt: { gte: ms, lt: me } } })
            const revenue = orders.reduce((s, o) => s + o.totalPrice, 0)
            results.push({ month: ms.toLocaleString('en-US', { month: 'short' }), orders: orders.length, revenue, category: 'General' })
        }
        return results
    }

    async getSystemHealth() {
        // Basic health info – in real system gather metrics from infra/monitoring
        return {
            overall: 'healthy',
            uptime: 99.9,
            lastCheck: new Date().toISOString(),
            metrics: {
                cpu: { name: 'CPU Usage', value: 30, status: 'healthy', threshold: { warning: 70, critical: 90 }, unit: '%', trend: 'stable', lastUpdated: new Date().toISOString() },
                memory: { name: 'Memory Usage', value: 55, status: 'healthy', threshold: { warning: 80, critical: 95 }, unit: '%', trend: 'up', lastUpdated: new Date().toISOString() },
                disk: { name: 'Disk Usage', value: 65, status: 'warning', threshold: { warning: 75, critical: 90 }, unit: '%', trend: 'up', lastUpdated: new Date().toISOString() },
                database: { name: 'Database Connections', value: 12, status: 'healthy', threshold: { warning: 50, critical: 80 }, unit: 'connections', trend: 'stable', lastUpdated: new Date().toISOString() },
                api: { name: 'API Response Time', value: 120, status: 'healthy', threshold: { warning: 500, critical: 1000 }, unit: 'ms', trend: 'down', lastUpdated: new Date().toISOString() },
                network: { name: 'Network Latency', value: 25, status: 'healthy', threshold: { warning: 100, critical: 200 }, unit: 'ms', trend: 'stable', lastUpdated: new Date().toISOString() },
            },
            alerts: [],
            performance: Array.from({ length: 24 }, (_, i) => ({
                timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
                responseTime: Math.floor(Math.random() * 200) + 50,
                requests: Math.floor(Math.random() * 1000) + 500,
                errors: Math.floor(Math.random() * 10),
            })),
        }
    }

    async globalSearch(query: string, type?: string, limit: number = 10) {
        if (!query) return []
        const results: Array<{ id: string; type: string; title: string; description: string; metadata: any; relevance: number; url: string }> = []

        if (!type || type === 'order') {
            const orders = await this.prisma.order.findMany({
                where: { id: { contains: query } },
                take: limit,
            })
            orders.forEach(o => results.push({
                id: o.id,
                type: 'order',
                title: `Order #${o.id.substring(0, 8)}...`,
                description: 'Customer order',
                metadata: { status: o.status, date: o.createdAt.toISOString(), amount: o.totalPrice },
                relevance: 0.9,
                url: `/orders?orderId=${o.id}`,
            }))
        }
        if (!type || type === 'user') {
            const users = await this.prisma.user.findMany({ where: { OR: [{ email: { contains: query } }, { name: { contains: query } }] }, take: limit })
            users.forEach(u => results.push({
                id: u.id,
                type: 'user',
                title: u.name || u.email,
                description: 'User account',
                metadata: { status: u.role, date: u.createdAt?.toISOString?.() },
                relevance: 0.8,
                url: `/users?userId=${u.id}`,
            }))
        }
        if (!type || type === 'medicine') {
            const meds = await this.prisma.medicine.findMany({ where: { name: { contains: query } }, take: limit })
            meds.forEach(m => results.push({
                id: m.id,
                type: 'medicine',
                title: m.name,
                description: m.description || 'Medicine',
                metadata: { category: m.category, status: m.quantity > 0 ? 'active' : 'inactive', amount: m.price },
                relevance: 0.7,
                url: `/inventory?medicineId=${m.id}`,
            }))
        }
        return results.slice(0, limit)
    }

    /**
     * Get order trends data for a specific user
     */
    async getOrderTrends(
        userId: string,
        period: 'week' | 'month' = 'month',
        months: number = 6
    ): Promise<OrderTrendData[]> {
        const endDate = new Date();
        const startDate = new Date();

        if (period === 'week') {
            startDate.setDate(endDate.getDate() - (months * 7));
        } else {
            startDate.setMonth(endDate.getMonth() - months);
        }

        const orders = await this.prisma.order.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                items: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });

        const trendData: OrderTrendData[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const periodStart = new Date(currentDate);
            const periodEnd = new Date(currentDate);

            if (period === 'week') {
                periodEnd.setDate(periodStart.getDate() + 6);
            } else {
                periodEnd.setMonth(periodStart.getMonth() + 1);
            }

            const periodOrders = orders.filter(order =>
                order.createdAt >= periodStart && order.createdAt < periodEnd
            );

            const periodRevenue = periodOrders.reduce((sum, order) =>
                sum + order.totalPrice, 0
            );

            const periodLabel = period === 'week'
                ? `Week ${Math.ceil((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))}`
                : currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            trendData.push({
                period: periodLabel,
                orders: periodOrders.length,
                revenue: periodRevenue,
            });

            if (period === 'week') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else {
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }

        return trendData;
    }

    /**
     * Get top ordered medicines for a specific user
     */
    async getTopOrderedMedicines(
        userId: string,
        limit: number = 10,
        months: number = 6
    ): Promise<TopOrderedMedicine[]> {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - months);

        const orderItems = await this.prisma.orderItem.findMany({
            where: {
                order: {
                    userId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            },
            include: {
                medicine: true,
                order: true,
            },
        });

        const medicineStats = new Map<string, {
            medicineId: string;
            medicineName: string;
            totalQuantity: number;
            totalOrders: number;
            orderDates: Date[];
        }>();

        orderItems.forEach(item => {
            const key = item.medicineId;
            if (!medicineStats.has(key)) {
                medicineStats.set(key, {
                    medicineId: item.medicineId,
                    medicineName: item.medicine.name,
                    totalQuantity: 0,
                    totalOrders: 0,
                    orderDates: [],
                });
            }

            const stats = medicineStats.get(key)!;
            stats.totalQuantity += item.quantity;
            stats.totalOrders += 1;
            stats.orderDates.push(item.order.createdAt);
        });

        return Array.from(medicineStats.values())
            .map(stats => ({
                medicineId: stats.medicineId,
                medicineName: stats.medicineName,
                totalQuantity: stats.totalQuantity,
                totalOrders: stats.totalOrders,
                averageQuantity: stats.totalQuantity / stats.totalOrders,
                lastOrdered: new Date(Math.max(...stats.orderDates.map(d => d.getTime()))),
            }))
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, limit);
    }

    /**
     * Get spending analysis by medicine categories
     */
    async getSpendingAnalysis(
        userId: string,
        months: number = 6
    ): Promise<SpendingAnalysis[]> {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - months);

        const orderItems = await this.prisma.orderItem.findMany({
            where: {
                order: {
                    userId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            },
            include: {
                medicine: true,
                order: true,
            },
        });

        const categoryStats = new Map<string, {
            totalSpent: number;
            orderCount: number;
        }>();

        let totalSpent = 0;

        orderItems.forEach(item => {
            const category = item.medicine.category || 'Uncategorized';
            const itemTotal = item.quantity * item.price;

            if (!categoryStats.has(category)) {
                categoryStats.set(category, {
                    totalSpent: 0,
                    orderCount: 0,
                });
            }

            const stats = categoryStats.get(category)!;
            stats.totalSpent += itemTotal;
            stats.orderCount += 1;
            totalSpent += itemTotal;
        });

        return Array.from(categoryStats.entries())
            .map(([category, stats]) => ({
                category,
                totalSpent: stats.totalSpent,
                percentage: totalSpent > 0 ? (stats.totalSpent / totalSpent) * 100 : 0,
                orderCount: stats.orderCount,
                averageOrderValue: stats.orderCount > 0 ? stats.totalSpent / stats.orderCount : 0,
            }))
            .sort((a, b) => b.totalSpent - a.totalSpent);
    }

    /**
     * Get order frequency metrics for a specific user
     */
    async getOrderFrequencyMetrics(userId: string): Promise<OrderFrequencyMetrics> {
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);

        const orders = await this.prisma.order.findMany({
            where: {
                userId,
                createdAt: {
                    gte: sixMonthsAgo,
                    lte: now,
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        const totalOrders = orders.length;
        const weeksInPeriod = Math.ceil((now.getTime() - sixMonthsAgo.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const monthsInPeriod = 6;

        const averageOrdersPerWeek = weeksInPeriod > 0 ? totalOrders / weeksInPeriod : 0;
        const averageOrdersPerMonth = monthsInPeriod > 0 ? totalOrders / monthsInPeriod : 0;

        // Calculate trend by comparing first half vs second half
        const midPoint = Math.floor(orders.length / 2);
        const firstHalfOrders = orders.slice(0, midPoint).length;
        const secondHalfOrders = orders.slice(midPoint).length;

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        let changePercentage = 0;

        if (firstHalfOrders > 0) {
            changePercentage = ((secondHalfOrders - firstHalfOrders) / firstHalfOrders) * 100;

            if (changePercentage > 10) {
                trend = 'increasing';
            } else if (changePercentage < -10) {
                trend = 'decreasing';
            }
        }

        return {
            averageOrdersPerWeek,
            averageOrdersPerMonth,
            totalOrders,
            period: '6 months',
            trend,
            changePercentage: Math.abs(changePercentage),
        };
    }

    /**
     * Get medicine availability alerts
     */
    async getMedicineAvailabilityAlerts(userId: string): Promise<MedicineAvailabilityAlert[]> {
        // This would typically be implemented with a background job that tracks medicine availability
        // For now, we'll return a placeholder implementation
        const userOrders = await this.prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        medicine: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const recentlyOrderedMedicines = new Set(
            userOrders.flatMap(order =>
                order.items.map(item => item.medicineId)
            )
        );

        const medicines = await this.prisma.medicine.findMany({
            where: {
                id: { in: Array.from(recentlyOrderedMedicines) },
            },
        });

        return medicines
            .filter(medicine => medicine.quantity > 0)
            .map(medicine => ({
                medicineId: medicine.id,
                medicineName: medicine.name,
                previousStatus: 'out_of_stock' as const,
                currentStatus: 'in_stock' as const,
                availableQuantity: medicine.quantity,
                alertDate: new Date(),
            }));
    }

    /**
     * Get price change notifications
     */
    async getPriceChangeNotifications(userId: string): Promise<PriceChangeNotification[]> {
        // This would typically be implemented with a price tracking system
        // For now, we'll return a placeholder implementation
        return [];
    }

    /**
     * Get new medicine announcements
     */
    async getNewMedicineAnnouncements(limit: number = 5): Promise<NewMedicineAnnouncement[]> {
        const medicines = await this.prisma.medicine.findMany({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });

        return medicines.map(medicine => ({
            medicineId: medicine.id,
            medicineName: medicine.name,
            description: medicine.description || '',
            category: medicine.category || 'Uncategorized',
            price: medicine.price,
            addedDate: medicine.createdAt,
        }));
    }
}

