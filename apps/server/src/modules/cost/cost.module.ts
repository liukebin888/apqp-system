import { Module } from '@nestjs/common'
import { CostController } from './cost.controller'
import { CostService } from './cost.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [CostController],
  providers: [CostService, PrismaService],
  exports: [CostService],
})
export class CostModule {}
