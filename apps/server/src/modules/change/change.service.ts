import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class ChangeService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Auto-numbering
  // ============================================================

  private async generateEcrCode(): Promise<string> {
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0')
    const prefix = `ECR${dateStr}`
    const count = await this.prisma.chgEcr.count({
      where: { ecrCode: { startsWith: prefix } },
    })
    return `${prefix}${(count + 1).toString().padStart(4, '0')}`
  }

  private async generateEcnCode(): Promise<string> {
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0')
    const prefix = `ECN${dateStr}`
    const count = await this.prisma.chgEcn.count({
      where: { ecnCode: { startsWith: prefix } },
    })
    return `${prefix}${(count + 1).toString().padStart(4, '0')}`
  }

  // ============================================================
  // ECR CRUD
  // ============================================================

  async findAllEcrs(projectId?: number, status?: string, changeType?: string, priority?: string) {
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (changeType) where.changeType = changeType
    if (priority) where.priority = priority

    return this.prisma.chgEcr.findMany({
      where,
      include: {
        requester: { select: { id: true, realName: true } },
        assignedTo: { select: { id: true, realName: true } },
        project: { select: { id: true, projectName: true } },
        _count: { select: { impactItems: true, ccbReviews: true, ecns: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneEcr(id: number) {
    return this.prisma.chgEcr.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, realName: true } },
        assignedTo: { select: { id: true, realName: true } },
        project: { select: { id: true, projectName: true } },
        impactItems: { orderBy: { sortOrder: 'asc' } },
        ccbReviews: {
          include: { reviewer: { select: { id: true, realName: true } } },
          orderBy: { reviewDate: 'desc' },
        },
        ecns: {
          include: {
            issuedBy: { select: { id: true, realName: true } },
            _count: { select: { actionItems: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  async createEcr(data: any, userId: number) {
    const ecrCode = await this.generateEcrCode()
    return this.prisma.chgEcr.create({
      data: {
        ecrCode,
        title: data.title,
        description: data.description,
        changeType: data.changeType,
        priority: data.priority || 'general',
        reason: data.reason,
        currentCondition: data.currentCondition,
        proposedChange: data.proposedChange,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : null,
        safetyRelated: data.safetyRelated || false,
        customerNotified: data.customerNotified || false,
        ppapResubmissionRequired: data.ppapResubmissionRequired || false,
        projectId: data.projectId,
        requesterId: userId,
        assignedToId: data.assignedToId || null,
        status: 'draft',
      },
      include: {
        requester: { select: { id: true, realName: true } },
        assignedTo: { select: { id: true, realName: true } },
      },
    })
  }

  async updateEcr(id: number, data: any) {
    const ecr = await this.prisma.chgEcr.findUnique({ where: { id } })
    if (!ecr) throw new BadRequestException('ECR not found')
    if (ecr.status !== 'draft') throw new BadRequestException('Can only edit ECR in draft status')

    return this.prisma.chgEcr.update({
      where: { id },
      data: {
        title: data.title ?? ecr.title,
        description: data.description ?? ecr.description,
        changeType: data.changeType ?? ecr.changeType,
        priority: data.priority ?? ecr.priority,
        reason: data.reason ?? ecr.reason,
        currentCondition: data.currentCondition ?? ecr.currentCondition,
        proposedChange: data.proposedChange ?? ecr.proposedChange,
        targetDate: data.targetDate ? new Date(data.targetDate) : ecr.targetDate,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : ecr.estimatedCost,
        safetyRelated: data.safetyRelated ?? ecr.safetyRelated,
        customerNotified: data.customerNotified ?? ecr.customerNotified,
        ppapResubmissionRequired: data.ppapResubmissionRequired ?? ecr.ppapResubmissionRequired,
        assignedToId: data.assignedToId !== undefined ? data.assignedToId : ecr.assignedToId,
      },
      include: {
        requester: { select: { id: true, realName: true } },
        assignedTo: { select: { id: true, realName: true } },
      },
    })
  }

  async deleteEcr(id: number) {
    const ecr = await this.prisma.chgEcr.findUnique({ where: { id } })
    if (!ecr) throw new BadRequestException('ECR not found')
    if (ecr.status !== 'draft') throw new BadRequestException('Can only delete ECR in draft status')
    await this.prisma.chgEcr.delete({ where: { id } })
  }

  // ============================================================
  // ECR Workflow Transitions
  // ============================================================

  async submitEcr(id: number) {
    return this.transitionEcr(id, ['draft'], 'submitted', { submittedAt: new Date() })
  }

  async startImpactAnalysis(id: number) {
    return this.transitionEcr(id, ['submitted'], 'impact_analysis')
  }

  async submitToCcb(id: number) {
    return this.transitionEcr(id, ['impact_analysis'], 'ccb_review')
  }

  async approveEcr(id: number, userId: number, opinion?: string, conditions?: string) {
    const ecr = await this.prisma.chgEcr.findUnique({ where: { id } })
    if (!ecr) throw new BadRequestException('ECR not found')
    if (ecr.status !== 'ccb_review') throw new BadRequestException('ECR must be in CCB review status to approve')

    await this.prisma.chgCcbReview.create({
      data: {
        ecrId: id,
        reviewerId: userId,
        decision: 'approve',
        opinion: opinion || null,
        conditions: conditions || null,
      },
    })

    return this.prisma.chgEcr.update({
      where: { id },
      data: { status: 'approved', approvedAt: new Date() },
      include: { requester: { select: { id: true, realName: true } }, assignedTo: { select: { id: true, realName: true } } },
    })
  }

  async rejectEcr(id: number, userId: number, opinion?: string) {
    const ecr = await this.prisma.chgEcr.findUnique({ where: { id } })
    if (!ecr) throw new BadRequestException('ECR not found')
    if (ecr.status !== 'ccb_review') throw new BadRequestException('ECR must be in CCB review status to reject')

    await this.prisma.chgCcbReview.create({
      data: {
        ecrId: id,
        reviewerId: userId,
        decision: 'reject',
        opinion: opinion || null,
      },
    })

    return this.prisma.chgEcr.update({
      where: { id },
      data: { status: 'rejected' },
      include: { requester: { select: { id: true, realName: true } }, assignedTo: { select: { id: true, realName: true } } },
    })
  }

  async closeEcr(id: number) {
    return this.transitionEcr(id, ['approved'], 'closed', { closedAt: new Date() })
  }

  private async transitionEcr(id: number, allowedFrom: string[], toStatus: string, extraData?: any) {
    const ecr = await this.prisma.chgEcr.findUnique({ where: { id } })
    if (!ecr) throw new BadRequestException('ECR not found')
    if (!allowedFrom.includes(ecr.status)) {
      throw new BadRequestException(`Cannot transition from ${ecr.status} to ${toStatus}`)
    }
    return this.prisma.chgEcr.update({
      where: { id },
      data: { status: toStatus, ...extraData },
      include: {
        requester: { select: { id: true, realName: true } },
        assignedTo: { select: { id: true, realName: true } },
      },
    })
  }

  // ============================================================
  // ECR Impact Items
  // ============================================================

  async createImpactItem(ecrId: number, data: any) {
    const ecr = await this.prisma.chgEcr.findUnique({ where: { id: ecrId } })
    if (!ecr) throw new BadRequestException('ECR not found')

    const maxOrder = await this.prisma.chgEcrImpactItem.aggregate({
      where: { ecrId },
      _max: { sortOrder: true },
    })

    return this.prisma.chgEcrImpactItem.create({
      data: {
        ecrId,
        impactArea: data.impactArea,
        affectedItem: data.affectedItem || null,
        impactLevel: data.impactLevel || 'medium',
        description: data.description || null,
        actionRequired: data.actionRequired || null,
        relatedDocId: data.relatedDocId || null,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })
  }

  async updateImpactItem(id: number, data: any) {
    return this.prisma.chgEcrImpactItem.update({
      where: { id },
      data: {
        impactArea: data.impactArea ?? undefined,
        affectedItem: data.affectedItem ?? undefined,
        impactLevel: data.impactLevel ?? undefined,
        description: data.description ?? undefined,
        actionRequired: data.actionRequired ?? undefined,
      },
    })
  }

  async deleteImpactItem(id: number) {
    await this.prisma.chgEcrImpactItem.delete({ where: { id } })
  }

  // ============================================================
  // CCB Reviews
  // ============================================================

  async findCcbReviews(ecrId?: number, decision?: string) {
    const where: any = {}
    if (ecrId) where.ecrId = ecrId
    if (decision) where.decision = decision

    return this.prisma.chgCcbReview.findMany({
      where,
      include: {
        ecr: { select: { id: true, ecrCode: true, title: true, status: true } },
        reviewer: { select: { id: true, realName: true } },
      },
      orderBy: { reviewDate: 'desc' },
    })
  }

  async createCcbReview(ecrId: number, data: any) {
    const ecr = await this.prisma.chgEcr.findUnique({ where: { id: ecrId } })
    if (!ecr) throw new BadRequestException('ECR not found')

    return this.prisma.chgCcbReview.create({
      data: {
        ecrId,
        reviewerId: data.reviewerId,
        decision: data.decision,
        opinion: data.opinion || null,
        conditions: data.conditions || null,
        nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : null,
      },
      include: {
        reviewer: { select: { id: true, realName: true } },
      },
    })
  }

  async updateCcbReview(id: number, data: any) {
    return this.prisma.chgCcbReview.update({
      where: { id },
      data: {
        decision: data.decision ?? undefined,
        opinion: data.opinion ?? undefined,
        conditions: data.conditions ?? undefined,
        nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : undefined,
      },
      include: {
        reviewer: { select: { id: true, realName: true } },
      },
    })
  }

  // ============================================================
  // ECN CRUD
  // ============================================================

  async findAllEcns(projectId?: number, status?: string, ecrId?: number) {
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (ecrId) where.ecrId = ecrId

    return this.prisma.chgEcn.findMany({
      where,
      include: {
        ecr: { select: { id: true, ecrCode: true, title: true } },
        issuedBy: { select: { id: true, realName: true } },
        verifiedBy: { select: { id: true, realName: true } },
        project: { select: { id: true, projectName: true } },
        _count: { select: { actionItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneEcn(id: number) {
    return this.prisma.chgEcn.findUnique({
      where: { id },
      include: {
        ecr: {
          select: { id: true, ecrCode: true, title: true, changeType: true, priority: true },
          include: { impactItems: { orderBy: { sortOrder: 'asc' } } },
        },
        issuedBy: { select: { id: true, realName: true } },
        verifiedBy: { select: { id: true, realName: true } },
        project: { select: { id: true, projectName: true } },
        actionItems: {
          include: { assignedTo: { select: { id: true, realName: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  }

  async createEcnFromEcr(ecrId: number, data: any, userId: number) {
    const ecr = await this.prisma.chgEcr.findUnique({ where: { id: ecrId } })
    if (!ecr) throw new BadRequestException('ECR not found')
    if (ecr.status !== 'approved') throw new BadRequestException('Can only create ECN from approved ECR')

    const ecnCode = await this.generateEcnCode()
    return this.prisma.chgEcn.create({
      data: {
        ecnCode,
        ecrId,
        projectId: ecr.projectId,
        title: data.title || ecr.title,
        description: data.description || ecr.proposedChange,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
        issuedById: userId,
        status: 'planning',
      },
      include: {
        ecr: { select: { id: true, ecrCode: true, title: true } },
        issuedBy: { select: { id: true, realName: true } },
      },
    })
  }

  async updateEcn(id: number, data: any) {
    const ecn = await this.prisma.chgEcn.findUnique({ where: { id } })
    if (!ecn) throw new BadRequestException('ECN not found')

    return this.prisma.chgEcn.update({
      where: { id },
      data: {
        title: data.title ?? ecn.title,
        description: data.description ?? ecn.description,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : ecn.effectiveDate,
      },
      include: {
        ecr: { select: { id: true, ecrCode: true, title: true } },
        issuedBy: { select: { id: true, realName: true } },
      },
    })
  }

  // ============================================================
  // ECN Workflow
  // ============================================================

  async startEcnExecution(id: number) {
    return this.transitionEcn(id, ['planning'], 'executing')
  }

  async startEcnVerification(id: number) {
    return this.transitionEcn(id, ['executing'], 'verifying')
  }

  async closeEcn(id: number, userId: number) {
    const ecn = await this.prisma.chgEcn.findUnique({ where: { id } })
    if (!ecn) throw new BadRequestException('ECN not found')
    if (ecn.status !== 'verifying') throw new BadRequestException('ECN must be in verifying status to close')

    const pendingActions = await this.prisma.chgEcnActionItem.count({
      where: { ecnId: id, status: { notIn: ['completed', 'verified'] } },
    })
    if (pendingActions > 0) {
      throw new BadRequestException(`Cannot close ECN: ${pendingActions} action items still pending`)
    }

    return this.prisma.chgEcn.update({
      where: { id },
      data: { status: 'closed', verifiedById: userId, verifiedAt: new Date(), closedAt: new Date() },
      include: {
        ecr: { select: { id: true, ecrCode: true, title: true } },
        issuedBy: { select: { id: true, realName: true } },
      },
    })
  }

  private async transitionEcn(id: number, allowedFrom: string[], toStatus: string) {
    const ecn = await this.prisma.chgEcn.findUnique({ where: { id } })
    if (!ecn) throw new BadRequestException('ECN not found')
    if (!allowedFrom.includes(ecn.status)) {
      throw new BadRequestException(`Cannot transition from ${ecn.status} to ${toStatus}`)
    }
    return this.prisma.chgEcn.update({
      where: { id },
      data: { status: toStatus },
      include: {
        ecr: { select: { id: true, ecrCode: true, title: true } },
        issuedBy: { select: { id: true, realName: true } },
      },
    })
  }

  // ============================================================
  // ECN Action Items
  // ============================================================

  async createActionItem(ecnId: number, data: any) {
    const ecn = await this.prisma.chgEcn.findUnique({ where: { id: ecnId } })
    if (!ecn) throw new BadRequestException('ECN not found')

    const maxOrder = await this.prisma.chgEcnActionItem.aggregate({
      where: { ecnId },
      _max: { sortOrder: true },
    })

    return this.prisma.chgEcnActionItem.create({
      data: {
        ecnId,
        actionType: data.actionType,
        description: data.description,
        assignedToId: data.assignedToId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        status: 'pending',
      },
      include: {
        assignedTo: { select: { id: true, realName: true } },
      },
    })
  }

  async updateActionItem(id: number, data: any) {
    return this.prisma.chgEcnActionItem.update({
      where: { id },
      data: {
        actionType: data.actionType ?? undefined,
        description: data.description ?? undefined,
        assignedToId: data.assignedToId !== undefined ? data.assignedToId : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        assignedTo: { select: { id: true, realName: true } },
      },
    })
  }

  async deleteActionItem(id: number) {
    await this.prisma.chgEcnActionItem.delete({ where: { id } })
  }

  async completeActionItem(id: number) {
    const item = await this.prisma.chgEcnActionItem.findUnique({ where: { id } })
    if (!item) throw new BadRequestException('Action item not found')
    if (item.status !== 'pending' && item.status !== 'in_progress') {
      throw new BadRequestException('Can only complete pending or in-progress items')
    }
    return this.prisma.chgEcnActionItem.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
      include: { assignedTo: { select: { id: true, realName: true } } },
    })
  }

  async verifyActionItem(id: number, verificationNote?: string) {
    const item = await this.prisma.chgEcnActionItem.findUnique({ where: { id } })
    if (!item) throw new BadRequestException('Action item not found')
    if (item.status !== 'completed') {
      throw new BadRequestException('Can only verify completed items')
    }
    return this.prisma.chgEcnActionItem.update({
      where: { id },
      data: { status: 'verified', verificationNote: verificationNote || null },
      include: { assignedTo: { select: { id: true, realName: true } } },
    })
  }

  // ============================================================
  // Statistics
  // ============================================================

  async getOverviewStats(projectId?: number) {
    const ecrWhere: any = {}
    const ecnWhere: any = {}
    if (projectId) {
      ecrWhere.projectId = projectId
      ecnWhere.projectId = projectId
    }

    const [
      totalEcrs,
      openEcrs,
      pendingCcb,
      totalEcns,
      activeEcns,
      closedEcns,
    ] = await Promise.all([
      this.prisma.chgEcr.count({ where: ecrWhere }),
      this.prisma.chgEcr.count({ where: { ...ecrWhere, status: { notIn: ['closed', 'rejected'] } } }),
      this.prisma.chgEcr.count({ where: { ...ecrWhere, status: 'ccb_review' } }),
      this.prisma.chgEcn.count({ where: ecnWhere }),
      this.prisma.chgEcn.count({ where: { ...ecnWhere, status: { in: ['planning', 'executing', 'verifying'] } } }),
      this.prisma.chgEcn.count({ where: { ...ecnWhere, status: 'closed' } }),
    ])

    return {
      totalEcrs,
      openEcrs,
      pendingCcb,
      totalEcns,
      activeEcns,
      closedEcns,
      closureRate: totalEcns > 0 ? Math.round((closedEcns / totalEcns) * 100) : 0,
    }
  }
}
