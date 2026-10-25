import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class QualityService {
  constructor(private prisma: PrismaService) {}

  // ==================== Quality Problems ====================

  async findAllProblems(params: {
    projectId?: number
    status?: string
    severity?: string
    classification?: string
    ownerId?: number
  }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.status) where.status = params.status
    if (params.severity) where.severity = params.severity
    if (params.classification) where.classification = params.classification
    if (params.ownerId) where.ownerId = params.ownerId

    return this.prisma.qualityProblem.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        owner: { select: { id: true, realName: true } },
        createdBy: { select: { id: true, realName: true } },
        closedBy: { select: { id: true, realName: true } },
        eightDReport: { select: { id: true, reportNo: true, status: true, completionRate: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneProblem(id: number) {
    return this.prisma.qualityProblem.findUniqueOrThrow({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        owner: { select: { id: true, realName: true } },
        createdBy: { select: { id: true, realName: true } },
        closedBy: { select: { id: true, realName: true } },
        eightDReport: true,
      },
    })
  }

  async createProblem(data: any, userId: number) {
    const problemNo = await this.generateProblemNo()
    return this.prisma.qualityProblem.create({
      data: {
        problemNo,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        classification: data.classification || 'quality',
        severity: data.severity || 'minor',
        source: data.source || 'process_inspection',
        status: 'new',
        ownerId: data.ownerId || null,
        createdById: userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        relatedOrderId: data.relatedOrderId || null,
        relatedOrderNo: data.relatedOrderNo || null,
      },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        owner: { select: { id: true, realName: true } },
        createdBy: { select: { id: true, realName: true } },
      },
    })
  }

  async updateProblem(id: number, data: any) {
    return this.prisma.qualityProblem.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        classification: data.classification,
        severity: data.severity,
        source: data.source,
        ownerId: data.ownerId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        owner: { select: { id: true, realName: true } },
      },
    })
  }

  async deleteProblem(id: number) {
    return this.prisma.qualityProblem.delete({ where: { id } })
  }

  async assignProblem(id: number, ownerId: number) {
    return this.prisma.qualityProblem.update({
      where: { id },
      data: { ownerId, status: 'analyzing' },
      include: {
        owner: { select: { id: true, realName: true } },
      },
    })
  }

  async closeProblem(id: number, userId: number) {
    return this.prisma.qualityProblem.update({
      where: { id },
      data: { status: 'closed', closedById: userId, closedAt: new Date() },
      include: {
        closedBy: { select: { id: true, realName: true } },
      },
    })
  }

  async escalateProblem(id: number) {
    return this.prisma.qualityProblem.update({
      where: { id },
      data: { status: 'escalated' },
    })
  }

  async updateProblemStatus(id: number, status: string) {
    return this.prisma.qualityProblem.update({
      where: { id },
      data: { status },
    })
  }

  private async generateProblemNo(): Promise<string> {
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0')
    const prefix = `QR${dateStr}`
    const count = await this.prisma.qualityProblem.count({
      where: { problemNo: { startsWith: prefix } },
    })
    return `${prefix}${(count + 1).toString().padStart(4, '0')}`
  }

  // ==================== 8D Reports ====================

  async findAll8DReports(params: { status?: string; problemId?: number }) {
    const where: any = {}
    if (params.status) where.status = params.status
    if (params.problemId) where.problemId = params.problemId

    return this.prisma.quality8DReport.findMany({
      where,
      include: {
        problem: {
          select: {
            id: true, problemNo: true, title: true, severity: true, status: true,
            project: { select: { id: true, projectName: true } },
          },
        },
        createdBy: { select: { id: true, realName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne8DReport(id: number) {
    return this.prisma.quality8DReport.findUniqueOrThrow({
      where: { id },
      include: {
        problem: {
          include: {
            project: { select: { id: true, projectName: true, projectCode: true } },
            owner: { select: { id: true, realName: true } },
          },
        },
        createdBy: { select: { id: true, realName: true } },
      },
    })
  }

  async create8DReport(problemId: number, userId: number) {
    const reportNo = await this.generate8DReportNo()
    const report = await this.prisma.quality8DReport.create({
      data: {
        problemId,
        reportNo,
        status: 'in_progress',
        completionRate: 0,
        createdById: userId,
      },
    })
    await this.prisma.qualityProblem.update({
      where: { id: problemId },
      data: { has8DReport: true, status: 'analyzing' },
    })
    return this.findOne8DReport(report.id)
  }

  async update8DStep(id: number, step: string, data: any) {
    const updateData: any = {}
    const stepFields: Record<string, string[]> = {
      d1: ['d1Team', 'd1ProblemDescription'],
      d2: ['d2ContainmentAction', 'd2ContainmentDate'],
      d3: ['d3RootCauseAnalysis', 'd3RootCauseVerified'],
      d4: ['d4PermanentCorrectiveAction', 'd4ImplementationDate'],
      d5: ['d5PreventiveAction', 'd5SystematicRecommendation'],
      d6: ['d6Verification', 'd6VerificationDate', 'd6Result'],
      d7: ['d7Standardization', 'd7DocumentUpdated'],
      d8: ['d8LessonsLearned', 'd8Congratulate'],
    }
    const fields = stepFields[step] || []
    for (const field of fields) {
      if (data[field] !== undefined) {
        if (field.endsWith('Date') && data[field]) {
          updateData[field] = new Date(data[field])
        } else {
          updateData[field] = data[field]
        }
      }
    }
    const completionRate = this.calculate8DCompletionRate({ ...updateData })
    updateData.completionRate = completionRate
    if (completionRate >= 100) {
      updateData.status = 'completed'
    }

    return this.prisma.quality8DReport.update({
      where: { id },
      data: updateData,
      include: {
        problem: {
          select: { id: true, problemNo: true, title: true, severity: true },
        },
      },
    })
  }

  private calculate8DCompletionRate(data: any): number {
    const steps = [
      ['d1Team'],
      ['d2ContainmentAction'],
      ['d3RootCauseAnalysis'],
      ['d4PermanentCorrectiveAction'],
      ['d5PreventiveAction'],
      ['d6Verification'],
      ['d7Standardization'],
      ['d8LessonsLearned'],
    ]
    let completed = 0
    for (const fields of steps) {
      if (fields.some((f) => data[f] != null && data[f] !== '' && data[f] !== false)) {
        completed++
      }
    }
    return Math.round((completed / 8) * 100 * 100) / 100
  }

  private async generate8DReportNo(): Promise<string> {
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0')
    const prefix = `8D${dateStr}`
    const count = await this.prisma.quality8DReport.count({
      where: { reportNo: { startsWith: prefix } },
    })
    return `${prefix}${(count + 1).toString().padStart(4, '0')}`
  }

  // ==================== Nonconformances ====================

  async findAllNonconformances(params: {
    projectId?: number
    defectType?: string
    disposition?: string
    supplierId?: number
  }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.defectType) where.defectType = params.defectType
    if (params.disposition) where.disposition = params.disposition
    if (params.supplierId) where.supplierId = params.supplierId

    return this.prisma.qualityNonconformance.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        supplier: { select: { id: true, supplierName: true, supplierCode: true } },
        dispositionBy: { select: { id: true, realName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneNonconformance(id: number) {
    return this.prisma.qualityNonconformance.findUniqueOrThrow({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        supplier: { select: { id: true, supplierName: true, supplierCode: true } },
        dispositionBy: { select: { id: true, realName: true } },
      },
    })
  }

  async createNonconformance(data: any, userId: number) {
    const ncNo = await this.generateNCNo()
    return this.prisma.qualityNonconformance.create({
      data: {
        ncNo,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        product: data.product,
        material: data.material,
        lotNo: data.lotNo,
        supplierId: data.supplierId || null,
        defectType: data.defectType,
        quantity: data.quantity || 0,
        defectQuantity: data.defectQuantity || 0,
        relatedInspectionId: data.relatedInspectionId || null,
      },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        supplier: { select: { id: true, supplierName: true } },
      },
    })
  }

  async updateNonconformance(id: number, data: any) {
    return this.prisma.qualityNonconformance.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        product: data.product,
        material: data.material,
        lotNo: data.lotNo,
        supplierId: data.supplierId,
        defectType: data.defectType,
        quantity: data.quantity,
        defectQuantity: data.defectQuantity,
      },
    })
  }

  async deleteNonconformance(id: number) {
    return this.prisma.qualityNonconformance.delete({ where: { id } })
  }

  async disposeNonconformance(id: number, disposition: string, userId: number, costImpact?: number) {
    return this.prisma.qualityNonconformance.update({
      where: { id },
      data: {
        disposition,
        dispositionDate: new Date(),
        dispositionById: userId,
        costImpact: costImpact || null,
      },
      include: {
        dispositionBy: { select: { id: true, realName: true } },
      },
    })
  }

  private async generateNCNo(): Promise<string> {
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0')
    const prefix = `NC${dateStr}`
    const count = await this.prisma.qualityNonconformance.count({
      where: { ncNo: { startsWith: prefix } },
    })
    return `${prefix}${(count + 1).toString().padStart(4, '0')}`
  }

  // ==================== CAPA ====================

  async findAllCapas(params: {
    status?: string
    type?: string
    source?: string
    assignedToId?: number
  }) {
    const where: any = {}
    if (params.status) where.status = params.status
    if (params.type) where.type = params.type
    if (params.source) where.source = params.source
    if (params.assignedToId) where.assignedToId = params.assignedToId

    return this.prisma.qualityCAPA.findMany({
      where,
      include: {
        createdBy: { select: { id: true, realName: true } },
        assignedTo: { select: { id: true, realName: true } },
        verifiedBy: { select: { id: true, realName: true } },
        project: { select: { id: true, projectName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneCapa(id: number) {
    return this.prisma.qualityCAPA.findUniqueOrThrow({
      where: { id },
      include: {
        createdBy: { select: { id: true, realName: true } },
        assignedTo: { select: { id: true, realName: true } },
        verifiedBy: { select: { id: true, realName: true } },
        project: { select: { id: true, projectName: true, projectCode: true } },
      },
    })
  }

  async createCapa(data: any, userId: number) {
    const capaNo = await this.generateCAPANo()
    return this.prisma.qualityCAPA.create({
      data: {
        capaNo,
        projectId: data.projectId || null,
        title: data.title,
        description: data.description,
        source: data.source || 'problem',
        type: data.type,
        relatedProblemId: data.relatedProblemId || null,
        relatedNonconformanceId: data.relatedNonconformanceId || null,
        rootCause: data.rootCause,
        correctiveAction: data.correctiveAction,
        preventiveAction: data.preventiveAction,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status: 'pending',
        createdById: userId,
        assignedToId: data.assignedToId || null,
      },
      include: {
        createdBy: { select: { id: true, realName: true } },
        assignedTo: { select: { id: true, realName: true } },
      },
    })
  }

  async updateCapa(id: number, data: any) {
    return this.prisma.qualityCAPA.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        rootCause: data.rootCause,
        correctiveAction: data.correctiveAction,
        preventiveAction: data.preventiveAction,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        assignedToId: data.assignedToId,
        status: data.status,
      },
    })
  }

  async deleteCapa(id: number) {
    return this.prisma.qualityCAPA.delete({ where: { id } })
  }

  async verifyCapa(id: number, userId: number, effectivenessResult: string) {
    return this.prisma.qualityCAPA.update({
      where: { id },
      data: {
        status: 'verified',
        verifiedById: userId,
        verifiedAt: new Date(),
        effectivenessResult,
      },
      include: {
        verifiedBy: { select: { id: true, realName: true } },
      },
    })
  }

  async closeCapa(id: number) {
    return this.prisma.qualityCAPA.update({
      where: { id },
      data: { status: 'closed', completedAt: new Date() },
    })
  }

  private async generateCAPANo(): Promise<string> {
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0')
    const prefix = `CA${dateStr}`
    const count = await this.prisma.qualityCAPA.count({
      where: { capaNo: { startsWith: prefix } },
    })
    return `${prefix}${(count + 1).toString().padStart(4, '0')}`
  }

  // ==================== Inspections ====================

  async findAllInspections(params: {
    projectId?: number
    type?: string
    result?: string
    inspectorId?: number
  }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.type) where.type = params.type
    if (params.result) where.result = params.result
    if (params.inspectorId) where.inspectorId = params.inspectorId

    return this.prisma.qualityInspection.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        inspector: { select: { id: true, realName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneInspection(id: number) {
    return this.prisma.qualityInspection.findUniqueOrThrow({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        inspector: { select: { id: true, realName: true } },
      },
    })
  }

  async createInspection(data: any, userId: number) {
    const inspectionNo = await this.generateInspectionNo()
    const result = data.result || 'pass'
    const inspection = await this.prisma.qualityInspection.create({
      data: {
        inspectionNo,
        projectId: data.projectId,
        title: data.title,
        type: data.type,
        inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : new Date(),
        inspectorId: userId,
        sampleSize: data.sampleSize || 0,
        defectCount: data.defectCount || 0,
        result,
        relatedOrderId: data.relatedOrderId || null,
        findings: data.findings,
        remarks: data.remarks,
      },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        inspector: { select: { id: true, realName: true } },
      },
    })

    if (result === 'fail') {
      await this.prisma.qualityNonconformance.create({
        data: {
          ncNo: await this.generateNCNo(),
          projectId: data.projectId,
          title: `检验不合格 - ${data.title}`,
          description: data.findings || `检验编号${inspectionNo}不合格`,
          defectType: data.defectType || 'function',
          quantity: data.sampleSize || 0,
          defectQuantity: data.defectCount || 0,
          relatedInspectionId: inspection.id,
        },
      })
    }

    return inspection
  }

  async updateInspection(id: number, data: any) {
    return this.prisma.qualityInspection.update({
      where: { id },
      data: {
        title: data.title,
        type: data.type,
        inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : undefined,
        sampleSize: data.sampleSize,
        defectCount: data.defectCount,
        result: data.result,
        findings: data.findings,
        remarks: data.remarks,
      },
    })
  }

  async deleteInspection(id: number) {
    return this.prisma.qualityInspection.delete({ where: { id } })
  }

  private async generateInspectionNo(): Promise<string> {
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0')
    const prefix = `IR${dateStr}`
    const count = await this.prisma.qualityInspection.count({
      where: { inspectionNo: { startsWith: prefix } },
    })
    return `${prefix}${(count + 1).toString().padStart(4, '0')}`
  }

  // ==================== Statistics ====================

  async getOverviewStats() {
    const [
      totalProblems, openProblems, criticalProblems,
      total8D, completed8D,
      totalNC, openNC,
      totalCAPA, openCAPA, verifiedCAPA,
      totalInspections, failedInspections,
    ] = await Promise.all([
      this.prisma.qualityProblem.count(),
      this.prisma.qualityProblem.count({ where: { status: { notIn: ['closed', 'escalated'] } } }),
      this.prisma.qualityProblem.count({ where: { severity: 'critical' } }),
      this.prisma.quality8DReport.count(),
      this.prisma.quality8DReport.count({ where: { status: 'completed' } }),
      this.prisma.qualityNonconformance.count(),
      this.prisma.qualityNonconformance.count({ where: { disposition: null } }),
      this.prisma.qualityCAPA.count(),
      this.prisma.qualityCAPA.count({ where: { status: { notIn: ['verified', 'closed'] } } }),
      this.prisma.qualityCAPA.count({ where: { status: 'verified' } }),
      this.prisma.qualityInspection.count(),
      this.prisma.qualityInspection.count({ where: { result: 'fail' } }),
    ])

    return {
      problems: { total: totalProblems, open: openProblems, critical: criticalProblems },
      eightD: { total: total8D, completed: completed8D, closureRate: total8D > 0 ? Math.round((completed8D / total8D) * 100) : 0 },
      nonconformances: { total: totalNC, open: openNC },
      capas: { total: totalCAPA, open: openCAPA, verified: verifiedCAPA },
      inspections: { total: totalInspections, failed: failedInspections, passRate: totalInspections > 0 ? Math.round(((totalInspections - failedInspections) / totalInspections) * 100) : 0 },
    }
  }

  async getProblemAnalysis(params: { projectId?: number }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId

    const [bySeverity, byClassification, bySource, byStatus, recentProblems] = await Promise.all([
      this.prisma.qualityProblem.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      this.prisma.qualityProblem.groupBy({
        by: ['classification'],
        where,
        _count: true,
      }),
      this.prisma.qualityProblem.groupBy({
        by: ['source'],
        where,
        _count: true,
      }),
      this.prisma.qualityProblem.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.qualityProblem.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, problemNo: true, title: true, severity: true, status: true, createdAt: true,
          owner: { select: { realName: true } },
          project: { select: { projectName: true } },
        },
      }),
    ])

    return { bySeverity, byClassification, bySource, byStatus, recentProblems }
  }
}
