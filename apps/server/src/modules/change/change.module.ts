import { Module } from '@nestjs/common'
import { ChangeController } from './change.controller'
import { ChangeService } from './change.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [ChangeController],
  providers: [ChangeService, PrismaService],
  exports: [ChangeService],
})
export class ChangeModule {}
