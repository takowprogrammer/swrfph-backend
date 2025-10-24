import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { OrderTemplatesService } from './order-templates.service';
import { CreateOrderTemplateDto, UpdateOrderTemplateDto } from './dto/order-template.dto';

interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role: UserRole;
    };
}

@Controller('order-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderTemplatesController {
    constructor(private readonly orderTemplatesService: OrderTemplatesService) { }

    @Post()
    @Roles(UserRole.PROVIDER, UserRole.ADMIN)
    async createTemplate(
        @Request() req: AuthenticatedRequest,
        @Body() createDto: CreateOrderTemplateDto
    ) {
        const userId = req.user.userId;
        return this.orderTemplatesService.createTemplate(userId, createDto);
    }

    @Get()
    @Roles(UserRole.PROVIDER, UserRole.ADMIN)
    async getUserTemplates(@Request() req: AuthenticatedRequest) {
        const userId = req.user.userId;
        return this.orderTemplatesService.getUserTemplates(userId);
    }

    @Get(':id')
    @Roles(UserRole.PROVIDER, UserRole.ADMIN)
    async getTemplateById(
        @Request() req: AuthenticatedRequest,
        @Param('id') templateId: string
    ) {
        const userId = req.user.userId;
        return this.orderTemplatesService.getTemplateById(templateId, userId);
    }

    @Put(':id')
    @Roles(UserRole.PROVIDER, UserRole.ADMIN)
    async updateTemplate(
        @Request() req: AuthenticatedRequest,
        @Param('id') templateId: string,
        @Body() updateDto: UpdateOrderTemplateDto
    ) {
        const userId = req.user.userId;
        return this.orderTemplatesService.updateTemplate(templateId, userId, updateDto);
    }

    @Delete(':id')
    @Roles(UserRole.PROVIDER, UserRole.ADMIN)
    async deleteTemplate(
        @Request() req: AuthenticatedRequest,
        @Param('id') templateId: string
    ) {
        const userId = req.user.userId;
        await this.orderTemplatesService.deleteTemplate(templateId, userId);
        return { message: 'Order template deleted successfully' };
    }

    @Post(':id/create-order')
    @Roles(UserRole.PROVIDER, UserRole.ADMIN)
    async createOrderFromTemplate(
        @Request() req: AuthenticatedRequest,
        @Param('id') templateId: string
    ) {
        const userId = req.user.userId;
        return this.orderTemplatesService.createOrderFromTemplate(templateId, userId);
    }
}
