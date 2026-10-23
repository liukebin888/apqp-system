import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { SequenceService } from '../../common/services/sequence.service'
import { PaginationDto } from '../../common/dto/pagination.dto'

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SequenceService,
  ) {}

  async findAll(query: PaginationDto & { status?: string; managerId?: number; keyword?: string }) {
    const where: any = {}
    if (query.status) where.status = query.status
    if (query.managerId) where.managerId = query.managerId
    if (query.keyword) {
      where.OR = [
        { projectCode: { contains: query.keyword } },
        { projectName: { contains: query.keyword } },
      ]
    }

    const skip = (query.page - 1) * query.pageSize
    const take = query.pageSize

    const [list, total] = await Promise.all([
      this.prisma.prjProject.findMany({
        where,
        include: {
          customer: { select: { id: true, customerName: true } },
          product: { select: { id: true, productName: true } },
          manager: { select: { id: true, realName: true } },
          teams: { include: { user: { select: { id: true, realName: true } } } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prjProject.count({ where }),
    ])

    return { list, total, page: query.page, pageSize: query.pageSize }
  }

  async findOne(id: number) {
    const project = await this.prisma.prjProject.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
        teams: { include: { user: { select: { id: true, realName: true, email: true } } } },
        schedules: { orderBy: { baselineVersion: 'desc' } },
        milestones: { orderBy: { plannedDate: 'asc' } },
        risks: { where: { status: { not: 'closed' } } },
      },
    })
    if (!project) throw new NotFoundException('项目不存在')
    return project
  }

  async create(data: {
    projectName: string
    customerId?: number
    productId?: number
    projectLevel?: string
    managerId?: number
    startDate?: string
    endDate?: string
    description?: string
    teamMembers?: Array<{ userId: number; role: string }>
  }) {
    const projectCode = await this.sequence.nextNo('PRJ')
    const { teamMembers, ...projectData } = data

    return this.prisma.prjProject.create({
      data: {
        projectCode,
        projectName: projectData.projectName,
        customerId: projectData.customerId,
        productId: projectData.productId,
        projectLevel: projectData.projectLevel || 'L3',
        managerId: projectData.managerId,
        description: projectData.description,
        ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
        ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
        ...(teamMembers?.length
          ? { teams: { create: teamMembers.map((m) => ({ userId: m.userId, role: m.role })) } }
          : {}),
      },
      include: {
        customer: true,
        product: true,
        teams: { include: { user: { select: { id: true, realName: true } } } },
      },
    })
  }

  async update(id: number, data: any) {
    const project = await this.prisma.prjProject.findUnique({ where: { id } })
    if (!project) throw new NotFoundException('项目不存在')

    const updateData = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    return this.prisma.prjProject.update({
      where: { id },
      data: updateData,
    })
  }

  async updateTeam(projectId: number, members: Array<{ userId: number; role: string }>) {
    await this.prisma.prjProjectTeam.deleteMany({ where: { projectId } })
    if (members.length > 0) {
      await this.prisma.prjProjectTeam.createMany({
        data: members.map((m) => ({ projectId, userId: m.userId, role: m.role })),
      })
    }
    return { message: '团队更新成功' }
  }

  async getStats() {
    const [total, active, onHold, completed] = await Promise.all([
      this.prisma.prjProject.count(),
      this.prisma.prjProject.count({ where: { status: 'active' } }),
      this.prisma.prjProject.count({ where: { status: 'on_hold' } }),
      this.prisma.prjProject.count({ where: { status: 'completed' } }),
    ])
    return { total, active, onHold, completed }
  }
}
