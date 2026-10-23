import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { MilestoneService } from './milestone.service'

@ApiTags('里程碑管理')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/milestones')
export class MilestoneController {
  constructor(private readonly service: MilestoneService) {}

  @Get()
  @ApiOperation({ summary: '获取项目里程碑列表' })
  async findByProject(@Param('projectId') projectId: string) {
    return this.service.findByProject(+projectId)
  }

  @Post()
  @ApiOperation({ summary: '创建里程碑' })
  async create(@Param('projectId') projectId: string, @Body() body: any) {
    return this.service.create({ ...body, projectId: +projectId })
  }

  @Put(':id')
  @ApiOperation({ summary: '更新里程碑' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除里程碑' })
  async delete(@Param('id') id: string) {
    return this.service.delete(+id)
  }
}
