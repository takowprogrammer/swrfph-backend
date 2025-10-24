import { Injectable } from '@nestjs/common';
import { DatabaseAuditService } from './database-audit.service';
import { AuditAction, AuditSeverity } from '@prisma/client';

@Injectable()
export class AuditService {
    constructor(private databaseAuditService: DatabaseAuditService) { }

    // Audit Log Methods
    async createAuditLog(data: {
        userId?: string;
        action: string;
        resource: string;
        resourceId?: string;
        description: string;
        details?: any;
        ipAddress?: string;
        userAgent?: string;
        severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        metadata?: any;
    }) {
        return this.databaseAuditService.createAuditLog({
            userId: data.userId || null,
            action: data.action as AuditAction,
            resource: data.resource,
            resourceId: data.resourceId || null,
            description: data.description,
            details: data.details || null,
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null,
            severity: (data.severity as AuditSeverity) || 'MEDIUM',
            metadata: data.metadata || null,
        });
    }

    async getAuditLogs(params: {
        page?: number;
        limit?: number;
        userId?: string;
        action?: string;
        resource?: string;
        severity?: string;
        startDate?: Date;
        endDate?: Date;
        search?: string;
    }) {
        return this.databaseAuditService.getAuditLogs({
            page: params.page,
            limit: params.limit,
            userId: params.userId,
            action: params.action,
            resource: params.resource,
            severity: params.severity,
            startDate: params.startDate?.toISOString(),
            endDate: params.endDate?.toISOString(),
            search: params.search,
        });
    }

    async getAuditStats(userId?: string) {
        return this.databaseAuditService.getAuditStats();
    }

    // Security Event Methods
    async createSecurityEvent(data: {
        userId?: string;
        eventType: string;
        description: string;
        ipAddress?: string;
        userAgent?: string;
        severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        metadata?: any;
    }) {
        return this.databaseAuditService.createSecurityEvent({
            userId: data.userId || null,
            eventType: data.eventType,
            description: data.description,
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null,
            severity: (data.severity as AuditSeverity) || 'MEDIUM',
            metadata: data.metadata || null,
        });
    }

    async getSecurityEvents(params: {
        page?: number;
        limit?: number;
        userId?: string;
        eventType?: string;
        severity?: string;
        resolved?: boolean;
        startDate?: Date;
        endDate?: Date;
    }) {
        return this.databaseAuditService.getSecurityEvents({
            page: params.page,
            limit: params.limit,
            userId: params.userId,
            eventType: params.eventType,
            severity: params.severity,
            resolved: params.resolved,
            startDate: params.startDate?.toISOString(),
            endDate: params.endDate?.toISOString(),
        });
    }

    async resolveSecurityEvent(eventId: string, resolvedBy: string) {
        return this.databaseAuditService.resolveSecurityEvent(eventId, resolvedBy);
    }

    async getSecurityStats() {
        return this.databaseAuditService.getSecurityEventStats();
    }

    // Helper Methods for Common Audit Events
    async logUserLogin(userId: string, ipAddress?: string, userAgent?: string) {
        return this.createAuditLog({
            userId,
            action: 'LOGIN',
            resource: 'User',
            description: 'User logged in successfully',
            ipAddress,
            userAgent,
            severity: 'LOW',
        });
    }

    async logUserLogout(userId: string, ipAddress?: string, userAgent?: string) {
        return this.createAuditLog({
            userId,
            action: 'LOGOUT',
            resource: 'User',
            description: 'User logged out',
            ipAddress,
            userAgent,
            severity: 'LOW',
        });
    }

    async logFailedLogin(email: string, ipAddress?: string, userAgent?: string) {
        return this.createAuditLog({
            action: 'FAILED_LOGIN',
            resource: 'Auth',
            description: `Failed login attempt for email: ${email}`,
            ipAddress,
            userAgent,
            severity: 'MEDIUM',
            metadata: { email },
        });
    }

    async logDataChange(
        userId: string,
        action: string,
        resource: string,
        resourceId: string,
        description: string,
        oldData?: any,
        newData?: any,
        ipAddress?: string,
        userAgent?: string
    ) {
        return this.createAuditLog({
            userId,
            action: action as AuditAction,
            resource,
            resourceId,
            description,
            details: { oldData, newData },
            ipAddress,
            userAgent,
            severity: 'MEDIUM',
        });
    }

    async logBulkOperation(
        userId: string,
        resource: string,
        description: string,
        details: any,
        ipAddress?: string,
        userAgent?: string
    ) {
        return this.createAuditLog({
            userId,
            action: 'BULK_OPERATION',
            resource,
            description,
            details,
            ipAddress,
            userAgent,
            severity: 'MEDIUM',
        });
    }

    async logSystemEvent(
        description: string,
        details?: any,
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
    ) {
        return this.createAuditLog({
            action: 'SYSTEM_EVENT',
            resource: 'System',
            description,
            details,
            severity,
        });
    }

    // Login Session Management
    async createLoginSession(data: {
        userId: string;
        sessionId: string;
        ipAddress?: string;
        userAgent?: string;
        expiresAt: Date;
    }) {
        return this.databaseAuditService.createLoginSession({
            userId: data.userId,
            sessionId: data.sessionId,
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null,
            expiresAt: data.expiresAt,
        });
    }

    async getActiveSessions(userId?: string) {
        return this.databaseAuditService.getActiveSessions(userId);
    }

    async updateSessionActivity(sessionId: string) {
        // This would require a separate method in DatabaseAuditService
        // For now, we'll just log the activity
        console.log('Session activity updated:', sessionId);
        return { id: sessionId, lastActivity: new Date() };
    }

    async terminateSession(sessionId: string) {
        // This would require a separate method in DatabaseAuditService
        // For now, we'll just log the termination
        console.log('Session terminated:', sessionId);
        return { id: sessionId, isActive: false };
    }

    async terminateAllUserSessions(userId: string) {
        return this.databaseAuditService.terminateAllUserSessions(userId);
    }

    async cleanupExpiredSessions() {
        const count = await this.databaseAuditService.cleanupExpiredSessions();
        return { count };
    }
}