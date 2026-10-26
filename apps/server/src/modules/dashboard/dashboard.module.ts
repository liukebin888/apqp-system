import { Module } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'

@Module({
  controllers: [DashboardController],
  providers: [PrismaService, DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
