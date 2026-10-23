import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class MilestoneService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProject(projectId: number) {
    return this.prisma.prjMilestone.findMany({
      where: { projectId },
      orderBy: { plannedDate: 'asc' },
    })
  }

  async create(data: {
    projectId: number
    milestoneType: string
    name: string
    plannedDate?: string
    actualDate?: string
    status?: string
  }) {
    return this.prisma.prjMilestone.create({
      data: {
        projectId: data.projectId,
        milestoneType: data.milestoneType,
        name: data.name,
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : undefined,
        actualDate: data.actualDate ? new Date(data.actualDate) : undefined,
        status: data.status || 'planned',
      },
    })
  }

  async update(id: number, data: {
    milestoneType?: string
    name?: string
    plannedDate?: string
    actualDate?: string
    status?: string
  }) {
    const milestone = await this.prisma.prjMilestone.findUnique({ where: { id } })
    if (!milestone) throw new NotFoundException('里程碑不存在')

    const updateData = { ...data }
    if (data.plannedDate) updateData.plannedDate = new Date(data.plannedDate) as any
    if (data.actualDate) updateData.actualDate = new Date(data.actualDate) as any

    return this.prisma.prjMilestone.update({ where: { id }, data: updateData })
  }

  async delete(id: number) {
    const milestone = await this.prisma.prjMilestone.findUnique({ where: { id } })
    if (!milestone) throw new NotFoundException('里程碑不存在')

    await this.prisma.prjMilestone.delete({ where: { id } })
    return { message: '删除成功' }
  }
}
