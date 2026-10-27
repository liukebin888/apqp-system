import { Module } from '@nestjs/common'
import { SecurityAuditController } from './security-audit.controller'
import { SecurityAuditService } from './security-audit.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [SecurityAuditController],
  providers: [SecurityAuditService, PrismaService],
  exports: [SecurityAuditService],
})
export class SecurityAuditModule {}
