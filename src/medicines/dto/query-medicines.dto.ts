import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryMedicinesDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(1000)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sortBy?: string = 'name';

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'asc';
}
