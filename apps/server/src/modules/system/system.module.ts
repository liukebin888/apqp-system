import { Module } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { OrganizationController } from './organization/organization.controller'
import { OrganizationService } from './organization/organization.service'
import { UserController } from './user/user.controller'
import { UserService } from './user/user.service'
import { RoleController } from './role/role.controller'
import { RoleService } from './role/role.service'
import { MasterDataController } from './master-data/master-data.controller'
import { MasterDataService } from './master-data/master-data.service'
import { AuditLogController } from './audit-log/audit-log.controller'
import { AuditLogService } from './audit-log/audit-log.service'
import { ConfigController } from './config/config.controller'
import { ConfigService } from './config/config.service'

@Module({
  controllers: [
    OrganizationController,
    UserController,
    RoleController,
    MasterDataController,
    AuditLogController,
    ConfigController,
  ],
  providers: [
    PrismaService,
    OrganizationService,
    UserService,
    RoleService,
    MasterDataService,
    AuditLogService,
    ConfigService,
  ],
  exports: [UserService, OrganizationService, ConfigService],
})
export class SystemModule {}
