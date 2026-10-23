import { Module } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { DefinitionController } from './definition/definition.controller'
import { DefinitionService } from './definition/definition.service'
import { InstanceController } from './instance/instance.controller'
import { InstanceService } from './instance/instance.service'

@Module({
  controllers: [DefinitionController, InstanceController],
  providers: [PrismaService, DefinitionService, InstanceService],
  exports: [DefinitionService, InstanceService],
})
export class WorkflowModule {}
