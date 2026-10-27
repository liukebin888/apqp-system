import { Module } from '@nestjs/common'
import { SupplierCollabController } from './supplier-collab.controller'
import { SupplierCollabService } from './supplier-collab.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [SupplierCollabController],
  providers: [SupplierCollabService, PrismaService],
  exports: [SupplierCollabService],
})
export class SupplierCollabModule {}
