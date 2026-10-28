import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AspiceTrackingService } from './aspice-tracking.service'

@Controller('aspice-tracking')
@UseGuards(AuthGuard('jwt'))
export class AspiceTrackingController {
  constructor(private readonly service: AspiceTrackingService) {}

  @Get()
  async findAll(@Query('projectId') projectId: string) {
    if (!projectId || isNaN(+projectId)) {
      return { code: 400, data: [], message: '缺少有效的 projectId 参数' }
    }
    return {
      code: 0,
      data: await this.service.findAllByProject(+projectId),
      message: 'success',
    }
  }

  @Get('summary/:projectId')
  async getSummary(@Param('projectId', ParseIntPipe) projectId: number) {
    return { code: 0, data: await this.service.getSummary(projectId), message: 'success' }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.findOne(id), message: 'success' }
  }

  @Post('init/:projectId')
  async initStandard(@Param('projectId', ParseIntPipe) projectId: number, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.initStandardProcesses(projectId, userId),
      message: '初始化成功',
    }
  }

  @Put('practices/:id')
  async updatePractice(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updatePractice(id, body), message: 'success' }
  }

  @Put(':id/practices/batch')
  async batchUpdatePractices(@Param('id', ParseIntPipe) id: number, @Body('practices') practices: any[]) {
    return {
      code: 0,
      data: await this.service.batchUpdatePractices(id, practices),
      message: 'success',
    }
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updateProcess(id, body), message: 'success' }
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.deleteProcess(id), message: 'success' }
  }
}
