import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class SupplierCollabService {
  private readonly logger = new Logger(SupplierCollabService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Auto-numbering ====================

  private async generateDevNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const p = `SD${d}`
    const c = await this.prisma.supplierDevelopment.count({ where: { devNo: { startsWith: p } } })
    return `${p}${String(c + 1).padStart(4, '0')}`
  }

  private async generate8DNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const p = `S8D${d}`
    const c = await this.prisma.supplier8D.count({ where: { reportNo: { startsWith: p } } })
    return `${p}${String(c + 1).padStart(4, '0')}`
  }

  // ==================== Supplier Development ====================

  async findAllDevs(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.supplierId) where.supplierId = +params.supplierId
    if (params.stage) where.stage = params.stage
    const [items, total] = await Promise.all([
      this.prisma.supplierDevelopment.findMany({
        where,
        include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.supplierDevelopment.count({ where }),
    ])
    return { items, total }
  }

  async findOneDev(id: number) {
    const item = await this.prisma.supplierDevelopment.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Supplier development ${id} not found`)
    return item
  }

  async createDev(data: any, userId: number) {
    return this.prisma.supplierDevelopment.create({
      data: {
        ...data,
        projectId: +data.projectId,
        supplierId: +data.supplierId,
        devNo: await this.generateDevNo(),
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateDev(id: number, data: any) {
    const existing = await this.prisma.supplierDevelopment.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Supplier development ${id} not found`)
    return this.prisma.supplierDevelopment.update({
      where: { id },
      data: {
        ...data,
        projectId: data.projectId !== undefined ? +data.projectId : undefined,
        supplierId: data.supplierId !== undefined ? +data.supplierId : undefined,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteDev(id: number) {
    await this.prisma.supplierDevelopment.delete({ where: { id } })
    return { success: true }
  }

  // ==================== Supplier 8D ====================

  async findAll8Ds(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.supplierId) where.supplierId = +params.supplierId
    if (params.status) where.status = params.status
    const [items, total] = await Promise.all([
      this.prisma.supplier8D.findMany({
        where,
        include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.supplier8D.count({ where }),
    ])
    return { items, total }
  }

  async findOne8D(id: number) {
    const item = await this.prisma.supplier8D.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Supplier 8D ${id} not found`)
    return item
  }

  async create8D(data: any, userId: number) {
    return this.prisma.supplier8D.create({
      data: {
        ...data,
        projectId: +data.projectId,
        supplierId: +data.supplierId,
        reportNo: await this.generate8DNo(),
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async update8D(id: number, data: any) {
    const existing = await this.prisma.supplier8D.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Supplier 8D ${id} not found`)
    return this.prisma.supplier8D.update({
      where: { id },
      data: {
        ...data,
        projectId: data.projectId !== undefined ? +data.projectId : undefined,
        supplierId: data.supplierId !== undefined ? +data.supplierId : undefined,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async delete8D(id: number) {
    await this.prisma.supplier8D.delete({ where: { id } })
    return { success: true }
  }

  // ==================== Supplier Performance ====================

  async findAllPerfs(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.supplierId) where.supplierId = +params.supplierId
    if (params.period) where.period = params.period
    const [items, total] = await Promise.all([
      this.prisma.supplierPerformance.findMany({
        where,
        include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.supplierPerformance.count({ where }),
    ])
    return { items, total }
  }

  async findOnePerf(id: number) {
    const item = await this.prisma.supplierPerformance.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Supplier performance ${id} not found`)
    return item
  }

  async createPerf(data: any, userId: number) {
    const qualityScore = data.qualityScore ?? 0
    const deliveryScore = data.deliveryScore ?? 0
    const costScore = data.costScore ?? 0
    const serviceScore = data.serviceScore ?? 0
    const totalScore = (qualityScore + deliveryScore + costScore + serviceScore) / 4
    let grade: string
    if (totalScore >= 90) grade = 'A'
    else if (totalScore >= 75) grade = 'B'
    else if (totalScore >= 60) grade = 'C'
    else grade = 'D'
    return this.prisma.supplierPerformance.create({
      data: {
        ...data,
        projectId: +data.projectId,
        supplierId: +data.supplierId,
        qualityScore,
        deliveryScore,
        costScore,
        serviceScore,
        totalScore,
        grade,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updatePerf(id: number, data: any) {
    const existing = await this.prisma.supplierPerformance.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Supplier performance ${id} not found`)
    const qualityScore = data.qualityScore ?? existing.qualityScore
    const deliveryScore = data.deliveryScore ?? existing.deliveryScore
    const costScore = data.costScore ?? existing.costScore
    const serviceScore = data.serviceScore ?? existing.serviceScore
    const totalScore = (qualityScore + deliveryScore + costScore + serviceScore) / 4
    let grade: string
    if (totalScore >= 90) grade = 'A'
    else if (totalScore >= 75) grade = 'B'
    else if (totalScore >= 60) grade = 'C'
    else grade = 'D'
    return this.prisma.supplierPerformance.update({
      where: { id },
      data: {
        ...data,
        projectId: data.projectId !== undefined ? +data.projectId : undefined,
        supplierId: data.supplierId !== undefined ? +data.supplierId : undefined,
        qualityScore,
        deliveryScore,
        costScore,
        serviceScore,
        totalScore,
        grade,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deletePerf(id: number) {
    await this.prisma.supplierPerformance.delete({ where: { id } })
    return { success: true }
  }
}
