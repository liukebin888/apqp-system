import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { AuditLogService } from './audit-log.service'
import { PaginationDto } from '../../../common/dto/pagination.dto'

@ApiTags('审计日志')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly service: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: '审计日志列表' })
  async findAll(
    @Query() query: PaginationDto,
    @Query('module') module?: string,
    @Query('userId') userId?: number,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll({ ...query, module, userId, action, startDate, endDate })
  }
}
