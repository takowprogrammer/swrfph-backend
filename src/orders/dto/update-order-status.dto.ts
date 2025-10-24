import { IsString, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
    @IsString()
    @IsIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    status: string;
}
