import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('revenue-trends')
    @Roles('ADMIN')
    async getRevenueTrends(@Query('months') months: string = '6') {
        return this.analyticsService.getRevenueTrends(parseInt(months));
    }

    @Get('user-growth')
    @Roles('ADMIN')
    async getUserGrowth(@Query('months') months: string = '6') {
        return this.analyticsService.getUserGrowth(parseInt(months));
    }

    @Get('medicine-performance')
    @Roles('ADMIN')
    async getMedicinePerformance(@Query('limit') limit: string = '10') {
        return this.analyticsService.getMedicinePerformance(parseInt(limit));
    }

    @Get('provider-performance')
    @Roles('ADMIN')
    async getProviderPerformance(@Query('limit') limit: string = '10') {
        return this.analyticsService.getProviderPerformance(parseInt(limit));
    }

    @Get('geographic-distribution')
    @Roles('ADMIN')
    async getGeographicDistribution() {
        return this.analyticsService.getGeographicDistribution();
    }

    @Get('seasonal-patterns')
    @Roles('ADMIN')
    async getSeasonalPatterns(@Query('year') year: string = '2024') {
        return this.analyticsService.getSeasonalPatterns(parseInt(year));
    }

    @Get('system-health')
    @Roles('ADMIN')
    async getSystemHealth() {
        return this.analyticsService.getSystemHealth();
    }

    @Get('search')
    @Roles('ADMIN')
    async globalSearch(
        @Query('q') query: string,
        @Query('type') type?: string,
        @Query('limit') limit: string = '10'
    ) {
        return this.analyticsService.globalSearch(query, type, parseInt(limit));
    }

    // Provider dashboard compatibility routes
    @Get('order-trends')
    @Roles('ADMIN', 'PROVIDER')
    async getOrderTrends(
        @Request() req: any,
        @Query('period') period: 'week' | 'month' = 'month',
        @Query('months') months: string = '6'
    ) {
        const userId = req.user?.userId;
        return this.analyticsService.getOrderTrends(userId, period, parseInt(months, 10));
    }

    @Get('top-ordered-medicines')
    @Roles('ADMIN', 'PROVIDER')
    async getTopOrderedMedicines(
        @Request() req: any,
        @Query('limit') limit: string = '10',
        @Query('months') months: string = '6'
    ) {
        const userId = req.user?.userId;
        return this.analyticsService.getTopOrderedMedicines(userId, parseInt(limit, 10), parseInt(months, 10));
    }

    @Get('spending-analysis')
    @Roles('ADMIN', 'PROVIDER')
    async getSpendingAnalysis(
        @Request() req: any,
        @Query('months') months: string = '6'
    ) {
        const userId = req.user?.userId;
        return this.analyticsService.getSpendingAnalysis(userId, parseInt(months, 10));
    }

    @Get('order-frequency-metrics')
    @Roles('ADMIN', 'PROVIDER')
    async getOrderFrequencyMetrics(@Request() req: any) {
        const userId = req.user?.role === 'PROVIDER' ? req.user?.userId : undefined;
        return this.analyticsService.getOrderFrequencyMetrics(userId);
    }
}