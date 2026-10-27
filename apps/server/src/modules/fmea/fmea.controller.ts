import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { FmeaService } from './fmea.service'

@Controller('fmea')
@UseGuards(AuthGuard('jwt'))
export class FmeaController {
  constructor(private readonly fmeaService: FmeaService) {}

  private userId(req: any): number {
    return req.user?.userId || 1
  }

  // ============================================================
  // DFMEA
  // ============================================================

  @Get('dfmeas')
  async findAllDfmeas(@Query('projectId') projectId?: string) {
    return { code: 0, data: await this.fmeaService.findAllDfmeas(projectId ? Number(projectId) : undefined), message: 'success' }
  }

  @Get('dfmeas/:id')
  async findOneDfmea(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.findOneDfmea(Number(id)), message: 'success' }
  }

  @Post('dfmeas')
  async createDfmea(@Body() body: any, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.createDfmea(body, this.userId(req)), message: 'success' }
  }

  @Put('dfmeas/:id')
  async updateDfmea(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updateDfmea(Number(id), body), message: 'success' }
  }

  @Delete('dfmeas/:id')
  async deleteDfmea(@Param('id') id: string) {
    await this.fmeaService.deleteDfmea(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  @Put('dfmeas/:id/approve')
  async approveDfmea(@Param('id') id: string, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.approveDfmea(Number(id), this.userId(req)), message: 'success' }
  }

  @Post('dfmeas/:id/copy')
  async copyDfmea(@Param('id') id: string, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.copyDfmea(Number(id), this.userId(req)), message: 'success' }
  }

  // DFMEA Items
  @Post('dfmeas/:id/items')
  async createDfmeaItem(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.createDfmeaItem(Number(id), body), message: 'success' }
  }

  @Put('dfmea-items/:id')
  async updateDfmeaItem(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updateDfmeaItem(Number(id), body), message: 'success' }
  }

  @Delete('dfmea-items/:id')
  async deleteDfmeaItem(@Param('id') id: string) {
    await this.fmeaService.deleteDfmeaItem(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  // ============================================================
  // Process Flow
  // ============================================================

  @Get('process-flows')
  async findAllProcessFlows(@Query('projectId') projectId?: string) {
    return { code: 0, data: await this.fmeaService.findAllProcessFlows(projectId ? Number(projectId) : undefined), message: 'success' }
  }

  @Get('process-flows/:id')
  async findOneProcessFlow(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.findOneProcessFlow(Number(id)), message: 'success' }
  }

  @Post('process-flows')
  async createProcessFlow(@Body() body: any, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.createProcessFlow(body, this.userId(req)), message: 'success' }
  }

  @Put('process-flows/:id')
  async updateProcessFlow(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updateProcessFlow(Number(id), body), message: 'success' }
  }

  @Delete('process-flows/:id')
  async deleteProcessFlow(@Param('id') id: string) {
    await this.fmeaService.deleteProcessFlow(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  @Post('process-flows/:id/steps')
  async addProcessFlowStep(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.addProcessFlowStep(Number(id), body), message: 'success' }
  }

  @Put('process-flow-steps/:id')
  async updateProcessFlowStep(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updateProcessFlowStep(Number(id), body), message: 'success' }
  }

  @Delete('process-flow-steps/:id')
  async deleteProcessFlowStep(@Param('id') id: string) {
    await this.fmeaService.deleteProcessFlowStep(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  // ============================================================
  // PFMEA
  // ============================================================

  @Get('pfmeas')
  async findAllPfmeas(@Query('projectId') projectId?: string) {
    return { code: 0, data: await this.fmeaService.findAllPfmeas(projectId ? Number(projectId) : undefined), message: 'success' }
  }

  @Get('pfmeas/:id')
  async findOnePfmea(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.findOnePfmea(Number(id)), message: 'success' }
  }

  @Post('pfmeas')
  async createPfmea(@Body() body: any, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.createPfmea(body, this.userId(req)), message: 'success' }
  }

  @Put('pfmeas/:id')
  async updatePfmea(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updatePfmea(Number(id), body), message: 'success' }
  }

  @Delete('pfmeas/:id')
  async deletePfmea(@Param('id') id: string) {
    await this.fmeaService.deletePfmea(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  @Put('pfmeas/:id/approve')
  async approvePfmea(@Param('id') id: string, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.approvePfmea(Number(id), this.userId(req)), message: 'success' }
  }

  // PFMEA Items
  @Post('pfmeas/:id/items')
  async createPfmeaItem(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.createPfmeaItem(Number(id), body), message: 'success' }
  }

  @Put('pfmea-items/:id')
  async updatePfmeaItem(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updatePfmeaItem(Number(id), body), message: 'success' }
  }

  @Delete('pfmea-items/:id')
  async deletePfmeaItem(@Param('id') id: string) {
    await this.fmeaService.deletePfmeaItem(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  // ============================================================
  // Control Plan
  // ============================================================

  @Get('control-plans')
  async findAllControlPlans(
    @Query('projectId') projectId?: string,
    @Query('cpType') cpType?: string,
  ) {
    return { code: 0, data: await this.fmeaService.findAllControlPlans(projectId ? Number(projectId) : undefined, cpType), message: 'success' }
  }

  @Get('control-plans/:id')
  async findOneControlPlan(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.findOneControlPlan(Number(id)), message: 'success' }
  }

  @Post('control-plans')
  async createControlPlan(@Body() body: any, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.createControlPlan(body, this.userId(req)), message: 'success' }
  }

  @Put('control-plans/:id')
  async updateControlPlan(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updateControlPlan(Number(id), body), message: 'success' }
  }

  @Delete('control-plans/:id')
  async deleteControlPlan(@Param('id') id: string) {
    await this.fmeaService.deleteControlPlan(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  @Put('control-plans/:id/approve')
  async approveControlPlan(@Param('id') id: string, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.approveControlPlan(Number(id), this.userId(req)), message: 'success' }
  }

  // Control Plan Items
  @Post('control-plans/:id/items')
  async createControlPlanItem(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.createControlPlanItem(Number(id), body), message: 'success' }
  }

  @Put('cp-items/:id')
  async updateControlPlanItem(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updateControlPlanItem(Number(id), body), message: 'success' }
  }

  @Delete('cp-items/:id')
  async deleteControlPlanItem(@Param('id') id: string) {
    await this.fmeaService.deleteControlPlanItem(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  @Post('control-plans/:id/generate-from-pfmea')
  async generateFromPfmea(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.generateControlPlanFromPfmea(Number(id)), message: 'success' }
  }

  // ============================================================
  // Special Characteristics
  // ============================================================

  @Get('special-chars')
  async findAllSpecialChars(
    @Query('projectId') projectId?: string,
    @Query('charType') charType?: string,
  ) {
    return { code: 0, data: await this.fmeaService.findAllSpecialChars(projectId ? Number(projectId) : undefined, charType), message: 'success' }
  }

  @Post('special-chars')
  async createSpecialChar(@Body() body: any, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.createSpecialChar(body, this.userId(req)), message: 'success' }
  }

  @Put('special-chars/:id')
  async updateSpecialChar(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updateSpecialChar(Number(id), body), message: 'success' }
  }

  @Delete('special-chars/:id')
  async deleteSpecialChar(@Param('id') id: string) {
    await this.fmeaService.deleteSpecialChar(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  @Get('special-chars/:id/traceability')
  async getTraceability(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.getSpecialCharTraceability(Number(id)), message: 'success' }
  }

  // ============================================================
  // SPC Studies
  // ============================================================

  @Get('spc-studies')
  async findAllSpcStudies(@Query('projectId') projectId?: string) {
    return { code: 0, data: await this.fmeaService.findAllSpcStudies(projectId ? Number(projectId) : undefined), message: 'success' }
  }

  @Get('spc-studies/:id')
  async findOneSpcStudy(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.findOneSpcStudy(Number(id)), message: 'success' }
  }

  @Post('spc-studies')
  async createSpcStudy(@Body() body: any, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.createSpcStudy(body, this.userId(req)), message: 'success' }
  }

  @Put('spc-studies/:id')
  async updateSpcStudy(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updateSpcStudy(Number(id), body), message: 'success' }
  }

  @Delete('spc-studies/:id')
  async deleteSpcStudy(@Param('id') id: string) {
    await this.fmeaService.deleteSpcStudy(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  @Post('spc-studies/:id/data-points')
  async addSpcDataPoint(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.addSpcDataPoint(Number(id), body), message: 'success' }
  }

  @Post('spc-studies/:id/data-points/bulk')
  async addSpcDataPointsBulk(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.addSpcDataPointsBulk(Number(id), body.points || []), message: 'success' }
  }

  @Post('spc-studies/:id/calculate')
  async calculateSpc(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.calculateSpc(Number(id)), message: 'success' }
  }

  @Get('spc-studies/:id/chart-data')
  async getSpcChartData(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.getSpcChartData(Number(id)), message: 'success' }
  }

  // ============================================================
  // MSA Studies
  // ============================================================

  @Get('msa-studies')
  async findAllMsaStudies(@Query('projectId') projectId?: string) {
    return { code: 0, data: await this.fmeaService.findAllMsaStudies(projectId ? Number(projectId) : undefined), message: 'success' }
  }

  @Get('msa-studies/:id')
  async findOneMsaStudy(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.findOneMsaStudy(Number(id)), message: 'success' }
  }

  @Post('msa-studies')
  async createMsaStudy(@Body() body: any, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.createMsaStudy(body, this.userId(req)), message: 'success' }
  }

  @Put('msa-studies/:id')
  async updateMsaStudy(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updateMsaStudy(Number(id), body), message: 'success' }
  }

  @Delete('msa-studies/:id')
  async deleteMsaStudy(@Param('id') id: string) {
    await this.fmeaService.deleteMsaStudy(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  @Post('msa-studies/:id/measurements')
  async addMsaMeasurement(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.addMsaMeasurement(Number(id), body), message: 'success' }
  }

  @Post('msa-studies/:id/measurements/bulk')
  async addMsaMeasurementsBulk(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.addMsaMeasurementsBulk(Number(id), body.measurements || []), message: 'success' }
  }

  @Post('msa-studies/:id/calculate')
  async calculateMsa(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.calculateMsaGrr(Number(id)), message: 'success' }
  }

  // ============================================================
  // Knowledge Base
  // ============================================================

  @Get('kb')
  async findAllKb(
    @Query('entryType') entryType?: string,
    @Query('category') category?: string,
  ) {
    return { code: 0, data: await this.fmeaService.findAllKbEntries(entryType, category), message: 'success' }
  }

  @Get('kb/:id')
  async findOneKb(@Param('id') id: string) {
    return { code: 0, data: await this.fmeaService.findOneKbEntry(Number(id)), message: 'success' }
  }

  @Post('kb')
  async createKb(@Body() body: any, @Req() req: any) {
    return { code: 0, data: await this.fmeaService.createKbEntry(body, this.userId(req)), message: 'success' }
  }

  @Put('kb/:id')
  async updateKb(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.fmeaService.updateKbEntry(Number(id), body), message: 'success' }
  }

  @Delete('kb/:id')
  async deleteKb(@Param('id') id: string) {
    await this.fmeaService.deleteKbEntry(Number(id))
    return { code: 0, data: null, message: 'success' }
  }

  @Post('kb/recommend')
  async recommendKb(@Body() body: { keywords: string; fmeaType?: string }) {
    return { code: 0, data: await this.fmeaService.recommendKbEntries(body.keywords, body.fmeaType), message: 'success' }
  }

  @Get('kb/reference-tables')
  async getReferenceTables() {
    return { code: 0, data: await this.fmeaService.getReferenceTables(), message: 'success' }
  }

  // ============================================================
  // Statistics
  // ============================================================

  @Get('stats/overview')
  async getOverviewStats(@Query('projectId') projectId?: string) {
    return { code: 0, data: await this.fmeaService.getOverviewStats(projectId ? Number(projectId) : undefined), message: 'success' }
  }

  @Get('stats/ap-distribution')
  async getApDistribution(@Query('projectId') projectId?: string) {
    return { code: 0, data: await this.fmeaService.getApDistribution(projectId ? Number(projectId) : undefined), message: 'success' }
  }
}
