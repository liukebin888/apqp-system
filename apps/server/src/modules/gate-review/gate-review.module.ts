import { Module } from '@nestjs/common'
import { GateReviewController } from './gate-review.controller'
import { GateReviewService } from './gate-review.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [GateReviewController],
  providers: [GateReviewService, PrismaService],
  exports: [GateReviewService],
})
export class GateReviewModule {}
