import { PartialType } from '@nestjs/mapped-types';
import { CreateSettingDto } from './create-setting.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto extends PartialType(CreateSettingDto) {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    value?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    category?: string;
}
