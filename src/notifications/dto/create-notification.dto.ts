import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
    @ApiProperty({ description: 'The notification event title' })
    @IsString()
    @IsNotEmpty()
    event: string;

    @ApiProperty({ description: 'Additional details about the notification' })
    @IsString()
    @IsNotEmpty()
    details: string;

    @ApiProperty({ description: 'Type of notification', enum: ['ORDER', 'INVENTORY', 'SYSTEM', 'SHIPMENT', 'PRICE_CHANGE', 'STOCK_ALERT', 'PROMOTION'] })
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiProperty({ description: 'User ID for user-specific notifications', required: false })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiProperty({ description: 'Whether the notification has been read', required: false })
    @IsOptional()
    @IsBoolean()
    isRead?: boolean = false;
}
