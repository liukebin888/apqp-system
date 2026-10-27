import { Module } from '@nestjs/common'
import { ClosureController } from './closure.controller'
import { ClosureService } from './closure.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [ClosureController],
  providers: [ClosureService, PrismaService],
  exports: [ClosureService],
})
export class ClosureModule {}
