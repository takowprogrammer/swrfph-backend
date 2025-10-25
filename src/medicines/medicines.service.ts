import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Medicine } from '@prisma/client';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { QueryMedicinesDto } from './dto/query-medicines.dto';

@Injectable()
export class MedicinesService {
    private readonly logger = new Logger(MedicinesService.name);

    constructor(private prisma: PrismaService) { }

    async findAll(query: QueryMedicinesDto) {
        const { search, category, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = query;
        const skip = (page - 1) * limit;

        this.logger.log(`🔍 Finding medicines with query: ${JSON.stringify(query)}`);

        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search } },
                    { description: { contains: search } },
                ],
            }),
            ...(category && { category }),
        };

        const orderBy = {
            [sortBy]: sortOrder,
        };

        this.logger.debug(`📊 Where clause: ${JSON.stringify(where)}`);
        this.logger.debug(`📈 Order by: ${JSON.stringify(orderBy)}`);
        this.logger.debug(`📄 Pagination: page=${page}, limit=${limit}, skip=${skip}`);

        try {
            const [medicines, total] = await Promise.all([
                this.prisma.medicine.findMany({
                    where,
                    orderBy,
                    skip,
                    take: limit,
                }),
                this.prisma.medicine.count({ where }),
            ]);

            this.logger.log(`✅ Found ${medicines.length} medicines (${total} total)`);

            return {
                data: medicines,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            this.logger.error(`❌ Error finding medicines:`, error.stack || error);
            throw error;
        }
    }

    async findOne(id: string): Promise<Medicine | null> {
        return this.prisma.medicine.findUnique({ where: { id } });
    }

    async create(createMedicineDto: CreateMedicineDto): Promise<Medicine> {
        return this.prisma.medicine.create({ data: createMedicineDto });
    }

    async update(id: string, updateMedicineDto: UpdateMedicineDto): Promise<Medicine> {
        return this.prisma.medicine.update({
            where: { id },
            data: updateMedicineDto,
        });
    }

    async remove(id: string): Promise<Medicine> {
        return this.prisma.medicine.delete({ where: { id } });
    }
}
