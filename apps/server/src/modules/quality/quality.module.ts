import { Module } from '@nestjs/common'
import { QualityController } from './quality.controller'
import { QualityService } from './quality.service'
import { QualityScheduler } from './quality.scheduler'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [QualityController],
  providers: [QualityService, QualityScheduler, PrismaService],
  exports: [QualityService],
})
export class QualityModule {}
