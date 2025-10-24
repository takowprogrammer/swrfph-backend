import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const user = request.user;
        const method = request.method;
        const url = request.url;
        const ipAddress = request.ip;
        const userAgent = request.get('User-Agent');

        // Skip audit logging for certain endpoints
        const skipAudit = this.shouldSkipAudit(url, method);
        if (skipAudit) {
            return next.handle();
        }

        const startTime = Date.now();

        return next.handle().pipe(
            tap(async (data) => {
                try {
                    const duration = Date.now() - startTime;
                    const statusCode = response.statusCode;

                    // Determine audit action based on HTTP method
                    let action: string;
                    switch (method) {
                        case 'GET':
                            action = 'READ';
                            break;
                        case 'POST':
                            action = 'CREATE';
                            break;
                        case 'PUT':
                        case 'PATCH':
                            action = 'UPDATE';
                            break;
                        case 'DELETE':
                            action = 'DELETE';
                            break;
                        default:
                            action = 'READ';
                    }

                    // Determine resource from URL
                    const resource = this.extractResourceFromUrl(url);

                    // Determine severity based on status code and action
                    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
                    if (statusCode >= 400) {
                        severity = 'MEDIUM';
                    }
                    if (statusCode >= 500) {
                        severity = 'HIGH';
                    }
                    if (action === 'DELETE' || action === 'CREATE') {
                        severity = 'MEDIUM';
                    }

                    // Create audit log entry
                    await this.auditService.createAuditLog({
                        userId: user?.userId,
                        action,
                        resource,
                        resourceId: this.extractResourceId(url, data),
                        description: `${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`,
                        details: {
                            method,
                            url,
                            statusCode,
                            duration,
                            timestamp: new Date().toISOString(),
                        },
                        ipAddress,
                        userAgent,
                        severity,
                        metadata: {
                            endpoint: url,
                            method,
                            responseTime: duration,
                        },
                    });

                    // Log security events for suspicious activities
                    if (statusCode === 401 || statusCode === 403) {
                        await this.auditService.createSecurityEvent({
                            userId: user?.userId,
                            eventType: statusCode === 401 ? 'UNAUTHORIZED_ACCESS' : 'FORBIDDEN_ACCESS',
                            description: `Unauthorized access attempt to ${url}`,
                            ipAddress,
                            userAgent,
                            severity: 'HIGH',
                            metadata: {
                                method,
                                url,
                                statusCode,
                                userAgent,
                            },
                        });
                    }

                    // Log multiple failed attempts (this would need additional logic to track)
                    if (statusCode === 401 && url.includes('/auth/login')) {
                        await this.auditService.createSecurityEvent({
                            eventType: 'FAILED_LOGIN_ATTEMPT',
                            description: `Failed login attempt from ${ipAddress}`,
                            ipAddress,
                            userAgent,
                            severity: 'MEDIUM',
                            metadata: {
                                url,
                                userAgent,
                                timestamp: new Date().toISOString(),
                            },
                        });
                    }

                } catch (error) {
                    // Don't let audit logging errors break the main request
                    console.error('Audit logging error:', error);
                }
            })
        );
    }

    private shouldSkipAudit(url: string, method: string): boolean {
        const skipPatterns = [
            '/health',
            '/metrics',
            '/audit', // Skip all audit endpoints to prevent infinite recursion
            '/auth/login', // Skip login to prevent recursion during authentication
            '/auth/register', // Skip registration to prevent recursion
        ];

        return skipPatterns.some(pattern => url.includes(pattern));
    }

    private extractResourceFromUrl(url: string): string {
        // Extract resource name from URL path
        const pathSegments = url.split('/').filter(segment => segment && !segment.match(/^\d+$/));

        if (pathSegments.length === 0) return 'Root';

        // Map common API endpoints to resource names
        const resourceMap: { [key: string]: string } = {
            'users': 'User',
            'orders': 'Order',
            'medicines': 'Medicine',
            'notifications': 'Notification',
            'analytics': 'Analytics',
            'settings': 'Setting',
            'invoices': 'Invoice',
            'templates': 'OrderTemplate',
            'auth': 'Authentication',
        };

        const firstSegment = pathSegments[0];
        return resourceMap[firstSegment] || firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
    }

    private extractResourceId(url: string, data: any): string | undefined {
        // Try to extract resource ID from URL or response data
        const urlMatch = url.match(/\/([a-zA-Z0-9-]+)$/);
        if (urlMatch) {
            return urlMatch[1];
        }

        // Try to get ID from response data
        if (data && typeof data === 'object') {
            if (data.id) return data.id;
            if (data.data && data.data.id) return data.data.id;
        }

        return undefined;
    }
}
