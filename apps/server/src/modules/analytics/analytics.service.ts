import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregate project counts by status, level, and APQP phase.
   */
  async getProjectStats(projectId?: number) {
    const where = projectId ? { id: projectId } : {}

    const [byStatus, byLevel, byPhase, total] = await Promise.all([
      this.prisma.prjProject.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.prjProject.groupBy({
        by: ['projectLevel'],
        where,
        _count: { id: true },
      }),
      this.prisma.prjProject.groupBy({
        by: ['apqpPhase'],
        where,
        _count: { id: true },
      }),
      this.prisma.prjProject.count({ where }),
    ])

    return {
      total,
      byStatus: byStatus.map(g => ({ status: g.status, count: g._count.id })),
      byLevel: byLevel.map(g => ({ level: g.projectLevel, count: g._count.id })),
      byPhase: byPhase.map(g => ({ phase: g.apqpPhase, count: g._count.id })),
    }
  }

  /**
   * Aggregate cost data - budget vs actual by category.
   */
  async getCostStats(projectId?: number) {
    const where: any = {}
    if (projectId) where.projectId = projectId

    const costs = await this.prisma.prjCost.findMany({
      where,
      select: {
        budgetCategory: true,
        budgetAmount: true,
        actualAmount: true,
        forecastAmount: true,
      },
    })

    const byCategory = costs.reduce(
      (acc, c) => {
        if (!acc[c.budgetCategory]) {
          acc[c.budgetCategory] = { budget: 0, actual: 0, forecast: 0 }
        }
        acc[c.budgetCategory].budget += Number(c.budgetAmount)
        acc[c.budgetCategory].actual += Number(c.actualAmount)
        acc[c.budgetCategory].forecast += Number(c.forecastAmount)
        return acc
      },
      {} as Record<string, { budget: number; actual: number; forecast: number }>,
    )

    const totals = Object.values(byCategory).reduce(
      (sum, v) => ({
        budget: sum.budget + v.budget,
        actual: sum.actual + v.actual,
        forecast: sum.forecast + v.forecast,
      }),
      { budget: 0, actual: 0, forecast: 0 },
    )

    return {
      totals,
      byCategory: Object.entries(byCategory).map(([category, values]) => ({
        category,
        ...values,
        varianceRate:
          values.budget > 0
            ? +(((values.actual - values.budget) / values.budget) * 100).toFixed(1)
            : 0,
      })),
    }
  }

  /**
   * Aggregate quality problems by classification, severity, and status.
   */
  async getQualityStats(projectId?: number) {
    const where = projectId ? { projectId } : {}

    const [byType, bySeverity, byStatus, total, openCount] = await Promise.all([
      this.prisma.qualityProblem.groupBy({
        by: ['classification'],
        where,
        _count: { id: true },
      }),
      this.prisma.qualityProblem.groupBy({
        by: ['severity'],
        where,
        _count: { id: true },
      }),
      this.prisma.qualityProblem.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.qualityProblem.count({ where }),
      this.prisma.qualityProblem.count({
        where: { ...where, status: { notIn: ['closed'] } },
      }),
    ])

    return {
      total,
      openCount,
      byType: byType.map(g => ({ type: g.classification, count: g._count.id })),
      bySeverity: bySeverity.map(g => ({ severity: g.severity, count: g._count.id })),
      byStatus: byStatus.map(g => ({ status: g.status, count: g._count.id })),
    }
  }

  /**
   * Aggregate supplier performance score averages.
   */
  async getSupplierStats(projectId?: number) {
    const where = projectId ? { projectId } : {}

    const records = await this.prisma.supplierPerformance.findMany({
      where,
      select: {
        qualityScore: true,
        deliveryScore: true,
        costScore: true,
        serviceScore: true,
        totalScore: true,
        grade: true,
        supplier: { select: { id: true, supplierName: true } },
      },
    })

    const count = records.length || 1

    const averages = {
      quality: +(records.reduce((s, r) => s + r.qualityScore, 0) / count).toFixed(1),
      delivery: +(records.reduce((s, r) => s + r.deliveryScore, 0) / count).toFixed(1),
      cost: +(records.reduce((s, r) => s + r.costScore, 0) / count).toFixed(1),
      service: +(records.reduce((s, r) => s + r.serviceScore, 0) / count).toFixed(1),
      total: +(records.reduce((s, r) => s + r.totalScore, 0) / count).toFixed(1),
    }

    const byGrade = records.reduce(
      (acc, r) => {
        acc[r.grade] = (acc[r.grade] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      recordCount: records.length,
      averages,
      byGrade: Object.entries(byGrade).map(([grade, count]) => ({ grade, count })),
    }
  }

  /**
   * Aggregate safety hazards by ASIL level and status.
   */
  async getSafetyStats(projectId?: number) {
    const where = projectId ? { projectId } : {}

    const [byAsil, byStatus, total] = await Promise.all([
      this.prisma.safetyHazardAnalysis.groupBy({
        by: ['calculatedAsil'],
        where,
        _count: { id: true },
      }),
      this.prisma.safetyHazardAnalysis.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.safetyHazardAnalysis.count({ where }),
    ])

    return {
      total,
      byAsil: byAsil.map(g => ({ asil: g.calculatedAsil, count: g._count.id })),
      byStatus: byStatus.map(g => ({ status: g.status, count: g._count.id })),
    }
  }

  /**
   * Time-series trend data grouped by month.
   * Supports types: progress, cost, quality (default: all).
   */
  async getTrendData(
    projectId?: number,
    type?: string,
    granularity: string = 'month',
  ) {
    const months = 12
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)

    const monthKeys: string[] = []
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate)
      d.setMonth(d.getMonth() + i)
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const getMonth = (date: Date) => {
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }

    const result: Record<string, any> = {}

    // Progress trends
    if (!type || type === 'progress') {
      const progressWhere: any = { reportDate: { gte: startDate } }
      if (projectId) progressWhere.projectId = projectId

      const reports = await this.prisma.prjProgressReport.findMany({
        where: progressWhere,
        select: { reportDate: true, progress: true },
      })

      result.progressTrends = monthKeys.map(month => {
        const entries = reports.filter(r => getMonth(r.reportDate) === month)
        const avgProgress =
          entries.length > 0
            ? +(entries.reduce((s, r) => s + r.progress, 0) / entries.length).toFixed(1)
            : null
        return { month, avgProgress, reportCount: entries.length }
      })
    }

    // Cost trends
    if (!type || type === 'cost') {
      const costEntryWhere: any = { entryDate: { gte: startDate } }
      if (projectId) {
        costEntryWhere.cost = { projectId }
      }

      const costEntries = await this.prisma.prjCostEntry.findMany({
        where: costEntryWhere,
        select: { entryDate: true, amount: true },
      })

      result.costTrends = monthKeys.map(month => ({
        month,
        amount: costEntries
          .filter(c => getMonth(c.entryDate) === month)
          .reduce((sum, c) => sum + Number(c.amount), 0),
      }))
    }

    // Quality trends
    if (!type || type === 'quality') {
      const problemWhere: any = { createdAt: { gte: startDate } }
      if (projectId) problemWhere.projectId = projectId

      const problems = await this.prisma.qualityProblem.findMany({
        where: problemWhere,
        select: { createdAt: true, status: true, severity: true },
      })

      result.qualityTrends = monthKeys.map(month => ({
        month,
        opened: problems.filter(p => getMonth(p.createdAt) === month).length,
        closed: problems.filter(
          p => getMonth(p.createdAt) === month && p.status === 'closed',
        ).length,
        critical: problems.filter(
          p => getMonth(p.createdAt) === month && p.severity === 'critical',
        ).length,
      }))
    }

    return result
  }
}
