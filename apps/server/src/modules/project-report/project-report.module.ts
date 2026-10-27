import { Module } from '@nestjs/common'
import { ProjectReportController } from './project-report.controller'
import { ProjectReportService } from './project-report.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [ProjectReportController],
  providers: [ProjectReportService, PrismaService],
  exports: [ProjectReportService],
})
export class ProjectReportModule {}
