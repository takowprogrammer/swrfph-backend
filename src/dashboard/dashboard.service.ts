import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getProviderStats(userId: string) {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const [
            // Current month stats
            currentMonthStats,
            // Last month stats for comparison
            lastMonthStats,
            // Recent orders - SIMPLIFIED: removed nested includes
            recentOrders,
            // Low stock medicines
            lowStockMedicines,
        ] = await Promise.all([
            // Current month statistics
            this.getMonthlyStats(userId, currentMonth, now),
            // Last month statistics
            this.getMonthlyStats(userId, lastMonth, lastMonthEnd),
            // Recent orders (last 5) - WITH items for frontend
            this.prisma.order.findMany({
                where: { userId },
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    totalPrice: true,
                    createdAt: true,
                    updatedAt: true,
                    items: {
                        select: {
                            id: true,
                            quantity: true,
                            price: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            // Low stock medicines with detailed info
            this.getLowStockMedicines(),
        ]);

        // Calculate percentage changes
        const pendingOrdersChange = this.calculatePercentageChange(
            lastMonthStats.pendingOrders,
            currentMonthStats.pendingOrders
        );
        const completedOrdersChange = this.calculatePercentageChange(
            lastMonthStats.completedOrders,
            currentMonthStats.completedOrders
        );
        const totalSpentChange = this.calculatePercentageChange(
            lastMonthStats.totalSpent,
            currentMonthStats.totalSpent
        );

        // Monthly spending trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Get monthly spending data for the last 6 months
        const monthlySpending = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthData = await this.prisma.order.aggregate({
                where: {
                    userId,
                    createdAt: { gte: monthStart, lte: monthEnd },
                    status: 'DELIVERED',
                },
                _sum: { totalPrice: true },
            });

            monthlySpending.push({
                month: monthStart.toISOString().substring(0, 7),
                amount: monthData._sum.totalPrice || 0,
            });
        }

        return {
            overview: {
                totalOrders: currentMonthStats.totalOrders,
                pendingOrders: currentMonthStats.pendingOrders,
                completedOrders: currentMonthStats.completedOrders,
                totalSpent: currentMonthStats.totalSpent,
                // Add percentage changes
                pendingOrdersChange,
                completedOrdersChange,
                totalSpentChange,
            },
            recentOrders,
            lowStockMedicines,
            monthlySpending,
        };
    }

    async getAdminStats() {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const [
            // Current month stats
            currentMonthStats,
            // Last month stats for comparison
            lastMonthStats,
            // Recent orders
            recentOrders,
            // Low stock medicines
            lowStockMedicines,
            // Top selling medicines
            topMedicines,
        ] = await Promise.all([
            // Current month statistics
            this.getAdminMonthlyStats(currentMonth, now),
            // Last month statistics
            this.getAdminMonthlyStats(lastMonth, lastMonthEnd),
            // Recent orders (last 10) - WITH items for frontend
            this.prisma.order.findMany({
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    totalPrice: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: { name: true, email: true },
                    },
                    items: {
                        select: {
                            id: true,
                            quantity: true,
                            price: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            // Low stock medicines with detailed info
            this.getLowStockMedicines(),
            // Top selling medicines
            this.prisma.orderItem.groupBy({
                by: ['medicineId'],
                _sum: { quantity: true },
                _count: { medicineId: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5,
            }),
        ]);

        // Calculate percentage changes
        const totalOrdersChange = this.calculatePercentageChange(
            lastMonthStats.totalOrders,
            currentMonthStats.totalOrders
        );
        const totalRevenueChange = this.calculatePercentageChange(
            lastMonthStats.totalRevenue,
            currentMonthStats.totalRevenue
        );
        const totalUsersChange = this.calculatePercentageChange(
            lastMonthStats.totalUsers,
            currentMonthStats.totalUsers
        );

        // Get medicine details for top selling
        const topMedicineIds = topMedicines.map(item => item.medicineId);
        const topMedicineDetails = await this.prisma.medicine.findMany({
            where: { id: { in: topMedicineIds } },
            select: {
                id: true,
                name: true,
                category: true,
            },
        });

        const topMedicinesWithDetails = topMedicines.map(item => {
            const medicine = topMedicineDetails.find(m => m.id === item.medicineId);
            return {
                ...item,
                medicine: medicine,
            };
        });

        // Monthly revenue trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRevenue = await this.prisma.order.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: sixMonthsAgo },
                status: 'DELIVERED',
            },
            _sum: { totalPrice: true },
            orderBy: { createdAt: 'asc' },
        });

        return {
            overview: {
                totalUsers: currentMonthStats.totalUsers,
                totalProviders: currentMonthStats.totalProviders,
                totalAdmins: currentMonthStats.totalAdmins,
                totalMedicines: currentMonthStats.totalMedicines,
                totalOrders: currentMonthStats.totalOrders,
                totalRevenue: currentMonthStats.totalRevenue,
                // Add percentage changes
                totalOrdersChange,
                totalRevenueChange,
                totalUsersChange,
            },
            recentOrders,
            lowStockMedicines,
            topMedicines: topMedicinesWithDetails,
            monthlyRevenue: monthlyRevenue.map(item => ({
                month: item.createdAt.toISOString().substring(0, 7),
                revenue: item._sum.totalPrice || 0,
            })),
        };
    }

    // Helper method to get monthly statistics for a provider
    private async getMonthlyStats(userId: string, startDate: Date, endDate: Date) {
        const [totalOrders, pendingOrders, completedOrders, totalSpent] = await Promise.all([
            this.prisma.order.count({
                where: {
                    userId,
                    createdAt: { gte: startDate, lte: endDate }
                },
            }),
            this.prisma.order.count({
                where: {
                    userId,
                    status: 'PENDING',
                    createdAt: { gte: startDate, lte: endDate }
                },
            }),
            this.prisma.order.count({
                where: {
                    userId,
                    status: 'DELIVERED',
                    createdAt: { gte: startDate, lte: endDate }
                },
            }),
            this.prisma.order.aggregate({
                where: {
                    userId,
                    createdAt: { gte: startDate, lte: endDate }
                },
                _sum: { totalPrice: true },
            }),
        ]);

        return {
            totalOrders,
            pendingOrders,
            completedOrders,
            totalSpent: totalSpent._sum.totalPrice || 0,
        };
    }

    // Helper method to get monthly statistics for admin
    private async getAdminMonthlyStats(startDate: Date, endDate: Date) {
        const [
            totalUsers,
            totalProviders,
            totalAdmins,
            totalMedicines,
            totalOrders,
            totalRevenue,
        ] = await Promise.all([
            this.prisma.user.count({
                where: { createdAt: { lte: endDate } }
            }),
            this.prisma.user.count({
                where: {
                    role: 'PROVIDER',
                    createdAt: { lte: endDate }
                },
            }),
            this.prisma.user.count({
                where: {
                    role: 'ADMIN',
                    createdAt: { lte: endDate }
                },
            }),
            this.prisma.medicine.count({
                where: { createdAt: { lte: endDate } }
            }),
            this.prisma.order.count({
                where: { createdAt: { gte: startDate, lte: endDate } }
            }),
            this.prisma.order.aggregate({
                where: {
                    status: 'DELIVERED',
                    createdAt: { gte: startDate, lte: endDate }
                },
                _sum: { totalPrice: true },
            }),
        ]);

        return {
            totalUsers,
            totalProviders,
            totalAdmins,
            totalMedicines,
            totalOrders,
            totalRevenue: totalRevenue._sum.totalPrice || 0,
        };
    }

    // Helper method to calculate percentage change
    private calculatePercentageChange(oldValue: number, newValue: number): number {
        if (oldValue === 0) {
            return newValue > 0 ? 100 : 0;
        }
        return Math.round(((newValue - oldValue) / oldValue) * 100);
    }

    // Enhanced low stock medicines with detailed information
    async getLowStockMedicines() {
        const lowStockMedicines = await this.prisma.medicine.findMany({
            where: { quantity: { lt: 50 } },
            select: {
                id: true,
                name: true,
                quantity: true,
                category: true,
                price: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { quantity: 'asc' },
        });

        // Categorize by stock level
        const critical = lowStockMedicines.filter(med => med.quantity < 10);
        const low = lowStockMedicines.filter(med => med.quantity >= 10 && med.quantity < 25);
        const warning = lowStockMedicines.filter(med => med.quantity >= 25 && med.quantity < 50);

        return {
            critical,
            low,
            warning,
            total: lowStockMedicines.length,
            summary: {
                critical: critical.length,
                low: low.length,
                warning: warning.length,
            }
        };
    }

    // Get detailed stock information for a specific medicine
    async getStockDetails(medicineId: string) {
        const medicine = await this.prisma.medicine.findUnique({
            where: { id: medicineId },
            include: {
                orderItems: {
                    include: {
                        order: {
                            select: {
                                id: true,
                                status: true,
                                createdAt: true,
                            }
                        }
                    },
                    orderBy: { order: { createdAt: 'desc' } },
                    take: 10,
                }
            }
        });

        if (!medicine) {
            throw new Error('Medicine not found');
        }

        // Calculate stock movement trends
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentOrders = await this.prisma.orderItem.findMany({
            where: {
                medicineId,
                order: {
                    createdAt: { gte: thirtyDaysAgo }
                }
            },
            include: {
                order: {
                    select: {
                        status: true,
                        createdAt: true,
                    }
                }
            },
            orderBy: { order: { createdAt: 'desc' } }
        });

        const totalOrdered = recentOrders.reduce((sum, item) => sum + item.quantity, 0);
        const averageDailyUsage = totalOrdered / 30;

        return {
            medicine,
            stockLevel: this.getStockLevel(medicine.quantity),
            averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
            daysRemaining: averageDailyUsage > 0 ? Math.floor(medicine.quantity / averageDailyUsage) : null,
            recentActivity: recentOrders.slice(0, 10),
            recommendations: this.getStockRecommendations(medicine.quantity, averageDailyUsage),
        };
    }

    private getStockLevel(quantity: number): 'critical' | 'low' | 'warning' | 'good' {
        if (quantity < 10) return 'critical';
        if (quantity < 25) return 'low';
        if (quantity < 50) return 'warning';
        return 'good';
    }

    private getStockRecommendations(quantity: number, averageDailyUsage: number): string[] {
        const recommendations = [];

        if (quantity < 10) {
            recommendations.push('URGENT: Restock immediately - critical stock level');
        } else if (quantity < 25) {
            recommendations.push('Order within 1-2 days to avoid stockout');
        } else if (quantity < 50) {
            recommendations.push('Consider placing an order soon');
        }

        if (averageDailyUsage > 0) {
            const daysRemaining = Math.floor(quantity / averageDailyUsage);
            if (daysRemaining < 7) {
                recommendations.push(`Only ${daysRemaining} days of stock remaining at current usage rate`);
            }
        }

        if (recommendations.length === 0) {
            recommendations.push('Stock levels are adequate');
        }

        return recommendations;
    }
}
