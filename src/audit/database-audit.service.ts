import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, AuditSeverity, AuditLog, SecurityEvent, LoginSession } from '@prisma/client';

@Injectable()
export class DatabaseAuditService {
    constructor(private prisma: PrismaService) { }

    async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
        return this.prisma.auditLog.create({
            data: {
                userId: log.userId,
                action: log.action,
                resource: log.resource,
                resourceId: log.resourceId,
                description: log.description,
                details: log.details as any,
                ipAddress: log.ipAddress,
                userAgent: log.userAgent,
                severity: log.severity,
                metadata: log.metadata as any,
            },
        });
    }

    async getAuditLogs(filter: {
        page?: number;
        limit?: number;
        userId?: string;
        action?: string;
        resource?: string;
        severity?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
    }): Promise<{ data: AuditLog[]; total: number }> {
        const where: any = {};

        if (filter.userId) where.userId = filter.userId;
        if (filter.action) where.action = filter.action as AuditAction;
        if (filter.resource) where.resource = { contains: filter.resource };
        if (filter.severity) where.severity = filter.severity as AuditSeverity;
        if (filter.startDate) where.createdAt = { gte: new Date(filter.startDate) };
        if (filter.endDate) where.createdAt = { lte: new Date(filter.endDate) };
        if (filter.search) {
            where.OR = [
                { description: { contains: filter.search } },
                { resource: { contains: filter.search } },
                { userId: { contains: filter.search } },
                { ipAddress: { contains: filter.search } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: ((filter.page || 1) - 1) * (filter.limit || 20),
                take: filter.limit || 20,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { data, total };
    }

    async getAuditStats(): Promise<any> {
        const [totalLogs, criticalLogs, highLogs, mediumLogs, lowLogs] = await Promise.all([
            this.prisma.auditLog.count(),
            this.prisma.auditLog.count({ where: { severity: 'CRITICAL' } }),
            this.prisma.auditLog.count({ where: { severity: 'HIGH' } }),
            this.prisma.auditLog.count({ where: { severity: 'MEDIUM' } }),
            this.prisma.auditLog.count({ where: { severity: 'LOW' } }),
        ]);

        return { totalLogs, criticalLogs, highLogs, mediumLogs, lowLogs };
    }

    async createSecurityEvent(event: Omit<SecurityEvent, 'id' | 'createdAt' | 'updatedAt' | 'resolved' | 'resolvedAt' | 'resolvedBy'>): Promise<SecurityEvent> {
        return this.prisma.securityEvent.create({
            data: {
                userId: event.userId,
                eventType: event.eventType,
                description: event.description,
                ipAddress: event.ipAddress,
                userAgent: event.userAgent,
                severity: event.severity,
                metadata: event.metadata as any,
            },
        });
    }

    async getSecurityEvents(filter: {
        page?: number;
        limit?: number;
        userId?: string;
        eventType?: string;
        severity?: string;
        resolved?: boolean;
        startDate?: string;
        endDate?: string;
    }): Promise<{ data: SecurityEvent[]; total: number }> {
        const where: any = {};

        if (filter.userId) where.userId = filter.userId;
        if (filter.eventType) where.eventType = { contains: filter.eventType };
        if (filter.severity) where.severity = filter.severity as AuditSeverity;
        if (filter.resolved !== undefined) where.resolved = filter.resolved;
        if (filter.startDate) where.createdAt = { gte: new Date(filter.startDate) };
        if (filter.endDate) where.createdAt = { lte: new Date(filter.endDate) };

        const [data, total] = await Promise.all([
            this.prisma.securityEvent.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: ((filter.page || 1) - 1) * (filter.limit || 20),
                take: filter.limit || 20,
            }),
            this.prisma.securityEvent.count({ where }),
        ]);

        return { data, total };
    }

    async getSecurityEventStats(): Promise<any> {
        const [totalEvents, unresolvedEvents, criticalEvents, highEvents] = await Promise.all([
            this.prisma.securityEvent.count(),
            this.prisma.securityEvent.count({ where: { resolved: false } }),
            this.prisma.securityEvent.count({ where: { severity: 'CRITICAL' } }),
            this.prisma.securityEvent.count({ where: { severity: 'HIGH' } }),
        ]);

        return { totalEvents, unresolvedEvents, criticalEvents, highEvents };
    }

    async resolveSecurityEvent(id: string, resolvedByUserId: string): Promise<SecurityEvent | null> {
        return this.prisma.securityEvent.update({
            where: { id },
            data: {
                resolved: true,
                resolvedAt: new Date(),
                resolvedBy: resolvedByUserId,
            },
        });
    }

    async createLoginSession(session: Omit<LoginSession, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastActivity'>): Promise<LoginSession> {
        return this.prisma.loginSession.create({
            data: {
                userId: session.userId,
                sessionId: session.sessionId,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                expiresAt: session.expiresAt,
            },
        });
    }

    async terminateAllUserSessions(userId: string): Promise<void> {
        await this.prisma.loginSession.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false },
        });
    }

    async getActiveSessions(userId?: string): Promise<LoginSession[]> {
        const where: any = { isActive: true };
        if (userId) where.userId = userId;

        return this.prisma.loginSession.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
            orderBy: { lastActivity: 'desc' },
        });
    }

    async cleanupExpiredSessions(): Promise<number> {
        const result = await this.prisma.loginSession.updateMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isActive: false },
                ],
            },
            data: { isActive: false },
        });

        return result.count;
    }
}
