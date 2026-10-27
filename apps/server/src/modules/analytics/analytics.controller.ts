import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { AnalyticsService } from './analytics.service'

@ApiTags('数据分析')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('project-stats')
  @ApiOperation({ summary: '项目统计分析' })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  async getProjectStats(@Query('projectId') projectId?: number) {
    const data = await this.service.getProjectStats(projectId ? Number(projectId) : undefined)
    return { code: 0, data, message: 'success' }
  }

  @Get('cost-stats')
  @ApiOperation({ summary: '成本统计分析' })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  async getCostStats(@Query('projectId') projectId?: number) {
    const data = await this.service.getCostStats(projectId ? Number(projectId) : undefined)
    return { code: 0, data, message: 'success' }
  }

  @Get('quality-stats')
  @ApiOperation({ summary: '质量问题分析统计' })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  async getQualityStats(@Query('projectId') projectId?: number) {
    const data = await this.service.getQualityStats(projectId ? Number(projectId) : undefined)
    return { code: 0, data, message: 'success' }
  }

  @Get('supplier-stats')
  @ApiOperation({ summary: '供应商绩效统计' })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  async getSupplierStats(@Query('projectId') projectId?: number) {
    const data = await this.service.getSupplierStats(projectId ? Number(projectId) : undefined)
    return { code: 0, data, message: 'success' }
  }

  @Get('safety-stats')
  @ApiOperation({ summary: '功能安全危害分析统计' })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  async getSafetyStats(@Query('projectId') projectId?: number) {
    const data = await this.service.getSafetyStats(projectId ? Number(projectId) : undefined)
    return { code: 0, data, message: 'success' }
  }

  @Get('trends')
  @ApiOperation({ summary: '趋势数据（按月聚合）' })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['progress', 'cost', 'quality'] })
  @ApiQuery({ name: 'granularity', required: false, type: String })
  async getTrends(
    @Query('projectId') projectId?: number,
    @Query('type') type?: string,
    @Query('granularity') granularity?: string,
  ) {
    const data = await this.service.getTrendData(
      projectId ? Number(projectId) : undefined,
      type,
      granularity,
    )
    return { code: 0, data, message: 'success' }
  }
}
