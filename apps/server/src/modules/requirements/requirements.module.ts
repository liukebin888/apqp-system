import { Module } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { SequenceService } from '../../common/services/sequence.service'
import { RequirementsController } from './requirements.controller'
import { RequirementsService } from './requirements.service'

@Module({
  controllers: [RequirementsController],
  providers: [PrismaService, SequenceService, RequirementsService],
  exports: [RequirementsService],
})
export class RequirementsModule {}
