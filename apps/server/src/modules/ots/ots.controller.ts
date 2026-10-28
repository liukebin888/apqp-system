import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { OtsService } from './ots.service'

@Controller('ots')
@UseGuards(AuthGuard('jwt'))
export class OtsController {
  constructor(private readonly service: OtsService) {}

  // ==================== Sample Endpoints ====================

  @Get('samples')
  async findAllSamples(
    @Query('projectId') projectId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('sampleType') sampleType?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllSamples({
        projectId: projectId ? +projectId : undefined,
        customerId: customerId ? +customerId : undefined,
        status,
        sampleType,
      }),
      message: 'success',
    }
  }

  @Get('samples/:id')
  async findOneSample(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.findOneSample(id), message: 'success' }
  }

  @Post('samples')
  async createSample(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createSample(body, userId), message: 'success' }
  }

  @Put('samples/:id')
  async updateSample(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updateSample(id, body), message: 'success' }
  }

  @Delete('samples/:id')
  async deleteSample(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.deleteSample(id), message: 'success' }
  }

  @Put('samples/:id/status')
  async updateSampleStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return { code: 0, data: await this.service.updateSampleStatus(id, status), message: 'success' }
  }

  // ==================== Report Endpoints ====================

  @Post('samples/:sampleId/reports')
  async createReport(
    @Param('sampleId', ParseIntPipe) sampleId: number,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createReport(sampleId, body, userId),
      message: 'success',
    }
  }

  @Put('reports/:id')
  async updateReport(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updateReport(id, body), message: 'success' }
  }

  @Delete('reports/:id')
  async deleteReport(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.deleteReport(id), message: 'success' }
  }

  // ==================== Test Record Endpoints ====================

  @Post('samples/:sampleId/test-records')
  async createTestRecord(
    @Param('sampleId', ParseIntPipe) sampleId: number,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createTestRecord(sampleId, body, userId),
      message: 'success',
    }
  }

  @Put('test-records/:id')
  async updateTestRecord(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updateTestRecord(id, body), message: 'success' }
  }

  @Delete('test-records/:id')
  async deleteTestRecord(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.deleteTestRecord(id), message: 'success' }
  }

  // ==================== Approval Endpoints ====================

  @Post('samples/:sampleId/approvals')
  async createApproval(
    @Param('sampleId', ParseIntPipe) sampleId: number,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createApproval(sampleId, body, userId),
      message: 'success',
    }
  }

  @Put('approvals/:id')
  async updateApproval(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updateApproval(id, body), message: 'success' }
  }

  // ==================== Doc Checklist Endpoints ====================

  @Get('doc-checklists')
  async findAllDocChecklists(@Query('projectId') projectId: string) {
    if (!projectId || isNaN(+projectId)) {
      return { code: 400, data: [], message: '缺少有效的 projectId 参数' }
    }
    return {
      code: 0,
      data: await this.service.findAllDocChecklists(+projectId),
      message: 'success',
    }
  }

  @Get('doc-checklists/progress/:projectId')
  async getDocChecklistProgress(@Param('projectId', ParseIntPipe) projectId: number) {
    return { code: 0, data: await this.service.getDocChecklistProgress(projectId), message: 'success' }
  }

  @Get('doc-checklists/:id')
  async findOneDocChecklist(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.findOneDocChecklist(id), message: 'success' }
  }

  @Post('doc-checklists')
  async createDocChecklist(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createDocChecklist(body, userId), message: 'success' }
  }

  @Post('doc-checklists/init/:projectId')
  async initStandardDocChecklist(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('otsSampleId') otsSampleId?: string,
    @Req() req?: any,
  ) {
    const userId = req?.user?.userId || 1
    return {
      code: 0,
      data: await this.service.initStandardDocChecklist(
        projectId,
        otsSampleId ? +otsSampleId : undefined,
        userId,
      ),
      message: '初始化成功',
    }
  }

  @Put('doc-checklists/items/:id')
  async updateDocChecklistItem(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return { code: 0, data: await this.service.updateDocChecklistItem(id, body), message: 'success' }
  }

  @Delete('doc-checklists/:id')
  async deleteDocChecklist(@Param('id', ParseIntPipe) id: number) {
    return { code: 0, data: await this.service.deleteDocChecklist(id), message: 'success' }
  }
}
