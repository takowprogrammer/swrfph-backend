import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query, Logger } from '@nestjs/common';
import { MedicinesService } from './medicines.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { QueryMedicinesDto } from './dto/query-medicines.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('medicines')
@Controller('medicines')
export class MedicinesController {
    private readonly logger = new Logger(MedicinesController.name);

    constructor(private readonly medicinesService: MedicinesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all medicines (public)' })
    findAll(@Query() query: QueryMedicinesDto) {
        this.logger.log(`📥 GET /medicines - Query: ${JSON.stringify(query)}`);
        return this.medicinesService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get medicine by ID (public)' })
    findOne(@Param('id') id: string) {
        return this.medicinesService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create medicine (admin only)' })
    create(@Body() createMedicineDto: CreateMedicineDto) {
        return this.medicinesService.create(createMedicineDto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update medicine (admin only)' })
    update(@Param('id') id: string, @Body() updateMedicineDto: UpdateMedicineDto) {
        return this.medicinesService.update(id, updateMedicineDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete medicine (admin only)' })
    remove(@Param('id') id: string) {
        return this.medicinesService.remove(id);
    }
}
