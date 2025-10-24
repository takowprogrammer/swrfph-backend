import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
// Removed Prisma dependency
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    // Audit Logs
    @Get('logs')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get audit logs (admin only)' })
    @ApiResponse({ status: 200, description: 'List of audit logs.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'userId', required: false, type: String })
    @ApiQuery({ name: 'action', required: false, type: String })
    @ApiQuery({ name: 'resource', required: false, type: String })
    @ApiQuery({ name: 'severity', required: false, type: String })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getAuditLogs(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('resource') resource?: string,
        @Query('severity') severity?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('search') search?: string,
    ) {
        return this.auditService.getAuditLogs({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            userId,
            action,
            resource,
            severity,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            search,
        });
    }

    @Get('logs/stats')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get audit log statistics (admin only)' })
    @ApiResponse({ status: 200, description: 'Audit log statistics.' })
    @ApiQuery({ name: 'userId', required: false, type: String })
    async getAuditStats(@Query('userId') userId?: string) {
        return this.auditService.getAuditStats(userId);
    }

    // Security Events
    @Get('security-events')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get security events (admin only)' })
    @ApiResponse({ status: 200, description: 'List of security events.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'userId', required: false, type: String })
    @ApiQuery({ name: 'eventType', required: false, type: String })
    @ApiQuery({ name: 'severity', required: false, type: String })
    @ApiQuery({ name: 'resolved', required: false, type: Boolean })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    async getSecurityEvents(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('userId') userId?: string,
        @Query('eventType') eventType?: string,
        @Query('severity') severity?: string,
        @Query('resolved') resolved?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.auditService.getSecurityEvents({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            userId,
            eventType,
            severity,
            resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }

    @Get('security-events/stats')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get security event statistics (admin only)' })
    @ApiResponse({ status: 200, description: 'Security event statistics.' })
    async getSecurityStats() {
        return this.auditService.getSecurityStats();
    }

    @Patch('security-events/:id/resolve')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Resolve a security event (admin only)' })
    @ApiResponse({ status: 200, description: 'Security event resolved.' })
    @ApiParam({ name: 'id', type: String, description: 'Security event ID' })
    async resolveSecurityEvent(
        @Request() req: any,
        @Param('id') id: string
    ) {
        return this.auditService.resolveSecurityEvent(id, req.user.userId);
    }

    // Login Sessions
    @Get('sessions')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get active login sessions (admin only)' })
    @ApiResponse({ status: 200, description: 'List of active login sessions.' })
    @ApiQuery({ name: 'userId', required: false, type: String })
    async getActiveSessions(@Query('userId') userId?: string) {
        return this.auditService.getActiveSessions(userId);
    }

    @Delete('sessions/:sessionId')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Terminate a login session (admin only)' })
    @ApiResponse({ status: 200, description: 'Login session terminated.' })
    @ApiParam({ name: 'sessionId', type: String, description: 'Session ID' })
    async terminateSession(@Param('sessionId') sessionId: string) {
        return this.auditService.terminateSession(sessionId);
    }

    @Delete('sessions/user/:userId')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Terminate all sessions for a user (admin only)' })
    @ApiResponse({ status: 200, description: 'All user sessions terminated.' })
    @ApiParam({ name: 'userId', type: String, description: 'User ID' })
    async terminateAllUserSessions(@Param('userId') userId: string) {
        return this.auditService.terminateAllUserSessions(userId);
    }

    @Post('sessions/cleanup')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Cleanup expired sessions (admin only)' })
    @ApiResponse({ status: 200, description: 'Expired sessions cleaned up.' })
    async cleanupExpiredSessions() {
        return this.auditService.cleanupExpiredSessions();
    }

    // Manual Audit Log Creation (for testing/admin use)
    @Post('logs')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Create audit log entry (admin only)' })
    @ApiResponse({ status: 201, description: 'Audit log created.' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                userId: { type: 'string' },
                action: { type: 'string' },
                resource: { type: 'string' },
                resourceId: { type: 'string' },
                description: { type: 'string' },
                details: { type: 'object' },
                ipAddress: { type: 'string' },
                userAgent: { type: 'string' },
                severity: { type: 'string' },
                metadata: { type: 'object' },
            },
            required: ['action', 'resource', 'description'],
        },
    })
    async createAuditLog(
        @Request() req: any,
        @Body() createAuditLogDto: {
            userId?: string;
            action: string;
            resource: string;
            resourceId?: string;
            description: string;
            details?: any;
            ipAddress?: string;
            userAgent?: string;
            severity?: string;
            metadata?: any;
        }
    ) {
        return this.auditService.createAuditLog({
            ...createAuditLogDto,
            ipAddress: createAuditLogDto.ipAddress || req.ip,
            userAgent: createAuditLogDto.userAgent || req.get('User-Agent'),
            severity: createAuditLogDto.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined,
        });
    }

    @Post('security-events')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Create security event (admin only)' })
    @ApiResponse({ status: 201, description: 'Security event created.' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                userId: { type: 'string' },
                eventType: { type: 'string' },
                description: { type: 'string' },
                ipAddress: { type: 'string' },
                userAgent: { type: 'string' },
                severity: { type: 'string' },
                metadata: { type: 'object' },
            },
            required: ['eventType', 'description'],
        },
    })
    async createSecurityEvent(
        @Request() req: any,
        @Body() createSecurityEventDto: {
            userId?: string;
            eventType: string;
            description: string;
            ipAddress?: string;
            userAgent?: string;
            severity?: string;
            metadata?: any;
        }
    ) {
        return this.auditService.createSecurityEvent({
            ...createSecurityEventDto,
            ipAddress: createSecurityEventDto.ipAddress || req.ip,
            userAgent: createSecurityEventDto.userAgent || req.get('User-Agent'),
            severity: createSecurityEventDto.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined,
        });
    }
}
