import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { SequenceService } from '../../common/services/sequence.service'
import { PaginationDto } from '../../common/dto/pagination.dto'

@Injectable()
export class RequirementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SequenceService,
  ) {}

  // ── Requirements CRUD ──

  async findByProject(projectId: number, query: PaginationDto & { reqType?: string; status?: string; keyword?: string }) {
    const where: any = { projectId }
    if (query.reqType) where.reqType = query.reqType
    if (query.status) where.status = query.status
    if (query.keyword) {
      where.OR = [
        { reqCode: { contains: query.keyword } },
        { title: { contains: query.keyword } },
      ]
    }

    const skip = (query.page - 1) * query.pageSize
    const take = query.pageSize

    const [list, total] = await Promise.all([
      this.prisma.reqRequirement.findMany({
        where,
        include: {
          sourceLinks: {
            include: { targetReq: { select: { id: true, reqCode: true, title: true } } },
            where: { status: 'active' },
          },
          targetLinks: {
            include: { sourceReq: { select: { id: true, reqCode: true, title: true } } },
            where: { status: 'active' },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reqRequirement.count({ where }),
    ])

    return { list, total, page: query.page, pageSize: query.pageSize }
  }

  async findOne(id: number) {
    const req = await this.prisma.reqRequirement.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { versionNo: 'desc' } },
        sourceLinks: {
          include: { targetReq: { select: { id: true, reqCode: true, title: true, reqType: true, status: true } } },
          where: { status: 'active' },
        },
        targetLinks: {
          include: { sourceReq: { select: { id: true, reqCode: true, title: true, reqType: true, status: true } } },
          where: { status: 'active' },
        },
        baselines: { include: { baseline: { select: { id: true, baselineName: true, baselineType: true, version: true } } } },
        changeRequestLinks: { include: { changeRequest: true } },
      },
    })
    if (!req) throw new NotFoundException('需求不存在')
    return req
  }

  async create(data: {
    projectId: number
    title: string
    description?: string
    reqType: string
    priority?: string
    asilLevel?: string
    source?: string
    acceptanceCriteria?: string
  }) {
    const reqCode = await this.sequence.nextNo('REQ')

    const req = await this.prisma.reqRequirement.create({
      data: {
        project: { connect: { id: data.projectId } },
        reqCode,
        title: data.title,
        description: data.description,
        reqType: data.reqType,
        priority: data.priority || 'medium',
        asilLevel: data.asilLevel,
        source: data.source,
        acceptanceCriteria: data.acceptanceCriteria,
      },
    })

    await this.prisma.reqRequirementVersion.create({
      data: {
        requirementId: req.id,
        versionNo: 1,
        title: data.title,
        description: data.description,
        changeNote: '初始版本',
        createdById: 1,
      },
    })

    return req
  }

  async update(id: number, data: {
    title?: string
    description?: string
    reqType?: string
    priority?: string
    asilLevel?: string
    status?: string
    source?: string
    acceptanceCriteria?: string
  }) {
    const req = await this.prisma.reqRequirement.findUnique({ where: { id } })
    if (!req) throw new NotFoundException('需求不存在')

    const updated = await this.prisma.reqRequirement.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    })

    await this.prisma.reqRequirementVersion.create({
      data: {
        requirementId: id,
        versionNo: updated.version,
        title: data.title || req.title,
        description: data.description || req.description,
        changeNote: '需求更新',
        createdById: 1,
      },
    })

    return updated
  }

  async delete(id: number) {
    const req = await this.prisma.reqRequirement.findUnique({ where: { id } })
    if (!req) throw new NotFoundException('需求不存在')
    await this.prisma.reqRequirement.delete({ where: { id } })
    return { message: '删除成功' }
  }

  // ── Trace Links ──

  async createTraceLink(data: {
    sourceReqId: number
    targetReqId?: number
    targetType?: string
    targetId?: number
    linkType: string
    verificationMethod?: string
  }) {
    return this.prisma.reqTraceLink.create({
      data: {
        sourceReqId: data.sourceReqId,
        targetReqId: data.targetReqId,
        targetType: data.targetType || 'requirement',
        targetId: data.targetId,
        linkType: data.linkType,
        verificationMethod: data.verificationMethod,
      },
    })
  }

  async deleteTraceLink(id: number) {
    await this.prisma.reqTraceLink.delete({ where: { id } })
    return { message: '追溯链接删除成功' }
  }

  async getTraceMatrix(projectId: number) {
    const requirements = await this.prisma.reqRequirement.findMany({
      where: { projectId },
      include: {
        sourceLinks: {
          include: { targetReq: { select: { id: true, reqCode: true, title: true, reqType: true, status: true } } },
          where: { status: 'active' },
        },
      },
      orderBy: { reqCode: 'asc' },
    })

    const matrix = requirements.map((req) => ({
      id: req.id,
      reqCode: req.reqCode,
      title: req.title,
      reqType: req.reqType,
      asilLevel: req.asilLevel,
      status: req.status,
      priority: req.priority,
      downstreamLinks: req.sourceLinks.map((link) => ({
        linkId: link.id,
        linkType: link.linkType,
        targetType: link.targetType,
        verificationMethod: link.verificationMethod,
        target: link.targetReq ? {
          id: link.targetReq.id,
          reqCode: link.targetReq.reqCode,
          title: link.targetReq.title,
          reqType: link.targetReq.reqType,
          status: link.targetReq.status,
        } : null,
      })),
    }))

    return matrix
  }

  // ── Coverage Analysis ──

  async analyzeCoverage(projectId: number) {
    const requirements = await this.prisma.reqRequirement.findMany({
      where: { projectId },
      include: {
        sourceLinks: { where: { status: 'active' } },
      },
    })

    const total = requirements.length
    const traced = requirements.filter((r) => r.sourceLinks.length > 0).length
    const coverageRate = total > 0 ? (traced / total) * 100 : 0

    const orphans = requirements
      .filter((r) => r.sourceLinks.length === 0)
      .map((r) => ({ id: r.id, reqCode: r.reqCode, title: r.title, reqType: r.reqType }))

    const asilBreakdown: Record<string, { total: number; traced: number }> = {}
    for (const req of requirements) {
      const level = req.asilLevel || 'QM'
      if (!asilBreakdown[level]) asilBreakdown[level] = { total: 0, traced: 0 }
      asilBreakdown[level].total++
      if (req.sourceLinks.length > 0) asilBreakdown[level].traced++
    }

    const analysis = await this.prisma.reqCoverageAnalysis.create({
      data: {
        projectId,
        totalRequirements: total,
        tracedRequirements: traced,
        coverageRate,
        orphanRequirements: orphans.map((o) => o.id) as any,
        asilCoverage: asilBreakdown as any,
        createdById: 1,
      },
    })

    return {
      analysisId: analysis.id,
      total,
      traced,
      coverageRate: +coverageRate.toFixed(2),
      orphans,
      asilBreakdown,
    }
  }

  // ── Baselines ──

  async findBaselines(projectId: number) {
    return this.prisma.reqBaseline.findMany({
      where: { projectId },
      include: {
        requirements: {
          include: { requirement: { select: { id: true, reqCode: true, title: true, version: true, status: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createBaseline(data: {
    projectId: number
    baselineName: string
    baselineCode: string
    baselineType: string
    version: string
    description?: string
    requirementIds?: number[]
  }) {
    const baseline = await this.prisma.reqBaseline.create({
      data: {
        project: { connect: { id: data.projectId } },
        baselineName: data.baselineName,
        baselineCode: data.baselineCode,
        baselineType: data.baselineType,
        version: data.version,
        description: data.description,
        createdById: 1,
      },
    })

    if (data.requirementIds?.length) {
      const reqs = await this.prisma.reqRequirement.findMany({
        where: { id: { in: data.requirementIds }, projectId: data.projectId },
        select: { id: true, version: true },
      })

      await this.prisma.reqBaselineRequirement.createMany({
        data: reqs.map((r) => ({
          baselineId: baseline.id,
          requirementId: r.id,
          reqVersion: r.version,
        })),
      })
    }

    return this.prisma.reqBaseline.findUnique({
      where: { id: baseline.id },
      include: {
        requirements: {
          include: { requirement: { select: { id: true, reqCode: true, title: true, version: true, status: true } } },
        },
      },
    })
  }

  async updateBaselineStatus(id: number, status: string) {
    return this.prisma.reqBaseline.update({ where: { id }, data: { status } })
  }

  // ── Change Requests ──

  async findChangeRequests(projectId: number, query: PaginationDto & { status?: string }) {
    const where: any = { projectId }
    if (query.status) where.status = query.status

    const skip = (query.page - 1) * query.pageSize
    const take = query.pageSize

    const [list, total] = await Promise.all([
      this.prisma.reqChangeRequest.findMany({
        where,
        include: {
          requirements: {
            include: { requirement: { select: { id: true, reqCode: true, title: true } } },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reqChangeRequest.count({ where }),
    ])

    return { list, total, page: query.page, pageSize: query.pageSize }
  }

  async createChangeRequest(data: {
    projectId: number
    title: string
    description?: string
    changeType: string
    impactAnalysis?: string
    priority?: string
    requirementIds?: number[]
  }) {
    const crCode = await this.sequence.nextNo('CR')

    const cr = await this.prisma.reqChangeRequest.create({
      data: {
        project: { connect: { id: data.projectId } },
        crCode,
        title: data.title,
        description: data.description,
        changeType: data.changeType,
        impactAnalysis: data.impactAnalysis,
        priority: data.priority || 'medium',
        requestedById: 1,
      },
    })

    if (data.requirementIds?.length) {
      await this.prisma.reqChangeRequestRequirement.createMany({
        data: data.requirementIds.map((reqId) => ({
          changeRequestId: cr.id,
          requirementId: reqId,
        })),
      })
    }

    return this.prisma.reqChangeRequest.findUnique({
      where: { id: cr.id },
      include: {
        requirements: {
          include: { requirement: { select: { id: true, reqCode: true, title: true } } },
        },
      },
    })
  }

  async updateChangeRequestStatus(id: number, status: string, approvedById?: number) {
    const data: any = { status }
    if (status === 'approved') {
      data.approvedById = approvedById || 1
      data.approvedAt = new Date()
    }
    if (status === 'implemented') {
      data.implementedAt = new Date()
    }
    return this.prisma.reqChangeRequest.update({ where: { id }, data })
  }
}
