import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class PpapService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Package ====================

  async findAllPackages(params: { projectId?: number; customerId?: number; status?: string }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.customerId) where.customerId = params.customerId
    if (params.status) where.status = params.status

    return this.prisma.ppapPackage.findMany({
      where,
      include: {
        project: { select: { id: true, projectCode: true, projectName: true } },
        customer: { select: { id: true, customerName: true } },
        createdBy: { select: { id: true, realName: true } },
        _count: { select: { items: true, submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOnePackage(id: number) {
    const pkg = await this.prisma.ppapPackage.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, projectCode: true, projectName: true } },
        customer: { select: { id: true, customerName: true } },
        createdBy: { select: { id: true, realName: true } },
        items: {
          include: { completedBy: { select: { id: true, realName: true } } },
          orderBy: { itemNumber: 'asc' },
        },
        submissions: {
          include: {
            reviewer: { select: { id: true, realName: true } },
            pswSignedBy: { select: { id: true, realName: true } },
          },
          orderBy: { submissionDate: 'desc' },
        },
      },
    })
    if (!pkg) throw new NotFoundException('PPAP包不存在')
    return pkg
  }

  async createPackage(data: any, userId: number) {
    const packageCode = await this.generatePackageCode()
    return this.prisma.ppapPackage.create({
      data: {
        ...data,
        packageCode,
        createdById: userId,
      },
    })
  }

  async updatePackage(id: number, data: any) {
    const pkg = await this.prisma.ppapPackage.findUnique({ where: { id } })
    if (!pkg) throw new NotFoundException('PPAP包不存在')
    return this.prisma.ppapPackage.update({ where: { id }, data })
  }

  async deletePackage(id: number) {
    const pkg = await this.prisma.ppapPackage.findUnique({ where: { id } })
    if (!pkg) throw new NotFoundException('PPAP包不存在')
    await this.prisma.ppapPackage.delete({ where: { id } })
    return { message: '删除成功' }
  }

  async updatePackageStatus(id: number, status: string) {
    const validStatuses = ['draft', 'in_review', 'submitted', 'approved', 'rejected']
    if (!validStatuses.includes(status)) throw new BadRequestException('无效的状态值')

    const updateData: any = { status }
    if (status === 'submitted') updateData.submittedDate = new Date()
    if (status === 'approved') updateData.approvedDate = new Date()

    return this.prisma.ppapPackage.update({ where: { id }, data: updateData })
  }

  // ==================== Item ====================

  async createItem(packageId: number, data: any) {
    const pkg = await this.prisma.ppapPackage.findUnique({ where: { id: packageId } })
    if (!pkg) throw new NotFoundException('PPAP包不存在')

    return this.prisma.ppapItem.create({
      data: {
        ...data,
        packageId,
      },
    })
  }

  async updateItem(id: number, data: any, userId?: number) {
    const updateData: any = { ...data }
    if (data.status === 'complete' && !data.completedById) {
      updateData.completedAt = new Date()
      updateData.completedById = userId || null
    }
    return this.prisma.ppapItem.update({ where: { id }, data: updateData })
  }

  async deleteItem(id: number) {
    await this.prisma.ppapItem.delete({ where: { id } })
    return { message: '删除成功' }
  }

  async initDefaultItems(packageId: number) {
    const ppapItemNames = [
      '设计记录', '工程变更文件', '顾客工程批准', '设计FMEA',
      '过程流程图', '过程FMEA', '控制计划', '测量系统分析',
      '全尺寸结果', '材料/性能测试结果', '初始过程研究',
      '合格实验室文件', '外观批准报告', '生产件样品',
      '标准样品', '检查辅具', '顾客特殊要求',
    ]

    const items = ppapItemNames.map((name, index) => ({
      packageId,
      itemNumber: index + 1,
      itemName: name,
      required: true,
      status: 'pending' as const,
    }))

    for (const item of items) {
      await this.prisma.ppapItem.upsert({
        where: {
          packageId_itemNumber: { packageId: item.packageId, itemNumber: item.itemNumber },
        },
        update: {},
        create: item,
      })
    }

    return this.prisma.ppapItem.findMany({
      where: { packageId },
      orderBy: { itemNumber: 'asc' },
    })
  }

  // ==================== Submission ====================

  async createSubmission(packageId: number, data: any, userId: number) {
    const pkg = await this.prisma.ppapPackage.findUnique({ where: { id: packageId } })
    if (!pkg) throw new NotFoundException('PPAP包不存在')

    const submission = await this.prisma.ppapSubmission.create({
      data: {
        ...data,
        packageId,
      },
    })

    await this.prisma.ppapPackage.update({
      where: { id: packageId },
      data: { status: 'submitted', submittedDate: new Date() },
    })

    return submission
  }

  async reviewSubmission(id: number, data: any, userId: number) {
    const { status, reviewComments, pswStatus } = data

    const updateData: any = {
      status,
      reviewComments,
      reviewerId: userId,
      reviewDate: new Date(),
    }

    if (pswStatus === 'signed') {
      updateData.pswStatus = 'signed'
      updateData.pswSignedDate = new Date()
      updateData.pswSignedById = userId
    } else if (pswStatus) {
      updateData.pswStatus = pswStatus
    }

    const submission = await this.prisma.ppapSubmission.update({
      where: { id },
      data: updateData,
    })

    if (status === 'approved') {
      await this.prisma.ppapPackage.update({
        where: { id: submission.packageId },
        data: { status: 'approved', approvedDate: new Date() },
      })
    } else if (status === 'rejected') {
      await this.prisma.ppapPackage.update({
        where: { id: submission.packageId },
        data: { status: 'rejected' },
      })
    }

    return submission
  }

  // ==================== Code Generator ====================

  private async generatePackageCode(): Promise<string> {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    const count = await this.prisma.ppapPackage.count({
      where: { packageCode: { startsWith: `PPAP-${dateStr}` } },
    })
    return `PPAP-${dateStr}-${String(count + 1).padStart(3, '0')}`
  }
}
