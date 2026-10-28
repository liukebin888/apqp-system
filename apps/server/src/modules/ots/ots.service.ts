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

  // ==================== OTS 文档检查表 ====================

  async findAllDocChecklists(projectId: number) {
    return this.prisma.otsDocChecklist.findMany({
      where: { projectId },
      include: {
        createdBy: { select: { id: true, realName: true } },
        items: {
          include: {
            reviewer: { select: { id: true, realName: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneDocChecklist(id: number) {
    const checklist = await this.prisma.otsDocChecklist.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, realName: true } },
        items: {
          include: {
            reviewer: { select: { id: true, realName: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
    if (!checklist) throw new NotFoundException('OTS 文档检查表不存在')
    return checklist
  }

  async createDocChecklist(data: any, userId: number) {
    return this.prisma.otsDocChecklist.create({
      data: {
        ...data,
        createdById: userId,
      },
    })
  }

  async initStandardDocChecklist(projectId: number, otsSampleId: number | undefined, userId: number) {
    const templateItems = [
      { category: 'structural', docName: '零件图纸 / 3D 模型（含公差标注）' },
      { category: 'structural', docName: '公差分析与堆叠报告（GD&T）' },
      { category: 'structural', docName: '材料清单（结构部分）与材料规格书' },
      { category: 'structural', docName: '结构 DFMEA' },
      { category: 'hardware', docName: '原理图 / Schema' },
      { category: 'hardware', docName: 'PCB Layout 文件' },
      { category: 'hardware', docName: '硬件 DFMEA' },
      { category: 'hardware', docName: '硬件 BOM' },
      { category: 'software', docName: '软件架构文档' },
      { category: 'software', docName: '软件详细设计文档' },
      { category: 'software', docName: '软件版本说明 / Release Notes' },
      { category: 'test', docName: 'DV 试验计划（DVP&R）' },
      { category: 'test', docName: 'DV 试验报告' },
      { category: 'test', docName: '全尺寸检验报告' },
      { category: 'material', docName: '材质证明 / 材料合格证' },
      { category: 'material', docName: '材料规格书（Material Specification）' },
      { category: 'process', docName: '过程流程图' },
      { category: 'process', docName: 'PFMEA' },
      { category: 'process', docName: '控制计划（Control Plan）' },
      { category: 'quality', docName: 'MSA 研究报告' },
      { category: 'quality', docName: '初始过程能力研究（Ppk/Cpk）' },
      { category: 'safety', docName: '功能安全文档包（Safety Case / FSC / TSR）' },
      { category: 'security', docName: 'TARA 报告 / 网络安全概念' },
      { category: 'security', docName: 'SBOM（软件物料清单）' },
    ]

    return this.prisma.otsDocChecklist.create({
      data: {
        projectId,
        otsSampleId,
        name: 'OTS 文档检查表',
        createdById: userId,
        items: {
          create: templateItems.map((item, idx) => ({
            sortOrder: idx + 1,
            docCategory: item.category,
            docName: item.docName,
          })),
        },
      },
      include: { items: true },
    })
  }

  async updateDocChecklistItem(id: number, data: any) {
    return this.prisma.otsDocChecklistItem.update({ where: { id }, data })
  }

  async getDocChecklistProgress(projectId: number) {
    const checklists = await this.prisma.otsDocChecklist.findMany({
      where: { projectId },
      include: { items: true },
    })

    let total = 0
    let completed = 0
    for (const cl of checklists) {
      total += cl.items.length
      completed += cl.items.filter(i => i.status === 'approved' || i.status === 'reviewed').length
    }

    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 }
  }

  async deleteDocChecklist(id: number) {
    const checklist = await this.prisma.otsDocChecklist.findUnique({ where: { id } })
    if (!checklist) throw new NotFoundException('OTS 文档检查表不存在')
    await this.prisma.otsDocChecklist.delete({ where: { id } })
    return { message: '删除成功' }
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
