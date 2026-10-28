import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class CostService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Cost Estimates ====================

  async findAllEstimates(params: { projectId?: number; status?: string; version?: string }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.status) where.status = params.status
    if (params.version) where.version = params.version

    return this.prisma.costEstimate.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true, projectLevel: true } },
        createdBy: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneEstimate(id: number) {
    return this.prisma.costEstimate.findUniqueOrThrow({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true, projectLevel: true } },
        createdBy: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        costs: true,
      },
    })
  }

  async createEstimate(data: {
    projectId: number
    version: string
    versionLabel: string
    remarks?: string
    items?: Array<{
      category: string
      itemName: string
      quantity: number
      unitPrice: number
      unit?: string
      basisRef?: string
      remarks?: string
      sortOrder?: number
    }>
  }, userId: number) {
    const items = (data.items || []).map(item => ({
      ...item,
      quantity: new (require('@prisma/client').Prisma.Decimal)(item.quantity),
      unitPrice: new (require('@prisma/client').Prisma.Decimal)(item.unitPrice),
      amount: new (require('@prisma/client').Prisma.Decimal)(item.quantity * item.unitPrice),
    }))

    const totalAmount = items.reduce((sum: any, item: any) => sum.add(item.amount), new (require('@prisma/client').Prisma.Decimal)(0))

    return this.prisma.costEstimate.create({
      data: {
        projectId: data.projectId,
        version: data.version,
        versionLabel: data.versionLabel,
        remarks: data.remarks,
        totalAmount,
        createdById: userId,
        items: { create: items },
      },
      include: { items: true },
    })
  }

  async updateEstimate(id: number, data: { versionLabel?: string; remarks?: string }) {
    const estimate = await this.prisma.costEstimate.findUniqueOrThrow({ where: { id } })
    if (estimate.status !== 'draft') {
      throw new BadRequestException('只能修改草稿状态的估算')
    }
    return this.prisma.costEstimate.update({ where: { id }, data })
  }

  async deleteEstimate(id: number) {
    const estimate = await this.prisma.costEstimate.findUniqueOrThrow({ where: { id } })
    if (estimate.status !== 'draft') {
      throw new BadRequestException('只能删除草稿状态的估算')
    }
    return this.prisma.costEstimate.delete({ where: { id } })
  }

  async calculateEstimate(id: number) {
    const estimate = await this.prisma.costEstimate.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    })

    const Decimal = require('@prisma/client').Prisma.Decimal
    let totalAmount = new Decimal(0)

    for (const item of estimate.items) {
      const amount = new Decimal(item.quantity).mul(new Decimal(item.unitPrice))
      await this.prisma.costEstimateItem.update({
        where: { id: item.id },
        data: { amount },
      })
      totalAmount = totalAmount.add(amount)
    }

    return this.prisma.costEstimate.update({
      where: { id },
      data: { totalAmount, status: 'calculating' },
      include: { items: true },
    })
  }

  async submitEstimate(id: number) {
    return this.prisma.costEstimate.update({
      where: { id },
      data: { status: 'pending_approval' },
    })
  }

  async approveEstimate(id: number, userId: number) {
    return this.prisma.costEstimate.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: userId,
        approvedAt: new Date(),
      },
    })
  }

  async rejectEstimate(id: number) {
    return this.prisma.costEstimate.update({
      where: { id },
      data: { status: 'rejected' },
    })
  }

  async publishEstimate(id: number, userId: number) {
    const estimate = await this.prisma.costEstimate.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    })

    if (estimate.status !== 'approved') {
      throw new BadRequestException('只能发布已批准的估算')
    }

    const Decimal = require('@prisma/client').Prisma.Decimal
    const categoryTotals = new Map<string, any>()

    for (const item of estimate.items) {
      const category = item.category
      const amount = new Decimal(item.amount)
      if (categoryTotals.has(category)) {
        categoryTotals.set(category, categoryTotals.get(category).add(amount))
      } else {
        categoryTotals.set(category, amount)
      }
    }

    for (const [category, budgetAmount] of categoryTotals.entries()) {
      await this.prisma.prjCost.upsert({
        where: {
          projectId_budgetCategory: {
            projectId: estimate.projectId,
            budgetCategory: category,
          },
        },
        update: {
          budgetAmount,
          estimateId: id,
          version: estimate.version,
          status: 'published',
          approvedById: userId,
          approvedAt: new Date(),
        },
        create: {
          projectId: estimate.projectId,
          budgetCategory: category,
          budgetAmount,
          estimateId: id,
          version: estimate.version,
          status: 'published',
          approvedById: userId,
          approvedAt: new Date(),
        },
      })
    }

    return this.prisma.costEstimate.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    })
  }

  // ==================== Estimate Items ====================

  async createEstimateItem(estimateId: number, data: {
    category: string
    itemName: string
    quantity: number
    unitPrice: number
    unit?: string
    basisRef?: string
    remarks?: string
    sortOrder?: number
  }) {
    const Decimal = require('@prisma/client').Prisma.Decimal
    const amount = new Decimal(data.quantity).mul(new Decimal(data.unitPrice))

    const item = await this.prisma.costEstimateItem.create({
      data: {
        estimateId,
        category: data.category,
        itemName: data.itemName,
        quantity: new Decimal(data.quantity),
        unitPrice: new Decimal(data.unitPrice),
        unit: data.unit,
        amount,
        basisRef: data.basisRef,
        remarks: data.remarks,
        sortOrder: data.sortOrder || 0,
      },
    })

    await this.recalculateEstimateTotal(estimateId)
    return item
  }

  async updateEstimateItem(id: number, data: {
    category?: string
    itemName?: string
    quantity?: number
    unitPrice?: number
    unit?: string
    basisRef?: string
    remarks?: string
    sortOrder?: number
  }) {
    const Decimal = require('@prisma/client').Prisma.Decimal
    const updateData: any = { ...data }

    if (data.quantity !== undefined && data.unitPrice !== undefined) {
      updateData.amount = new Decimal(data.quantity).mul(new Decimal(data.unitPrice))
      updateData.quantity = new Decimal(data.quantity)
      updateData.unitPrice = new Decimal(data.unitPrice)
    }

    const item = await this.prisma.costEstimateItem.update({ where: { id }, data: updateData })
    await this.recalculateEstimateTotal(item.estimateId)
    return item
  }

  async deleteEstimateItem(id: number) {
    const item = await this.prisma.costEstimateItem.findUniqueOrThrow({ where: { id } })
    await this.prisma.costEstimateItem.delete({ where: { id } })
    await this.recalculateEstimateTotal(item.estimateId)
    return { deleted: true }
  }

  async batchUpdateEstimateItems(estimateId: number, items: Array<{
    id?: number
    category: string
    itemName: string
    quantity: number
    unitPrice: number
    unit?: string
    basisRef?: string
    remarks?: string
    sortOrder?: number
  }>) {
    const Decimal = require('@prisma/client').Prisma.Decimal

    await this.prisma.costEstimateItem.deleteMany({ where: { estimateId } })

    const createdItems = []
    for (const item of items) {
      const amount = new Decimal(item.quantity).mul(new Decimal(item.unitPrice))
      const created = await this.prisma.costEstimateItem.create({
        data: {
          estimateId,
          category: item.category,
          itemName: item.itemName,
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          unit: item.unit,
          amount,
          basisRef: item.basisRef,
          remarks: item.remarks,
          sortOrder: item.sortOrder || 0,
        },
      })
      createdItems.push(created)
    }

    await this.recalculateEstimateTotal(estimateId)
    return createdItems
  }

  private async recalculateEstimateTotal(estimateId: number) {
    const Decimal = require('@prisma/client').Prisma.Decimal
    const items = await this.prisma.costEstimateItem.findMany({ where: { estimateId } })
    const totalAmount = items.reduce((sum: any, item: any) => sum.add(new Decimal(item.amount)), new Decimal(0))
    await this.prisma.costEstimate.update({ where: { id: estimateId }, data: { totalAmount } })
  }

  // ==================== Budgets (PrjCost) ====================

  async findAllBudgets(params: { projectId?: number; budgetCategory?: string; status?: string }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.budgetCategory) where.budgetCategory = params.budgetCategory
    if (params.status) where.status = params.status

    return this.prisma.prjCost.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        entries: { orderBy: { entryDate: 'desc' }, take: 10 },
        estimate: { select: { id: true, version: true, versionLabel: true } },
        approvedBy: { select: { id: true, realName: true } },
        adjustments: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { entries: true, adjustments: true, alerts: true } },
      },
      orderBy: { budgetCategory: 'asc' },
    })
  }

  async findOneBudget(id: number) {
    return this.prisma.prjCost.findUniqueOrThrow({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true, projectLevel: true } },
        entries: { orderBy: { entryDate: 'desc' } },
        estimate: true,
        approvedBy: { select: { id: true, realName: true } },
        adjustments: {
          include: {
            requestedBy: { select: { id: true, realName: true } },
            approvedBy: { select: { id: true, realName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        alerts: { orderBy: { createdAt: 'desc' } },
      },
    })
  }

  async createBudget(data: {
    projectId: number
    budgetCategory: string
    budgetAmount: number
    forecastAmount?: number
    version?: string
  }) {
    const Decimal = require('@prisma/client').Prisma.Decimal
    return this.prisma.prjCost.create({
      data: {
        projectId: data.projectId,
        budgetCategory: data.budgetCategory,
        budgetAmount: new Decimal(data.budgetAmount),
        forecastAmount: new Decimal(data.forecastAmount || 0),
        version: data.version,
        status: 'draft',
      },
    })
  }

  async updateBudget(id: number, data: {
    budgetAmount?: number
    forecastAmount?: number
    status?: string
  }) {
    const Decimal = require('@prisma/client').Prisma.Decimal
    const updateData: any = {}
    if (data.budgetAmount !== undefined) updateData.budgetAmount = new Decimal(data.budgetAmount)
    if (data.forecastAmount !== undefined) updateData.forecastAmount = new Decimal(data.forecastAmount)
    if (data.status) updateData.status = data.status

    return this.prisma.prjCost.update({ where: { id }, data: updateData })
  }

  async deleteBudget(id: number) {
    const cost = await this.prisma.prjCost.findUniqueOrThrow({ where: { id } })
    if (cost.status !== 'draft') {
      throw new BadRequestException('只能删除草稿状态的预算')
    }
    return this.prisma.prjCost.delete({ where: { id } })
  }

  // ==================== Budget Adjustments ====================

  async findAllAdjustments(params: { costId?: number; status?: string }) {
    const where: any = {}
    if (params.costId) where.costId = params.costId
    if (params.status) where.status = params.status

    return this.prisma.costBudgetAdjustment.findMany({
      where,
      include: {
        cost: {
          select: { id: true, budgetCategory: true, budgetAmount: true, projectId: true },
        },
        requestedBy: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createAdjustment(data: {
    costId: number
    adjustmentType: string
    adjustedAmount: number
    reason: string
  }, userId: number) {
    const Decimal = require('@prisma/client').Prisma.Decimal
    const cost = await this.prisma.prjCost.findUniqueOrThrow({ where: { id: data.costId } })

    return this.prisma.costBudgetAdjustment.create({
      data: {
        costId: data.costId,
        adjustmentType: data.adjustmentType,
        originalAmount: cost.budgetAmount,
        adjustedAmount: new Decimal(data.adjustedAmount),
        reason: data.reason,
        requestedById: userId,
      },
    })
  }

  async approveAdjustment(id: number, userId: number) {
    const adjustment = await this.prisma.costBudgetAdjustment.findUniqueOrThrow({
      where: { id },
      include: { cost: true },
    })

    if (adjustment.status !== 'pending') {
      throw new BadRequestException('只能审批待审批状态的调整')
    }

    await this.prisma.prjCost.update({
      where: { id: adjustment.costId },
      data: { budgetAmount: adjustment.adjustedAmount },
    })

    return this.prisma.costBudgetAdjustment.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: userId,
        approvedAt: new Date(),
      },
    })
  }

  async rejectAdjustment(id: number) {
    return this.prisma.costBudgetAdjustment.update({
      where: { id },
      data: { status: 'rejected' },
    })
  }

  // ==================== Cost Entries ====================

  async findAllEntries(params: { costId?: number; projectId?: number; sourceType?: string; startDate?: string; endDate?: string }) {
    const where: any = {}
    if (params.costId) where.costId = params.costId
    if (params.sourceType) where.sourceType = params.sourceType
    if (params.projectId) {
      where.cost = { projectId: params.projectId }
    }
    if (params.startDate || params.endDate) {
      where.entryDate = {}
      if (params.startDate) where.entryDate.gte = new Date(params.startDate)
      if (params.endDate) where.entryDate.lte = new Date(params.endDate)
    }

    return this.prisma.prjCostEntry.findMany({
      where,
      include: {
        cost: {
          select: { id: true, budgetCategory: true, projectId: true },
        },
      },
      orderBy: { entryDate: 'desc' },
    })
  }

  async createEntry(data: {
    costId: number
    entryDate: string
    amount: number
    description?: string
    sourceType?: string
    sourceId?: number
  }) {
    const Decimal = require('@prisma/client').Prisma.Decimal

    const entry = await this.prisma.prjCostEntry.create({
      data: {
        costId: data.costId,
        entryDate: new Date(data.entryDate),
        amount: new Decimal(data.amount),
        description: data.description,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
      },
    })

    await this.recalculateActualAmount(data.costId)
    return entry
  }

  async updateEntry(id: number, data: {
    entryDate?: string
    amount?: number
    description?: string
    sourceType?: string
  }) {
    const Decimal = require('@prisma/client').Prisma.Decimal
    const updateData: any = {}
    if (data.entryDate) updateData.entryDate = new Date(data.entryDate)
    if (data.amount !== undefined) updateData.amount = new Decimal(data.amount)
    if (data.description !== undefined) updateData.description = data.description
    if (data.sourceType !== undefined) updateData.sourceType = data.sourceType

    const entry = await this.prisma.prjCostEntry.update({ where: { id }, data: updateData })
    await this.recalculateActualAmount(entry.costId)
    return entry
  }

  async deleteEntry(id: number) {
    const entry = await this.prisma.prjCostEntry.findUniqueOrThrow({ where: { id } })
    await this.prisma.prjCostEntry.delete({ where: { id } })
    await this.recalculateActualAmount(entry.costId)
    return { deleted: true }
  }

  async batchImportEntries(entries: Array<{
    costId: number
    entryDate: string
    amount: number
    description?: string
    sourceType?: string
  }>) {
    const Decimal = require('@prisma/client').Prisma.Decimal
    const createdEntries = []

    for (const entry of entries) {
      const created = await this.prisma.prjCostEntry.create({
        data: {
          costId: entry.costId,
          entryDate: new Date(entry.entryDate),
          amount: new Decimal(entry.amount),
          description: entry.description,
          sourceType: entry.sourceType,
        },
      })
      createdEntries.push(created)
    }

    const costIds = [...new Set(entries.map(e => e.costId))]
    for (const costId of costIds) {
      await this.recalculateActualAmount(costId)
    }

    return createdEntries
  }

  private async recalculateActualAmount(costId: number) {
    const Decimal = require('@prisma/client').Prisma.Decimal
    const entries = await this.prisma.prjCostEntry.findMany({ where: { costId } })
    const actualAmount = entries.reduce((sum: any, entry: any) => sum.add(new Decimal(entry.amount)), new Decimal(0))
    await this.prisma.prjCost.update({ where: { id: costId }, data: { actualAmount } })
  }

  // ==================== Variance Analysis ====================

  async getVariance(projectId: number) {
    const costs = await this.prisma.prjCost.findMany({
      where: { projectId },
      include: { entries: true },
    })

    const Decimal = require('@prisma/client').Prisma.Decimal
    let totalBCWS = new Decimal(0)
    let totalACWP = new Decimal(0)

    const byCategory = costs.map(cost => {
      const bcws = new Decimal(cost.budgetAmount)
      const acwp = new Decimal(cost.actualAmount)
      const cv = bcws.sub(acwp)
      const cpi = acwp.isZero() ? new Decimal(1) : bcws.div(acwp)

      totalBCWS = totalBCWS.add(bcws)
      totalACWP = totalACWP.add(acwp)

      return {
        category: cost.budgetCategory,
        budgetAmount: bcws.toNumber(),
        actualAmount: acwp.toNumber(),
        forecastAmount: new Decimal(cost.forecastAmount).toNumber(),
        variance: cv.toNumber(),
        varianceRate: bcws.isZero() ? 0 : cv.div(bcws).toNumber(),
        cpi: cpi.toNumber(),
      }
    })

    const totalCV = totalBCWS.sub(totalACWP)
    const totalCPI = totalACWP.isZero() ? new Decimal(1) : totalBCWS.div(totalACWP)

    return {
      projectId,
      byCategory,
      summary: {
        totalBudget: totalBCWS.toNumber(),
        totalActual: totalACWP.toNumber(),
        totalVariance: totalCV.toNumber(),
        totalVarianceRate: totalBCWS.isZero() ? 0 : totalCV.div(totalBCWS).toNumber(),
        totalCPI: totalCPI.toNumber(),
      },
    }
  }

  async getTracking(projectId: number) {
    const costs = await this.prisma.prjCost.findMany({
      where: { projectId },
      include: {
        entries: { orderBy: { entryDate: 'asc' } },
      },
    })

    const monthlyData = new Map<string, { planned: number; actual: number }>()

    for (const cost of costs) {
      for (const entry of cost.entries) {
        const month = entry.entryDate.toISOString().substring(0, 7)
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { planned: 0, actual: 0 })
        }
        const data = monthlyData.get(month)!
        data.actual += Number(entry.amount)
      }
    }

    const tracking = Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))

    let cumulativePlanned = 0
    let cumulativeActual = 0
    const cumulativeTracking = tracking.map(item => {
      cumulativePlanned += item.planned
      cumulativeActual += item.actual
      return {
        month: item.month,
        planned: item.planned,
        actual: item.actual,
        cumulativePlanned,
        cumulativeActual,
      }
    })

    return { projectId, tracking: cumulativeTracking }
  }

  // ==================== Cost Analysis ====================

  async getProjectAnalysis(projectId: number) {
    const costs = await this.prisma.prjCost.findMany({
      where: { projectId },
      include: { entries: true },
    })

    const Decimal = require('@prisma/client').Prisma.Decimal
    const byCategory = costs.map(cost => ({
      category: cost.budgetCategory,
      budget: new Decimal(cost.budgetAmount).toNumber(),
      actual: new Decimal(cost.actualAmount).toNumber(),
      forecast: new Decimal(cost.forecastAmount).toNumber(),
    }))

    const totalBudget = byCategory.reduce((sum, item) => sum + item.budget, 0)
    const totalActual = byCategory.reduce((sum, item) => sum + item.actual, 0)
    const totalForecast = byCategory.reduce((sum, item) => sum + item.forecast, 0)

    return {
      projectId,
      byCategory,
      summary: {
        totalBudget,
        totalActual,
        totalForecast,
        variance: totalBudget - totalActual,
        varianceRate: totalBudget === 0 ? 0 : (totalBudget - totalActual) / totalBudget,
      },
    }
  }

  async getDepartmentAnalysis(deptId?: number, quarter?: string) {
    const costs = await this.prisma.prjCost.findMany({
      include: {
        project: { select: { id: true, projectName: true, projectLevel: true, managerId: true } },
      },
    })

    const Decimal = require('@prisma/client').Prisma.Decimal
    const byProject = new Map<number, { project: any; budget: number; actual: number }>()

    for (const cost of costs) {
      const key = cost.projectId
      if (!byProject.has(key)) {
        byProject.set(key, { project: cost.project, budget: 0, actual: 0 })
      }
      const data = byProject.get(key)!
      data.budget += new Decimal(cost.budgetAmount).toNumber()
      data.actual += new Decimal(cost.actualAmount).toNumber()
    }

    return {
      quarter: quarter || new Date().toISOString().substring(0, 7),
      byProject: Array.from(byProject.values()),
      summary: {
        totalBudget: Array.from(byProject.values()).reduce((sum, item) => sum + item.budget, 0),
        totalActual: Array.from(byProject.values()).reduce((sum, item) => sum + item.actual, 0),
      },
    }
  }

  async getCompanyAnalysis(year?: string) {
    const targetYear = year || new Date().getFullYear().toString()
    const startDate = new Date(`${targetYear}-01-01`)
    const endDate = new Date(`${targetYear}-12-31`)

    const costs = await this.prisma.prjCost.findMany({
      include: {
        project: { select: { id: true, projectName: true, projectLevel: true } },
        entries: {
          where: { entryDate: { gte: startDate, lte: endDate } },
        },
      },
    })

    const Decimal = require('@prisma/client').Prisma.Decimal
    let totalBudget = new Decimal(0)
    let totalActual = new Decimal(0)

    const byLevel = new Map<string, { budget: number; actual: number }>()

    for (const cost of costs) {
      const budget = new Decimal(cost.budgetAmount)
      const actual = cost.entries.reduce((sum: any, entry: any) => sum.add(new Decimal(entry.amount)), new Decimal(0))

      totalBudget = totalBudget.add(budget)
      totalActual = totalActual.add(actual)

      const level = cost.project.projectLevel || 'L4'
      if (!byLevel.has(level)) {
        byLevel.set(level, { budget: 0, actual: 0 })
      }
      const data = byLevel.get(level)!
      data.budget += budget.toNumber()
      data.actual += actual.toNumber()
    }

    return {
      year: targetYear,
      byLevel: Array.from(byLevel.entries()).map(([level, data]) => ({ level, ...data })),
      summary: {
        totalBudget: totalBudget.toNumber(),
        totalActual: totalActual.toNumber(),
        variance: totalBudget.sub(totalActual).toNumber(),
      },
    }
  }

  async getProfitability(projectId: number) {
    const project = await this.prisma.prjProject.findUniqueOrThrow({
      where: { id: projectId },
      include: { costs: true },
    })

    const Decimal = require('@prisma/client').Prisma.Decimal
    const totalCost = project.costs.reduce(
      (sum: any, cost: any) => sum.add(new Decimal(cost.actualAmount)),
      new Decimal(0)
    )

    const targetMargin = require('@apqp/shared').TARGET_MARGINS[project.projectLevel || 'L4'] || 0.08

    return {
      projectId,
      projectName: project.projectName,
      projectLevel: project.projectLevel,
      totalCost: totalCost.toNumber(),
      revenue: 0,
      profit: 0,
      profitMargin: 0,
      targetMargin,
      marginGap: -targetMargin,
    }
  }

  // ==================== Cost Alerts ====================

  async findAllAlerts(params: { projectId?: number; alertLevel?: string; isResolved?: boolean }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.alertLevel) where.alertLevel = params.alertLevel
    if (params.isResolved !== undefined) where.isResolved = params.isResolved

    return this.prisma.costAlert.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        cost: { select: { id: true, budgetCategory: true, budgetAmount: true, actualAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async resolveAlert(id: number, userId: number) {
    return this.prisma.costAlert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedById: userId,
        resolvedAt: new Date(),
      },
    })
  }

  async checkAlerts(projectId: number) {
    const costs = await this.prisma.prjCost.findMany({ where: { projectId } })
    const Decimal = require('@prisma/client').Prisma.Decimal
    const alerts = []

    for (const cost of costs) {
      const budget = new Decimal(cost.budgetAmount)
      const actual = new Decimal(cost.actualAmount)

      if (budget.isZero()) continue

      const ratio = actual.div(budget)

      let alertLevel: string | null = null
      let thresholdValue = new Decimal(0)

      if (ratio.gte(new Decimal(1))) {
        alertLevel = 'red'
        thresholdValue = budget
      } else if (ratio.gte(new Decimal(0.9))) {
        alertLevel = 'orange'
        thresholdValue = budget.mul(new Decimal(0.9))
      } else if (ratio.gte(new Decimal(0.8))) {
        alertLevel = 'yellow'
        thresholdValue = budget.mul(new Decimal(0.8))
      }

      if (alertLevel) {
        const categoryLabels: Record<string, string> = {
          labor: '人工成本',
          material: '材料成本',
          outsourcing: '外协成本',
          travel: '差旅成本',
          equipment: '设备成本',
          other: '其他成本',
        }

        const alert = await this.prisma.costAlert.create({
          data: {
            projectId,
            costId: cost.id,
            alertLevel,
            alertType: 'budget_overrun',
            currentValue: actual,
            thresholdValue,
            message: `${categoryLabels[cost.budgetCategory] || cost.budgetCategory}实际支出已超预算${(ratio.mul(new Decimal(100)).toNumber() - 100).toFixed(1)}%`,
          },
        })
        alerts.push(alert)
      }
    }

    return { projectId, alertsCreated: alerts.length, alerts }
  }
}
