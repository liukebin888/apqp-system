import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, Res,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Response } from 'express'
import { IssueService } from './issue.service'
import { generateCsv, sendCsv } from '../../common/utils/csv.util'

@Controller('issues')
@UseGuards(AuthGuard('jwt'))
export class IssueController {
  constructor(private readonly service: IssueService) {}

  // ==================== Quality Issues ====================

  @Get()
  async findAllIssues(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('issueType') issueType?: string,
    @Query('severity') severity?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllIssues({
        projectId, status, issueType, severity,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('stats')
  async getIssueStats(@Query('projectId') projectId?: string) {
    return {
      code: 0,
      data: await this.service.getIssueStats(projectId ? +projectId : undefined),
      message: 'success',
    }
  }

  @Get('lessons')
  async findAllLessons(
    @Query('projectId') projectId?: string,
    @Query('category') category?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllLessons({
        projectId, category,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('lessons/:id')
  async findOneLesson(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneLesson(+id),
      message: 'success',
    }
  }

  @Post('lessons')
  async createLesson(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createLesson(body, userId),
      message: 'success',
    }
  }

  @Put('lessons/:id')
  async updateLesson(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateLesson(+id, body),
      message: 'success',
    }
  }

  @Delete('lessons/:id')
  async deleteLesson(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteLesson(+id),
      message: 'success',
    }
  }

  @Get('export')
  async exportIssues(
    @Res() res: Response,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('issueType') issueType?: string,
    @Query('severity') severity?: string,
  ) {
    const result = await this.service.findAllIssues({
      projectId, status, issueType, severity, skip: 0, take: 10000,
    })
    const list = result?.items || result || []
    const headers = ['编号', '标题', '类型', '严重度', '状态', '责任人', '项目ID', '创建时间']
    const rows = list.map((i: any) => [
      i.code, i.title, i.issueType, i.severity, i.status,
      i.assignee?.realName || '', i.projectId, i.createdAt,
    ])
    sendCsv(res, `issues_${Date.now()}.csv`, generateCsv(headers, rows))
  }

  @Get(':id')
  async findOneIssue(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneIssue(+id),
      message: 'success',
    }
  }

  @Post()
  async createIssue(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createIssue(body, userId),
      message: 'success',
    }
  }

  @Put(':id')
  async updateIssue(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateIssue(+id, body),
      message: 'success',
    }
  }

  @Delete(':id')
  async deleteIssue(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteIssue(+id),
      message: 'success',
    }
  }
}
