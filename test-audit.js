// Test script to generate sample audit logs
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Sample audit logs
const sampleAuditLogs = [
    {
        id: 'audit-1',
        timestamp: new Date().toISOString(),
        userId: 'user-123',
        action: 'LOGIN',
        resource: 'User',
        resourceId: 'user-123',
        description: 'User logged in successfully',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'LOW',
        metadata: {
            loginMethod: 'password',
            sessionDuration: '2h 30m'
        }
    },
    {
        id: 'audit-2',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        userId: 'user-123',
        action: 'CREATE',
        resource: 'Order',
        resourceId: 'order-456',
        description: 'Created new order for medicines',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'MEDIUM',
        metadata: {
            orderValue: 150.00,
            itemsCount: 3
        }
    },
    {
        id: 'audit-3',
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        userId: 'user-456',
        action: 'UPDATE',
        resource: 'Medicine',
        resourceId: 'med-789',
        description: 'Updated medicine inventory',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        severity: 'MEDIUM',
        metadata: {
            oldQuantity: 50,
            newQuantity: 45,
            reason: 'Stock adjustment'
        }
    },
    {
        id: 'audit-4',
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        action: 'FAILED_LOGIN',
        resource: 'User',
        description: 'Failed login attempt for email: hacker@example.com',
        ipAddress: '192.168.1.200',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        severity: 'HIGH',
        metadata: {
            attemptCount: 3,
            blocked: true
        }
    },
    {
        id: 'audit-5',
        timestamp: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
        userId: 'user-789',
        action: 'DELETE',
        resource: 'Notification',
        resourceId: 'notif-123',
        description: 'Deleted notification',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1) AppleWebKit/605.1.15',
        severity: 'LOW',
        metadata: {
            notificationType: 'ORDER_UPDATE'
        }
    }
];

// Sample security events
const sampleSecurityEvents = [
    {
        id: 'security-1',
        timestamp: new Date().toISOString(),
        eventType: 'UNAUTHORIZED_ACCESS',
        description: 'Unauthorized access attempt to admin panel',
        ipAddress: '192.168.1.200',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        severity: 'HIGH',
        resolved: false,
        metadata: {
            attemptedEndpoint: '/admin/users',
            blocked: true,
            reason: 'Invalid admin token'
        }
    },
    {
        id: 'security-2',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        eventType: 'MULTIPLE_FAILED_ATTEMPTS',
        description: 'Multiple failed login attempts detected',
        ipAddress: '192.168.1.201',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'CRITICAL',
        resolved: false,
        metadata: {
            attemptCount: 10,
            timeWindow: '5 minutes',
            blocked: true
        }
    },
    {
        id: 'security-3',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        userId: 'user-123',
        eventType: 'SUSPICIOUS_LOGIN',
        description: 'Login from unusual location',
        ipAddress: '203.0.113.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'MEDIUM',
        resolved: true,
        resolvedAt: new Date(Date.now() - 3000000).toISOString(),
        resolvedBy: 'admin-001',
        metadata: {
            previousLocation: '192.168.1.100',
            newLocation: '203.0.113.1',
            verified: true
        }
    }
];

// Write sample data to files
fs.writeFileSync(
    path.join(logsDir, 'audit.json'),
    JSON.stringify(sampleAuditLogs, null, 2)
);

fs.writeFileSync(
    path.join(logsDir, 'security.json'),
    JSON.stringify(sampleSecurityEvents, null, 2)
);

console.log('✅ Sample audit logs and security events created!');
console.log('📁 Files created:');
console.log('   - logs/audit.json');
console.log('   - logs/security.json');
console.log('');
console.log('🔍 You can now view these in the admin dashboard at:');
console.log('   http://localhost:3001/audit');
console.log('');
console.log('📊 Or test the API endpoints:');
console.log('   GET http://localhost:5000/audit/logs');
console.log('   GET http://localhost:5000/audit/security-events');


