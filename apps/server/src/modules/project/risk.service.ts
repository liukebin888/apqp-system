import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { SequenceService } from '../../common/services/sequence.service'
import { PaginationDto } from '../../common/dto/pagination.dto'

@Injectable()
export class RiskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SequenceService,
  ) {}

  async findByProject(projectId: number, query: PaginationDto & { status?: string; category?: string }) {
    const where: any = { projectId }
    if (query.status) where.status = query.status
    if (query.category) where.category = query.category

    const skip = (query.page - 1) * query.pageSize
    const take = query.pageSize

    const [list, total] = await Promise.all([
      this.prisma.prjRisk.findMany({
        where,
        include: {
          responses: { include: { responsible: { select: { id: true, realName: true } } } },
          owner: { select: { id: true, realName: true } },
        },
        skip,
        take,
        orderBy: { identifiedAt: 'desc' },
      }),
      this.prisma.prjRisk.count({ where }),
    ])

    return { list, total, page: query.page, pageSize: query.pageSize }
  }

  async create(data: {
    projectId: number
    description: string
    category: string
    probability: number
    impact: number
    ownerUserId?: number
    responseStrategy?: string
  }) {
    const riskCode = await this.sequence.nextNo('RSK')
    const riskLevel = this.calculateRiskLevel(data.probability, data.impact)

    return this.prisma.prjRisk.create({
      data: { ...data, riskCode, riskLevel },
    })
  }

  async update(id: number, data: any) {
    const risk = await this.prisma.prjRisk.findUnique({ where: { id } })
    if (!risk) throw new NotFoundException('风险不存在')

    const updateData = { ...data }
    if (data.probability && data.impact) {
      updateData.riskLevel = this.calculateRiskLevel(data.probability, data.impact)
    }

    return this.prisma.prjRisk.update({ where: { id }, data: updateData })
  }

  async addResponse(riskId: number, data: { actionDesc: string; responsibleId?: number; dueDate?: string }) {
    return this.prisma.prjRiskResponse.create({
      data: {
        riskId,
        actionDesc: data.actionDesc,
        responsibleId: data.responsibleId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    })
  }

  async updateResponse(responseId: number, data: { status?: string; actionDesc?: string }) {
    return this.prisma.prjRiskResponse.update({ where: { id: responseId }, data })
  }

  async getRiskMatrix(projectId: number) {
    const risks = await this.prisma.prjRisk.findMany({
      where: { projectId, status: { not: 'closed' } },
      select: { probability: true, impact: true, riskLevel: true, id: true, description: true },
    })

    const matrix: Record<string, any[]> = {}
    for (const risk of risks) {
      const key = `${risk.probability}-${risk.impact}`
      if (!matrix[key]) matrix[key] = []
      matrix[key].push(risk)
    }

    return matrix
  }

  private calculateRiskLevel(probability: number, impact: number): string {
    const score = probability * impact
    if (score >= 16) return 'critical'
    if (score >= 9) return 'high'
    if (score >= 4) return 'medium'
    return 'low'
  }
}
