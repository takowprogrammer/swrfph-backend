import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Roles(UserRole.PROVIDER, UserRole.ADMIN)
    @Get('provider')
    getProviderStats(@Request() req: any) {
        return this.dashboardService.getProviderStats(req.user.userId);
    }

    @Roles(UserRole.ADMIN)
    @Get('admin')
    getAdminStats() {
        return this.dashboardService.getAdminStats();
    }

    @Roles(UserRole.PROVIDER, UserRole.ADMIN)
    @Get('low-stock')
    getLowStockMedicines() {
        return this.dashboardService.getLowStockMedicines();
    }

    @Roles(UserRole.PROVIDER, UserRole.ADMIN)
    @Get('stock-details/:medicineId')
    getStockDetails(@Param('medicineId') medicineId: string) {
        return this.dashboardService.getStockDetails(medicineId);
    }
}
