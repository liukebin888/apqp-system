import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
const ASIL_MATRIX: number[][][] = [
  [[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
  [[0,0,0],[0,0,0],[0,1,1],[1,1,2]],
  [[0,0,1],[0,1,2],[1,2,3],[2,3,4]],
  [[0,1,2],[1,2,3],[2,3,4],[3,4,4]],
  [[1,2,3],[2,3,4],[3,4,4],[4,4,4]],
]
const ASIL_NAMES = ['QM', 'A', 'B', 'C', 'D']
function calculateASIL(severity: number, exposure: number, controllability: number): string {
  const s = Math.max(0, Math.min(4, severity))
  const e = Math.max(1, Math.min(4, exposure))
  const c = Math.max(1, Math.min(3, controllability))
  const idx = ASIL_MATRIX[s]?.[e - 1]?.[c - 1]
  return ASIL_NAMES[idx ?? 0] || 'QM'
}

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Auto-numbering ====================

  private async generateNo(prefix: string, model: any): Promise<string> {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const likePrefix = `${prefix}${dateStr}`
    const count = await model.count({ where: { hazardNo: { startsWith: likePrefix } } } as any)
      .catch(() => 0)
    return `${likePrefix}${String(count + 1).padStart(4, '0')}`
  }

  private async genHazardNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `SH${d}`
    const c = await this.prisma.safetyHazardAnalysis.count({ where: { hazardNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genGoalNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `SG${d}`
    const c = await this.prisma.safetyGoal.count({ where: { goalNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genFtaNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `FT${d}`
    const c = await this.prisma.safetyFtaEvent.count({ where: { eventNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genCaseNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `SC${d}`
    const c = await this.prisma.safetyCase.count({ where: { caseNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genReviewNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `SR${d}`
    const c = await this.prisma.safetyReview.count({ where: { reviewNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genArgNo(safetyCaseId: number): Promise<string> {
    const c = await this.prisma.safetyCaseArgument.count({ where: { safetyCaseId } })
    return `ARG-${String(c+1).padStart(3,'0')}`
  }

  // ==================== Hazard Analysis ====================

  async findAllHazards(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    if (params.asil) where.calculatedAsil = params.asil
    if (params.hazardType) where.hazardType = params.hazardType
    const [items, total] = await Promise.all([
      this.prisma.safetyHazardAnalysis.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.safetyHazardAnalysis.count({ where }),
    ])
    return { items, total }
  }

  async findOneHazard(id: number) {
    const item = await this.prisma.safetyHazardAnalysis.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, realName: true } },
        safetyGoals: true,
      },
    })
    if (!item) throw new NotFoundException(`Hazard ${id} not found`)
    return item
  }

  async createHazard(data: any, userId: number) {
    const asil = calculateASIL(data.severityRating || 0, data.exposureRating || 1, data.controllabilityRating || 1)
    return this.prisma.safetyHazardAnalysis.create({
      data: {
        ...data,
        projectId: +data.projectId,
        hazardNo: await this.genHazardNo(),
        calculatedAsil: asil,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateHazard(id: number, data: any) {
    const existing = await this.prisma.safetyHazardAnalysis.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Hazard ${id} not found`)
    const s = data.severityRating ?? existing.severityRating
    const e = data.exposureRating ?? existing.exposureRating
    const c = data.controllabilityRating ?? existing.controllabilityRating
    const asil = calculateASIL(s, e, c)
    return this.prisma.safetyHazardAnalysis.update({
      where: { id },
      data: { ...data, calculatedAsil: asil },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteHazard(id: number) {
    await this.prisma.safetyHazardAnalysis.delete({ where: { id } })
    return { success: true }
  }

  async getHazardStats(projectId?: number) {
    const where: any = {}
    if (projectId) where.projectId = +projectId
    const all = await this.prisma.safetyHazardAnalysis.findMany({ where, select: { calculatedAsil: true, status: true } })
    const byAsil: Record<string, number> = { QM: 0, A: 0, B: 0, C: 0, D: 0 }
    const byStatus: Record<string, number> = {}
    for (const h of all) {
      byAsil[h.calculatedAsil] = (byAsil[h.calculatedAsil] || 0) + 1
      byStatus[h.status] = (byStatus[h.status] || 0) + 1
    }
    return { total: all.length, byAsil, byStatus }
  }

  // ==================== Safety Goals ====================

  async findAllGoals(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    if (params.targetAsil) where.targetAsil = params.targetAsil
    if (params.hazardId) where.hazardId = +params.hazardId
    const [items, total] = await Promise.all([
      this.prisma.safetyGoal.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          hazard: { select: { id: true, hazardNo: true, title: true, calculatedAsil: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.safetyGoal.count({ where }),
    ])
    return { items, total }
  }

  async findOneGoal(id: number) {
    const item = await this.prisma.safetyGoal.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, realName: true } },
        hazard: true,
        childGoals: { include: { createdBy: { select: { id: true, realName: true } } } },
        safetyCaseArguments: true,
      },
    })
    if (!item) throw new NotFoundException(`Safety goal ${id} not found`)
    return item
  }

  async createGoal(data: any, userId: number) {
    return this.prisma.safetyGoal.create({
      data: {
        ...data,
        projectId: +data.projectId,
        goalNo: await this.genGoalNo(),
        hazardId: data.hazardId ? +data.hazardId : null,
        parentGoalId: data.parentGoalId ? +data.parentGoalId : null,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } }, hazard: true },
    })
  }

  async updateGoal(id: number, data: any) {
    const existing = await this.prisma.safetyGoal.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Safety goal ${id} not found`)
    return this.prisma.safetyGoal.update({
      where: { id },
      data: {
        ...data,
        hazardId: data.hazardId !== undefined ? (data.hazardId ? +data.hazardId : null) : undefined,
        parentGoalId: data.parentGoalId !== undefined ? (data.parentGoalId ? +data.parentGoalId : null) : undefined,
      },
      include: { createdBy: { select: { id: true, realName: true } }, hazard: true },
    })
  }

  async deleteGoal(id: number) {
    await this.prisma.safetyGoal.delete({ where: { id } })
    return { success: true }
  }

  async getGoalTree(projectId: number) {
    const goals = await this.prisma.safetyGoal.findMany({
      where: { projectId: +projectId },
      include: {
        hazard: { select: { id: true, hazardNo: true, title: true, calculatedAsil: true } },
        createdBy: { select: { id: true, realName: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    const map = new Map<number, any>()
    const roots: any[] = []
    for (const g of goals) map.set(g.id, { ...g, children: [] })
    for (const g of goals) {
      const node = map.get(g.id)
      if (g.parentGoalId && map.has(g.parentGoalId)) {
        map.get(g.parentGoalId).children.push(node)
      } else {
        roots.push(node)
      }
    }
    return roots
  }

  // ==================== FTA Events ====================

  async findTopEvents(params: any) {
    const where: any = { parentId: null }
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    const [items, total] = await Promise.all([
      this.prisma.safetyFtaEvent.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          children: { select: { id: true, eventNo: true, title: true, eventType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.safetyFtaEvent.count({ where }),
    ])
    return { items, total }
  }

  async findOneFtaEvent(id: number) {
    const item = await this.prisma.safetyFtaEvent.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, realName: true } },
        children: {
          include: { createdBy: { select: { id: true, realName: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
    if (!item) throw new NotFoundException(`FTA event ${id} not found`)
    return item
  }

  async createFtaEvent(data: any, userId: number) {
    return this.prisma.safetyFtaEvent.create({
      data: {
        ...data,
        projectId: +data.projectId,
        eventNo: await this.genFtaNo(),
        parentId: data.parentId ? +data.parentId : null,
        goalId: data.goalId ? +data.goalId : null,
        failureRate: data.failureRate != null ? Decimal(data.failureRate) : null,
        probability: data.probability != null ? Decimal(data.probability) : null,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateFtaEvent(id: number, data: any) {
    const existing = await this.prisma.safetyFtaEvent.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`FTA event ${id} not found`)
    const updateData = { ...data }
    if (data.parentId !== undefined) updateData.parentId = data.parentId ? +data.parentId : null
    if (data.goalId !== undefined) updateData.goalId = data.goalId ? +data.goalId : null
    if (data.failureRate != null) updateData.failureRate = Decimal(data.failureRate)
    if (data.probability != null) updateData.probability = Decimal(data.probability)
    return this.prisma.safetyFtaEvent.update({
      where: { id }, data: updateData,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteFtaEvent(id: number) {
    await this.prisma.safetyFtaEvent.delete({ where: { id } })
    return { success: true }
  }

  async moveFtaEvent(id: number, data: any) {
    return this.prisma.safetyFtaEvent.update({
      where: { id },
      data: {
        parentId: data.parentId !== undefined ? (data.parentId ? +data.parentId : null) : undefined,
        sortOrder: data.sortOrder !== undefined ? +data.sortOrder : undefined,
      },
    })
  }

  async calculateFtaProbabilities(topEventId: number) {
    const topEvent = await this.prisma.safetyFtaEvent.findUnique({ where: { id: topEventId } })
    if (!topEvent) throw new NotFoundException(`FTA event ${topEventId} not found`)

    const allEvents = await this.prisma.safetyFtaEvent.findMany({
      where: { projectId: topEvent.projectId },
      orderBy: { sortOrder: 'asc' },
    })

    const eventMap = new Map<number, any>()
    for (const e of allEvents) eventMap.set(e.id, e)

    const calc = async (eventId: number): Promise<number> => {
      const ev = eventMap.get(eventId)
      if (!ev) return 0
      const children = allEvents.filter(e => e.parentId === eventId)
      if (children.length === 0) {
        const prob = ev.probability ? Number(ev.probability) : 0
        return prob
      }
      const childProbs = await Promise.all(children.map(c => calc(c.id)))
      let result: number
      if (ev.gateType === 'and') {
        result = childProbs.reduce((a, b) => a * b, 1)
      } else if (ev.gateType === 'voting' && ev.votingK) {
        const k = ev.votingK
        const n = childProbs.length
        const comb = (nn: number, rr: number): number => {
          if (rr > nn) return 0
          if (rr === 0 || rr === nn) return 1
          let r = 1
          for (let i = 0; i < rr; i++) r = r * (nn - i) / (i + 1)
          return r
        }
        result = 0
        for (let i = k; i <= n; i++) {
          const pSingle = childProbs.reduce((a, b) => a + b, 0) / n
          result += comb(n, i) * Math.pow(pSingle, i) * Math.pow(1 - pSingle, n - i)
        }
      } else {
        result = 1 - childProbs.reduce((a, b) => a * (1 - b), 1)
      }
      await this.prisma.safetyFtaEvent.update({
        where: { id: eventId }, data: { probability: Decimal(result) },
      })
      return result
    }

    const topProb = await calc(topEventId)
    return { topEventId, probability: topProb }
  }

  async getFtaTreeData(projectId: number) {
    const events = await this.prisma.safetyFtaEvent.findMany({
      where: { projectId: +projectId },
      include: { createdBy: { select: { id: true, realName: true } } },
      orderBy: { sortOrder: 'asc' },
    })
    const map = new Map<number, any>()
    const roots: any[] = []
    for (const e of events) map.set(e.id, { ...e, children: [] })
    for (const e of events) {
      const node = map.get(e.id)
      if (e.parentId && map.has(e.parentId)) {
        map.get(e.parentId).children.push(node)
      } else {
        roots.push(node)
      }
    }
    return roots
  }

  // ==================== Safety Cases ====================

  async findAllCases(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    const [items, total] = await Promise.all([
      this.prisma.safetyCase.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          approvedBy: { select: { id: true, realName: true } },
          _count: { select: { arguments: true, evidences: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.safetyCase.count({ where }),
    ])
    return { items, total }
  }

  async findOneCase(id: number) {
    const item = await this.prisma.safetyCase.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        arguments: {
          include: { goal: { select: { id: true, goalNo: true, title: true } }, evidences: true },
          orderBy: { sortOrder: 'asc' },
        },
        evidences: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!item) throw new NotFoundException(`Safety case ${id} not found`)
    return item
  }

  async createCase(data: any, userId: number) {
    return this.prisma.safetyCase.create({
      data: {
        ...data,
        projectId: +data.projectId,
        version: data.version ? parseInt(data.version, 10) || 1 : 1,
        caseNo: await this.genCaseNo(),
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateCase(id: number, data: any) {
    const existing = await this.prisma.safetyCase.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Safety case ${id} not found`)
    return this.prisma.safetyCase.update({
      where: { id }, data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteCase(id: number) {
    await this.prisma.safetyCase.delete({ where: { id } })
    return { success: true }
  }

  async approveCase(id: number, userId: number) {
    return this.prisma.safetyCase.update({
      where: { id },
      data: { status: 'approved', approvedById: userId, approvedAt: new Date() },
      include: { approvedBy: { select: { id: true, realName: true } } },
    })
  }

  // ==================== Safety Case Arguments ====================

  async findArguments(caseId: number) {
    const args = await this.prisma.safetyCaseArgument.findMany({
      where: { safetyCaseId: +caseId },
      include: {
        goal: { select: { id: true, goalNo: true, title: true, targetAsil: true } },
        evidences: { select: { id: true, evidenceType: true, title: true, status: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })
    const map = new Map<number, any>()
    const roots: any[] = []
    for (const a of args) map.set(a.id, { ...a, children: [] })
    for (const a of args) {
      const node = map.get(a.id)
      if (a.parentId && map.has(a.parentId)) {
        map.get(a.parentId).children.push(node)
      } else {
        roots.push(node)
      }
    }
    return roots
  }

  async createArgument(caseId: number, data: any) {
    return this.prisma.safetyCaseArgument.create({
      data: {
        ...data,
        safetyCaseId: +caseId,
        argumentNo: await this.genArgNo(+caseId),
        parentId: data.parentId ? +data.parentId : null,
        goalId: data.goalId ? +data.goalId : null,
      },
      include: { goal: true },
    })
  }

  async updateArgument(id: number, data: any) {
    return this.prisma.safetyCaseArgument.update({
      where: { id },
      data: {
        ...data,
        parentId: data.parentId !== undefined ? (data.parentId ? +data.parentId : null) : undefined,
        goalId: data.goalId !== undefined ? (data.goalId ? +data.goalId : null) : undefined,
      },
    })
  }

  async deleteArgument(id: number) {
    await this.prisma.safetyCaseArgument.delete({ where: { id } })
    return { success: true }
  }

  // ==================== Safety Case Evidence ====================

  async createEvidence(caseId: number, data: any) {
    return this.prisma.safetyCaseEvidence.create({
      data: {
        ...data,
        safetyCaseId: +caseId,
        argumentId: data.argumentId ? +data.argumentId : null,
        referenceId: data.referenceId ? +data.referenceId : null,
      },
    })
  }

  async updateEvidence(id: number, data: any) {
    return this.prisma.safetyCaseEvidence.update({ where: { id }, data })
  }

  async deleteEvidence(id: number) {
    await this.prisma.safetyCaseEvidence.delete({ where: { id } })
    return { success: true }
  }

  async getComplianceMatrix(caseId: number) {
    const sc = await this.prisma.safetyCase.findUnique({
      where: { id: +caseId },
      include: {
        arguments: {
          where: { nodeType: 'goal' },
          include: {
            goal: { select: { id: true, goalNo: true, title: true, targetAsil: true } },
            evidences: { select: { id: true, evidenceType: true, status: true } },
          },
        },
      },
    })
    if (!sc) throw new NotFoundException(`Safety case ${caseId} not found`)
    const goals = sc.arguments.filter(a => a.nodeType === 'goal')
    const matrix = goals.map(g => ({
      argumentId: g.id,
      argumentNo: g.argumentNo,
      title: g.title,
      safetyGoal: g.goal,
      evidenceCount: g.evidences.length,
      verifiedCount: g.evidences.filter(e => e.status === 'verified' || e.status === 'accepted').length,
      status: g.evidences.length > 0 ? (g.evidences.every(e => e.status === 'verified' || e.status === 'accepted') ? 'covered' : 'partial') : 'uncovered',
    }))
    const totalGoals = matrix.length
    const coveredGoals = matrix.filter(m => m.status === 'covered').length
    return {
      safetyCaseId: +caseId,
      totalGoals,
      coveredGoals,
      coverageRate: totalGoals > 0 ? Math.round((coveredGoals / totalGoals) * 100) : 0,
      matrix,
    }
  }

  // ==================== Safety Reviews ====================

  async findAllReviews(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    if (params.reviewType) where.reviewType = params.reviewType
    const [items, total] = await Promise.all([
      this.prisma.safetyReview.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          leader: { select: { id: true, realName: true } },
        },
        orderBy: { plannedDate: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.safetyReview.count({ where }),
    ])
    return { items, total }
  }

  async findOneReview(id: number) {
    const item = await this.prisma.safetyReview.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, realName: true } },
        leader: { select: { id: true, realName: true } },
      },
    })
    if (!item) throw new NotFoundException(`Safety review ${id} not found`)
    return item
  }

  async createReview(data: any, userId: number) {
    const { projectId, title, reviewType, plannedDate, leaderId, status } = data
    return this.prisma.safetyReview.create({
      data: {
        projectId: +projectId,
        title,
        reviewType,
        reviewNo: await this.genReviewNo(),
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        leaderId: leaderId ? +leaderId : null,
        status: status || 'planned',
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } }, leader: { select: { id: true, realName: true } } },
    })
  }

  async updateReview(id: number, data: any) {
    const existing = await this.prisma.safetyReview.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Safety review ${id} not found`)
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.reviewType !== undefined) updateData.reviewType = data.reviewType
    if (data.plannedDate !== undefined) updateData.plannedDate = data.plannedDate ? new Date(data.plannedDate) : null
    if (data.leaderId !== undefined) updateData.leaderId = data.leaderId ? +data.leaderId : null
    if (data.status !== undefined) updateData.status = data.status
    return this.prisma.safetyReview.update({
      where: { id },
      data: updateData,
      include: { leader: { select: { id: true, realName: true } } },
    })
  }

  async deleteReview(id: number) {
    await this.prisma.safetyReview.delete({ where: { id } })
    return { success: true }
  }

  async completeReview(id: number, data: any) {
    return this.prisma.safetyReview.update({
      where: { id },
      data: {
        status: 'completed',
        conclusion: data.conclusion,
        findingsSummary: data.findingsSummary,
        actualDate: data.actualDate || new Date(),
      },
    })
  }

  // ==================== Auto-number generators (new modules) ====================

  private async genConceptNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `CN${d}`
    const c = await this.prisma.safetyConcept.count({ where: { conceptNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genSafetyReqNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `SR${d}`
    const c = await this.prisma.safetyRequirement.count({ where: { reqNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genFmedaNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `FM${d}`
    const c = await this.prisma.fmedaRecord.count({ where: { fmedaNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genMetricNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `HM${d}`
    const c = await this.prisma.hardwareSafetyMetric.count({ where: { metricNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genDfaNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `DF${d}`
    const c = await this.prisma.dfaRecord.count({ where: { dfaNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genDecompNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `AD${d}`
    const c = await this.prisma.asilDecomposition.count({ where: { decompositionNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genToolNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `TL${d}`
    const c = await this.prisma.toolQualification.count({ where: { toolNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  private async genMeasureNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `CM${d}`
    const c = await this.prisma.confirmationMeasure.count({ where: { measureNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  // ==================== Safety Concepts (FSC/TSC) ====================

  async findAllConcepts(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    if (params.conceptType) where.conceptType = params.conceptType
    if (params.goalId) where.goalId = +params.goalId
    const [items, total] = await Promise.all([
      this.prisma.safetyConcept.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          goal: { select: { id: true, goalNo: true, title: true, targetAsil: true } },
          childConcepts: { select: { id: true, conceptNo: true, title: true, conceptType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.safetyConcept.count({ where }),
    ])
    return { items, total }
  }

  async findOneConcept(id: number) {
    const item = await this.prisma.safetyConcept.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, realName: true } },
        goal: true,
        parentConcept: { select: { id: true, conceptNo: true, title: true } },
        childConcepts: { include: { createdBy: { select: { id: true, realName: true } } } },
        requirements: true,
      },
    })
    if (!item) throw new NotFoundException(`Safety concept ${id} not found`)
    return item
  }

  async createConcept(data: any, userId: number) {
    return this.prisma.safetyConcept.create({
      data: {
        ...data,
        projectId: +data.projectId,
        conceptNo: await this.genConceptNo(),
        goalId: data.goalId ? +data.goalId : null,
        parentConceptId: data.parentConceptId ? +data.parentConceptId : null,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } }, goal: true },
    })
  }

  async updateConcept(id: number, data: any) {
    const existing = await this.prisma.safetyConcept.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Safety concept ${id} not found`)
    return this.prisma.safetyConcept.update({
      where: { id },
      data: {
        ...data,
        goalId: data.goalId !== undefined ? (data.goalId ? +data.goalId : null) : undefined,
        parentConceptId: data.parentConceptId !== undefined ? (data.parentConceptId ? +data.parentConceptId : null) : undefined,
      },
    })
  }

  async deleteConcept(id: number) {
    await this.prisma.safetyConcept.delete({ where: { id } })
    return { success: true }
  }

  async getConceptTree(projectId: number) {
    const concepts = await this.prisma.safetyConcept.findMany({
      where: { projectId: +projectId },
      include: {
        goal: { select: { id: true, goalNo: true, title: true } },
        createdBy: { select: { id: true, realName: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    const map = new Map<number, any>()
    const roots: any[] = []
    for (const c of concepts) map.set(c.id, { ...c, children: [] })
    for (const c of concepts) {
      const node = map.get(c.id)
      if (c.parentConceptId && map.has(c.parentConceptId)) {
        map.get(c.parentConceptId).children.push(node)
      } else {
        roots.push(node)
      }
    }
    return roots
  }

  // ==================== Safety Requirements ====================

  async findAllSafetyReqs(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    if (params.reqType) where.reqType = params.reqType
    if (params.goalId) where.goalId = +params.goalId
    if (params.conceptId) where.conceptId = +params.conceptId
    if (params.asilLevel) where.asilLevel = params.asilLevel
    const [items, total] = await Promise.all([
      this.prisma.safetyRequirement.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          goal: { select: { id: true, goalNo: true, title: true, targetAsil: true } },
          concept: { select: { id: true, conceptNo: true, title: true, conceptType: true } },
          sourceReq: { select: { id: true, reqCode: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.safetyRequirement.count({ where }),
    ])
    return { items, total }
  }

  async findOneSafetyReq(id: number) {
    const item = await this.prisma.safetyRequirement.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, realName: true } },
        goal: true,
        concept: true,
        sourceReq: true,
      },
    })
    if (!item) throw new NotFoundException(`Safety requirement ${id} not found`)
    return item
  }

  async createSafetyReq(data: any, userId: number) {
    return this.prisma.safetyRequirement.create({
      data: {
        ...data,
        projectId: +data.projectId,
        reqNo: await this.genSafetyReqNo(),
        conceptId: data.conceptId ? +data.conceptId : null,
        goalId: data.goalId ? +data.goalId : null,
        sourceReqId: data.sourceReqId ? +data.sourceReqId : null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, realName: true } },
        goal: true, concept: true, sourceReq: true,
      },
    })
  }

  async updateSafetyReq(id: number, data: any) {
    const existing = await this.prisma.safetyRequirement.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Safety requirement ${id} not found`)
    return this.prisma.safetyRequirement.update({
      where: { id },
      data: {
        ...data,
        conceptId: data.conceptId !== undefined ? (data.conceptId ? +data.conceptId : null) : undefined,
        goalId: data.goalId !== undefined ? (data.goalId ? +data.goalId : null) : undefined,
        sourceReqId: data.sourceReqId !== undefined ? (data.sourceReqId ? +data.sourceReqId : null) : undefined,
      },
    })
  }

  async deleteSafetyReq(id: number) {
    await this.prisma.safetyRequirement.delete({ where: { id } })
    return { success: true }
  }

  async getTraceabilityMatrix(projectId: number) {
    const reqs = await this.prisma.safetyRequirement.findMany({
      where: { projectId: +projectId },
      include: {
        goal: { select: { id: true, goalNo: true, title: true, targetAsil: true } },
        concept: { select: { id: true, conceptNo: true, title: true, conceptType: true } },
        sourceReq: { select: { id: true, reqCode: true, title: true } },
      },
      orderBy: { reqNo: 'asc' },
    })
    const total = reqs.length
    const tracedToGoal = reqs.filter(r => r.goalId).length
    const tracedToConcept = reqs.filter(r => r.conceptId).length
    const tracedToSource = reqs.filter(r => r.sourceReqId).length
    const byAsil: Record<string, number> = {}
    for (const r of reqs) byAsil[r.asilLevel] = (byAsil[r.asilLevel] || 0) + 1
    return {
      totalRequirements: total,
      tracedToGoal, tracedToConcept, tracedToSource,
      goalCoverage: total > 0 ? Math.round((tracedToGoal / total) * 100) : 0,
      byAsil,
      requirements: reqs.map(r => ({
        id: r.id, reqNo: r.reqNo, title: r.title, reqType: r.reqType, asilLevel: r.asilLevel, status: r.status,
        safetyGoal: r.goal, safetyConcept: r.concept, sourceRequirement: r.sourceReq,
      })),
    }
  }

  // ==================== FMEDA Records ====================

  async findAllFmeda(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    if (params.safetyGoalId) where.safetyGoalId = +params.safetyGoalId
    const [items, total] = await Promise.all([
      this.prisma.fmedaRecord.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          safetyGoal: { select: { id: true, goalNo: true, title: true, targetAsil: true } },
          ftaEvent: { select: { id: true, eventNo: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.fmedaRecord.count({ where }),
    ])
    return { items, total }
  }

  async findOneFmeda(id: number) {
    const item = await this.prisma.fmedaRecord.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } }, safetyGoal: true, ftaEvent: true },
    })
    if (!item) throw new NotFoundException(`FMEDA record ${id} not found`)
    return item
  }

  async createFmeda(data: any, userId: number) {
    return this.prisma.fmedaRecord.create({
      data: {
        ...data,
        projectId: +data.projectId,
        fmedaNo: await this.genFmedaNo(),
        safetyGoalId: data.safetyGoalId ? +data.safetyGoalId : null,
        ftaEventId: data.ftaEventId ? +data.ftaEventId : null,
        diagnosticCoverage: data.diagnosticCoverage != null ? Decimal(data.diagnosticCoverage) : null,
        fitRate: data.fitRate != null ? Decimal(data.fitRate) : null,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } }, safetyGoal: true },
    })
  }

  async updateFmeda(id: number, data: any) {
    const existing = await this.prisma.fmedaRecord.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`FMEDA record ${id} not found`)
    const updateData = { ...data }
    if (data.safetyGoalId !== undefined) updateData.safetyGoalId = data.safetyGoalId ? +data.safetyGoalId : null
    if (data.ftaEventId !== undefined) updateData.ftaEventId = data.ftaEventId ? +data.ftaEventId : null
    if (data.diagnosticCoverage != null) updateData.diagnosticCoverage = Decimal(data.diagnosticCoverage)
    if (data.fitRate != null) updateData.fitRate = Decimal(data.fitRate)
    return this.prisma.fmedaRecord.update({ where: { id }, data: updateData })
  }

  async deleteFmeda(id: number) {
    await this.prisma.fmedaRecord.delete({ where: { id } })
    return { success: true }
  }

  // ==================== Hardware Safety Metrics ====================

  async findAllMetrics(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.metricType) where.metricType = params.metricType
    if (params.safetyGoalId) where.safetyGoalId = +params.safetyGoalId
    const [items, total] = await Promise.all([
      this.prisma.hardwareSafetyMetric.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          safetyGoal: { select: { id: true, goalNo: true, title: true, targetAsil: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.hardwareSafetyMetric.count({ where }),
    ])
    return { items, total }
  }

  async findOneMetric(id: number) {
    const item = await this.prisma.hardwareSafetyMetric.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } }, safetyGoal: true },
    })
    if (!item) throw new NotFoundException(`Hardware metric ${id} not found`)
    return item
  }

  async createMetric(data: any, userId: number) {
    const targetValue = Decimal(data.targetValue || 0)
    const calculatedValue = Decimal(data.calculatedValue || 0)
    const passed = Number(calculatedValue) >= Number(targetValue)
    return this.prisma.hardwareSafetyMetric.create({
      data: {
        ...data,
        projectId: +data.projectId,
        metricNo: await this.genMetricNo(),
        targetValue, calculatedValue,
        safetyGoalId: data.safetyGoalId ? +data.safetyGoalId : null,
        status: data.status || (passed ? 'passed' : 'failed'),
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } }, safetyGoal: true },
    })
  }

  async updateMetric(id: number, data: any) {
    const existing = await this.prisma.hardwareSafetyMetric.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Hardware metric ${id} not found`)
    const updateData = { ...data }
    if (data.safetyGoalId !== undefined) updateData.safetyGoalId = data.safetyGoalId ? +data.safetyGoalId : null
    if (data.targetValue != null) updateData.targetValue = Decimal(data.targetValue)
    if (data.calculatedValue != null) updateData.calculatedValue = Decimal(data.calculatedValue)
    return this.prisma.hardwareSafetyMetric.update({ where: { id }, data: updateData })
  }

  async deleteMetric(id: number) {
    await this.prisma.hardwareSafetyMetric.delete({ where: { id } })
    return { success: true }
  }

  // ==================== DFA Records ====================

  async findAllDfa(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    if (params.failureType) where.failureType = params.failureType
    const [items, total] = await Promise.all([
      this.prisma.dfaRecord.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          safetyGoal: { select: { id: true, goalNo: true, title: true, targetAsil: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.dfaRecord.count({ where }),
    ])
    return { items, total }
  }

  async findOneDfa(id: number) {
    const item = await this.prisma.dfaRecord.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } }, safetyGoal: true },
    })
    if (!item) throw new NotFoundException(`DFA record ${id} not found`)
    return item
  }

  async createDfa(data: any, userId: number) {
    return this.prisma.dfaRecord.create({
      data: {
        ...data,
        projectId: +data.projectId,
        dfaNo: await this.genDfaNo(),
        safetyGoalId: data.safetyGoalId ? +data.safetyGoalId : null,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } }, safetyGoal: true },
    })
  }

  async updateDfa(id: number, data: any) {
    const existing = await this.prisma.dfaRecord.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`DFA record ${id} not found`)
    return this.prisma.dfaRecord.update({
      where: { id },
      data: { ...data, safetyGoalId: data.safetyGoalId !== undefined ? (data.safetyGoalId ? +data.safetyGoalId : null) : undefined },
    })
  }

  async deleteDfa(id: number) {
    await this.prisma.dfaRecord.delete({ where: { id } })
    return { success: true }
  }

  // ==================== ASIL Decomposition ====================

  async findAllDecompositions(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    if (params.goalId) where.goalId = +params.goalId
    const [items, total] = await Promise.all([
      this.prisma.asilDecomposition.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          goal: { select: { id: true, goalNo: true, title: true, targetAsil: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.asilDecomposition.count({ where }),
    ])
    return { items, total }
  }

  async findOneDecomposition(id: number) {
    const item = await this.prisma.asilDecomposition.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } }, goal: true },
    })
    if (!item) throw new NotFoundException(`ASIL decomposition ${id} not found`)
    return item
  }

  async createDecomposition(data: any, userId: number) {
    return this.prisma.asilDecomposition.create({
      data: {
        ...data,
        projectId: +data.projectId,
        decompositionNo: await this.genDecompNo(),
        goalId: +data.goalId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } }, goal: true },
    })
  }

  async updateDecomposition(id: number, data: any) {
    const existing = await this.prisma.asilDecomposition.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`ASIL decomposition ${id} not found`)
    return this.prisma.asilDecomposition.update({
      where: { id },
      data: { ...data, goalId: data.goalId !== undefined ? +data.goalId : undefined },
    })
  }

  async deleteDecomposition(id: number) {
    await this.prisma.asilDecomposition.delete({ where: { id } })
    return { success: true }
  }

  // ==================== Tool Qualification ====================

  async findAllTools(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    if (params.confidenceLevel) where.confidenceLevel = params.confidenceLevel
    if (params.toolType) where.toolType = params.toolType
    const [items, total] = await Promise.all([
      this.prisma.toolQualification.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          project: { select: { id: true, projectName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.toolQualification.count({ where }),
    ])
    return { items, total }
  }

  async findOneTool(id: number) {
    const item = await this.prisma.toolQualification.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } }, project: true },
    })
    if (!item) throw new NotFoundException(`Tool qualification ${id} not found`)
    return item
  }

  async createTool(data: any, userId: number) {
    return this.prisma.toolQualification.create({
      data: {
        ...data,
        projectId: data.projectId ? +data.projectId : null,
        toolNo: await this.genToolNo(),
        qualifiedAt: data.qualifiedAt ? new Date(data.qualifiedAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateTool(id: number, data: any) {
    const existing = await this.prisma.toolQualification.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Tool qualification ${id} not found`)
    const updateData = { ...data }
    if (data.projectId !== undefined) updateData.projectId = data.projectId ? +data.projectId : null
    if (data.qualifiedAt !== undefined) updateData.qualifiedAt = data.qualifiedAt ? new Date(data.qualifiedAt) : null
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
    return this.prisma.toolQualification.update({ where: { id }, data: updateData })
  }

  async deleteTool(id: number) {
    await this.prisma.toolQualification.delete({ where: { id } })
    return { success: true }
  }

  // ==================== Confirmation Measures ====================

  async findAllMeasures(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    if (params.safetyCaseId) where.safetyCaseId = +params.safetyCaseId
    if (params.safetyGoalId) where.safetyGoalId = +params.safetyGoalId
    const [items, total] = await Promise.all([
      this.prisma.confirmationMeasure.findMany({
        where, include: {
          createdBy: { select: { id: true, realName: true } },
          safetyCase: { select: { id: true, caseNo: true, title: true } },
          safetyGoal: { select: { id: true, goalNo: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.confirmationMeasure.count({ where }),
    ])
    return { items, total }
  }

  async findOneMeasure(id: number) {
    const item = await this.prisma.confirmationMeasure.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, realName: true } },
        safetyCase: true, safetyGoal: true,
      },
    })
    if (!item) throw new NotFoundException(`Confirmation measure ${id} not found`)
    return item
  }

  async createMeasure(data: any, userId: number) {
    return this.prisma.confirmationMeasure.create({
      data: {
        ...data,
        projectId: +data.projectId,
        measureNo: await this.genMeasureNo(),
        safetyCaseId: data.safetyCaseId ? +data.safetyCaseId : null,
        safetyGoalId: data.safetyGoalId ? +data.safetyGoalId : null,
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
        actualDate: data.actualDate ? new Date(data.actualDate) : null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, realName: true } },
        safetyCase: true, safetyGoal: true,
      },
    })
  }

  async updateMeasure(id: number, data: any) {
    const existing = await this.prisma.confirmationMeasure.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Confirmation measure ${id} not found`)
    const updateData = { ...data }
    if (data.safetyCaseId !== undefined) updateData.safetyCaseId = data.safetyCaseId ? +data.safetyCaseId : null
    if (data.safetyGoalId !== undefined) updateData.safetyGoalId = data.safetyGoalId ? +data.safetyGoalId : null
    if (data.plannedDate !== undefined) updateData.plannedDate = data.plannedDate ? new Date(data.plannedDate) : null
    if (data.actualDate !== undefined) updateData.actualDate = data.actualDate ? new Date(data.actualDate) : null
    return this.prisma.confirmationMeasure.update({ where: { id }, data: updateData })
  }

  async deleteMeasure(id: number) {
    await this.prisma.confirmationMeasure.delete({ where: { id } })
    return { success: true }
  }

  async completeMeasure(id: number, data: any) {
    return this.prisma.confirmationMeasure.update({
      where: { id },
      data: {
        status: data.passed ? 'passed' : 'failed',
        result: data.result,
        evidenceUrl: data.evidenceUrl,
        actualDate: new Date(),
      },
    })
  }
}

function Decimal(val: any): any {
  return typeof val === 'number' ? val : parseFloat(String(val))
}
