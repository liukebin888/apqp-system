import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class AspiceTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByProject(projectId: number) {
    return this.prisma.aspiceProcess.findMany({
      where: { projectId },
      include: {
        assessor: { select: { id: true, realName: true } },
        practices: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ processGroup: 'asc' }, { processId: 'asc' }],
    })
  }

  async findOne(id: number) {
    const process = await this.prisma.aspiceProcess.findUnique({
      where: { id },
      include: {
        assessor: { select: { id: true, realName: true } },
        practices: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!process) throw new NotFoundException('ASPICE 过程不存在')
    return process
  }

  async initStandardProcesses(projectId: number, userId: number) {
    const standardProcesses = [
      { processGroup: 'SYS', processId: 'SYS.1', processName: '需求挖掘', targetLevel: 2 },
      { processGroup: 'SYS', processId: 'SYS.2', processName: '系统需求分析', targetLevel: 2 },
      { processGroup: 'SYS', processId: 'SYS.3', processName: '系统架构设计', targetLevel: 2 },
      { processGroup: 'SYS', processId: 'SYS.4', processName: '系统集成与集成测试', targetLevel: 2 },
      { processGroup: 'SYS', processId: 'SYS.5', processName: '系统验证', targetLevel: 2 },
      { processGroup: 'SWE', processId: 'SWE.1', processName: '软件需求分析', targetLevel: 2 },
      { processGroup: 'SWE', processId: 'SWE.2', processName: '软件架构设计', targetLevel: 2 },
      { processGroup: 'SWE', processId: 'SWE.3', processName: '软件详细设计与单元构建', targetLevel: 2 },
      { processGroup: 'SWE', processId: 'SWE.4', processName: '软件单元验证', targetLevel: 2 },
      { processGroup: 'SWE', processId: 'SWE.5', processName: '软件集成与集成测试', targetLevel: 2 },
      { processGroup: 'SWE', processId: 'SWE.6', processName: '软件验证', targetLevel: 2 },
      { processGroup: 'SUP', processId: 'SUP.1', processName: '质量保证', targetLevel: 2 },
      { processGroup: 'SUP', processId: 'SUP.8', processName: '配置管理', targetLevel: 2 },
      { processGroup: 'MAN', processId: 'MAN.3', processName: '项目管理', targetLevel: 2 },
      { processGroup: 'ACQ', processId: 'ACQ.4', processName: '供应商监控', targetLevel: 1 },
    ]

    const created = []
    for (const p of standardProcesses) {
      const existing = await this.prisma.aspiceProcess.findUnique({
        where: { projectId_processId: { projectId, processId: p.processId } },
      })
      if (!existing) {
        const record = await this.prisma.aspiceProcess.create({
          data: { ...p, projectId, createdById: userId },
        })
        created.push(record)
      }
    }
    return created
  }

  async updateProcess(id: number, data: any) {
    const process = await this.prisma.aspiceProcess.findUnique({ where: { id } })
    if (!process) throw new NotFoundException('ASPICE 过程不存在')
    return this.prisma.aspiceProcess.update({ where: { id }, data })
  }

  async updatePractice(id: number, data: any) {
    return this.prisma.aspiceBasePractice.update({ where: { id }, data })
  }

  async batchUpdatePractices(processId: number, practices: any[]) {
    const results = []
    for (const p of practices) {
      if (p.id) {
        const updated = await this.prisma.aspiceBasePractice.update({
          where: { id: p.id },
          data: { rating: p.rating, evidence: p.evidence },
        })
        results.push(updated)
      } else {
        const created = await this.prisma.aspiceBasePractice.create({
          data: { ...p, processId },
        })
        results.push(created)
      }
    }
    return results
  }

  async getSummary(projectId: number) {
    const processes = await this.prisma.aspiceProcess.findMany({
      where: { projectId },
      include: { practices: true },
    })

    const groups: Record<string, { total: number; assessed: number; avgLevel: number }> = {}
    for (const p of processes) {
      if (!groups[p.processGroup]) {
        groups[p.processGroup] = { total: 0, assessed: 0, avgLevel: 0 }
      }
      groups[p.processGroup].total++
      if (p.assessmentStatus === 'assessed') {
        groups[p.processGroup].assessed++
        groups[p.processGroup].avgLevel += p.achievedLevel
      }
    }

    for (const g of Object.values(groups)) {
      g.avgLevel = g.assessed > 0 ? g.avgLevel / g.assessed : 0
    }

    return {
      total: processes.length,
      assessed: processes.filter(p => p.assessmentStatus === 'assessed').length,
      groups,
    }
  }

  async deleteProcess(id: number) {
    const process = await this.prisma.aspiceProcess.findUnique({ where: { id } })
    if (!process) throw new NotFoundException('ASPICE 过程不存在')
    await this.prisma.aspiceProcess.delete({ where: { id } })
    return { message: '删除成功' }
  }
}
