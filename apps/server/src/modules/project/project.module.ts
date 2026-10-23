import { Module } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { SequenceService } from '../../common/services/sequence.service'
import { ProjectController } from './project.controller'
import { ProjectService } from './project.service'
import { ScheduleController } from './schedule.controller'
import { ScheduleService } from './schedule.service'
import { RiskController } from './risk.controller'
import { RiskService } from './risk.service'
import { MilestoneController } from './milestone.controller'
import { MilestoneService } from './milestone.service'

@Module({
  controllers: [ProjectController, ScheduleController, RiskController, MilestoneController],
  providers: [PrismaService, SequenceService, ProjectService, ScheduleService, RiskService, MilestoneService],
  exports: [ProjectService, ScheduleService, RiskService, MilestoneService],
})
export class ProjectModule {}
