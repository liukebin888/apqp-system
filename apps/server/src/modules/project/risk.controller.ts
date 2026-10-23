import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { RiskService } from './risk.service'
import { PaginationDto } from '../../common/dto/pagination.dto'

@ApiTags('风险管理')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/risks')
export class RiskController {
  constructor(private readonly service: RiskService) {}

  @Get()
  @ApiOperation({ summary: '风险列表' })
  async findByProject(
    @Param('projectId') projectId: string,
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.service.findByProject(+projectId, { ...query, status, category })
  }

  @Get('matrix')
  @ApiOperation({ summary: '风险矩阵' })
  async getRiskMatrix(@Param('projectId') projectId: string) {
    return this.service.getRiskMatrix(+projectId)
  }

  @Post()
  @ApiOperation({ summary: '登记风险' })
  async create(@Param('projectId') projectId: string, @Body() body: any) {
    return this.service.create({ ...body, projectId: +projectId })
  }

  @Put(':id')
  @ApiOperation({ summary: '更新风险' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body)
  }

  @Post(':id/responses')
  @ApiOperation({ summary: '添加风险应对措施' })
  async addResponse(@Param('id') id: string, @Body() body: any) {
    return this.service.addResponse(+id, body)
  }

  @Put('responses/:responseId')
  @ApiOperation({ summary: '更新应对措施' })
  async updateResponse(@Param('responseId') responseId: string, @Body() body: any) {
    return this.service.updateResponse(+responseId, body)
  }
}
