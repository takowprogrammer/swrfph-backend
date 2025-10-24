import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderTemplatesService } from './order-templates.service';
import { OrderTemplatesController } from './order-templates.controller';

@Module({
    imports: [PrismaModule],
    providers: [OrderTemplatesService],
    controllers: [OrderTemplatesController],
    exports: [OrderTemplatesService],
})
export class OrderTemplatesModule { }

