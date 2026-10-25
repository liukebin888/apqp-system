import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req,
} from '@nestjs/common'
import { QualityService } from './quality.service'

@Controller('quality')
export class QualityController {
  constructor(private readonly service: QualityService) {}

  // ==================== Problem Endpoints ====================

  @Get('problems')
  async findAllProblems(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('classification') classification?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllProblems({
        projectId: projectId ? +projectId : undefined,
        status,
        severity,
        classification,
        ownerId: ownerId ? +ownerId : undefined,
      }),
      message: 'success',
    }
  }

  @Get('problems/:id')
  async findOneProblem(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneProblem(+id),
      message: 'success',
    }
  }

  @Post('problems')
  async createProblem(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createProblem(body, userId),
      message: 'success',
    }
  }

  @Put('problems/:id')
  async updateProblem(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateProblem(+id, body),
      message: 'success',
    }
  }

  @Delete('problems/:id')
  async deleteProblem(@Param('id') id: string) {
    await this.service.deleteProblem(+id)
    return { code: 0, data: null, message: 'success' }
  }

  @Put('problems/:id/assign')
  async assignProblem(@Param('id') id: string, @Body() body: { ownerId: number }) {
    return {
      code: 0,
      data: await this.service.assignProblem(+id, body.ownerId),
      message: 'success',
    }
  }

  @Put('problems/:id/close')
  async closeProblem(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.closeProblem(+id, userId),
      message: 'success',
    }
  }

  @Put('problems/:id/escalate')
  async escalateProblem(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.escalateProblem(+id),
      message: 'success',
    }
  }

  @Put('problems/:id/status')
  async updateProblemStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return {
      code: 0,
      data: await this.service.updateProblemStatus(+id, body.status),
      message: 'success',
    }
  }

  // ==================== 8D Report Endpoints ====================

  @Get('8d-reports')
  async findAll8DReports(
    @Query('status') status?: string,
    @Query('problemId') problemId?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAll8DReports({
        status,
        problemId: problemId ? +problemId : undefined,
      }),
      message: 'success',
    }
  }

  @Get('8d-reports/:id')
  async findOne8DReport(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOne8DReport(+id),
      message: 'success',
    }
  }

  @Post('problems/:id/8d')
  async create8DReport(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.create8DReport(+id, userId),
      message: 'success',
    }
  }

  @Put('8d-reports/:id/:step')
  async update8DStep(
    @Param('id') id: string,
    @Param('step') step: string,
    @Body() body: any,
  ) {
    return {
      code: 0,
      data: await this.service.update8DStep(+id, step, body),
      message: 'success',
    }
  }

  // ==================== Nonconformance Endpoints ====================

  @Get('nonconformances')
  async findAllNonconformances(
    @Query('projectId') projectId?: string,
    @Query('defectType') defectType?: string,
    @Query('disposition') disposition?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllNonconformances({
        projectId: projectId ? +projectId : undefined,
        defectType,
        disposition,
        supplierId: supplierId ? +supplierId : undefined,
      }),
      message: 'success',
    }
  }

  @Get('nonconformances/:id')
  async findOneNonconformance(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneNonconformance(+id),
      message: 'success',
    }
  }

  @Post('nonconformances')
  async createNonconformance(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createNonconformance(body, userId),
      message: 'success',
    }
  }

  @Put('nonconformances/:id')
  async updateNonconformance(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateNonconformance(+id, body),
      message: 'success',
    }
  }

  @Delete('nonconformances/:id')
  async deleteNonconformance(@Param('id') id: string) {
    await this.service.deleteNonconformance(+id)
    return { code: 0, data: null, message: 'success' }
  }

  @Put('nonconformances/:id/dispose')
  async disposeNonconformance(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.disposeNonconformance(+id, body.disposition, userId, body.costImpact),
      message: 'success',
    }
  }

  // ==================== CAPA Endpoints ====================

  @Get('capas')
  async findAllCapas(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('source') source?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllCapas({
        status,
        type,
        source,
        assignedToId: assignedToId ? +assignedToId : undefined,
      }),
      message: 'success',
    }
  }

  @Get('capas/:id')
  async findOneCapa(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneCapa(+id),
      message: 'success',
    }
  }

  @Post('capas')
  async createCapa(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createCapa(body, userId),
      message: 'success',
    }
  }

  @Put('capas/:id')
  async updateCapa(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateCapa(+id, body),
      message: 'success',
    }
  }

  @Delete('capas/:id')
  async deleteCapa(@Param('id') id: string) {
    await this.service.deleteCapa(+id)
    return { code: 0, data: null, message: 'success' }
  }

  @Put('capas/:id/verify')
  async verifyCapa(@Param('id') id: string, @Body() body: { effectivenessResult: string }, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.verifyCapa(+id, userId, body.effectivenessResult),
      message: 'success',
    }
  }

  @Put('capas/:id/close')
  async closeCapa(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.closeCapa(+id),
      message: 'success',
    }
  }

  // ==================== Inspection Endpoints ====================

  @Get('inspections')
  async findAllInspections(
    @Query('projectId') projectId?: string,
    @Query('type') type?: string,
    @Query('result') result?: string,
    @Query('inspectorId') inspectorId?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllInspections({
        projectId: projectId ? +projectId : undefined,
        type,
        result,
        inspectorId: inspectorId ? +inspectorId : undefined,
      }),
      message: 'success',
    }
  }

  @Get('inspections/:id')
  async findOneInspection(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneInspection(+id),
      message: 'success',
    }
  }

  @Post('inspections')
  async createInspection(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createInspection(body, userId),
      message: 'success',
    }
  }

  @Put('inspections/:id')
  async updateInspection(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateInspection(+id, body),
      message: 'success',
    }
  }

  @Delete('inspections/:id')
  async deleteInspection(@Param('id') id: string) {
    await this.service.deleteInspection(+id)
    return { code: 0, data: null, message: 'success' }
  }

  // ==================== Statistics Endpoints ====================

  @Get('stats/overview')
  async getOverviewStats() {
    return {
      code: 0,
      data: await this.service.getOverviewStats(),
      message: 'success',
    }
  }

  @Get('stats/problem-analysis')
  async getProblemAnalysis(@Query('projectId') projectId?: string) {
    return {
      code: 0,
      data: await this.service.getProblemAnalysis({
        projectId: projectId ? +projectId : undefined,
      }),
      message: 'success',
    }
  }
}
