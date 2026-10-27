import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Lessons ====================

  async findAllLessons(params: any) {
    const where: any = {}
    if (params.category) where.category = params.category
    if (params.projectId) where.projectId = +params.projectId
    const [items, total] = await Promise.all([
      this.prisma.kbLesson.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.kbLesson.count({ where }),
    ])
    return { items, total }
  }

  async findOneLesson(id: number) {
    const item = await this.prisma.kbLesson.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Lesson ${id} not found`)
    return item
  }

  async createLesson(data: any, userId: number) {
    return this.prisma.kbLesson.create({
      data: {
        ...data,
        projectId: data.projectId ? +data.projectId : undefined,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateLesson(id: number, data: any) {
    const existing = await this.prisma.kbLesson.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Lesson ${id} not found`)
    return this.prisma.kbLesson.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteLesson(id: number) {
    await this.prisma.kbLesson.delete({ where: { id } })
    return { success: true }
  }

  // ==================== Templates ====================

  async findAllTemplates(params: any) {
    const where: any = {}
    if (params.category) where.category = params.category
    const [items, total] = await Promise.all([
      this.prisma.kbTemplate.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.kbTemplate.count({ where }),
    ])
    return { items, total }
  }

  async findOneTemplate(id: number) {
    const item = await this.prisma.kbTemplate.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Template ${id} not found`)
    return item
  }

  async createTemplate(data: any, userId: number) {
    return this.prisma.kbTemplate.create({
      data: {
        ...data,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateTemplate(id: number, data: any) {
    const existing = await this.prisma.kbTemplate.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Template ${id} not found`)
    return this.prisma.kbTemplate.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteTemplate(id: number) {
    await this.prisma.kbTemplate.delete({ where: { id } })
    return { success: true }
  }

  // ==================== Checklists ====================

  async findAllChecklists(params: any) {
    const where: any = {}
    if (params.category) where.category = params.category
    const [items, total] = await Promise.all([
      this.prisma.kbChecklist.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.kbChecklist.count({ where }),
    ])
    return { items, total }
  }

  async findOneChecklist(id: number) {
    const item = await this.prisma.kbChecklist.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Checklist ${id} not found`)
    return item
  }

  async createChecklist(data: any, userId: number) {
    return this.prisma.kbChecklist.create({
      data: {
        ...data,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateChecklist(id: number, data: any) {
    const existing = await this.prisma.kbChecklist.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Checklist ${id} not found`)
    return this.prisma.kbChecklist.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteChecklist(id: number) {
    await this.prisma.kbChecklist.delete({ where: { id } })
    return { success: true }
  }
}
