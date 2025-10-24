import { Controller, Post, Body, Get, Param, UseGuards, Patch, Query, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Roles(UserRole.PROVIDER)
    @Post()
    create(@Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(createOrderDto);
    }

    @Roles(UserRole.PROVIDER)
    @Get('me')
    findAllForAuthenticatedProvider(@Request() req: any, @Query('page') page: string = '1', @Query('limit') limit: string = '10', @Query('status') status?: string) {
        return this.ordersService.findAll({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            status,
            userId: req.user?.userId,
        });
    }

    @Roles(UserRole.ADMIN)
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
        return this.ordersService.updateStatus(id, updateOrderStatusDto.status);
    }

    @Roles(UserRole.ADMIN)
    @Get('past')
    findPastOrders(@Query() query: any) {
        return this.ordersService.findPastOrders(query);
    }

    @Roles(UserRole.ADMIN)
    @Get()
    findAll(@Query() query: any) {
        return this.ordersService.findAll(query);
    }

    @Get('stats')
    getOrderStats(@Request() req: any) {
        const userId = req.user.role === 'PROVIDER' ? req.user.userId : undefined;
        return this.ordersService.getOrderStats(userId);
    }
}
