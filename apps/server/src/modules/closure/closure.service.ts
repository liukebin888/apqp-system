import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class ClosureService {
  private readonly logger = new Logger(ClosureService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Auto-numbering ====================

  async generateClosureNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const p = `PC${d}`
    const c = await this.prisma.prjClosure.count({ where: { closureNo: { startsWith: p } } })
    return `${p}${String(c + 1).padStart(4, '0')}`
  }

  async generateHandoverNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const p = `PH${d}`
    const c = await this.prisma.prjHandover.count({ where: { handoverNo: { startsWith: p } } })
    return `${p}${String(c + 1).padStart(4, '0')}`
  }

  // ==================== PrjClosure ====================

  async findAllClosures(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    const [items, total] = await Promise.all([
      this.prisma.prjClosure.findMany({
        where,
        include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      this.prisma.prjClosure.count({ where }),
    ])
    return { items, total }
  }

  async findOneClosure(id: number) {
    const item = await this.prisma.prjClosure.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Closure ${id} not found`)
    return item
  }

  async createClosure(data: any, userId: number) {
    return this.prisma.prjClosure.create({
      data: {
        ...data,
        projectId: +data.projectId,
        closureNo: await this.generateClosureNo(),
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateClosure(id: number, data: any) {
    const existing = await this.prisma.prjClosure.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Closure ${id} not found`)
    return this.prisma.prjClosure.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteClosure(id: number) {
    await this.prisma.prjClosure.delete({ where: { id } })
    return { success: true }
  }

  async approveClosure(id: number, userId: number) {
    return this.prisma.prjClosure.update({
      where: { id },
      data: { status: 'approved', approvedById: userId, approvedAt: new Date() },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  // ==================== PrjHandover ====================

  async findAllHandovers(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    const [items, total] = await Promise.all([
      this.prisma.prjHandover.findMany({
        where,
        include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      this.prisma.prjHandover.count({ where }),
    ])
    return { items, total }
  }

  async findOneHandover(id: number) {
    const item = await this.prisma.prjHandover.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Handover ${id} not found`)
    return item
  }

  async createHandover(data: any, userId: number) {
    return this.prisma.prjHandover.create({
      data: {
        ...data,
        projectId: +data.projectId,
        handoverNo: await this.generateHandoverNo(),
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateHandover(id: number, data: any) {
    const existing = await this.prisma.prjHandover.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Handover ${id} not found`)
    return this.prisma.prjHandover.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteHandover(id: number) {
    await this.prisma.prjHandover.delete({ where: { id } })
    return { success: true }
  }

  // ==================== PrjProductionTrace ====================

  async findAllTraces(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    const [items, total] = await Promise.all([
      this.prisma.prjProductionTrace.findMany({
        where,
        include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      this.prisma.prjProductionTrace.count({ where }),
    ])
    return { items, total }
  }

  async findOneTrace(id: number) {
    const item = await this.prisma.prjProductionTrace.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`ProductionTrace ${id} not found`)
    return item
  }

  async createTrace(data: any, userId: number) {
    return this.prisma.prjProductionTrace.create({
      data: {
        ...data,
        projectId: +data.projectId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateTrace(id: number, data: any) {
    const existing = await this.prisma.prjProductionTrace.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`ProductionTrace ${id} not found`)
    return this.prisma.prjProductionTrace.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteTrace(id: number) {
    await this.prisma.prjProductionTrace.delete({ where: { id } })
    return { success: true }
  }
}
