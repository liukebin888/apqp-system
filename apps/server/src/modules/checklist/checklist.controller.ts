import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ChecklistService } from './checklist.service'

@Controller('checklist')
@UseGuards(AuthGuard('jwt'))
export class ChecklistController {
  constructor(private readonly service: ChecklistService) {}

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

  @Get('progress/:projectId')
  async getProgress(@Param('projectId', ParseIntPipe) projectId: number) {
    return { code: 0, data: await this.service.getProgress(projectId), message: 'success' }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.findOne(id), message: 'success' }
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.create(body, userId), message: 'success' }
  }

  @Post('instantiate/:projectId')
  async instantiateAll(@Param('projectId', ParseIntPipe) projectId: number, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.instantiateAllPhases(projectId, userId),
      message: '初始化成功',
    }
  }

  @Put('items/:id')
  async updateItem(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updateItem(id, body), message: 'success' }
  }

  @Put(':id/items/batch')
  async batchUpdateItems(@Param('id', ParseIntPipe) id: number, @Body('items') items: any[]) {
    return {
      code: 0,
      data: await this.service.batchUpdateItems(id, items),
      message: 'success',
    }
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updateItem(id, body), message: 'success' }
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.delete(id), message: 'success' }
  }
}
