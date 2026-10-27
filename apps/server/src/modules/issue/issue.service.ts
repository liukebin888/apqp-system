import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class IssueService {
  private readonly logger = new Logger(IssueService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Auto-numbering ====================

  private async generateIssueNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `QI${d}`
    const c = await this.prisma.qualityIssue.count({ where: { issueNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  // ==================== Quality Issues ====================

  async findAllIssues(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    if (params.issueType) where.issueType = params.issueType
    if (params.severity) where.severity = params.severity
    const [items, total] = await Promise.all([
      this.prisma.qualityIssue.findMany({
        where, include: { reporter: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.qualityIssue.count({ where }),
    ])
    return { items, total }
  }

  async findOneIssue(id: number) {
    const item = await this.prisma.qualityIssue.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, realName: true } },
        owner: { select: { id: true, realName: true } },
      },
    })
    if (!item) throw new NotFoundException(`Issue ${id} not found`)
    return item
  }

  async createIssue(data: any, userId: number) {
    return this.prisma.qualityIssue.create({
      data: {
        ...data,
        projectId: +data.projectId,
        issueNo: await this.generateIssueNo(),
        reporterId: userId,
      },
      include: { reporter: { select: { id: true, realName: true } } },
    })
  }

  async updateIssue(id: number, data: any) {
    const existing = await this.prisma.qualityIssue.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Issue ${id} not found`)
    return this.prisma.qualityIssue.update({
      where: { id },
      data,
      include: { reporter: { select: { id: true, realName: true } } },
    })
  }

  async deleteIssue(id: number) {
    await this.prisma.qualityIssue.delete({ where: { id } })
    return { success: true }
  }

  async getIssueStats(projectId?: number) {
    const where: any = {}
    if (projectId) where.projectId = +projectId
    const all = await this.prisma.qualityIssue.findMany({ where, select: { severity: true, status: true, issueType: true } })
    const bySeverity: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    const byType: Record<string, number> = {}
    for (const i of all) {
      bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1
      byStatus[i.status] = (byStatus[i.status] || 0) + 1
      byType[i.issueType] = (byType[i.issueType] || 0) + 1
    }
    return { total: all.length, bySeverity, byStatus, byType }
  }

  // ==================== Quality Lessons ====================

  async findAllLessons(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.category) where.category = params.category
    const [items, total] = await Promise.all([
      this.prisma.qualityLesson.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.qualityLesson.count({ where }),
    ])
    return { items, total }
  }

  async findOneLesson(id: number) {
    const item = await this.prisma.qualityLesson.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Lesson ${id} not found`)
    return item
  }

  async createLesson(data: any, userId: number) {
    return this.prisma.qualityLesson.create({
      data: {
        ...data,
        projectId: +data.projectId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateLesson(id: number, data: any) {
    const existing = await this.prisma.qualityLesson.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Lesson ${id} not found`)
    return this.prisma.qualityLesson.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteLesson(id: number) {
    await this.prisma.qualityLesson.delete({ where: { id } })
    return { success: true }
  }
}
