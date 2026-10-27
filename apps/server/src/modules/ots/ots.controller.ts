import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards,
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
  async findOneSample(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneSample(+id), message: 'success' }
  }

  @Post('samples')
  async createSample(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createSample(body, userId), message: 'success' }
  }

  @Put('samples/:id')
  async updateSample(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateSample(+id, body), message: 'success' }
  }

  @Delete('samples/:id')
  async deleteSample(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteSample(+id), message: 'success' }
  }

  @Put('samples/:id/status')
  async updateSampleStatus(@Param('id') id: string, @Body('status') status: string) {
    return { code: 0, data: await this.service.updateSampleStatus(+id, status), message: 'success' }
  }

  // ==================== Report Endpoints ====================

  @Post('samples/:sampleId/reports')
  async createReport(
    @Param('sampleId') sampleId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createReport(+sampleId, body, userId),
      message: 'success',
    }
  }

  @Put('reports/:id')
  async updateReport(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateReport(+id, body), message: 'success' }
  }

  @Delete('reports/:id')
  async deleteReport(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteReport(+id), message: 'success' }
  }

  // ==================== Test Record Endpoints ====================

  @Post('samples/:sampleId/test-records')
  async createTestRecord(
    @Param('sampleId') sampleId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createTestRecord(+sampleId, body, userId),
      message: 'success',
    }
  }

  @Put('test-records/:id')
  async updateTestRecord(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateTestRecord(+id, body), message: 'success' }
  }

  @Delete('test-records/:id')
  async deleteTestRecord(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteTestRecord(+id), message: 'success' }
  }

  // ==================== Approval Endpoints ====================

  @Post('samples/:sampleId/approvals')
  async createApproval(
    @Param('sampleId') sampleId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createApproval(+sampleId, body, userId),
      message: 'success',
    }
  }

  @Put('approvals/:id')
  async updateApproval(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateApproval(+id, body), message: 'success' }
  }
}
