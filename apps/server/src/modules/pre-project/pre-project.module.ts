import { Module } from '@nestjs/common'
import { PreProjectController } from './pre-project.controller'
import { PreProjectService } from './pre-project.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [PreProjectController],
  providers: [PreProjectService, PrismaService],
  exports: [PreProjectService],
})
export class PreProjectModule {}
