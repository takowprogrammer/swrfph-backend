import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderTemplateItemDto {
    @IsString()
    @IsNotEmpty()
    medicineId: string;

    @IsNumber()
    @IsPositive()
    quantity: number;

    @IsNumber()
    @IsPositive()
    price: number;
}

export class CreateOrderTemplateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderTemplateItemDto)
    items: OrderTemplateItemDto[];
}

export class UpdateOrderTemplateDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderTemplateItemDto)
    @IsOptional()
    items?: OrderTemplateItemDto[];
}

