import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PublicAnalyticsController } from './public-analytics.controller';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
    imports: [PrismaModule],
    providers: [AnalyticsService, NotificationsService],
    controllers: [AnalyticsController, PublicAnalyticsController],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
