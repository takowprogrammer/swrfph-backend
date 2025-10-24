import { IsString, IsNotEmpty, IsNumber, IsEmail, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
    @ApiProperty({ description: 'The order ID this invoice is for' })
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty({ description: 'Customer name' })
    @IsString()
    @IsNotEmpty()
    customerName: string;

    @ApiProperty({ description: 'Customer email' })
    @IsEmail()
    customerEmail: string;

    @ApiProperty({ description: 'Billing address' })
    @IsString()
    @IsNotEmpty()
    billingAddress: string;

    @ApiProperty({ description: 'Invoice amount' })
    @IsNumber()
    amount: number;

    @ApiProperty({ description: 'Tax amount', required: false })
    @IsNumber()
    tax?: number = 0;

    @ApiProperty({ description: 'Discount amount', required: false })
    @IsNumber()
    discount?: number = 0;

    @ApiProperty({ description: 'Total amount after tax and discount' })
    @IsNumber()
    totalAmount: number;

    @ApiProperty({ description: 'Due date' })
    @IsDateString()
    dueDate: string;
}
