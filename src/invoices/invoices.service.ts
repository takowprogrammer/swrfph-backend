import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
    constructor(private prisma: PrismaService) { }

    async create(createInvoiceDto: CreateInvoiceDto) {
        const invoiceId = await this.generateInvoiceId();

        // Convert date string to DateTime for Prisma
        const dueDate = new Date(createInvoiceDto.dueDate);

        return this.prisma.invoice.create({
            data: {
                ...createInvoiceDto,
                invoiceId,
                dueDate,
            },
        });
    }

    async findAll() {
        return this.prisma.invoice.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.invoice.findUnique({ where: { id } });
    }

    async findByOrderId(orderId: string) {
        return this.prisma.invoice.findFirst({ where: { orderId } });
    }

    async updateStatus(id: string, status: string) {
        return this.prisma.invoice.update({
            where: { id },
            data: { status },
        });
    }

    async generateInvoiceId(): Promise<string> {
        const count = await this.prisma.invoice.count();
        return `INV-${String(count + 1).padStart(3, '0')}`;
    }
}
