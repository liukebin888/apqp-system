import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { Response } from 'express'
import { ProjectService } from './project.service'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { generateCsv, sendCsv } from '../../common/utils/csv.util'

@ApiTags('项目管理')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Get()
  @ApiOperation({ summary: '项目列表' })
  async findAll(
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('managerId') managerId?: number,
    @Query('keyword') keyword?: string,
  ) {
    return this.service.findAll({ ...query, status, managerId, keyword })
  }

  @Get('stats')
  @ApiOperation({ summary: '项目统计' })
  async getStats() {
    return this.service.getStats()
  }

  @Get('export')
  @ApiOperation({ summary: '导出项目CSV' })
  async exportCsv(
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('managerId') managerId?: number,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.service.findAll({ page: 1, pageSize: 10000, status, managerId, keyword } as any)
    const list = (result as any)?.list || []
    const headers = ['项目编号', '项目名称', '客户', '状态', '项目经理', '预算', '开始日期', '结束日期']
    const rows = list.map((p: any) => [
      p.code, p.name, p.customer?.name || '', p.status, p.manager?.realName || '',
      p.budget, p.start_date, p.end_date,
    ])
    sendCsv(res, `projects_${Date.now()}.csv`, generateCsv(headers, rows))
  }

  @Get(':id')
  @ApiOperation({ summary: '项目详情' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(+id)
  }

  @Post()
  @ApiOperation({ summary: '创建项目' })
  async create(@Body() body: any) {
    return this.service.create(body)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body)
  }

  @Put(':id/team')
  @ApiOperation({ summary: '更新项目团队' })
  async updateTeam(@Param('id') id: string, @Body() body: { members: Array<{ userId: number; role: string }> }) {
    return this.service.updateTeam(+id, body.members)
  }
}
