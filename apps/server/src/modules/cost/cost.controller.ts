import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req,
} from '@nestjs/common'
import { CostService } from './cost.service'

@Controller('cost')
export class CostController {
  constructor(private readonly service: CostService) {}

  // ==================== Estimate Endpoints ====================

  @Get('estimates')
  async findAllEstimates(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('version') version?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllEstimates({
        projectId: projectId ? +projectId : undefined,
        status,
        version,
      }),
      message: 'success',
    }
  }

  @Get('estimates/:id')
  async findOneEstimate(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneEstimate(+id), message: 'success' }
  }

  @Post('estimates')
  async createEstimate(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createEstimate(body, userId), message: 'success' }
  }

  @Put('estimates/:id')
  async updateEstimate(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateEstimate(+id, body), message: 'success' }
  }

  @Delete('estimates/:id')
  async deleteEstimate(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteEstimate(+id), message: 'success' }
  }

  @Post('estimates/:id/calculate')
  async calculateEstimate(@Param('id') id: string) {
    return { code: 0, data: await this.service.calculateEstimate(+id), message: 'success' }
  }

  @Put('estimates/:id/submit')
  async submitEstimate(@Param('id') id: string) {
    return { code: 0, data: await this.service.submitEstimate(+id), message: 'success' }
  }

  @Put('estimates/:id/approve')
  async approveEstimate(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.approveEstimate(+id, userId), message: 'success' }
  }

  @Put('estimates/:id/reject')
  async rejectEstimate(@Param('id') id: string) {
    return { code: 0, data: await this.service.rejectEstimate(+id), message: 'success' }
  }

  @Put('estimates/:id/publish')
  async publishEstimate(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.publishEstimate(+id, userId), message: 'success' }
  }

  // ==================== Estimate Item Endpoints ====================

  @Post('estimates/:estimateId/items')
  async createEstimateItem(@Param('estimateId') estimateId: string, @Body() body: any) {
    return { code: 0, data: await this.service.createEstimateItem(+estimateId, body), message: 'success' }
  }

  @Put('items/:id')
  async updateEstimateItem(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateEstimateItem(+id, body), message: 'success' }
  }

  @Delete('items/:id')
  async deleteEstimateItem(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteEstimateItem(+id), message: 'success' }
  }

  @Put('estimates/:estimateId/items/batch')
  async batchUpdateEstimateItems(
    @Param('estimateId') estimateId: string,
    @Body('items') items: any[],
  ) {
    return { code: 0, data: await this.service.batchUpdateEstimateItems(+estimateId, items), message: 'success' }
  }

  // ==================== Budget Endpoints ====================

  @Get('budgets')
  async findAllBudgets(
    @Query('projectId') projectId?: string,
    @Query('budgetCategory') budgetCategory?: string,
    @Query('status') status?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllBudgets({
        projectId: projectId ? +projectId : undefined,
        budgetCategory,
        status,
      }),
      message: 'success',
    }
  }

  @Get('budgets/:id')
  async findOneBudget(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneBudget(+id), message: 'success' }
  }

  @Post('budgets')
  async createBudget(@Body() body: any) {
    return { code: 0, data: await this.service.createBudget(body), message: 'success' }
  }

  @Put('budgets/:id')
  async updateBudget(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateBudget(+id, body), message: 'success' }
  }

  @Delete('budgets/:id')
  async deleteBudget(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteBudget(+id), message: 'success' }
  }

  // ==================== Adjustment Endpoints ====================

  @Get('adjustments')
  async findAllAdjustments(
    @Query('costId') costId?: string,
    @Query('status') status?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllAdjustments({
        costId: costId ? +costId : undefined,
        status,
      }),
      message: 'success',
    }
  }

  @Post('adjustments')
  async createAdjustment(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createAdjustment(body, userId), message: 'success' }
  }

  @Put('adjustments/:id/approve')
  async approveAdjustment(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.approveAdjustment(+id, userId), message: 'success' }
  }

  @Put('adjustments/:id/reject')
  async rejectAdjustment(@Param('id') id: string) {
    return { code: 0, data: await this.service.rejectAdjustment(+id), message: 'success' }
  }

  // ==================== Entry Endpoints ====================

  @Get('entries')
  async findAllEntries(
    @Query('costId') costId?: string,
    @Query('projectId') projectId?: string,
    @Query('sourceType') sourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllEntries({
        costId: costId ? +costId : undefined,
        projectId: projectId ? +projectId : undefined,
        sourceType,
        startDate,
        endDate,
      }),
      message: 'success',
    }
  }

  @Post('entries')
  async createEntry(@Body() body: any) {
    return { code: 0, data: await this.service.createEntry(body), message: 'success' }
  }

  @Put('entries/:id')
  async updateEntry(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateEntry(+id, body), message: 'success' }
  }

  @Delete('entries/:id')
  async deleteEntry(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteEntry(+id), message: 'success' }
  }

  @Post('entries/batch')
  async batchImportEntries(@Body('entries') entries: any[]) {
    return { code: 0, data: await this.service.batchImportEntries(entries), message: 'success' }
  }

  // ==================== Variance & Tracking Endpoints ====================

  @Get('variance/:projectId')
  async getVariance(@Param('projectId') projectId: string) {
    return { code: 0, data: await this.service.getVariance(+projectId), message: 'success' }
  }

  @Get('tracking/:projectId')
  async getTracking(@Param('projectId') projectId: string) {
    return { code: 0, data: await this.service.getTracking(+projectId), message: 'success' }
  }

  // ==================== Analysis Endpoints ====================

  @Get('analysis/project/:projectId')
  async getProjectAnalysis(@Param('projectId') projectId: string) {
    return { code: 0, data: await this.service.getProjectAnalysis(+projectId), message: 'success' }
  }

  @Get('analysis/department')
  async getDepartmentAnalysis(
    @Query('deptId') deptId?: string,
    @Query('quarter') quarter?: string,
  ) {
    return {
      code: 0,
      data: await this.service.getDepartmentAnalysis(
        deptId ? +deptId : undefined,
        quarter,
      ),
      message: 'success',
    }
  }

  @Get('analysis/company')
  async getCompanyAnalysis(@Query('year') year?: string) {
    return { code: 0, data: await this.service.getCompanyAnalysis(year), message: 'success' }
  }

  @Get('analysis/profitability/:projectId')
  async getProfitability(@Param('projectId') projectId: string) {
    return { code: 0, data: await this.service.getProfitability(+projectId), message: 'success' }
  }

  // ==================== Alert Endpoints ====================

  @Get('alerts')
  async findAllAlerts(
    @Query('projectId') projectId?: string,
    @Query('alertLevel') alertLevel?: string,
    @Query('isResolved') isResolved?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllAlerts({
        projectId: projectId ? +projectId : undefined,
        alertLevel,
        isResolved: isResolved !== undefined ? isResolved === 'true' : undefined,
      }),
      message: 'success',
    }
  }

  @Put('alerts/:id/resolve')
  async resolveAlert(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.resolveAlert(+id, userId), message: 'success' }
  }

  @Post('alerts/check/:projectId')
  async checkAlerts(@Param('projectId') projectId: string) {
    return { code: 0, data: await this.service.checkAlerts(+projectId), message: 'success' }
  }
}
