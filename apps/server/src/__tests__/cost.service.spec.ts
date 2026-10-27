class MockDecimal {
  private val: number
  constructor(v: number | string | MockDecimal) {
    this.val = v instanceof MockDecimal ? v.val : Number(v)
  }
  add(other: MockDecimal | number) {
    const o = other instanceof MockDecimal ? other.val : Number(other)
    return new MockDecimal(this.val + o)
  }
  sub(other: MockDecimal | number) {
    const o = other instanceof MockDecimal ? other.val : Number(other)
    return new MockDecimal(this.val - o)
  }
  mul(other: MockDecimal | number) {
    const o = other instanceof MockDecimal ? other.val : Number(other)
    return new MockDecimal(this.val * o)
  }
  div(other: MockDecimal | number) {
    const o = other instanceof MockDecimal ? other.val : Number(other)
    return new MockDecimal(this.val / o)
  }
  toNumber() { return this.val }
  valueOf() { return this.val }
  isZero() { return this.val === 0 }
  gte(other: MockDecimal | number) {
    const o = other instanceof MockDecimal ? other.val : Number(other)
    return this.val >= o
  }
}

const originalPrismaClient = jest.requireActual('@prisma/client')
jest.mock('@prisma/client', () => ({
  ...originalPrismaClient,
  Prisma: {
    ...originalPrismaClient.Prisma,
    Decimal: MockDecimal,
  },
}))

jest.mock('@apqp/shared', () => ({
  TARGET_MARGINS: { L1: 0.15, L2: 0.12, L3: 0.10, L4: 0.08 },
}), { virtual: true })

import { CostService } from '../modules/cost/cost.service'
import { createMockPrismaService } from './helpers/prisma.mock'

