import { Module, forwardRef } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { DatabaseAuditService } from './database-audit.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule, forwardRef(() => AuthModule)],
    providers: [AuditService, DatabaseAuditService],
    controllers: [AuditController],
    exports: [AuditService],
})
export class AuditModule { }
