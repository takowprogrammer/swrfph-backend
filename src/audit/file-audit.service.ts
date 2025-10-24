import { Injectable } from '@nestjs/common';
import { writeFileSync, appendFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: any;
}

export interface SecurityEventEntry {
  id: string;
  timestamp: string;
  userId?: string;
  eventType: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  metadata?: any;
}

@Injectable()
export class FileAuditService {
  private readonly auditLogPath = join(process.cwd(), 'logs', 'audit.json');
  private readonly securityEventsPath = join(process.cwd(), 'logs', 'security.json');

  constructor() {
    // Ensure logs directory exists
    const logsDir = join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    // Initialize files if they don't exist
    if (!existsSync(this.auditLogPath)) {
      writeFileSync(this.auditLogPath, JSON.stringify([], null, 2));
    }
    if (!existsSync(this.securityEventsPath)) {
      writeFileSync(this.securityEventsPath, JSON.stringify([], null, 2));
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

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
  }): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      description: data.description,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: data.severity || 'MEDIUM',
      metadata: data.metadata,
    };

    const logs = this.readAuditLogs();
    logs.push(entry);
    writeFileSync(this.auditLogPath, JSON.stringify(logs, null, 2));

    return entry;
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
  } = {}) {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      resource,
      severity,
      startDate,
      endDate,
      search,
    } = params;

    let logs = this.readAuditLogs();

    // Apply filters
    if (userId) logs = logs.filter(log => log.userId === userId);
    if (action) logs = logs.filter(log => log.action === action);
    if (resource) logs = logs.filter(log => log.resource === resource);
    if (severity) logs = logs.filter(log => log.severity === severity);
    if (startDate) logs = logs.filter(log => new Date(log.timestamp) >= startDate);
    if (endDate) logs = logs.filter(log => new Date(log.timestamp) <= endDate);
    if (search) {
      logs = logs.filter(log => 
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        log.resource.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = logs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);

    return {
      data: paginatedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditStats(userId?: string) {
    const logs = this.readAuditLogs();
    let filteredLogs = logs;
    
    if (userId) {
      filteredLogs = logs.filter(log => log.userId === userId);
    }

    const totalLogs = filteredLogs.length;
    const criticalLogs = filteredLogs.filter(log => log.severity === 'CRITICAL').length;
    const highSeverityLogs = filteredLogs.filter(log => log.severity === 'HIGH').length;
    const recentLogs = filteredLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logDate >= oneDayAgo;
    }).length;

    // Action stats
    const actionCounts: { [key: string]: number } = {};
    filteredLogs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    const actionStats = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);

    // Resource stats
    const resourceCounts: { [key: string]: number } = {};
    filteredLogs.forEach(log => {
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
    });
    const resourceStats = Object.entries(resourceCounts)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalLogs,
      criticalLogs,
      highSeverityLogs,
      recentLogs,
      actionStats,
      resourceStats,
    };
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
  }): Promise<SecurityEventEntry> {
    const entry: SecurityEventEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      userId: data.userId,
      eventType: data.eventType,
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: data.severity || 'MEDIUM',
      resolved: false,
      metadata: data.metadata,
    };

    const events = this.readSecurityEvents();
    events.push(entry);
    writeFileSync(this.securityEventsPath, JSON.stringify(events, null, 2));

    return entry;
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
  } = {}) {
    const {
      page = 1,
      limit = 20,
      userId,
      eventType,
      severity,
      resolved,
      startDate,
      endDate,
    } = params;

    let events = this.readSecurityEvents();

    // Apply filters
    if (userId) events = events.filter(event => event.userId === userId);
    if (eventType) events = events.filter(event => event.eventType === eventType);
    if (severity) events = events.filter(event => event.severity === severity);
    if (resolved !== undefined) events = events.filter(event => event.resolved === resolved);
    if (startDate) events = events.filter(event => new Date(event.timestamp) >= startDate);
    if (endDate) events = events.filter(event => new Date(event.timestamp) <= endDate);

    // Sort by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = events.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = events.slice(startIndex, endIndex);

    return {
      data: paginatedEvents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<SecurityEventEntry | null> {
    const events = this.readSecurityEvents();
    const eventIndex = events.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) return null;

    events[eventIndex].resolved = true;
    events[eventIndex].resolvedAt = new Date().toISOString();
    events[eventIndex].resolvedBy = resolvedBy;

    writeFileSync(this.securityEventsPath, JSON.stringify(events, null, 2));
    return events[eventIndex];
  }

  async getSecurityStats() {
    const events = this.readSecurityEvents();
    
    const totalEvents = events.length;
    const unresolvedEvents = events.filter(event => !event.resolved).length;
    const criticalEvents = events.filter(event => event.severity === 'CRITICAL').length;
    const recentEvents = events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return eventDate >= oneDayAgo;
    }).length;

    // Event type stats
    const eventTypeCounts: { [key: string]: number } = {};
    events.forEach(event => {
      eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1;
    });
    const eventTypeStats = Object.entries(eventTypeCounts)
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalEvents,
      unresolvedEvents,
      criticalEvents,
      recentEvents,
      eventTypeStats,
    };
  }

  // Helper Methods for Common Audit Events
  async logUserLogin(userId: string, ipAddress?: string, userAgent?: string) {
    return this.createAuditLog({
      userId,
      action: 'LOGIN',
      resource: 'User',
      resourceId: userId,
      description: 'User logged in',
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
      resourceId: userId,
      description: 'User logged out',
      ipAddress,
      userAgent,
      severity: 'LOW',
    });
  }

  async logFailedLogin(email: string, ipAddress?: string, userAgent?: string) {
    return this.createAuditLog({
      action: 'FAILED_LOGIN',
      resource: 'User',
      description: `Failed login attempt for email: ${email}`,
      ipAddress,
      userAgent,
      severity: 'MEDIUM',
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
      action,
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

  // Private helper methods
  private readAuditLogs(): AuditLogEntry[] {
    try {
      const data = readFileSync(this.auditLogPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private readSecurityEvents(): SecurityEventEntry[] {
    try {
      const data = readFileSync(this.securityEventsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }
}


