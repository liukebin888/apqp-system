import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getSchedule(projectId: number) {
    const schedule = await this.prisma.prjSchedule.findFirst({
      where: { projectId, status: { in: ['draft', 'active'] } },
      include: {
        tasks: {
          include: {
            predecessors: { include: { successor: { select: { id: true, taskName: true } } } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { baselineVersion: 'desc' },
    })
    return schedule
  }

  async createSchedule(data: {
    projectId: number
    startDate?: string
    endDate?: string
    tasks?: Array<{
      taskCode: string
      taskName: string
      parentId?: number
      responsibleId?: number
      plannedStart?: string
      plannedEnd?: string
      milestoneFlag?: boolean
      sortOrder: number
    }>
  }) {
    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.prjSchedule.create({
        data: {
          projectId: data.projectId,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
      })

      if (data.tasks?.length) {
        await tx.prjWbsTask.createMany({
          data: data.tasks.map((t) => ({
            ...t,
            scheduleId: schedule.id,
            plannedStart: t.plannedStart ? new Date(t.plannedStart) : undefined,
            plannedEnd: t.plannedEnd ? new Date(t.plannedEnd) : undefined,
          })),
        })
      }

      return this.getSchedule(schedule.projectId)
    })
  }

  async updateTask(taskId: number, data: {
    taskName?: string
    responsibleId?: number
    plannedStart?: string
    plannedEnd?: string
    actualStart?: string
    actualEnd?: string
    progressPct?: number
    status?: string
    milestoneFlag?: boolean
  }) {
    const updateData = { ...data }
    if (data.plannedStart) updateData.plannedStart = new Date(data.plannedStart) as any
    if (data.plannedEnd) updateData.plannedEnd = new Date(data.plannedEnd) as any
    if (data.actualStart) updateData.actualStart = new Date(data.actualStart) as any
    if (data.actualEnd) updateData.actualEnd = new Date(data.actualEnd) as any

    return this.prisma.prjWbsTask.update({ where: { id: taskId }, data: updateData })
  }

  async addTaskDependency(predecessorId: number, successorId: number, dependencyType: string = 'FS', lagDays: number = 0) {
    return this.prisma.prjTaskDependency.create({
      data: { predecessorId, successorId, dependencyType, lagDays },
    })
  }

  async removeTaskDependency(id: number) {
    await this.prisma.prjTaskDependency.delete({ where: { id } })
    return { message: '删除成功' }
  }
}
