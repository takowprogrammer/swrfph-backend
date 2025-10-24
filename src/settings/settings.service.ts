import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { CreateSettingDto } from './dto/create-setting.dto';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.setting.findMany({
            orderBy: { category: 'asc' },
        });
    }

    async findByCategory(category: string) {
        return this.prisma.setting.findMany({
            where: { category },
            orderBy: { key: 'asc' },
        });
    }

    async findOne(key: string) {
        return this.prisma.setting.findUnique({ where: { key } });
    }

    async create(createSettingDto: CreateSettingDto) {
        return this.prisma.setting.create({
            data: createSettingDto,
        });
    }

    async update(key: string, updateSettingDto: UpdateSettingDto) {
        return this.prisma.setting.update({
            where: { key },
            data: updateSettingDto,
        });
    }

    async upsert(key: string, value: string, category: string) {
        return this.prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value, category },
        });
    }

    async remove(key: string) {
        return this.prisma.setting.delete({ where: { key } });
    }

    async getOrganizationSettings() {
        return this.findByCategory('ORGANIZATION');
    }

    async updateOrganizationSettings(settings: {
        orgName?: string;
        orgAddress?: string;
        orgContact?: string;
        orgPhone?: string;
    }) {
        const updates = [];

        if (settings.orgName) {
            updates.push(this.upsert('org_name', settings.orgName, 'ORGANIZATION'));
        }
        if (settings.orgAddress) {
            updates.push(this.upsert('org_address', settings.orgAddress, 'ORGANIZATION'));
        }
        if (settings.orgContact) {
            updates.push(this.upsert('org_contact', settings.orgContact, 'ORGANIZATION'));
        }
        if (settings.orgPhone) {
            updates.push(this.upsert('org_phone', settings.orgPhone, 'ORGANIZATION'));
        }

        return Promise.all(updates);
    }

    async getNotificationSettings() {
        return this.findByCategory('NOTIFICATION');
    }

    async updateNotificationSettings(settings: {
        emailAlerts?: boolean;
        smsAlerts?: boolean;
    }) {
        const updates = [];

        if (settings.emailAlerts !== undefined) {
            updates.push(this.upsert('email_alerts', settings.emailAlerts.toString(), 'NOTIFICATION'));
        }
        if (settings.smsAlerts !== undefined) {
            updates.push(this.upsert('sms_alerts', settings.smsAlerts.toString(), 'NOTIFICATION'));
        }

        return Promise.all(updates);
    }

    async getGeneralSettings() {
        return this.findByCategory('GENERAL');
    }

    async updateGeneralSettings(settings: {
        language?: string;
        timezone?: string;
    }) {
        const updates = [];

        if (settings.language) {
            updates.push(this.upsert('language', settings.language, 'GENERAL'));
        }
        if (settings.timezone) {
            updates.push(this.upsert('timezone', settings.timezone, 'GENERAL'));
        }

        return Promise.all(updates);
    }
}
