import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { ScheduleService } from './schedule.service'

@ApiTags('进度计划')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/schedule')
export class ScheduleController {
  constructor(private readonly service: ScheduleService) {}

  @Get()
  @ApiOperation({ summary: '获取项目进度计划' })
  async getSchedule(@Param('projectId') projectId: string) {
    return this.service.getSchedule(+projectId)
  }

  @Post()
  @ApiOperation({ summary: '创建进度计划' })
  async create(@Param('projectId') projectId: string, @Body() body: any) {
    return this.service.createSchedule({ ...body, projectId: +projectId })
  }

  @Put('tasks/:taskId')
  @ApiOperation({ summary: '更新任务' })
  async updateTask(@Param('taskId') taskId: string, @Body() body: any) {
    return this.service.updateTask(+taskId, body)
  }

  @Post('tasks/dependencies')
  @ApiOperation({ summary: '添加任务依赖' })
  async addDependency(@Body() body: { predecessorId: number; successorId: number; dependencyType?: string; lagDays?: number }) {
    return this.service.addTaskDependency(body.predecessorId, body.successorId, body.dependencyType, body.lagDays)
  }

  @Delete('tasks/dependencies/:id')
  @ApiOperation({ summary: '删除任务依赖' })
  async removeDependency(@Param('id') id: string) {
    return this.service.removeTaskDependency(+id)
  }
}
