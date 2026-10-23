import { Module } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { SequenceService } from '../../common/services/sequence.service'
import { ProjectController } from './project.controller'
import { ProjectService } from './project.service'
import { ScheduleController } from './schedule.controller'
import { ScheduleService } from './schedule.service'
import { RiskController } from './risk.controller'
import { RiskService } from './risk.service'

@Module({
  controllers: [ProjectController, ScheduleController, RiskController],
  providers: [PrismaService, SequenceService, ProjectService, ScheduleService, RiskService],
  exports: [ProjectService, ScheduleService, RiskService],
})
export class ProjectModule {}
