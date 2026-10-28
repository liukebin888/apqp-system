import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { DashboardService } from './dashboard.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('工作台')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '跨模块 KPI 聚合' })
  async getOverview(@CurrentUser('userId') userId: number) {
    return this.service.getOverview(userId)
  }

  @Get('warnings')
  @ApiOperation({ summary: '预警信息' })
  async getWarnings(@CurrentUser('userId') userId: number) {
    return this.service.getWarnings(userId)
  }

  @Get('my-tasks')
  @ApiOperation({ summary: '跨模块统一待办' })
  async getMyTasks(@CurrentUser('userId') userId: number) {
    return this.service.getMyTasks(userId)
  }

  @Get('trends')
  @ApiOperation({ summary: '月度趋势数据' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  async getTrends(@Query('months') months?: number) {
    return this.service.getTrends(months || 6)
  }

  @Get('process-overview/:projectId')
  @ApiOperation({ summary: '流程总览 - APQP五阶段聚合' })
  async getProcessOverview(@Param('projectId') projectId: string) {
    return { code: 0, data: await this.service.getProcessOverview(+projectId), message: 'success' }
  }
}
