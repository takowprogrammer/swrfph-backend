import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @Roles('ADMIN', 'PROVIDER')
    async getNotifications(
        @Request() req: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('type') type?: string,
        @Query('isRead') isRead?: string,
        @Query('search') search?: string,
    ) {
        const role = req.user?.role?.toLowerCase?.();
        if (role === 'admin' || role === 'super_admin') {
            return this.notificationsService.getNotifications({
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                type,
                isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
                search,
            });
        }
        // Provider: scope to own notifications + system-wide
        return this.notificationsService.findAll({
            page: Number(page),
            limit: Number(limit),
            type,
            search,
        } as any, req.user?.userId);
    }

    @Get('stats')
    @Roles('ADMIN', 'PROVIDER')
    async getNotificationStats(@Request() req: any) {
        const role = req.user?.role?.toLowerCase?.();
        const userScope = role === 'provider' ? req.user?.userId : undefined;
        return this.notificationsService.getNotificationStats(userScope);
    }

    @Post()
    @Roles('ADMIN')
    async createNotification(@Body() createNotificationDto: {
        event: string;
        details: string;
        type: string;
    }) {
        return this.notificationsService.createNotification(createNotificationDto);
    }

    @Patch(':id/read')
    @Roles('ADMIN', 'PROVIDER')
    async markAsRead(@Request() req: any, @Param('id') id: string) {
        const role = req.user?.role?.toLowerCase?.();
        if (role === 'provider') {
            return this.notificationsService.markAsRead(id, req.user?.userId);
        }
        return this.notificationsService.markAsRead(id);
    }

    @Patch('read-all')
    @Roles('ADMIN', 'PROVIDER')
    async markAllAsRead(@Request() req: any) {
        const role = req.user?.role?.toLowerCase?.();
        const userScope = role === 'provider' ? req.user?.userId : undefined;
        return this.notificationsService.markAllAsRead(userScope);
    }

    @Delete(':id')
    @Roles('ADMIN', 'PROVIDER')
    async deleteNotification(@Request() req: any, @Param('id') id: string) {
        const role = req.user?.role?.toLowerCase?.();
        if (role === 'provider') {
            return this.notificationsService.removeOwn(id, req.user?.userId);
        }
        return this.notificationsService.deleteNotification(id);
    }
}