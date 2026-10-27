import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { configuration, validate } from './config/configuration'
import { PrismaService } from './common/services/prisma.service'
import { AuthModule } from './modules/auth/auth.module'
import { SystemModule } from './modules/system/system.module'
import { WorkflowModule } from './modules/workflow/workflow.module'
import { ProjectModule } from './modules/project/project.module'
import { NotificationModule } from './modules/notification/notification.module'
import { DocumentModule } from './modules/document/document.module'
import { RequirementsModule } from './modules/requirements/requirements.module'
import { PreProjectModule } from './modules/pre-project/pre-project.module'
import { GateReviewModule } from './modules/gate-review/gate-review.module'
import { OtsModule } from './modules/ots/ots.module'
import { PpapModule } from './modules/ppap/ppap.module'
import { CostModule } from './modules/cost/cost.module'
import { ProcurementModule } from './modules/procurement/procurement.module'
import { QualityModule } from './modules/quality/quality.module'
import { FmeaModule } from './modules/fmea/fmea.module'
import { ChangeModule } from './modules/change/change.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { SafetyModule } from './modules/safety/safety.module'
import { IssueModule } from './modules/issue/issue.module'
import { ProjectReportModule } from './modules/project-report/project-report.module'
import { ClosureModule } from './modules/closure/closure.module'
import { SupplierCollabModule } from './modules/supplier-collab/supplier-collab.module'
import { KnowledgeModule } from './modules/knowledge/knowledge.module'
import { SecurityModule } from './modules/security/security.module'
import { SecurityAuditModule } from './modules/security-audit/security-audit.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    SystemModule,
    WorkflowModule,
    ProjectModule,
    NotificationModule,
    DocumentModule,
    RequirementsModule,
    PreProjectModule,
    GateReviewModule,
    OtsModule,
    PpapModule,
    CostModule,
    ProcurementModule,
    QualityModule,
    FmeaModule,
    ChangeModule,
    DashboardModule,
    SafetyModule,
    IssueModule,
    ProjectReportModule,
    ClosureModule,
    SupplierCollabModule,
    KnowledgeModule,
    SecurityModule,
    SecurityAuditModule,
    AnalyticsModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
