import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class PreProjectService {
  constructor(private readonly prisma: PrismaService) {}

  // RFQ Management
  async findAllRfqs(params: { customerId?: number; status?: string }) {
    const where: any = {}
    if (params.customerId) where.customerId = params.customerId
    if (params.status) where.status = params.status

    return this.prisma.preRfq.findMany({
      where,
      include: {
        customer: true,
        quotations: { orderBy: { version: 'desc' }, take: 1 },
        feasibility: true,
        nomination: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneRfq(id: number) {
    const rfq = await this.prisma.preRfq.findUnique({
      where: { id },
      include: {
        customer: true,
        quotations: { orderBy: { version: 'desc' } },
        proposals: { orderBy: { version: 'desc' } },
        feasibility: true,
        nomination: true,
      },
    })
    if (!rfq) throw new NotFoundException('RFQ不存在')
    return rfq
  }

  async createRfq(data: any, userId: number) {
    const rfqCode = await this.generateRfqCode()
    return this.prisma.preRfq.create({
      data: {
        ...data,
        rfqCode,
        createdById: userId,
      },
    })
  }

  async updateRfq(id: number, data: any) {
    const rfq = await this.prisma.preRfq.findUnique({ where: { id } })
    if (!rfq) throw new NotFoundException('RFQ不存在')
    return this.prisma.preRfq.update({ where: { id }, data })
  }

  async deleteRfq(id: number) {
    const rfq = await this.prisma.preRfq.findUnique({ where: { id } })
    if (!rfq) throw new NotFoundException('RFQ不存在')
    await this.prisma.preRfq.delete({ where: { id } })
    return { message: '删除成功' }
  }

  // Quotation Management
  async createQuotation(rfqId: number, data: any, userId: number) {
    const rfq = await this.prisma.preRfq.findUnique({ where: { id: rfqId } })
    if (!rfq) throw new NotFoundException('RFQ不存在')

    const maxVersionResult = await this.prisma.preQuotation.findFirst({
      where: { rfqId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const nextVersion = (maxVersionResult?.version || 0) + 1

    return this.prisma.preQuotation.create({
      data: {
        ...data,
        rfqId,
        version: nextVersion,
        createdById: userId,
      },
    })
  }

  async updateQuotation(id: number, data: any) {
    return this.prisma.preQuotation.update({ where: { id }, data })
  }

  // Technical Proposal Management
  async createProposal(rfqId: number, data: any, userId: number) {
    const rfq = await this.prisma.preRfq.findUnique({ where: { id: rfqId } })
    if (!rfq) throw new NotFoundException('RFQ不存在')

    const maxVersionResult = await this.prisma.preTechnicalProposal.findFirst({
      where: { rfqId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const nextVersion = (maxVersionResult?.version || 0) + 1

    return this.prisma.preTechnicalProposal.create({
      data: {
        ...data,
        rfqId,
        version: nextVersion,
        createdById: userId,
      },
    })
  }

  async approveProposal(id: number, userId: number) {
    return this.prisma.preTechnicalProposal.update({
      where: { id },
      data: {
        customerApproved: true,
        approvedAt: new Date(),
      },
    })
  }

  // Feasibility Study
  async createOrUpdateFeasibility(rfqId: number, data: any, userId: number) {
    const rfq = await this.prisma.preRfq.findUnique({ where: { id: rfqId } })
    if (!rfq) throw new NotFoundException('RFQ不存在')

    const overallScore = (
      (data.techScore || 0) * 0.3 +
      (data.capacityScore || 0) * 0.2 +
      (data.qualityScore || 0) * 0.3 +
      (data.businessScore || 0) * 0.2
    ).toFixed(2)

    const { risks, conclusion, ...rest } = data
    const mappedData = {
      ...rest,
      techComment: data.techComment || risks || null,
      capacityComment: data.capacityComment || null,
      qualityComment: data.qualityComment || null,
      businessComment: data.businessComment || null,
      conclusion: conclusion || 'feasible',
    }

    const existing = await this.prisma.preFeasibilityStudy.findUnique({ where: { rfqId } })
    
    if (existing) {
      return this.prisma.preFeasibilityStudy.update({
        where: { rfqId },
        data: {
          ...mappedData,
          overallScore: parseFloat(overallScore),
          reviewedById: userId,
          reviewedAt: new Date(),
        },
      })
    }

    return this.prisma.preFeasibilityStudy.create({
      data: {
        rfqId,
        ...mappedData,
        overallScore: parseFloat(overallScore),
        reviewedById: userId,
        reviewedAt: new Date(),
      },
    })
  }

  // Nomination
  async createNomination(rfqId: number, data: any, userId: number) {
    const rfq = await this.prisma.preRfq.findUnique({ where: { id: rfqId } })
    if (!rfq) throw new NotFoundException('RFQ不存在')

    const nomination = await this.prisma.preNomination.create({
      data: {
        rfqId,
        customerId: rfq.customerId,
        ...data,
        createdById: userId,
      },
    })

    await this.prisma.preRfq.update({
      where: { id: rfqId },
      data: { status: 'nominated' },
    })

    return nomination
  }

  // Update RFQ Status
  async updateRfqStatus(id: number, status: string) {
    const validStatuses = ['received', 'analyzing', 'proposal_submitted', 'quoting', 'nominated', 'lost']
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('无效的状态值')
    }
    return this.prisma.preRfq.update({
      where: { id },
      data: { status },
    })
  }

  private async generateRfqCode(): Promise<string> {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    
    const count = await this.prisma.preRfq.count({
      where: {
        rfqCode: { startsWith: `RFQ-${dateStr}` },
      },
    })
    
    return `RFQ-${dateStr}-${String(count + 1).padStart(3, '0')}`
  }
}
