import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req,
} from '@nestjs/common'
import { ChangeService } from './change.service'

@Controller('change')
export class ChangeController {
  constructor(private readonly changeService: ChangeService) {}

  private userId(req: any): number {
    return req.user?.userId || 1
  }

  // ============================================================
  // ECR
  // ============================================================

  @Get('ecrs')
  async findAllEcrs(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('changeType') changeType?: string,
    @Query('priority') priority?: string,
  ) {
    return {
      code: 0,
      data: await this.changeService.findAllEcrs(
        projectId ? +projectId : undefined,
        status,
        changeType,
        priority,
      ),
      message: 'success',
    }
  }

  @Get('ecrs/:id')
  async findOneEcr(@Param('id') id: string) {
    return { code: 0, data: await this.changeService.findOneEcr(+id), message: 'success' }
  }

  @Post('ecrs')
  async createEcr(@Body() body: any, @Req() req: any) {
    return { code: 0, data: await this.changeService.createEcr(body, this.userId(req)), message: 'success' }
  }

  @Put('ecrs/:id')
  async updateEcr(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.changeService.updateEcr(+id, body), message: 'success' }
  }

  @Delete('ecrs/:id')
  async deleteEcr(@Param('id') id: string) {
    await this.changeService.deleteEcr(+id)
    return { code: 0, data: null, message: 'success' }
  }

  @Put('ecrs/:id/submit')
  async submitEcr(@Param('id') id: string) {
    return { code: 0, data: await this.changeService.submitEcr(+id), message: 'success' }
  }

  @Put('ecrs/:id/start-impact-analysis')
  async startImpactAnalysis(@Param('id') id: string) {
    return { code: 0, data: await this.changeService.startImpactAnalysis(+id), message: 'success' }
  }

  @Put('ecrs/:id/submit-ccb')
  async submitToCcb(@Param('id') id: string) {
    return { code: 0, data: await this.changeService.submitToCcb(+id), message: 'success' }
  }

  @Post('ecrs/:id/approve')
  async approveEcr(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return {
      code: 0,
      data: await this.changeService.approveEcr(+id, this.userId(req), body.opinion, body.conditions),
      message: 'success',
    }
  }

  @Post('ecrs/:id/reject')
  async rejectEcr(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return {
      code: 0,
      data: await this.changeService.rejectEcr(+id, this.userId(req), body.opinion),
      message: 'success',
    }
  }

  @Put('ecrs/:id/close')
  async closeEcr(@Param('id') id: string) {
    return { code: 0, data: await this.changeService.closeEcr(+id), message: 'success' }
  }

  // ============================================================
  // ECR Impact Items
  // ============================================================

  @Post('ecrs/:ecrId/impact-items')
  async createImpactItem(@Param('ecrId') ecrId: string, @Body() body: any) {
    return { code: 0, data: await this.changeService.createImpactItem(+ecrId, body), message: 'success' }
  }

  @Put('impact-items/:id')
  async updateImpactItem(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.changeService.updateImpactItem(+id, body), message: 'success' }
  }

  @Delete('impact-items/:id')
  async deleteImpactItem(@Param('id') id: string) {
    await this.changeService.deleteImpactItem(+id)
    return { code: 0, data: null, message: 'success' }
  }

  // ============================================================
  // CCB Reviews
  // ============================================================

  @Get('ccb-reviews')
  async findCcbReviews(@Query('ecrId') ecrId?: string, @Query('decision') decision?: string) {
    return {
      code: 0,
      data: await this.changeService.findCcbReviews(
        ecrId ? +ecrId : undefined,
        decision,
      ),
      message: 'success',
    }
  }

  @Post('ecrs/:ecrId/ccb-review')
  async createCcbReview(@Param('ecrId') ecrId: string, @Body() body: any) {
    return { code: 0, data: await this.changeService.createCcbReview(+ecrId, body), message: 'success' }
  }

  @Put('ccb-reviews/:id')
  async updateCcbReview(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.changeService.updateCcbReview(+id, body), message: 'success' }
  }

  // ============================================================
  // ECN
  // ============================================================

  @Get('ecns')
  async findAllEcns(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('ecrId') ecrId?: string,
  ) {
    return {
      code: 0,
      data: await this.changeService.findAllEcns(
        projectId ? +projectId : undefined,
        status,
        ecrId ? +ecrId : undefined,
      ),
      message: 'success',
    }
  }

  @Get('ecns/:id')
  async findOneEcn(@Param('id') id: string) {
    return { code: 0, data: await this.changeService.findOneEcn(+id), message: 'success' }
  }

  @Post('ecrs/:ecrId/ecn')
  async createEcn(@Param('ecrId') ecrId: string, @Body() body: any, @Req() req: any) {
    return {
      code: 0,
      data: await this.changeService.createEcnFromEcr(+ecrId, body, this.userId(req)),
      message: 'success',
    }
  }

  @Put('ecns/:id')
  async updateEcn(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.changeService.updateEcn(+id, body), message: 'success' }
  }

  @Put('ecns/:id/start-execution')
  async startEcnExecution(@Param('id') id: string) {
    return { code: 0, data: await this.changeService.startEcnExecution(+id), message: 'success' }
  }

  @Put('ecns/:id/start-verification')
  async startEcnVerification(@Param('id') id: string) {
    return { code: 0, data: await this.changeService.startEcnVerification(+id), message: 'success' }
  }

  @Put('ecns/:id/close')
  async closeEcn(@Param('id') id: string, @Req() req: any) {
    return { code: 0, data: await this.changeService.closeEcn(+id, this.userId(req)), message: 'success' }
  }

  // ============================================================
  // ECN Action Items
  // ============================================================

  @Post('ecns/:ecnId/action-items')
  async createActionItem(@Param('ecnId') ecnId: string, @Body() body: any) {
    return { code: 0, data: await this.changeService.createActionItem(+ecnId, body), message: 'success' }
  }

  @Put('action-items/:id')
  async updateActionItem(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.changeService.updateActionItem(+id, body), message: 'success' }
  }

  @Delete('action-items/:id')
  async deleteActionItem(@Param('id') id: string) {
    await this.changeService.deleteActionItem(+id)
    return { code: 0, data: null, message: 'success' }
  }

  @Put('action-items/:id/complete')
  async completeActionItem(@Param('id') id: string) {
    return { code: 0, data: await this.changeService.completeActionItem(+id), message: 'success' }
  }

  @Put('action-items/:id/verify')
  async verifyActionItem(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.changeService.verifyActionItem(+id, body?.verificationNote),
      message: 'success',
    }
  }

  // ============================================================
  // Statistics
  // ============================================================

  @Get('stats/overview')
  async getOverviewStats(@Query('projectId') projectId?: string) {
    return {
      code: 0,
      data: await this.changeService.getOverviewStats(projectId ? +projectId : undefined),
      message: 'success',
    }
  }
}
