const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const sampleTemplates = [
    {
        name: 'Monthly Sales Report',
        description: 'Comprehensive monthly sales analysis with revenue trends and top products',
        category: 'Sales',
        isPublic: true,
        config: {
            dataSource: 'orders',
            components: [
                {
                    type: 'chart',
                    title: 'Monthly Revenue Trend',
                    config: {
                        chartType: 'line',
                        fields: ['createdAt', 'totalPrice'],
                        groupBy: ['month'],
                        aggregates: [{ field: 'totalPrice', operation: 'sum' }]
                    }
                },
                {
                    type: 'table',
                    title: 'Top Selling Products',
                    config: {
                        fields: ['medicineName', 'quantity', 'revenue'],
                        groupBy: ['medicineName'],
                        aggregates: [
                            { field: 'quantity', operation: 'sum' },
                            { field: 'revenue', operation: 'sum' }
                        ],
                        sortBy: 'revenue',
                        sortOrder: 'desc',
                        limit: 10
                    }
                }
            ],
            filters: {},
            groupBy: ['month'],
            aggregates: [
                { field: 'totalPrice', operation: 'sum' },
                { field: 'id', operation: 'count' }
            ]
        }
    },
    {
        name: 'Inventory Analysis',
        description: 'Current inventory status and turnover analysis',
        category: 'Inventory',
        isPublic: true,
        config: {
            dataSource: 'medicines',
            components: [
                {
                    type: 'chart',
                    title: 'Stock Levels by Category',
                    config: {
                        chartType: 'pie',
                        fields: ['category', 'stock'],
                        groupBy: ['category'],
                        aggregates: [{ field: 'stock', operation: 'sum' }]
                    }
                },
                {
                    type: 'table',
                    title: 'Low Stock Alert',
                    config: {
                        fields: ['name', 'category', 'stock', 'minStock'],
                        filters: { stock: { lt: 'minStock' } },
                        sortBy: 'stock',
                        sortOrder: 'asc'
                    }
                }
            ],
            filters: {},
            groupBy: ['category'],
            aggregates: [
                { field: 'stock', operation: 'sum' },
                { field: 'id', operation: 'count' }
            ]
        }
    },
    {
        name: 'User Activity Report',
        description: 'User registration trends and activity analysis',
        category: 'Users',
        isPublic: true,
        config: {
            dataSource: 'users',
            components: [
                {
                    type: 'chart',
                    title: 'User Registration Trend',
                    config: {
                        chartType: 'bar',
                        fields: ['createdAt'],
                        groupBy: ['month'],
                        aggregates: [{ field: 'id', operation: 'count' }]
                    }
                },
                {
                    type: 'table',
                    title: 'User Statistics',
                    config: {
                        fields: ['role', 'count'],
                        groupBy: ['role'],
                        aggregates: [{ field: 'id', operation: 'count' }]
                    }
                }
            ],
            filters: {},
            groupBy: ['month'],
            aggregates: [{ field: 'id', operation: 'count' }]
        }
    },
    {
        name: 'Security Audit Report',
        description: 'Security events and audit log analysis',
        category: 'Security',
        isPublic: false,
        config: {
            dataSource: 'auditLogs',
            components: [
                {
                    type: 'chart',
                    title: 'Security Events by Severity',
                    config: {
                        chartType: 'pie',
                        fields: ['severity', 'count'],
                        groupBy: ['severity'],
                        aggregates: [{ field: 'id', operation: 'count' }]
                    }
                },
                {
                    type: 'table',
                    title: 'Recent Security Events',
                    config: {
                        fields: ['action', 'severity', 'createdAt', 'user'],
                        sortBy: 'createdAt',
                        sortOrder: 'desc',
                        limit: 20
                    }
                }
            ],
            filters: {},
            groupBy: ['severity'],
            aggregates: [{ field: 'id', operation: 'count' }]
        }
    }
]

async function seedReportTemplates() {
    try {
        console.log('🌱 Seeding report templates...')

        // Get the admin user ID
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        })

        if (!adminUser) {
            console.error('❌ No admin user found. Please create an admin user first.')
            return
        }

        // Create report templates
        for (const template of sampleTemplates) {
            await prisma.reportTemplate.create({
                data: {
                    ...template,
                    createdBy: adminUser.id
                }
            })
        }

        console.log('✅ Successfully seeded report templates!')
        console.log(`📊 Created ${sampleTemplates.length} report templates`)

    } catch (error) {
        console.error('❌ Error seeding report templates:', error)
    } finally {
        await prisma.$disconnect()
    }
}

seedReportTemplates()


