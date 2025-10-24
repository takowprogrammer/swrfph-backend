import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: [
                // Disabled query logging to reduce overhead during debugging
                // { emit: 'stdout', level: 'query' },
                { emit: 'stdout', level: 'info' },
                { emit: 'stdout', level: 'warn' },
                { emit: 'stdout', level: 'error' },
            ],
        });
    }

    async onModuleInit() {
        try {
            this.logger.log('🔌 Connecting to database...');
            await this.$connect();
            this.logger.log('✅ Database connected successfully');

            // Test database connection
            await this.$queryRaw`SELECT 1`;
            this.logger.log('🧪 Database connection test passed');
        } catch (error) {
            this.logger.error('❌ Failed to connect to database:', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        this.logger.log('🔌 Disconnecting from database...');
        await this.$disconnect();
        this.logger.log('✅ Database disconnected');
    }
}
