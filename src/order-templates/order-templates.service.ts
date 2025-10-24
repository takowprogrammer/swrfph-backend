import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderTemplateDto, UpdateOrderTemplateDto } from './dto/order-template.dto';

export interface OrderTemplate {
    id: string;
    name: string;
    description?: string;
    userId: string;
    items: OrderTemplateItem[];
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderTemplateItem {
    id: string;
    medicineId: string;
    medicineName: string;
    quantity: number;
    price: number;
}

@Injectable()
export class OrderTemplatesService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a new order template
     */
    async createTemplate(userId: string, createDto: CreateOrderTemplateDto): Promise<OrderTemplate> {
        const template = await this.prisma.orderTemplate.create({
            data: {
                name: createDto.name,
                description: createDto.description,
                userId,
                items: {
                    create: createDto.items.map(item => ({
                        medicineId: item.medicineId,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });

        return this.mapToOrderTemplate(template);
    }

    /**
     * Get all templates for a user
     */
    async getUserTemplates(userId: string): Promise<OrderTemplate[]> {
        const templates = await this.prisma.orderTemplate.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        medicine: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return templates.map(template => this.mapToOrderTemplate(template));
    }

    /**
     * Get a specific template by ID
     */
    async getTemplateById(templateId: string, userId: string): Promise<OrderTemplate> {
        const template = await this.prisma.orderTemplate.findFirst({
            where: {
                id: templateId,
                userId,
            },
            include: {
                items: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });

        if (!template) {
            throw new NotFoundException('Order template not found');
        }

        return this.mapToOrderTemplate(template);
    }

    /**
     * Update an order template
     */
    async updateTemplate(
        templateId: string,
        userId: string,
        updateDto: UpdateOrderTemplateDto
    ): Promise<OrderTemplate> {
        const existingTemplate = await this.prisma.orderTemplate.findFirst({
            where: {
                id: templateId,
                userId,
            },
        });

        if (!existingTemplate) {
            throw new NotFoundException('Order template not found');
        }

        // Delete existing items and create new ones
        await this.prisma.orderTemplateItem.deleteMany({
            where: { templateId },
        });

        const template = await this.prisma.orderTemplate.update({
            where: { id: templateId },
            data: {
                name: updateDto.name,
                description: updateDto.description,
                items: updateDto.items ? {
                    create: updateDto.items.map(item => ({
                        medicineId: item.medicineId,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                } : undefined,
            },
            include: {
                items: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });

        return this.mapToOrderTemplate(template);
    }

    /**
     * Delete an order template
     */
    async deleteTemplate(templateId: string, userId: string): Promise<void> {
        const template = await this.prisma.orderTemplate.findFirst({
            where: {
                id: templateId,
                userId,
            },
        });

        if (!template) {
            throw new NotFoundException('Order template not found');
        }

        await this.prisma.orderTemplate.delete({
            where: { id: templateId },
        });
    }

    /**
     * Create an order from a template
     */
    async createOrderFromTemplate(templateId: string, userId: string): Promise<any> {
        const template = await this.getTemplateById(templateId, userId);

        // Create the order
        const order = await this.prisma.order.create({
            data: {
                userId,
                status: 'pending',
                totalPrice: template.items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
                items: {
                    create: template.items.map(item => ({
                        medicineId: item.medicineId,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });

        return order;
    }

    /**
     * Map Prisma template to OrderTemplate interface
     */
    private mapToOrderTemplate(template: any): OrderTemplate {
        return {
            id: template.id,
            name: template.name,
            description: template.description,
            userId: template.userId,
            items: template.items.map((item: any) => ({
                id: item.id,
                medicineId: item.medicineId,
                medicineName: item.medicine.name,
                quantity: item.quantity,
                price: item.price,
            })),
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
        };
    }
}
