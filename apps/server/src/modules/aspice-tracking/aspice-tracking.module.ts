import { Module } from '@nestjs/common'
import { AspiceTrackingController } from './aspice-tracking.controller'
import { AspiceTrackingService } from './aspice-tracking.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [AspiceTrackingController],
  providers: [AspiceTrackingService, PrismaService],
  exports: [AspiceTrackingService],
})
export class AspiceTrackingModule {}
