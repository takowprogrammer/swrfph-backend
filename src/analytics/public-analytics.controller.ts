import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class PublicAnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('new-medicine-announcements')
    async getNewMedicineAnnouncements(
        @Query('limit') limit: string = '5'
    ) {
        const limitNumber = parseInt(limit, 10);
        return this.analyticsService.getNewMedicineAnnouncements(limitNumber);
    }
}

