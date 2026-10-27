import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { SafetyService } from './safety.service'

@Controller('safety')
@UseGuards(AuthGuard('jwt'))
export class SafetyController {
  constructor(private readonly service: SafetyService) {}

  // ==================== Hazard Analysis ====================

  @Get('hazards')
  async findAllHazards(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('asil') asil?: string,
    @Query('hazardType') hazardType?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllHazards({
        projectId, status, asil, hazardType,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('hazards/stats')
  async getHazardStats(@Query('projectId') projectId?: string) {
    return {
      code: 0,
      data: await this.service.getHazardStats(projectId ? +projectId : undefined),
      message: 'success',
    }
  }

  @Get('hazards/:id')
  async findOneHazard(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneHazard(+id),
      message: 'success',
    }
  }

  @Post('hazards')
  async createHazard(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createHazard(body, userId),
      message: 'success',
    }
  }

  @Put('hazards/:id')
  async updateHazard(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateHazard(+id, body),
      message: 'success',
    }
  }

  @Delete('hazards/:id')
  async deleteHazard(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteHazard(+id),
      message: 'success',
    }
  }

  // ==================== Safety Goals ====================

  @Get('goals')
  async findAllGoals(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('targetAsil') targetAsil?: string,
    @Query('hazardId') hazardId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllGoals({
        projectId, status, targetAsil, hazardId,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('goals/tree/:projectId')
  async getGoalTree(@Param('projectId') projectId: string) {
    return {
      code: 0,
      data: await this.service.getGoalTree(+projectId),
      message: 'success',
    }
  }

  @Get('goals/:id')
  async findOneGoal(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneGoal(+id),
      message: 'success',
    }
  }

  @Post('goals')
  async createGoal(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createGoal(body, userId),
      message: 'success',
    }
  }

  @Put('goals/:id')
  async updateGoal(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateGoal(+id, body),
      message: 'success',
    }
  }

  @Delete('goals/:id')
  async deleteGoal(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteGoal(+id),
      message: 'success',
    }
  }

  // ==================== FTA Events ====================

  @Get('fta/events')
  async findTopEvents(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findTopEvents({
        projectId, status,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('fta/tree/:projectId')
  async getFtaTreeData(@Param('projectId') projectId: string) {
    return {
      code: 0,
      data: await this.service.getFtaTreeData(+projectId),
      message: 'success',
    }
  }

  @Get('fta/events/:id')
  async findOneFtaEvent(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneFtaEvent(+id),
      message: 'success',
    }
  }

  @Post('fta/events')
  async createFtaEvent(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createFtaEvent(body, userId),
      message: 'success',
    }
  }

  @Put('fta/events/:id')
  async updateFtaEvent(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateFtaEvent(+id, body),
      message: 'success',
    }
  }

  @Delete('fta/events/:id')
  async deleteFtaEvent(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteFtaEvent(+id),
      message: 'success',
    }
  }

  @Post('fta/events/:id/move')
  async moveFtaEvent(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.moveFtaEvent(+id, body),
      message: 'success',
    }
  }

  @Post('fta/events/:id/calculate')
  async calculateFtaProbabilities(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.calculateFtaProbabilities(+id),
      message: 'success',
    }
  }

  // ==================== Safety Cases ====================

  @Get('cases')
  async findAllCases(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllCases({
        projectId, status,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('cases/:id')
  async findOneCase(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneCase(+id),
      message: 'success',
    }
  }

  @Post('cases')
  async createCase(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createCase(body, userId),
      message: 'success',
    }
  }

  @Put('cases/:id')
  async updateCase(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateCase(+id, body),
      message: 'success',
    }
  }

  @Delete('cases/:id')
  async deleteCase(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteCase(+id),
      message: 'success',
    }
  }

  @Put('cases/:id/approve')
  async approveCase(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.approveCase(+id, userId),
      message: 'success',
    }
  }

  // ==================== Safety Case Arguments ====================

  @Get('cases/:id/arguments')
  async findArguments(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findArguments(+id),
      message: 'success',
    }
  }

  @Post('cases/:id/arguments')
  async createArgument(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.createArgument(+id, body),
      message: 'success',
    }
  }

  @Put('case-arguments/:id')
  async updateArgument(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateArgument(+id, body),
      message: 'success',
    }
  }

  @Delete('case-arguments/:id')
  async deleteArgument(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteArgument(+id),
      message: 'success',
    }
  }

  // ==================== Safety Case Evidence ====================

  @Post('cases/:id/evidences')
  async createEvidence(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.createEvidence(+id, body),
      message: 'success',
    }
  }

  @Put('case-evidences/:id')
  async updateEvidence(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateEvidence(+id, body),
      message: 'success',
    }
  }

  @Delete('case-evidences/:id')
  async deleteEvidence(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteEvidence(+id),
      message: 'success',
    }
  }

  @Get('cases/:id/compliance-matrix')
  async getComplianceMatrix(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.getComplianceMatrix(+id),
      message: 'success',
    }
  }

  // ==================== Safety Reviews ====================

  @Get('reviews')
  async findAllReviews(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('reviewType') reviewType?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllReviews({
        projectId, status, reviewType,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('reviews/:id')
  async findOneReview(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneReview(+id),
      message: 'success',
    }
  }

  @Post('reviews')
  async createReview(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createReview(body, userId),
      message: 'success',
    }
  }

  @Put('reviews/:id')
  async updateReview(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateReview(+id, body),
      message: 'success',
    }
  }

  @Delete('reviews/:id')
  async deleteReview(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteReview(+id),
      message: 'success',
    }
  }

  @Put('reviews/:id/complete')
  async completeReview(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.completeReview(+id, body),
      message: 'success',
    }
  }

  // ==================== Safety Concepts (FSC/TSC) ====================

  @Get('concepts')
  async findAllConcepts(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('conceptType') conceptType?: string,
    @Query('goalId') goalId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return { code: 0, data: await this.service.findAllConcepts({ projectId, status, conceptType, goalId, skip: skip ? +skip : undefined, take: take ? +take : undefined }), message: 'success' }
  }

  @Get('concepts/tree/:projectId')
  async getConceptTree(@Param('projectId') projectId: string) {
    return { code: 0, data: await this.service.getConceptTree(+projectId), message: 'success' }
  }

  @Get('concepts/:id')
  async findOneConcept(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneConcept(+id), message: 'success' }
  }

  @Post('concepts')
  async createConcept(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createConcept(body, userId), message: 'success' }
  }

  @Put('concepts/:id')
  async updateConcept(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateConcept(+id, body), message: 'success' }
  }

  @Delete('concepts/:id')
  async deleteConcept(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteConcept(+id), message: 'success' }
  }

  // ==================== Safety Requirements ====================

  @Get('requirements')
  async findAllSafetyReqs(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('reqType') reqType?: string,
    @Query('goalId') goalId?: string,
    @Query('conceptId') conceptId?: string,
    @Query('asilLevel') asilLevel?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return { code: 0, data: await this.service.findAllSafetyReqs({ projectId, status, reqType, goalId, conceptId, asilLevel, skip: skip ? +skip : undefined, take: take ? +take : undefined }), message: 'success' }
  }

  @Get('requirements/traceability/:projectId')
  async getTraceabilityMatrix(@Param('projectId') projectId: string) {
    return { code: 0, data: await this.service.getTraceabilityMatrix(+projectId), message: 'success' }
  }

  @Get('requirements/:id')
  async findOneSafetyReq(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneSafetyReq(+id), message: 'success' }
  }

  @Post('requirements')
  async createSafetyReq(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createSafetyReq(body, userId), message: 'success' }
  }

  @Put('requirements/:id')
  async updateSafetyReq(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateSafetyReq(+id, body), message: 'success' }
  }

  @Delete('requirements/:id')
  async deleteSafetyReq(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteSafetyReq(+id), message: 'success' }
  }

  // ==================== FMEDA Records ====================

  @Get('fmeda')
  async findAllFmeda(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('safetyGoalId') safetyGoalId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return { code: 0, data: await this.service.findAllFmeda({ projectId, status, safetyGoalId, skip: skip ? +skip : undefined, take: take ? +take : undefined }), message: 'success' }
  }

  @Get('fmeda/:id')
  async findOneFmeda(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneFmeda(+id), message: 'success' }
  }

  @Post('fmeda')
  async createFmeda(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createFmeda(body, userId), message: 'success' }
  }

  @Put('fmeda/:id')
  async updateFmeda(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateFmeda(+id, body), message: 'success' }
  }

  @Delete('fmeda/:id')
  async deleteFmeda(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteFmeda(+id), message: 'success' }
  }

  // ==================== Hardware Safety Metrics ====================

  @Get('metrics')
  async findAllMetrics(
    @Query('projectId') projectId?: string,
    @Query('metricType') metricType?: string,
    @Query('safetyGoalId') safetyGoalId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return { code: 0, data: await this.service.findAllMetrics({ projectId, metricType, safetyGoalId, skip: skip ? +skip : undefined, take: take ? +take : undefined }), message: 'success' }
  }

  @Get('metrics/:id')
  async findOneMetric(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneMetric(+id), message: 'success' }
  }

  @Post('metrics')
  async createMetric(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createMetric(body, userId), message: 'success' }
  }

  @Put('metrics/:id')
  async updateMetric(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateMetric(+id, body), message: 'success' }
  }

  @Delete('metrics/:id')
  async deleteMetric(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteMetric(+id), message: 'success' }
  }

  // ==================== DFA Records ====================

  @Get('dfa')
  async findAllDfa(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('failureType') failureType?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return { code: 0, data: await this.service.findAllDfa({ projectId, status, failureType, skip: skip ? +skip : undefined, take: take ? +take : undefined }), message: 'success' }
  }

  @Get('dfa/:id')
  async findOneDfa(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneDfa(+id), message: 'success' }
  }

  @Post('dfa')
  async createDfa(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createDfa(body, userId), message: 'success' }
  }

  @Put('dfa/:id')
  async updateDfa(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateDfa(+id, body), message: 'success' }
  }

  @Delete('dfa/:id')
  async deleteDfa(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteDfa(+id), message: 'success' }
  }

  // ==================== ASIL Decomposition ====================

  @Get('decompositions')
  async findAllDecompositions(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('goalId') goalId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return { code: 0, data: await this.service.findAllDecompositions({ projectId, status, goalId, skip: skip ? +skip : undefined, take: take ? +take : undefined }), message: 'success' }
  }

  @Get('decompositions/:id')
  async findOneDecomposition(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneDecomposition(+id), message: 'success' }
  }

  @Post('decompositions')
  async createDecomposition(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createDecomposition(body, userId), message: 'success' }
  }

  @Put('decompositions/:id')
  async updateDecomposition(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateDecomposition(+id, body), message: 'success' }
  }

  @Delete('decompositions/:id')
  async deleteDecomposition(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteDecomposition(+id), message: 'success' }
  }

  // ==================== Tool Qualification ====================

  @Get('tools')
  async findAllTools(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('confidenceLevel') confidenceLevel?: string,
    @Query('toolType') toolType?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return { code: 0, data: await this.service.findAllTools({ projectId, status, confidenceLevel, toolType, skip: skip ? +skip : undefined, take: take ? +take : undefined }), message: 'success' }
  }

  @Get('tools/:id')
  async findOneTool(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneTool(+id), message: 'success' }
  }

  @Post('tools')
  async createTool(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createTool(body, userId), message: 'success' }
  }

  @Put('tools/:id')
  async updateTool(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateTool(+id, body), message: 'success' }
  }

  @Delete('tools/:id')
  async deleteTool(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteTool(+id), message: 'success' }
  }

  // ==================== Confirmation Measures ====================

  @Get('measures')
  async findAllMeasures(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('safetyCaseId') safetyCaseId?: string,
    @Query('safetyGoalId') safetyGoalId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return { code: 0, data: await this.service.findAllMeasures({ projectId, status, safetyCaseId, safetyGoalId, skip: skip ? +skip : undefined, take: take ? +take : undefined }), message: 'success' }
  }

  @Get('measures/:id')
  async findOneMeasure(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneMeasure(+id), message: 'success' }
  }

  @Post('measures')
  async createMeasure(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createMeasure(body, userId), message: 'success' }
  }

  @Put('measures/:id')
  async updateMeasure(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateMeasure(+id, body), message: 'success' }
  }

  @Delete('measures/:id')
  async deleteMeasure(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteMeasure(+id), message: 'success' }
  }

  @Put('measures/:id/complete')
  async completeMeasure(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.completeMeasure(+id, body), message: 'success' }
  }
}
