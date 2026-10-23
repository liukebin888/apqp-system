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
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
