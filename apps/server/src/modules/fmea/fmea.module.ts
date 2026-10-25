import { Module } from '@nestjs/common'
import { FmeaController } from './fmea.controller'
import { FmeaService } from './fmea.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [FmeaController],
  providers: [FmeaService, PrismaService],
  exports: [FmeaService],
})
export class FmeaModule {}
