import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSettingDto {
    @ApiProperty({ description: 'The setting key' })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty({ description: 'The setting value' })
    @IsString()
    @IsNotEmpty()
    value: string;

    @ApiProperty({ description: 'The setting category', enum: ['GENERAL', 'NOTIFICATION', 'INTEGRATION', 'BACKUP', 'ORGANIZATION'] })
    @IsString()
    @IsNotEmpty()
    category: string;
}