describe('CostService', () => {
  let service: CostService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(() => {
    prisma = createMockPrismaService()
    service = new CostService(prisma as any)
  })

  // ==================== Estimates ====================

  describe('findAllEstimates', () => {
    it('returns estimates filtered by projectId', async () => {
      const mockData = [{ id: 1, projectId: 1, version: 'V1' }]
      prisma.costEstimate.findMany.mockResolvedValue(mockData)
      const result = await service.findAllEstimates({ projectId: 1 })
      expect(result).toEqual(mockData)
      expect(prisma.costEstimate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId: 1 } }),
      )
    })

    it('returns all estimates when no filters', async () => {
      prisma.costEstimate.findMany.mockResolvedValue([])
      await service.findAllEstimates({})
      expect(prisma.costEstimate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      )
    })

    it('filters by status and version', async () => {
      prisma.costEstimate.findMany.mockResolvedValue([])
      await service.findAllEstimates({ status: 'draft', version: 'V1' })
      expect(prisma.costEstimate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'draft', version: 'V1' } }),
      )
    })
  })

  describe('findOneEstimate', () => {
    it('returns estimate with includes', async () => {
      const mockData = { id: 1, version: 'V1', items: [], costs: [] }
      prisma.costEstimate.findUniqueOrThrow.mockResolvedValue(mockData)
      const result = await service.findOneEstimate(1)
      expect(result).toEqual(mockData)
    })
  })

  describe('createEstimate', () => {
    it('creates estimate with items and calculates total', async () => {
      prisma.costEstimate.create.mockResolvedValue({ id: 1 })
      const result = await service.createEstimate({
        projectId: 1,
        version: 'V1',
        versionLabel: 'Version 1',
        items: [
          { category: 'labor', itemName: 'Design', quantity: 10, unitPrice: 100 },
          { category: 'material', itemName: 'Parts', quantity: 5, unitPrice: 200 },
        ],
      }, 1)

      expect(prisma.costEstimate.create).toHaveBeenCalled()
      const callData = prisma.costEstimate.create.mock.calls[0][0].data
      expect(callData.projectId).toBe(1)
      expect(callData.version).toBe('V1')
      expect(callData.items.create).toHaveLength(2)
      expect(callData.items.create[0].amount).toBeInstanceOf(MockDecimal)
      expect(callData.items.create[0].amount.toNumber()).toBe(1000)
      expect(callData.items.create[1].amount.toNumber()).toBe(1000)
      expect(callData.totalAmount.toNumber()).toBe(2000)
    })

    it('creates estimate with no items', async () => {
      prisma.costEstimate.create.mockResolvedValue({ id: 1 })
      await service.createEstimate({
        projectId: 1,
        version: 'V1',
        versionLabel: 'Version 1',
      }, 1)

      const callData = prisma.costEstimate.create.mock.calls[0][0].data
      expect(callData.items.create).toEqual([])
      expect(callData.totalAmount.toNumber()).toBe(0)
    })
  })

  describe('updateEstimate', () => {
    it('updates draft estimate', async () => {
      prisma.costEstimate.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'draft' })
      prisma.costEstimate.update.mockResolvedValue({ id: 1 })
      await service.updateEstimate(1, { versionLabel: 'Updated' })
      expect(prisma.costEstimate.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { versionLabel: 'Updated' } }),
      )
    })

    it('throws if estimate is not draft', async () => {
      prisma.costEstimate.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'approved' })
      await expect(service.updateEstimate(1, { versionLabel: 'Updated' }))
        .rejects.toThrow('只能修改草稿状态的估算')
    })
  })

  describe('deleteEstimate', () => {
    it('deletes draft estimate', async () => {
      prisma.costEstimate.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'draft' })
      prisma.costEstimate.delete.mockResolvedValue({ id: 1 })
      await service.deleteEstimate(1)
      expect(prisma.costEstimate.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })

    it('throws if estimate is not draft', async () => {
      prisma.costEstimate.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'published' })
      await expect(service.deleteEstimate(1))
        .rejects.toThrow('只能删除草稿状态的估算')
    })
  })

  describe('calculateEstimate', () => {
    it('calculates total from items and updates status', async () => {
      prisma.costEstimate.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        items: [
          { id: 1, quantity: 10, unitPrice: 100 },
          { id: 2, quantity: 5, unitPrice: 200 },
        ],
      })
      prisma.costEstimateItem.update.mockResolvedValue({})
      prisma.costEstimate.update.mockResolvedValue({ id: 1, totalAmount: 2000, status: 'calculating' })

      const result = await service.calculateEstimate(1)
      expect(prisma.costEstimateItem.update).toHaveBeenCalledTimes(2)
      expect(prisma.costEstimate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ status: 'calculating' }),
        }),
      )
      const updateData = prisma.costEstimate.update.mock.calls[0][0].data
      expect(updateData.totalAmount.toNumber()).toBe(2000)
    })
  })

  describe('workflow transitions', () => {
    it('submitEstimate sets status to pending_approval', async () => {
      prisma.costEstimate.update.mockResolvedValue({ id: 1, status: 'pending_approval' })
      await service.submitEstimate(1)
      expect(prisma.costEstimate.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'pending_approval' } }),
      )
    })

    it('approveEstimate sets status to approved', async () => {
      prisma.costEstimate.update.mockResolvedValue({ id: 1, status: 'approved' })
      await service.approveEstimate(1, 1)
      expect(prisma.costEstimate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'approved', approvedById: 1 }),
        }),
      )
    })

    it('rejectEstimate sets status to rejected', async () => {
      prisma.costEstimate.update.mockResolvedValue({ id: 1, status: 'rejected' })
      await service.rejectEstimate(1)
      expect(prisma.costEstimate.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'rejected' } }),
      )
    })
  })

  describe('publishEstimate', () => {
    it('throws if not approved', async () => {
      prisma.costEstimate.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'pending_approval', items: [] })
      await expect(service.publishEstimate(1, 1))
        .rejects.toThrow('只能发布已批准的估算')
    })

    it('creates budgets by category and publishes', async () => {
      prisma.costEstimate.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        projectId: 10,
        version: 'V1',
        status: 'approved',
        items: [
          { category: 'labor', amount: new MockDecimal(1000) },
          { category: 'labor', amount: new MockDecimal(500) },
          { category: 'material', amount: new MockDecimal(2000) },
        ],
      })
      prisma.prjCost.upsert.mockResolvedValue({})
      prisma.costEstimate.update.mockResolvedValue({ id: 1, status: 'published' })

      await service.publishEstimate(1, 1)

      expect(prisma.prjCost.upsert).toHaveBeenCalledTimes(2)
      const laborCall = prisma.prjCost.upsert.mock.calls[0][0]
      expect(laborCall.create.budgetCategory).toBe('labor')
      expect(laborCall.create.budgetAmount.toNumber()).toBe(1500)
      const materialCall = prisma.prjCost.upsert.mock.calls[1][0]
      expect(materialCall.create.budgetCategory).toBe('material')
      expect(materialCall.create.budgetAmount.toNumber()).toBe(2000)

      expect(prisma.costEstimate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'published' }),
        }),
      )
    })
  })

  // ==================== Estimate Items ====================

  describe('createEstimateItem', () => {
    it('creates item and recalculates total', async () => {
      prisma.costEstimateItem.create.mockResolvedValue({ id: 1, estimateId: 10 })
      prisma.costEstimateItem.findMany.mockResolvedValue([
        { amount: new MockDecimal(1000) },
        { amount: new MockDecimal(500) },
      ])
      prisma.costEstimate.update.mockResolvedValue({})

      const result = await service.createEstimateItem(10, {
        category: 'labor',
        itemName: 'Design',
        quantity: 10,
        unitPrice: 100,
      })

      expect(prisma.costEstimateItem.create).toHaveBeenCalled()
      const createData = prisma.costEstimateItem.create.mock.calls[0][0].data
      expect(createData.amount.toNumber()).toBe(1000)
      expect(prisma.costEstimate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: expect.objectContaining({
            totalAmount: expect.objectContaining({ toNumber: expect.any(Function) }),
          }),
        }),
      )
    })
  })

  describe('updateEstimateItem', () => {
    it('updates item with quantity and price, recalculates', async () => {
      prisma.costEstimateItem.update.mockResolvedValue({ id: 1, estimateId: 10 })
      prisma.costEstimateItem.findMany.mockResolvedValue([
        { amount: new MockDecimal(2000) },
      ])
      prisma.costEstimate.update.mockResolvedValue({})

      await service.updateEstimateItem(1, { quantity: 20, unitPrice: 100 })

      const updateData = prisma.costEstimateItem.update.mock.calls[0][0].data
      expect(updateData.amount.toNumber()).toBe(2000)
      expect(updateData.quantity.toNumber()).toBe(20)
      expect(updateData.unitPrice.toNumber()).toBe(100)
    })
  })

  describe('deleteEstimateItem', () => {
    it('deletes item and recalculates', async () => {
      prisma.costEstimateItem.findUniqueOrThrow.mockResolvedValue({ id: 1, estimateId: 10 })
      prisma.costEstimateItem.delete.mockResolvedValue({})
      prisma.costEstimateItem.findMany.mockResolvedValue([
        { amount: new MockDecimal(500) },
      ])
      prisma.costEstimate.update.mockResolvedValue({})

      const result = await service.deleteEstimateItem(1)
      expect(result).toEqual({ deleted: true })
      expect(prisma.costEstimateItem.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })
  })

  describe('batchUpdateEstimateItems', () => {
    it('deletes all items and recreates', async () => {
      prisma.costEstimateItem.deleteMany.mockResolvedValue({ count: 2 })
      prisma.costEstimateItem.create.mockResolvedValue({ id: 1 })
      prisma.costEstimateItem.findMany.mockResolvedValue([
        { amount: new MockDecimal(1000) },
        { amount: new MockDecimal(2000) },
      ])
      prisma.costEstimate.update.mockResolvedValue({})

      const result = await service.batchUpdateEstimateItems(10, [
        { category: 'labor', itemName: 'Design', quantity: 10, unitPrice: 100 },
        { category: 'material', itemName: 'Parts', quantity: 10, unitPrice: 200 },
      ])

      expect(prisma.costEstimateItem.deleteMany).toHaveBeenCalledWith({ where: { estimateId: 10 } })
      expect(prisma.costEstimateItem.create).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(2)
    })
  })

  // ==================== Budgets ====================

  describe('findAllBudgets', () => {
    it('returns budgets with filters', async () => {
      prisma.prjCost.findMany.mockResolvedValue([])
      await service.findAllBudgets({ projectId: 1, budgetCategory: 'labor', status: 'draft' })
      expect(prisma.prjCost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 1, budgetCategory: 'labor', status: 'draft' },
        }),
      )
    })
  })

  describe('findOneBudget', () => {
    it('returns budget with includes', async () => {
      const mockData = { id: 1, budgetCategory: 'labor' }
      prisma.prjCost.findUniqueOrThrow.mockResolvedValue(mockData)
      const result = await service.findOneBudget(1)
      expect(result).toEqual(mockData)
    })
  })

  describe('createBudget', () => {
    it('creates budget with Decimal amounts', async () => {
      prisma.prjCost.create.mockResolvedValue({ id: 1 })
      await service.createBudget({
        projectId: 1,
        budgetCategory: 'labor',
        budgetAmount: 10000,
        forecastAmount: 12000,
        version: 'V1',
      })

      const createData = prisma.prjCost.create.mock.calls[0][0].data
      expect(createData.budgetAmount).toBeInstanceOf(MockDecimal)
      expect(createData.budgetAmount.toNumber()).toBe(10000)
      expect(createData.forecastAmount.toNumber()).toBe(12000)
      expect(createData.status).toBe('draft')
    })
  })

  describe('updateBudget', () => {
    it('updates budget amounts', async () => {
      prisma.prjCost.update.mockResolvedValue({ id: 1 })
      await service.updateBudget(1, { budgetAmount: 15000, status: 'published' })

      const updateData = prisma.prjCost.update.mock.calls[0][0].data
      expect(updateData.budgetAmount.toNumber()).toBe(15000)
      expect(updateData.status).toBe('published')
    })
  })

  describe('deleteBudget', () => {
    it('deletes draft budget', async () => {
      prisma.prjCost.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'draft' })
      prisma.prjCost.delete.mockResolvedValue({ id: 1 })
      await service.deleteBudget(1)
      expect(prisma.prjCost.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })

    it('throws if budget is not draft', async () => {
      prisma.prjCost.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'published' })
      await expect(service.deleteBudget(1))
        .rejects.toThrow('只能删除草稿状态的预算')
    })
  })

  // ==================== Adjustments ====================

  describe('findAllAdjustments', () => {
    it('returns adjustments with filters', async () => {
      prisma.costBudgetAdjustment.findMany.mockResolvedValue([])
      await service.findAllAdjustments({ costId: 1, status: 'pending' })
      expect(prisma.costBudgetAdjustment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { costId: 1, status: 'pending' } }),
      )
    })
  })

  describe('createAdjustment', () => {
    it('creates adjustment with original amount from budget', async () => {
      prisma.prjCost.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        budgetAmount: new MockDecimal(10000),
      })
      prisma.costBudgetAdjustment.create.mockResolvedValue({ id: 1 })

      await service.createAdjustment({
        costId: 1,
        adjustmentType: 'increase',
        adjustedAmount: 12000,
        reason: 'Material price increase',
      }, 1)

      const createData = prisma.costBudgetAdjustment.create.mock.calls[0][0].data
      expect(createData.originalAmount).toBeInstanceOf(MockDecimal)
      expect(createData.originalAmount.toNumber()).toBe(10000)
      expect(createData.adjustedAmount.toNumber()).toBe(12000)
      expect(createData.requestedById).toBe(1)
    })
  })

  describe('approveAdjustment', () => {
    it('approves pending adjustment and updates budget', async () => {
      prisma.costBudgetAdjustment.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        costId: 10,
        status: 'pending',
        adjustedAmount: new MockDecimal(12000),
      })
      prisma.prjCost.update.mockResolvedValue({})
      prisma.costBudgetAdjustment.update.mockResolvedValue({ id: 1, status: 'approved' })

      await service.approveAdjustment(1, 1)

      expect(prisma.prjCost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { budgetAmount: expect.objectContaining({ toNumber: expect.any(Function) }) },
        }),
      )
      expect(prisma.costBudgetAdjustment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'approved', approvedById: 1 }),
        }),
      )
    })

    it('throws if adjustment is not pending', async () => {
      prisma.costBudgetAdjustment.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        status: 'approved',
      })
      await expect(service.approveAdjustment(1, 1))
        .rejects.toThrow('只能审批待审批状态的调整')
    })
  })

  describe('rejectAdjustment', () => {
    it('rejects adjustment', async () => {
      prisma.costBudgetAdjustment.update.mockResolvedValue({ id: 1, status: 'rejected' })
      await service.rejectAdjustment(1)
      expect(prisma.costBudgetAdjustment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'rejected' } }),
      )
    })
  })

  // ==================== Cost Entries ====================

  describe('findAllEntries', () => {
    it('returns entries with filters', async () => {
      prisma.prjCostEntry.findMany.mockResolvedValue([])
      await service.findAllEntries({ costId: 1, sourceType: 'po', projectId: 10 })
      expect(prisma.prjCostEntry.findMany).toHaveBeenCalled()
      const where = prisma.prjCostEntry.findMany.mock.calls[0][0].where
      expect(where.costId).toBe(1)
      expect(where.sourceType).toBe('po')
      expect(where.cost).toEqual({ projectId: 10 })
    })

    it('filters by date range', async () => {
      prisma.prjCostEntry.findMany.mockResolvedValue([])
      await service.findAllEntries({ startDate: '2026-01-01', endDate: '2026-12-31' })
      const where = prisma.prjCostEntry.findMany.mock.calls[0][0].where
      expect(where.entryDate.gte).toBeInstanceOf(Date)
      expect(where.entryDate.lte).toBeInstanceOf(Date)
    })
  })

  describe('createEntry', () => {
    it('creates entry and recalculates actual amount', async () => {
      prisma.prjCostEntry.create.mockResolvedValue({ id: 1, costId: 10 })
      prisma.prjCostEntry.findMany.mockResolvedValue([
        { amount: new MockDecimal(5000) },
        { amount: new MockDecimal(3000) },
      ])
      prisma.prjCost.update.mockResolvedValue({})

      await service.createEntry({
        costId: 10,
        entryDate: '2026-10-27',
        amount: 5000,
        description: 'Material purchase',
        sourceType: 'po',
      })

      expect(prisma.prjCostEntry.create).toHaveBeenCalled()
      const createData = prisma.prjCostEntry.create.mock.calls[0][0].data
      expect(createData.amount.toNumber()).toBe(5000)
      expect(createData.entryDate).toBeInstanceOf(Date)
      expect(prisma.prjCost.update).toHaveBeenCalled()
    })
  })

  describe('updateEntry', () => {
    it('updates entry and recalculates', async () => {
      prisma.prjCostEntry.update.mockResolvedValue({ id: 1, costId: 10 })
      prisma.prjCostEntry.findMany.mockResolvedValue([
        { amount: new MockDecimal(8000) },
      ])
      prisma.prjCost.update.mockResolvedValue({})

      await service.updateEntry(1, { amount: 8000, entryDate: '2026-10-28' })

      const updateData = prisma.prjCostEntry.update.mock.calls[0][0].data
      expect(updateData.amount.toNumber()).toBe(8000)
      expect(updateData.entryDate).toBeInstanceOf(Date)
    })
  })

  describe('deleteEntry', () => {
    it('deletes entry and recalculates', async () => {
      prisma.prjCostEntry.findUniqueOrThrow.mockResolvedValue({ id: 1, costId: 10 })
      prisma.prjCostEntry.delete.mockResolvedValue({})
      prisma.prjCostEntry.findMany.mockResolvedValue([])
      prisma.prjCost.update.mockResolvedValue({})

      const result = await service.deleteEntry(1)
      expect(result).toEqual({ deleted: true })
    })
  })

  describe('batchImportEntries', () => {
    it('creates multiple entries and recalculates per costId', async () => {
      prisma.prjCostEntry.create.mockResolvedValue({ id: 1 })
      prisma.prjCostEntry.findMany.mockResolvedValue([
        { amount: new MockDecimal(1000) },
      ])
      prisma.prjCost.update.mockResolvedValue({})

      const result = await service.batchImportEntries([
        { costId: 10, entryDate: '2026-10-01', amount: 1000 },
        { costId: 10, entryDate: '2026-10-02', amount: 2000 },
        { costId: 20, entryDate: '2026-10-01', amount: 3000 },
      ])

      expect(prisma.prjCostEntry.create).toHaveBeenCalledTimes(3)
      expect(result).toHaveLength(3)
      expect(prisma.prjCost.update).toHaveBeenCalledTimes(2)
    })
  })

  // ==================== Variance Analysis ====================

  describe('getVariance', () => {
    it('calculates variance by category and summary', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          budgetCategory: 'labor',
          budgetAmount: new MockDecimal(10000),
          actualAmount: new MockDecimal(8000),
          forecastAmount: new MockDecimal(9000),
          entries: [],
        },
        {
          budgetCategory: 'material',
          budgetAmount: new MockDecimal(20000),
          actualAmount: new MockDecimal(25000),
          forecastAmount: new MockDecimal(22000),
          entries: [],
        },
      ])

      const result = await service.getVariance(1)

      expect(result.projectId).toBe(1)
      expect(result.byCategory).toHaveLength(2)
      expect(result.byCategory[0].category).toBe('labor')
      expect(result.byCategory[0].budgetAmount).toBe(10000)
      expect(result.byCategory[0].actualAmount).toBe(8000)
      expect(result.byCategory[0].variance).toBe(2000)
      expect(result.byCategory[0].varianceRate).toBeCloseTo(0.2)
      expect(result.byCategory[0].cpi).toBeCloseTo(1.25)

      expect(result.byCategory[1].category).toBe('material')
      expect(result.byCategory[1].variance).toBe(-5000)
      expect(result.byCategory[1].varianceRate).toBeCloseTo(-0.25)

      expect(result.summary.totalBudget).toBe(30000)
      expect(result.summary.totalActual).toBe(33000)
      expect(result.summary.totalVariance).toBe(-3000)
      expect(result.summary.totalCPI).toBeCloseTo(30000 / 33000)
    })

    it('handles zero actual amount (CPI = 1)', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          budgetCategory: 'labor',
          budgetAmount: new MockDecimal(10000),
          actualAmount: new MockDecimal(0),
          forecastAmount: new MockDecimal(0),
          entries: [],
        },
      ])

      const result = await service.getVariance(1)
      expect(result.byCategory[0].cpi).toBe(1)
      expect(result.summary.totalCPI).toBe(1)
    })

    it('handles zero budget (varianceRate = 0)', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          budgetCategory: 'labor',
          budgetAmount: new MockDecimal(0),
          actualAmount: new MockDecimal(0),
          forecastAmount: new MockDecimal(0),
          entries: [],
        },
      ])

      const result = await service.getVariance(1)
      expect(result.byCategory[0].varianceRate).toBe(0)
      expect(result.summary.totalVarianceRate).toBe(0)
    })
  })

  describe('getTracking', () => {
    it('aggregates entries by month with cumulative totals', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          entries: [
            { entryDate: new Date('2026-01-15'), amount: new MockDecimal(1000) },
            { entryDate: new Date('2026-01-20'), amount: new MockDecimal(2000) },
            { entryDate: new Date('2026-02-10'), amount: new MockDecimal(3000) },
          ],
        },
      ])

      const result = await service.getTracking(1)

      expect(result.projectId).toBe(1)
      expect(result.tracking).toHaveLength(2)
      expect(result.tracking[0].month).toBe('2026-01')
      expect(result.tracking[0].actual).toBe(3000)
      expect(result.tracking[0].cumulativeActual).toBe(3000)
      expect(result.tracking[1].month).toBe('2026-02')
      expect(result.tracking[1].actual).toBe(3000)
      expect(result.tracking[1].cumulativeActual).toBe(6000)
    })
  })

  // ==================== Cost Analysis ====================

  describe('getProjectAnalysis', () => {
    it('returns analysis by category with summary', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          budgetCategory: 'labor',
          budgetAmount: new MockDecimal(10000),
          actualAmount: new MockDecimal(8000),
          forecastAmount: new MockDecimal(9000),
          entries: [],
        },
        {
          budgetCategory: 'material',
          budgetAmount: new MockDecimal(20000),
          actualAmount: new MockDecimal(15000),
          forecastAmount: new MockDecimal(18000),
          entries: [],
        },
      ])

      const result = await service.getProjectAnalysis(1)

      expect(result.projectId).toBe(1)
      expect(result.byCategory).toHaveLength(2)
      expect(result.summary.totalBudget).toBe(30000)
      expect(result.summary.totalActual).toBe(23000)
      expect(result.summary.totalForecast).toBe(27000)
      expect(result.summary.variance).toBe(7000)
      expect(result.summary.varianceRate).toBeCloseTo(7000 / 30000)
    })

    it('handles zero budget', async () => {
      prisma.prjCost.findMany.mockResolvedValue([])
      const result = await service.getProjectAnalysis(1)
      expect(result.summary.totalBudget).toBe(0)
      expect(result.summary.varianceRate).toBe(0)
    })
  })

  describe('getDepartmentAnalysis', () => {
    it('aggregates by project', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          projectId: 1,
          budgetAmount: new MockDecimal(10000),
          actualAmount: new MockDecimal(8000),
          project: { id: 1, projectName: 'Project A', projectLevel: 'L1', managerId: 1 },
        },
        {
          projectId: 1,
          budgetAmount: new MockDecimal(5000),
          actualAmount: new MockDecimal(4000),
          project: { id: 1, projectName: 'Project A', projectLevel: 'L1', managerId: 1 },
        },
        {
          projectId: 2,
          budgetAmount: new MockDecimal(20000),
          actualAmount: new MockDecimal(15000),
          project: { id: 2, projectName: 'Project B', projectLevel: 'L2', managerId: 2 },
        },
      ])

      const result = await service.getDepartmentAnalysis(1, '2026-Q4')

      expect(result.quarter).toBe('2026-Q4')
      expect(result.byProject).toHaveLength(2)
      expect(result.byProject[0].budget).toBe(15000)
      expect(result.byProject[0].actual).toBe(12000)
      expect(result.byProject[1].budget).toBe(20000)
      expect(result.byProject[1].actual).toBe(15000)
      expect(result.summary.totalBudget).toBe(35000)
      expect(result.summary.totalActual).toBe(27000)
    })
  })

  describe('getCompanyAnalysis', () => {
    it('aggregates by project level', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          budgetAmount: new MockDecimal(10000),
          project: { id: 1, projectName: 'P1', projectLevel: 'L1' },
          entries: [{ amount: new MockDecimal(8000) }],
        },
        {
          budgetAmount: new MockDecimal(20000),
          project: { id: 2, projectName: 'P2', projectLevel: 'L2' },
          entries: [{ amount: new MockDecimal(15000) }],
        },
        {
          budgetAmount: new MockDecimal(5000),
          project: { id: 3, projectName: 'P3', projectLevel: 'L1' },
          entries: [{ amount: new MockDecimal(4000) }],
        },
      ])

      const result = await service.getCompanyAnalysis('2026')

      expect(result.year).toBe('2026')
      expect(result.byLevel).toHaveLength(2)
      const l1 = result.byLevel.find(l => l.level === 'L1')!
      expect(l1.budget).toBe(15000)
      expect(l1.actual).toBe(12000)
      const l2 = result.byLevel.find(l => l.level === 'L2')!
      expect(l2.budget).toBe(20000)
      expect(l2.actual).toBe(15000)
      expect(result.summary.totalBudget).toBe(35000)
      expect(result.summary.totalActual).toBe(27000)
      expect(result.summary.variance).toBe(8000)
    })

    it('defaults to current year', async () => {
      prisma.prjCost.findMany.mockResolvedValue([])
      const result = await service.getCompanyAnalysis()
      expect(result.year).toBe(new Date().getFullYear().toString())
    })
  })

  describe('getProfitability', () => {
    it('returns profitability with target margin by level', async () => {
      prisma.prjProject.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        projectName: 'Project A',
        projectLevel: 'L1',
        costs: [
          { actualAmount: new MockDecimal(50000) },
          { actualAmount: new MockDecimal(30000) },
        ],
      })

      const result = await service.getProfitability(1)

      expect(result.projectId).toBe(1)
      expect(result.projectName).toBe('Project A')
      expect(result.projectLevel).toBe('L1')
      expect(result.totalCost).toBe(80000)
      expect(result.targetMargin).toBe(0.15)
      expect(result.marginGap).toBe(-0.15)
    })

    it('defaults to L4 margin if no level', async () => {
      prisma.prjProject.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        projectName: 'Project A',
        projectLevel: null,
        costs: [],
      })

      const result = await service.getProfitability(1)
      expect(result.targetMargin).toBe(0.08)
    })
  })

  // ==================== Cost Alerts ====================

  describe('findAllAlerts', () => {
    it('returns alerts with filters', async () => {
      prisma.costAlert.findMany.mockResolvedValue([])
      await service.findAllAlerts({ projectId: 1, alertLevel: 'red', isResolved: false })
      expect(prisma.costAlert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 1, alertLevel: 'red', isResolved: false },
        }),
      )
    })
  })

  describe('resolveAlert', () => {
    it('marks alert as resolved', async () => {
      prisma.costAlert.update.mockResolvedValue({ id: 1, isResolved: true })
      await service.resolveAlert(1, 1)
      expect(prisma.costAlert.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isResolved: true, resolvedById: 1 }),
        }),
      )
    })
  })

  describe('checkAlerts', () => {
    it('creates red alert when actual >= budget (100%)', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          id: 1,
          budgetCategory: 'labor',
          budgetAmount: new MockDecimal(10000),
          actualAmount: new MockDecimal(10000),
        },
      ])
      prisma.costAlert.create.mockResolvedValue({ id: 1 })

      const result = await service.checkAlerts(1)

      expect(result.alertsCreated).toBe(1)
      expect(prisma.costAlert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            alertLevel: 'red',
            alertType: 'budget_overrun',
          }),
        }),
      )
    })

    it('creates orange alert when actual >= 90% of budget', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          id: 1,
          budgetCategory: 'material',
          budgetAmount: new MockDecimal(10000),
          actualAmount: new MockDecimal(9000),
        },
      ])
      prisma.costAlert.create.mockResolvedValue({ id: 1 })

      const result = await service.checkAlerts(1)

      expect(result.alertsCreated).toBe(1)
      expect(prisma.costAlert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ alertLevel: 'orange' }),
        }),
      )
    })

    it('creates yellow alert when actual >= 80% of budget', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          id: 1,
          budgetCategory: 'outsourcing',
          budgetAmount: new MockDecimal(10000),
          actualAmount: new MockDecimal(8000),
        },
      ])
      prisma.costAlert.create.mockResolvedValue({ id: 1 })

      const result = await service.checkAlerts(1)

      expect(result.alertsCreated).toBe(1)
      expect(prisma.costAlert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ alertLevel: 'yellow' }),
        }),
      )
    })

    it('skips zero budget', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          id: 1,
          budgetCategory: 'labor',
          budgetAmount: new MockDecimal(0),
          actualAmount: new MockDecimal(0),
        },
      ])

      const result = await service.checkAlerts(1)
      expect(result.alertsCreated).toBe(0)
    })

    it('creates no alert when actual < 80%', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          id: 1,
          budgetCategory: 'labor',
          budgetAmount: new MockDecimal(10000),
          actualAmount: new MockDecimal(7000),
        },
      ])

      const result = await service.checkAlerts(1)
      expect(result.alertsCreated).toBe(0)
    })

    it('uses category labels in message', async () => {
      prisma.prjCost.findMany.mockResolvedValue([
        {
          id: 1,
          budgetCategory: 'outsourcing',
          budgetAmount: new MockDecimal(10000),
          actualAmount: new MockDecimal(12000),
        },
      ])
      prisma.costAlert.create.mockResolvedValue({ id: 1 })

      await service.checkAlerts(1)

      const createData = prisma.costAlert.create.mock.calls[0][0].data
      expect(createData.message).toContain('外协成本')
      expect(createData.message).toContain('20.0%')
    })
  })
})
