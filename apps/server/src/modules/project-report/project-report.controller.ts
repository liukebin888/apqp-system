import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ProjectReportService } from './project-report.service'

@Controller('project-reports')
@UseGuards(AuthGuard('jwt'))
export class ProjectReportController {
  constructor(private readonly service: ProjectReportService) {}

  // ==================== Kanban Configs (must be before :id) ====================

  @Get('kanban')
  async findAllKanbanConfigs(
    @Query('projectId') projectId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllKanbanConfigs({
        projectId,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('kanban/:id')
  async findOneKanbanConfig(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneKanbanConfig(+id),
      message: 'success',
    }
  }

  @Post('kanban')
  async createKanbanConfig(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createKanbanConfig(body, userId),
      message: 'success',
    }
  }

  @Put('kanban/:id')
  async updateKanbanConfig(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateKanbanConfig(+id, body),
      message: 'success',
    }
  }

  @Delete('kanban/:id')
  async deleteKanbanConfig(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteKanbanConfig(+id),
      message: 'success',
    }
  }

  // ==================== Progress Reports ====================

  @Get()
  async findAllReports(
    @Query('projectId') projectId?: string,
    @Query('reportType') reportType?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllReports({
        projectId, reportType,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get(':id')
  async findOneReport(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneReport(+id),
      message: 'success',
    }
  }

  @Post()
  async createReport(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createReport(body, userId),
      message: 'success',
    }
  }

  @Put(':id')
  async updateReport(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateReport(+id, body),
      message: 'success',
    }
  }

  @Delete(':id')
  async deleteReport(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteReport(+id),
      message: 'success',
    }
  }
}
