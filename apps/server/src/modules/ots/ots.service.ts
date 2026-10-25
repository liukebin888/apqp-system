import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class OtsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Sample ====================

  async findAllSamples(params: { projectId?: number; customerId?: number; status?: string; sampleType?: string }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.customerId) where.customerId = params.customerId
    if (params.status) where.status = params.status
    if (params.sampleType) where.sampleType = params.sampleType

    return this.prisma.otsSample.findMany({
      where,
      include: {
        project: { select: { id: true, projectCode: true, projectName: true } },
        customer: { select: { id: true, customerName: true } },
        createdBy: { select: { id: true, realName: true } },
        _count: { select: { reports: true, testRecords: true, approvals: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneSample(id: number) {
    const sample = await this.prisma.otsSample.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, projectCode: true, projectName: true } },
        customer: { select: { id: true, customerName: true } },
        createdBy: { select: { id: true, realName: true } },
        reports: {
          include: { createdBy: { select: { id: true, realName: true } } },
          orderBy: { reportDate: 'desc' },
        },
        testRecords: {
          include: { tester: { select: { id: true, realName: true } } },
          orderBy: { testDate: 'desc' },
        },
        approvals: {
          include: { approver: { select: { id: true, realName: true } } },
          orderBy: { approvalDate: 'desc' },
        },
      },
    })
    if (!sample) throw new NotFoundException('OTS样件不存在')
    return sample
  }

  async createSample(data: any, userId: number) {
    const sampleCode = await this.generateSampleCode()
    return this.prisma.otsSample.create({
      data: {
        ...data,
        sampleCode,
        createdById: userId,
      },
    })
  }

  async updateSample(id: number, data: any) {
    const sample = await this.prisma.otsSample.findUnique({ where: { id } })
    if (!sample) throw new NotFoundException('OTS样件不存在')
    return this.prisma.otsSample.update({ where: { id }, data })
  }

  async deleteSample(id: number) {
    const sample = await this.prisma.otsSample.findUnique({ where: { id } })
    if (!sample) throw new NotFoundException('OTS样件不存在')
    await this.prisma.otsSample.delete({ where: { id } })
    return { message: '删除成功' }
  }

  async updateSampleStatus(id: number, status: string) {
    const validStatuses = ['planned', 'in_production', 'submitted', 'testing', 'approved', 'rejected']
    if (!validStatuses.includes(status)) throw new BadRequestException('无效的状态值')
    return this.prisma.otsSample.update({ where: { id }, data: { status } })
  }

  // ==================== Report ====================

  async createReport(sampleId: number, data: any, userId: number) {
    const sample = await this.prisma.otsSample.findUnique({ where: { id: sampleId } })
    if (!sample) throw new NotFoundException('OTS样件不存在')

    const reportCode = await this.generateReportCode()
    return this.prisma.otsReport.create({
      data: {
        ...data,
        sampleId,
        reportCode,
        createdById: userId,
      },
    })
  }

  async updateReport(id: number, data: any) {
    return this.prisma.otsReport.update({ where: { id }, data })
  }

  async deleteReport(id: number) {
    await this.prisma.otsReport.delete({ where: { id } })
    return { message: '删除成功' }
  }

  // ==================== Test Record ====================

  async createTestRecord(sampleId: number, data: any, userId: number) {
    const sample = await this.prisma.otsSample.findUnique({ where: { id: sampleId } })
    if (!sample) throw new NotFoundException('OTS样件不存在')

    return this.prisma.otsTestRecord.create({
      data: {
        ...data,
        sampleId,
        testerId: data.testerId || userId,
      },
    })
  }

  async updateTestRecord(id: number, data: any) {
    return this.prisma.otsTestRecord.update({ where: { id }, data })
  }

  async deleteTestRecord(id: number) {
    await this.prisma.otsTestRecord.delete({ where: { id } })
    return { message: '删除成功' }
  }

  // ==================== Approval ====================

  async createApproval(sampleId: number, data: any, userId: number) {
    const sample = await this.prisma.otsSample.findUnique({ where: { id: sampleId } })
    if (!sample) throw new NotFoundException('OTS样件不存在')

    const approval = await this.prisma.otsApproval.create({
      data: {
        ...data,
        sampleId,
        approverId: data.approverId || userId,
      },
    })

    if (data.status === 'approved') {
      await this.prisma.otsSample.update({
        where: { id: sampleId },
        data: { status: 'approved' },
      })
    } else if (data.status === 'rejected') {
      await this.prisma.otsSample.update({
        where: { id: sampleId },
        data: { status: 'rejected' },
      })
    }

    return approval
  }

  async updateApproval(id: number, data: any) {
    return this.prisma.otsApproval.update({ where: { id }, data })
  }

  // ==================== Code Generators ====================

  private async generateSampleCode(): Promise<string> {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    const count = await this.prisma.otsSample.count({
      where: { sampleCode: { startsWith: `OTS-${dateStr}` } },
    })
    return `OTS-${dateStr}-${String(count + 1).padStart(3, '0')}`
  }

  private async generateReportCode(): Promise<string> {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    const count = await this.prisma.otsReport.count({
      where: { reportCode: { startsWith: `OTSR-${dateStr}` } },
    })
    return `OTSR-${dateStr}-${String(count + 1).padStart(3, '0')}`
  }
}
