import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class ProjectReportService {
  private readonly logger = new Logger(ProjectReportService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Progress Reports ====================

  async findAllReports(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.reportType) where.reportType = params.reportType
    const [items, total] = await Promise.all([
      this.prisma.prjProgressReport.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.prjProgressReport.count({ where }),
    ])
    return { items, total }
  }

  async findOneReport(id: number) {
    const item = await this.prisma.prjProgressReport.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Progress report ${id} not found`)
    return item
  }

  async createReport(data: any, userId: number) {
    return this.prisma.prjProgressReport.create({
      data: {
        ...data,
        projectId: +data.projectId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateReport(id: number, data: any) {
    const existing = await this.prisma.prjProgressReport.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Progress report ${id} not found`)
    return this.prisma.prjProgressReport.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteReport(id: number) {
    await this.prisma.prjProgressReport.delete({ where: { id } })
    return { success: true }
  }

  // ==================== Kanban Configs ====================

  async findAllKanbanConfigs(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    const [items, total] = await Promise.all([
      this.prisma.prjKanbanConfig.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.prjKanbanConfig.count({ where }),
    ])
    return { items, total }
  }

  async findOneKanbanConfig(id: number) {
    const item = await this.prisma.prjKanbanConfig.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Kanban config ${id} not found`)
    return item
  }

  async createKanbanConfig(data: any, userId: number) {
    return this.prisma.prjKanbanConfig.create({
      data: {
        ...data,
        projectId: +data.projectId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateKanbanConfig(id: number, data: any) {
    const existing = await this.prisma.prjKanbanConfig.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Kanban config ${id} not found`)
    return this.prisma.prjKanbanConfig.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteKanbanConfig(id: number) {
    await this.prisma.prjKanbanConfig.delete({ where: { id } })
    return { success: true }
  }
}
