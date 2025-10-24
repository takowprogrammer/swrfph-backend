import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    // Report Templates
    @Post('templates')
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Create a new report template' })
    @ApiResponse({ status: 201, description: 'Report template created successfully.' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                isPublic: { type: 'boolean' },
                config: { type: 'object' },
            },
            required: ['name', 'category', 'config'],
        },
    })
    async createTemplate(@Request() req: any, @Body() createTemplateDto: any) {
        return this.reportsService.createTemplate({
            ...createTemplateDto,
            createdBy: req.user.userId,
        });
    }

    @Get('templates')
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Get report templates' })
    @ApiResponse({ status: 200, description: 'List of report templates.' })
    @ApiQuery({ name: 'category', required: false, type: String })
    async getTemplates(@Request() req: any, @Query('category') category?: string) {
        return this.reportsService.getTemplates(req.user.userId, category);
    }

    @Get('templates/:id')
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Get a specific report template' })
    @ApiResponse({ status: 200, description: 'Report template details.' })
    @ApiParam({ name: 'id', type: String, description: 'Template ID' })
    async getTemplate(@Param('id') id: string) {
        return this.reportsService.getTemplate(id);
    }

    @Put('templates/:id')
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Update a report template' })
    @ApiResponse({ status: 200, description: 'Report template updated successfully.' })
    @ApiParam({ name: 'id', type: String, description: 'Template ID' })
    async updateTemplate(@Request() req: any, @Param('id') id: string, @Body() updateTemplateDto: any) {
        return this.reportsService.updateTemplate(id, updateTemplateDto, req.user.userId);
    }

    @Delete('templates/:id')
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Delete a report template' })
    @ApiResponse({ status: 200, description: 'Report template deleted successfully.' })
    @ApiParam({ name: 'id', type: String, description: 'Template ID' })
    async deleteTemplate(@Request() req: any, @Param('id') id: string) {
        return this.reportsService.deleteTemplate(id, req.user.userId);
    }

    // Reports
    @Post()
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Create a new report' })
    @ApiResponse({ status: 201, description: 'Report created successfully.' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                templateId: { type: 'string' },
                config: { type: 'object' },
                format: { type: 'string', enum: ['JSON', 'CSV', 'EXCEL', 'PDF'] },
                scheduledAt: { type: 'string', format: 'date-time' },
            },
            required: ['name', 'config', 'format'],
        },
    })
    async createReport(@Request() req: any, @Body() createReportDto: any) {
        return this.reportsService.createReport({
            ...createReportDto,
            createdBy: req.user.userId,
        });
    }

    @Get()
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Get reports' })
    @ApiResponse({ status: 200, description: 'List of reports.' })
    @ApiQuery({ name: 'status', required: false, type: String })
    async getReports(@Request() req: any, @Query('status') status?: string) {
        return this.reportsService.getReports(req.user.userId, status as any);
    }

    @Get(':id')
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Get a specific report' })
    @ApiResponse({ status: 200, description: 'Report details.' })
    @ApiParam({ name: 'id', type: String, description: 'Report ID' })
    async getReport(@Param('id') id: string) {
        return this.reportsService.getReport(id);
    }

    @Post(':id/execute')
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Execute a report' })
    @ApiResponse({ status: 200, description: 'Report executed successfully.' })
    @ApiParam({ name: 'id', type: String, description: 'Report ID' })
    async executeReport(@Param('id') id: string) {
        return this.reportsService.executeReport(id);
    }

    @Get(':id/download')
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Download a report file' })
    @ApiResponse({ status: 200, description: 'Report file download.' })
    @ApiParam({ name: 'id', type: String, description: 'Report ID' })
    async downloadReport(@Param('id') id: string, @Res() res: Response) {
        try {
            const { filePath, fileName, fileSize } = await this.reportsService.downloadReport(id);

            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Length', fileSize || 0);

            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } catch (error) {
            res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
        }
    }

    @Delete(':id')
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Delete a report' })
    @ApiResponse({ status: 200, description: 'Report deleted successfully.' })
    @ApiParam({ name: 'id', type: String, description: 'Report ID' })
    async deleteReport(@Request() req: any, @Param('id') id: string) {
        return this.reportsService.deleteReport(id, req.user.userId);
    }

    // Admin-only endpoints
    @Post('cleanup')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Cleanup expired report files (admin only)' })
    @ApiResponse({ status: 200, description: 'Cleanup completed.' })
    async cleanupExpiredFiles() {
        const count = await this.reportsService.cleanupExpiredFiles();
        return { message: `Cleaned up ${count} expired files` };
    }

    // Pre-built report templates
    @Get('templates/prebuilt')
    @Roles('ADMIN', 'PROVIDER')
    @ApiOperation({ summary: 'Get pre-built report templates' })
    @ApiResponse({ status: 200, description: 'List of pre-built templates.' })
    async getPrebuiltTemplates() {
        return [
            {
                id: 'sales-summary',
                name: 'Sales Summary Report',
                description: 'Monthly sales overview with revenue trends',
                category: 'Sales',
                isPublic: true,
                config: {
                    dataSource: 'orders',
                    filters: {
                        dateRange: { start: '2024-01-01', end: '2024-12-31' },
                        status: ['COMPLETED'],
                    },
                    fields: ['id', 'totalPrice', 'createdAt', 'userName'],
                    groupBy: ['createdAt'],
                    aggregations: [
                        { field: 'totalPrice', operation: 'sum' },
                        { field: 'id', operation: 'count' },
                    ],
                },
            },
            {
                id: 'inventory-status',
                name: 'Inventory Status Report',
                description: 'Current inventory levels and low stock alerts',
                category: 'Inventory',
                isPublic: true,
                config: {
                    dataSource: 'medicines',
                    filters: {
                        lowStock: true,
                    },
                    fields: ['name', 'category', 'quantity', 'price'],
                    sorting: [{ field: 'quantity', direction: 'asc' }],
                },
            },
            {
                id: 'user-activity',
                name: 'User Activity Report',
                description: 'User registration and activity overview',
                category: 'Users',
                isPublic: true,
                config: {
                    dataSource: 'users',
                    filters: {
                        dateRange: { start: '2024-01-01', end: '2024-12-31' },
                    },
                    fields: ['name', 'email', 'role', 'createdAt'],
                    groupBy: ['role'],
                    aggregations: [
                        { field: 'id', operation: 'count' },
                    ],
                },
            },
            {
                id: 'financial-summary',
                name: 'Financial Summary Report',
                description: 'Revenue, costs, and financial metrics',
                category: 'Financial',
                isPublic: true,
                config: {
                    dataSource: 'analytics',
                    filters: {},
                    fields: ['totalOrders', 'totalRevenue', 'totalUsers', 'lowStockCount'],
                },
            },
        ];
    }
}