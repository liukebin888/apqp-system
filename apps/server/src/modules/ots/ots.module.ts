import { Module } from '@nestjs/common'
import { OtsController } from './ots.controller'
import { OtsService } from './ots.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [OtsController],
  providers: [OtsService, PrismaService],
  exports: [OtsService],
})
export class OtsModule {}
