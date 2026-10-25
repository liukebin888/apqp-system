import { Module } from '@nestjs/common'
import { PpapController } from './ppap.controller'
import { PpapService } from './ppap.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [PpapController],
  providers: [PpapService, PrismaService],
  exports: [PpapService],
})
export class PpapModule {}
