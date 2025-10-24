import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus, ReportFormat } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

export interface ReportConfig {
    dataSource: string; // e.g., 'orders', 'users', 'medicines', 'analytics'
    filters: {
        dateRange?: { start: string; end: string };
        status?: string[];
        category?: string[];
        userId?: string;
        [key: string]: any;
    };
    fields: string[];
    groupBy?: string[];
    aggregations?: {
        field: string;
        operation: 'sum' | 'count' | 'avg' | 'min' | 'max';
    }[];
    charts?: {
        type: 'bar' | 'line' | 'pie' | 'table';
        title: string;
        data: any;
    }[];
    sorting?: {
        field: string;
        direction: 'asc' | 'desc';
    }[];
}

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);
    private readonly reportsDir = path.join(process.cwd(), 'reports');

    constructor(private prisma: PrismaService) {
        // Ensure reports directory exists
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    // Report Templates
    async createTemplate(data: {
        name: string;
        description?: string;
        category: string;
        isPublic?: boolean;
        createdBy: string;
        config: ReportConfig;
    }) {
        return this.prisma.reportTemplate.create({
            data: {
                name: data.name,
                description: data.description,
                category: data.category,
                isPublic: data.isPublic || false,
                createdBy: data.createdBy,
                config: data.config as any,
            },
        });
    }

    async getTemplates(userId?: string, category?: string) {
        const where: any = {};
        if (userId) {
            where.OR = [
                { createdBy: userId },
                { isPublic: true },
            ];
        } else {
            where.isPublic = true;
        }
        if (category) {
            where.category = category;
        }

        return this.prisma.reportTemplate.findMany({
            where,
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getTemplate(id: string) {
        return this.prisma.reportTemplate.findUnique({
            where: { id },
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }

    async updateTemplate(id: string, data: Partial<ReportConfig>, userId: string) {
        const template = await this.prisma.reportTemplate.findUnique({
            where: { id },
        });

        if (!template || template.createdBy !== userId) {
            throw new Error('Template not found or access denied');
        }

        return this.prisma.reportTemplate.update({
            where: { id },
            data: {
                ...data,
                config: data as any,
            },
        });
    }

    async deleteTemplate(id: string, userId: string) {
        const template = await this.prisma.reportTemplate.findUnique({
            where: { id },
        });

        if (!template || template.createdBy !== userId) {
            throw new Error('Template not found or access denied');
        }

        return this.prisma.reportTemplate.delete({
            where: { id },
        });
    }

    // Reports
    async createReport(data: {
        name: string;
        description?: string;
        templateId?: string;
        createdBy: string;
        config: ReportConfig;
        format: ReportFormat;
        scheduledAt?: Date;
    }) {
        return this.prisma.report.create({
            data: {
                name: data.name,
                description: data.description,
                templateId: data.templateId,
                createdBy: data.createdBy,
                config: data.config as any,
                format: data.format,
                scheduledAt: data.scheduledAt,
            },
        });
    }

    async getReports(userId?: string, status?: ReportStatus) {
        const where: any = {};
        if (userId) {
            where.createdBy = userId;
        }
        if (status) {
            where.status = status;
        }

        return this.prisma.report.findMany({
            where,
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
                template: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getReport(id: string) {
        return this.prisma.report.findUnique({
            where: { id },
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
                template: {
                    select: { id: true, name: true },
                },
                executions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
    }

    async executeReport(reportId: string) {
        const report = await this.prisma.report.findUnique({
            where: { id: reportId },
        });

        if (!report) {
            throw new Error('Report not found');
        }

        // Create execution record
        const execution = await this.prisma.reportExecution.create({
            data: {
                reportId,
                status: 'PROCESSING',
            },
        });

        try {
            // Update report status
            await this.prisma.report.update({
                where: { id: reportId },
                data: { status: 'PROCESSING' },
            });

            // Generate report data
            const data = await this.generateReportData(report.config as any);

            // Generate file based on format
            const filePath = await this.generateFile(report.format, data, report.name);
            const stats = fs.statSync(filePath);

            // Update execution and report
            await Promise.all([
                this.prisma.reportExecution.update({
                    where: { id: execution.id },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                        filePath,
                        fileSize: stats.size,
                    },
                }),
                this.prisma.report.update({
                    where: { id: reportId },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                        filePath,
                        fileSize: stats.size,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    },
                }),
            ]);

            return { success: true, filePath, fileSize: stats.size };
        } catch (error) {
            this.logger.error(`Report execution failed: ${error.message}`, error.stack);

            await Promise.all([
                this.prisma.reportExecution.update({
                    where: { id: execution.id },
                    data: {
                        status: 'FAILED',
                        completedAt: new Date(),
                        errorMessage: error.message,
                    },
                }),
                this.prisma.report.update({
                    where: { id: reportId },
                    data: {
                        status: 'FAILED',
                        completedAt: new Date(),
                        errorMessage: error.message,
                    },
                }),
            ]);

            throw error;
        }
    }

    async downloadReport(reportId: string) {
        const report = await this.prisma.report.findUnique({
            where: { id: reportId },
        });

        if (!report || !report.filePath || !fs.existsSync(report.filePath)) {
            throw new Error('Report file not found');
        }

        return {
            filePath: report.filePath,
            fileName: `${report.name}.${report.format.toLowerCase()}`,
            fileSize: report.fileSize,
        };
    }

    async deleteReport(id: string, userId: string) {
        const report = await this.prisma.report.findUnique({
            where: { id },
        });

        if (!report || report.createdBy !== userId) {
            throw new Error('Report not found or access denied');
        }

        // Delete file if exists
        if (report.filePath && fs.existsSync(report.filePath)) {
            fs.unlinkSync(report.filePath);
        }

        return this.prisma.report.delete({
            where: { id },
        });
    }

    // Data Generation
    private async generateReportData(config: ReportConfig) {
        const { dataSource, filters, fields, groupBy, aggregations, sorting } = config;

        let data: any[] = [];

        switch (dataSource) {
            case 'orders':
                data = await this.getOrdersData(filters, fields);
                break;
            case 'users':
                data = await this.getUsersData(filters, fields);
                break;
            case 'medicines':
                data = await this.getMedicinesData(filters, fields);
                break;
            case 'analytics':
                data = await this.getAnalyticsData(filters, fields);
                break;
            default:
                throw new Error(`Unknown data source: ${dataSource}`);
        }

        // Apply grouping and aggregations
        if (groupBy && aggregations) {
            data = this.applyGroupingAndAggregations(data, groupBy, aggregations);
        }

        // Apply sorting
        if (sorting) {
            data = this.applySorting(data, sorting);
        }

        return data;
    }

    private async getOrdersData(filters: any, fields: string[]) {
        const where: any = {};

        if (filters.dateRange) {
            where.createdAt = {
                gte: new Date(filters.dateRange.start),
                lte: new Date(filters.dateRange.end),
            };
        }

        if (filters.status) {
            where.status = { in: filters.status };
        }

        if (filters.userId) {
            where.userId = filters.userId;
        }

        const orders = await this.prisma.order.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                items: {
                    include: {
                        medicine: {
                            select: { id: true, name: true, category: true },
                        },
                    },
                },
            },
        });

        return orders.map(order => ({
            id: order.id,
            status: order.status,
            totalPrice: order.totalPrice,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            userName: order.user?.name,
            userEmail: order.user?.email,
            itemCount: order.items.length,
            items: order.items.map(item => ({
                medicineName: item.medicine.name,
                category: item.medicine.category,
                quantity: item.quantity,
                price: item.price,
            })),
        }));
    }

    private async getUsersData(filters: any, fields: string[]) {
        const where: any = {};

        if (filters.dateRange) {
            where.createdAt = {
                gte: new Date(filters.dateRange.start),
                lte: new Date(filters.dateRange.end),
            };
        }

        if (filters.role) {
            where.role = filters.role;
        }

        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return users;
    }

    private async getMedicinesData(filters: any, fields: string[]) {
        const where: any = {};

        if (filters.category) {
            where.category = { in: filters.category };
        }

        if (filters.lowStock) {
            where.quantity = { lt: 50 };
        }

        const medicines = await this.prisma.medicine.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                category: true,
                price: true,
                quantity: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return medicines;
    }

    private async getAnalyticsData(filters: any, fields: string[]) {
        // This would integrate with the existing analytics service
        // For now, return basic analytics data
        const [totalOrders, totalUsers, totalRevenue, lowStockCount] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.user.count(),
            this.prisma.order.aggregate({
                _sum: { totalPrice: true },
                where: { status: 'COMPLETED' },
            }),
            this.prisma.medicine.count({
                where: { quantity: { lt: 50 } },
            }),
        ]);

        return [{
            totalOrders,
            totalUsers,
            totalRevenue: totalRevenue._sum.totalPrice || 0,
            lowStockCount,
            generatedAt: new Date(),
        }];
    }

    private applyGroupingAndAggregations(data: any[], groupBy: string[], aggregations: any[]) {
        const grouped = data.reduce((acc, item) => {
            const key = groupBy.map(field => item[field]).join('|');
            if (!acc[key]) {
                acc[key] = { group: {}, items: [] };
                groupBy.forEach(field => {
                    acc[key].group[field] = item[field];
                });
            }
            acc[key].items.push(item);
            return acc;
        }, {});

        return Object.values(grouped).map((group: any) => {
            const result = { ...group.group };
            aggregations.forEach(agg => {
                const values = group.items.map((item: any) => item[agg.field]);
                switch (agg.operation) {
                    case 'sum':
                        result[`${agg.field}_sum`] = values.reduce((a: any, b: any) => a + b, 0);
                        break;
                    case 'count':
                        result[`${agg.field}_count`] = values.length;
                        break;
                    case 'avg':
                        result[`${agg.field}_avg`] = values.reduce((a: any, b: any) => a + b, 0) / values.length;
                        break;
                    case 'min':
                        result[`${agg.field}_min`] = Math.min(...values);
                        break;
                    case 'max':
                        result[`${agg.field}_max`] = Math.max(...values);
                        break;
                }
            });
            return result;
        });
    }

    private applySorting(data: any[], sorting: any[]) {
        return data.sort((a, b) => {
            for (const sort of sorting) {
                const aVal = a[sort.field];
                const bVal = b[sort.field];
                if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    // File Generation
    private async generateFile(format: ReportFormat, data: any[], name: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;

        switch (format) {
            case 'JSON':
                return this.generateJSONFile(data, fileName);
            case 'CSV':
                return this.generateCSVFile(data, fileName);
            case 'EXCEL':
                return this.generateExcelFile(data, fileName);
            case 'PDF':
                return this.generatePDFFile(data, fileName);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    private async generateJSONFile(data: any[], fileName: string): Promise<string> {
        const filePath = path.join(this.reportsDir, `${fileName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return filePath;
    }

    private async generateCSVFile(data: any[], fileName: string): Promise<string> {
        if (data.length === 0) {
            const filePath = path.join(this.reportsDir, `${fileName}.csv`);
            fs.writeFileSync(filePath, '');
            return filePath;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                if (typeof value === 'object') {
                    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                }
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const filePath = path.join(this.reportsDir, `${fileName}.csv`);
        fs.writeFileSync(filePath, csvContent);
        return filePath;
    }

    private async generateExcelFile(data: any[], fileName: string): Promise<string> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        if (data.length === 0) {
            const filePath = path.join(this.reportsDir, `${fileName}.xlsx`);
            await workbook.xlsx.writeFile(filePath);
            return filePath;
        }

        // Add headers
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);

        // Style headers
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        // Add data
        data.forEach(row => {
            const values = headers.map(header => row[header]);
            worksheet.addRow(values);
        });

        // Auto-fit columns
        worksheet.columns.forEach((column: any) => {
            column.width = 15;
        });

        const filePath = path.join(this.reportsDir, `${fileName}.xlsx`);
        await workbook.xlsx.writeFile(filePath);
        return filePath;
    }

    private async generatePDFFile(data: any[], fileName: string): Promise<string> {
        const doc = new PDFDocument();
        const filePath = path.join(this.reportsDir, `${fileName}.pdf`);
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Add title
        doc.fontSize(20).text('Report', 50, 50);
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, 50, 80);

        if (data.length === 0) {
            doc.text('No data available', 50, 120);
        } else {
            // Add table
            const headers = Object.keys(data[0]);
            let y = 120;
            const rowHeight = 20;
            const colWidth = 100;

            // Headers
            doc.fontSize(10).font('Helvetica-Bold');
            headers.forEach((header, i) => {
                doc.text(header, 50 + i * colWidth, y);
            });
            y += rowHeight;

            // Data rows
            doc.font('Helvetica');
            data.slice(0, 50).forEach((row, rowIndex) => { // Limit to 50 rows for PDF
                headers.forEach((header, colIndex) => {
                    const value = String(row[header] || '').substring(0, 20); // Truncate long values
                    doc.text(value, 50 + colIndex * colWidth, y);
                });
                y += rowHeight;
            });

            if (data.length > 50) {
                doc.text(`... and ${data.length - 50} more rows`, 50, y);
            }
        }

        doc.end();
        return new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        });
    }

    // Cleanup expired files
    async cleanupExpiredFiles() {
        const expiredReports = await this.prisma.report.findMany({
            where: {
                expiresAt: { lt: new Date() },
                filePath: { not: null },
            },
        });

        for (const report of expiredReports) {
            if (report.filePath && fs.existsSync(report.filePath)) {
                fs.unlinkSync(report.filePath);
            }
        }

        await this.prisma.report.updateMany({
            where: {
                expiresAt: { lt: new Date() },
            },
            data: {
                filePath: null,
                fileSize: null,
            },
        });

        return expiredReports.length;
    }
}