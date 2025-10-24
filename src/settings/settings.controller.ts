import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Roles(UserRole.ADMIN)
    @Get()
    findAll() {
        return this.settingsService.findAll();
    }

    @Get('category/:category')
    findByCategory(@Param('category') category: string) {
        return this.settingsService.findByCategory(category);
    }

    @Get('organization')
    getOrganizationSettings() {
        return this.settingsService.getOrganizationSettings();
    }

    @Get('notification-settings')
    getNotificationSettings() {
        return this.settingsService.getNotificationSettings();
    }

    @Get('general')
    getGeneralSettings() {
        return this.settingsService.getGeneralSettings();
    }

    @Get(':key')
    findOne(@Param('key') key: string) {
        return this.settingsService.findOne(key);
    }

    @Roles(UserRole.ADMIN)
    @Post()
    create(@Body() createSettingDto: CreateSettingDto) {
        return this.settingsService.create(createSettingDto);
    }

    @Roles(UserRole.ADMIN)
    @Patch('organization')
    updateOrganizationSettings(@Body() settings: {
        orgName?: string;
        orgAddress?: string;
        orgContact?: string;
        orgPhone?: string;
    }) {
        return this.settingsService.updateOrganizationSettings(settings);
    }

    @Roles(UserRole.ADMIN)
    @Patch('notification-settings')
    updateNotificationSettings(@Body() settings: {
        emailAlerts?: boolean;
        smsAlerts?: boolean;
    }) {
        return this.settingsService.updateNotificationSettings(settings);
    }

    @Roles(UserRole.ADMIN)
    @Patch('general')
    updateGeneralSettings(@Body() settings: {
        language?: string;
        timezone?: string;
    }) {
        return this.settingsService.updateGeneralSettings(settings);
    }

    @Roles(UserRole.ADMIN)
    @Patch(':key')
    update(@Param('key') key: string, @Body() updateSettingDto: UpdateSettingDto) {
        return this.settingsService.update(key, updateSettingDto);
    }

    @Roles(UserRole.ADMIN)
    @Delete(':key')
    remove(@Param('key') key: string) {
        return this.settingsService.remove(key);
    }
}
