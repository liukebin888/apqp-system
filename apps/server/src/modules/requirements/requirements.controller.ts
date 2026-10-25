import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { RequirementsService } from './requirements.service'
import { PaginationDto } from '../../common/dto/pagination.dto'

@ApiTags('A-SPICE 需求管理')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/requirements')
export class RequirementsController {
  constructor(private readonly service: RequirementsService) {}

  // ── Requirements ──

  @Get()
  @ApiOperation({ summary: '需求列表' })
  async findByProject(
    @Param('projectId') projectId: string,
    @Query() query: PaginationDto,
    @Query('reqType') reqType?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.service.findByProject(+projectId, { ...query, reqType, status, keyword })
  }

  @Get('trace-matrix')
  @ApiOperation({ summary: '需求追溯矩阵' })
  async getTraceMatrix(@Param('projectId') projectId: string) {
    return this.service.getTraceMatrix(+projectId)
  }

  @Get('coverage')
  @ApiOperation({ summary: '覆盖率分析' })
  async analyzeCoverage(@Param('projectId') projectId: string) {
    return this.service.analyzeCoverage(+projectId)
  }

  @Get(':id')
  @ApiOperation({ summary: '需求详情' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(+id)
  }

  @Post()
  @ApiOperation({ summary: '创建需求' })
  async create(@Param('projectId') projectId: string, @Body() body: any) {
    return this.service.create({ ...body, projectId: +projectId })
  }

  @Put(':id')
  @ApiOperation({ summary: '更新需求' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除需求' })
  async delete(@Param('id') id: string) {
    return this.service.delete(+id)
  }

  // ── Trace Links ──

  @Post('trace-links')
  @ApiOperation({ summary: '创建追溯链接' })
  async createTraceLink(@Body() body: any) {
    return this.service.createTraceLink(body)
  }

  @Delete('trace-links/:linkId')
  @ApiOperation({ summary: '删除追溯链接' })
  async deleteTraceLink(@Param('linkId') linkId: string) {
    return this.service.deleteTraceLink(+linkId)
  }

  // ── Baselines ──

  @Get('baselines/list')
  @ApiOperation({ summary: '基线列表' })
  async findBaselines(@Param('projectId') projectId: string) {
    return this.service.findBaselines(+projectId)
  }

  @Post('baselines')
  @ApiOperation({ summary: '创建基线' })
  async createBaseline(@Param('projectId') projectId: string, @Body() body: any) {
    return this.service.createBaseline({ ...body, projectId: +projectId })
  }

  @Put('baselines/:id/status')
  @ApiOperation({ summary: '更新基线状态' })
  async updateBaselineStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateBaselineStatus(+id, body.status)
  }

  // ── Change Requests ──

  @Get('change-requests/list')
  @ApiOperation({ summary: '变更请求列表' })
  async findChangeRequests(
    @Param('projectId') projectId: string,
    @Query() query: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.service.findChangeRequests(+projectId, { ...query, status })
  }

  @Post('change-requests')
  @ApiOperation({ summary: '创建变更请求' })
  async createChangeRequest(@Param('projectId') projectId: string, @Body() body: any) {
    return this.service.createChangeRequest({ ...body, projectId: +projectId })
  }

  @Put('change-requests/:id/status')
  @ApiOperation({ summary: '更新变更请求状态' })
  async updateChangeRequestStatus(
    @Param('id') id: string,
    @Body() body: { status: string; approvedById?: number },
  ) {
    return this.service.updateChangeRequestStatus(+id, body.status, body.approvedById)
  }
}
