import { ProcurementService } from '../modules/procurement/procurement.service'
import { createMockPrismaService } from './helpers/prisma.mock'

describe('ProcurementService', () => {
  let service: ProcurementService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(() => {
    prisma = createMockPrismaService()
    service = new ProcurementService(prisma as any)
  })

  // ==================== Purchase Requests ====================

  describe('findAllRequests', () => {
    it('returns requests with filters', async () => {
      const mockData = [{ id: 1, requestNo: 'PR202610270001' }]
      prisma.purchaseRequest.findMany.mockResolvedValue(mockData)
      const result = await service.findAllRequests({ projectId: 1, status: 'pending' })
      expect(result).toEqual(mockData)
      expect(prisma.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId: 1, status: 'pending' } }),
      )
    })

    it('returns all requests when no filters', async () => {
      prisma.purchaseRequest.findMany.mockResolvedValue([])
      await service.findAllRequests({})
      expect(prisma.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      )
    })

    it('filters by category and applicantId', async () => {
      prisma.purchaseRequest.findMany.mockResolvedValue([])
      await service.findAllRequests({ category: 'material', applicantId: 5 })
      expect(prisma.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'material', applicantId: 5 } }),
      )
    })
  })

  describe('findOneRequest', () => {
    it('returns request with includes', async () => {
      const mockData = { id: 1, requestNo: 'PR202610270001', items: [], orders: [] }
      prisma.purchaseRequest.findUniqueOrThrow.mockResolvedValue(mockData)
      const result = await service.findOneRequest(1)
      expect(result).toEqual(mockData)
    })
  })

  describe('createRequest', () => {
    it('creates request with items and calculates total', async () => {
      prisma.purchaseRequest.count.mockResolvedValue(0)
      prisma.purchaseRequest.create.mockResolvedValue({ id: 1 })
      const result = await service.createRequest({
        projectId: 1,
        department: 'Engineering',
        category: 'material',
        expectedDate: '2026-11-01',
        reason: 'Project needs',
        items: [
          { materialCode: 'M001', materialName: 'Steel', quantity: 100, expectedPrice: 50, amount: 5000 },
          { materialCode: 'M002', materialName: 'Aluminum', quantity: 50, expectedPrice: 80 },
        ],
      }, 1)

      expect(prisma.purchaseRequest.create).toHaveBeenCalled()
      const callData = prisma.purchaseRequest.create.mock.calls[0][0].data
      expect(callData.requestNo).toMatch(/^PR\d{8}\d{4}$/)
      expect(callData.items.create).toHaveLength(2)
      expect(callData.items.create[0].amount).toBe(5000)
      expect(callData.items.create[1].amount).toBe(4000)
      expect(callData.totalAmount).toBe(9000)
    })

    it('creates request with no items', async () => {
      prisma.purchaseRequest.count.mockResolvedValue(0)
      prisma.purchaseRequest.create.mockResolvedValue({ id: 1 })
      await service.createRequest({
        projectId: 1,
        department: 'Engineering',
        category: 'material',
      }, 1)

      const callData = prisma.purchaseRequest.create.mock.calls[0][0].data
      expect(callData.items.create).toEqual([])
      expect(callData.totalAmount).toBe(0)
    })
  })

  describe('updateRequest', () => {
    it('updates request with new items', async () => {
      prisma.purchaseRequestItem.deleteMany.mockResolvedValue({ count: 2 })
      prisma.purchaseRequest.update.mockResolvedValue({ id: 1 })
      await service.updateRequest(1, {
        department: 'Updated',
        items: [
          { materialCode: 'M001', materialName: 'Steel', quantity: 100, expectedPrice: 50, amount: 5000 },
        ],
      })

      expect(prisma.purchaseRequestItem.deleteMany).toHaveBeenCalledWith({ where: { requestId: 1 } })
      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            department: 'Updated',
            totalAmount: 5000,
          }),
        }),
      )
    })

    it('updates request without items', async () => {
      prisma.purchaseRequest.update.mockResolvedValue({ id: 1 })
      await service.updateRequest(1, { department: 'Updated', totalAmount: 1000 })

      expect(prisma.purchaseRequestItem.deleteMany).not.toHaveBeenCalled()
      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ totalAmount: 1000 }),
        }),
      )
    })
  })

  describe('deleteRequest', () => {
    it('deletes request', async () => {
      prisma.purchaseRequest.delete.mockResolvedValue({ id: 1 })
      await service.deleteRequest(1)
      expect(prisma.purchaseRequest.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })
  })

  describe('workflow transitions', () => {
    it('submitRequest sets status to pending', async () => {
      prisma.purchaseRequest.update.mockResolvedValue({ id: 1, status: 'pending' })
      await service.submitRequest(1)
      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'pending' } }),
      )
    })

    it('approveRequest sets status to approved', async () => {
      prisma.purchaseRequest.update.mockResolvedValue({ id: 1, status: 'approved' })
      await service.approveRequest(1, 2)
      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'approved', approvedById: 2 }),
        }),
      )
    })

    it('rejectRequest sets status to rejected', async () => {
      prisma.purchaseRequest.update.mockResolvedValue({ id: 1, status: 'rejected' })
      await service.rejectRequest(1)
      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'rejected' } }),
      )
    })

    it('cancelRequest sets status to cancelled', async () => {
      prisma.purchaseRequest.update.mockResolvedValue({ id: 1, status: 'cancelled' })
      await service.cancelRequest(1)
      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'cancelled' } }),
      )
    })
  })

  describe('request items', () => {
    it('addRequestItem creates item and recalculates total', async () => {
      prisma.purchaseRequestItem.create.mockResolvedValue({ id: 1, requestId: 10 })
      prisma.purchaseRequestItem.findMany.mockResolvedValue([
        { amount: 5000 },
        { amount: 3000 },
      ])
      prisma.purchaseRequest.update.mockResolvedValue({})

      await service.addRequestItem(10, {
        materialCode: 'M001',
        materialName: 'Steel',
        quantity: 100,
        expectedPrice: 50,
        amount: 5000,
      })

      expect(prisma.purchaseRequestItem.create).toHaveBeenCalled()
      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { totalAmount: 8000 },
        }),
      )
    })

    it('updateRequestItem updates item and recalculates', async () => {
      prisma.purchaseRequestItem.update.mockResolvedValue({ id: 1, requestId: 10 })
      prisma.purchaseRequestItem.findMany.mockResolvedValue([
        { amount: 6000 },
      ])
      prisma.purchaseRequest.update.mockResolvedValue({})

      await service.updateRequestItem(1, { amount: 6000 })
      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { totalAmount: 6000 },
        }),
      )
    })

    it('deleteRequestItem deletes item and recalculates', async () => {
      prisma.purchaseRequestItem.delete.mockResolvedValue({ id: 1, requestId: 10 })
      prisma.purchaseRequestItem.findMany.mockResolvedValue([])
      prisma.purchaseRequest.update.mockResolvedValue({})

      await service.deleteRequestItem(1)
      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { totalAmount: 0 },
        }),
      )
    })
  })

  // ==================== Purchase Orders ====================

  describe('findAllOrders', () => {
    it('returns orders with filters', async () => {
      prisma.purchaseOrder.findMany.mockResolvedValue([])
      await service.findAllOrders({ supplierId: 1, status: 'confirmed' })
      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { supplierId: 1, status: 'confirmed' } }),
      )
    })
  })

  describe('findOneOrder', () => {
    it('returns order with includes', async () => {
      const mockData = { id: 1, orderNo: 'PO202610270001', items: [] }
      prisma.purchaseOrder.findUniqueOrThrow.mockResolvedValue(mockData)
      const result = await service.findOneOrder(1)
      expect(result).toEqual(mockData)
    })
  })

  describe('createOrderFromRequest', () => {
    it('throws if request is not approved', async () => {
      prisma.purchaseRequest.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        status: 'pending',
        items: [],
      })
      await expect(service.createOrderFromRequest(1, { supplierId: 1 }, 1))
        .rejects.toThrow('Only approved requests can be converted to orders')
    })

    it('creates order from approved request', async () => {
      prisma.purchaseRequest.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        status: 'approved',
        projectId: 10,
        items: [
          { materialCode: 'M001', materialName: 'Steel', quantity: 100, expectedPrice: 50 },
          { materialCode: 'M002', materialName: 'Aluminum', quantity: 50, expectedPrice: 80 },
        ],
      })
      prisma.purchaseOrder.count.mockResolvedValue(0)
      prisma.purchaseOrder.create.mockResolvedValue({ id: 1 })
      prisma.purchaseRequest.update.mockResolvedValue({})

      const result = await service.createOrderFromRequest(1, {
        supplierId: 5,
        deliveryDate: '2026-12-01',
        paymentTerms: 'Net 30',
      }, 2)

      expect(prisma.purchaseOrder.create).toHaveBeenCalled()
      const orderData = prisma.purchaseOrder.create.mock.calls[0][0].data
      expect(orderData.orderNo).toMatch(/^PO\d{8}\d{4}$/)
      expect(orderData.supplierId).toBe(5)
      expect(orderData.projectId).toBe(10)
      expect(orderData.items.create).toHaveLength(2)
      expect(orderData.items.create[0].unitPrice).toBe(50)
      expect(orderData.items.create[0].amount).toBe(5000)
      expect(orderData.items.create[1].unitPrice).toBe(80)
      expect(orderData.items.create[1].amount).toBe(4000)
      expect(orderData.totalAmount).toBe(9000)

      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'completed' },
      })
    })

    it('uses custom unit prices if provided', async () => {
      prisma.purchaseRequest.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        status: 'approved',
        projectId: 10,
        items: [
          { materialCode: 'M001', materialName: 'Steel', quantity: 100, expectedPrice: 50 },
        ],
      })
      prisma.purchaseOrder.count.mockResolvedValue(0)
      prisma.purchaseOrder.create.mockResolvedValue({ id: 1 })
      prisma.purchaseRequest.update.mockResolvedValue({})

      await service.createOrderFromRequest(1, {
        supplierId: 5,
        unitPrices: [45],
      }, 2)

      const orderData = prisma.purchaseOrder.create.mock.calls[0][0].data
      expect(orderData.items.create[0].unitPrice).toBe(45)
      expect(orderData.items.create[0].amount).toBe(4500)
    })
  })

  describe('createOrder', () => {
    it('creates order directly', async () => {
      prisma.purchaseOrder.count.mockResolvedValue(0)
      prisma.purchaseOrder.create.mockResolvedValue({ id: 1 })
      await service.createOrder({
        supplierId: 5,
        projectId: 10,
        items: [
          { materialCode: 'M001', materialName: 'Steel', quantity: 100, unitPrice: 50, amount: 5000 },
        ],
      }, 2)

      expect(prisma.purchaseOrder.create).toHaveBeenCalled()
      const orderData = prisma.purchaseOrder.create.mock.calls[0][0].data
      expect(orderData.totalAmount).toBe(5000)
    })
  })

  describe('order workflow', () => {
    it('confirmOrder sets status to confirmed', async () => {
      prisma.purchaseOrder.update.mockResolvedValue({ id: 1, status: 'confirmed' })
      await service.confirmOrder(1)
      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'confirmed' } }),
      )
    })

    it('receiveOrder updates received quantities', async () => {
      prisma.purchaseOrderItem.update.mockResolvedValue({})
      prisma.purchaseOrderItem.findMany.mockResolvedValue([
        { id: 1, quantity: 100, receivedQty: 100 },
        { id: 2, quantity: 50, receivedQty: 50 },
      ])
      prisma.purchaseOrder.update.mockResolvedValue({ id: 1, status: 'received' })

      await service.receiveOrder(1, [
        { itemId: 1, receivedQty: 100 },
        { itemId: 2, receivedQty: 50 },
      ])

      expect(prisma.purchaseOrderItem.update).toHaveBeenCalledTimes(2)
      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'received' } }),
      )
    })

    it('receiveOrder sets in_transit if not all received', async () => {
      prisma.purchaseOrderItem.update.mockResolvedValue({})
      prisma.purchaseOrderItem.findMany.mockResolvedValue([
        { id: 1, quantity: 100, receivedQty: 80 },
        { id: 2, quantity: 50, receivedQty: 50 },
      ])
      prisma.purchaseOrder.update.mockResolvedValue({ id: 1, status: 'in_transit' })

      await service.receiveOrder(1, [
        { itemId: 1, receivedQty: 80 },
        { itemId: 2, receivedQty: 50 },
      ])

      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'in_transit' } }),
      )
    })

    it('closeOrder sets status to closed', async () => {
      prisma.purchaseOrder.update.mockResolvedValue({ id: 1, status: 'closed' })
      await service.closeOrder(1)
      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'closed' } }),
      )
    })

    it('cancelOrder sets status to cancelled', async () => {
      prisma.purchaseOrder.update.mockResolvedValue({ id: 1, status: 'cancelled' })
      await service.cancelOrder(1)
      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'cancelled' } }),
      )
    })
  })

  describe('order items', () => {
    it('addOrderItem creates item and recalculates total', async () => {
      prisma.purchaseOrderItem.create.mockResolvedValue({ id: 1, orderId: 10 })
      prisma.purchaseOrderItem.findMany.mockResolvedValue([
        { amount: 5000 },
        { amount: 3000 },
      ])
      prisma.purchaseOrder.update.mockResolvedValue({})

      await service.addOrderItem(10, {
        materialCode: 'M001',
        materialName: 'Steel',
        quantity: 100,
        unitPrice: 50,
        amount: 5000,
      })

      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { totalAmount: 8000 },
        }),
      )
    })

    it('updateOrderItem updates item and recalculates', async () => {
      prisma.purchaseOrderItem.update.mockResolvedValue({ id: 1, orderId: 10 })
      prisma.purchaseOrderItem.findMany.mockResolvedValue([
        { amount: 6000 },
      ])
      prisma.purchaseOrder.update.mockResolvedValue({})

      await service.updateOrderItem(1, { amount: 6000 })
      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { totalAmount: 6000 },
        }),
      )
    })

    it('deleteOrderItem deletes item and recalculates', async () => {
      prisma.purchaseOrderItem.delete.mockResolvedValue({ id: 1, orderId: 10 })
      prisma.purchaseOrderItem.findMany.mockResolvedValue([])
      prisma.purchaseOrder.update.mockResolvedValue({})

      await service.deleteOrderItem(1)
      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { totalAmount: 0 },
        }),
      )
    })
  })

  // ==================== Supplier Management ====================

  describe('findAllSuppliers', () => {
    it('returns suppliers with filters', async () => {
      prisma.mdSupplier.findMany.mockResolvedValue([])
      await service.findAllSuppliers({ category: 'material', level: 'A' })
      expect(prisma.mdSupplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'material', level: 'A' } }),
      )
    })

    it('searches by keyword', async () => {
      prisma.mdSupplier.findMany.mockResolvedValue([])
      await service.findAllSuppliers({ keyword: 'Steel' })
      expect(prisma.mdSupplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { supplierName: { contains: 'Steel' } },
              { supplierCode: { contains: 'Steel' } },
            ],
          },
        }),
      )
    })
  })

  describe('findOneSupplier', () => {
    it('returns supplier with includes', async () => {
      const mockData = { id: 1, supplierName: 'Supplier A', documents: [], ratings: [] }
      prisma.mdSupplier.findUniqueOrThrow.mockResolvedValue(mockData)
      const result = await service.findOneSupplier(1)
      expect(result).toEqual(mockData)
    })
  })

  describe('supplier lifecycle', () => {
    it('admitSupplier qualifies supplier', async () => {
      prisma.mdSupplier.update.mockResolvedValue({ id: 1, qualificationStatus: 'qualified' })
      await service.admitSupplier(1, { level: 'A', category: 'material' }, 2)
      expect(prisma.mdSupplier.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            qualificationStatus: 'qualified',
            level: 'A',
            category: 'material',
            approvedById: 2,
          }),
        }),
      )
    })

    it('blacklistSupplier blacklists supplier', async () => {
      prisma.mdSupplier.update.mockResolvedValue({ id: 1, qualificationStatus: 'blacklisted', status: 0 })
      await service.blacklistSupplier(1, 'Quality issues')
      expect(prisma.mdSupplier.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { qualificationStatus: 'blacklisted', status: 0 },
        }),
      )
    })

    it('restoreSupplier restores to probation', async () => {
      prisma.mdSupplier.update.mockResolvedValue({ id: 1, qualificationStatus: 'probation', status: 1 })
      await service.restoreSupplier(1)
      expect(prisma.mdSupplier.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { qualificationStatus: 'probation', status: 1 },
        }),
      )
    })
  })

  // ==================== Supplier Evaluation ====================

  describe('findAllEvaluations', () => {
    it('returns evaluations with filters', async () => {
      prisma.supplierEvaluation.findMany.mockResolvedValue([])
      await service.findAllEvaluations({ supplierId: 1, period: '2026-Q4' })
      expect(prisma.supplierEvaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { supplierId: 1, period: '2026-Q4' } }),
      )
    })
  })

  describe('findOneEvaluation', () => {
    it('returns evaluation with includes', async () => {
      const mockData = { id: 1, totalScore: 85, level: 'B' }
      prisma.supplierEvaluation.findUniqueOrThrow.mockResolvedValue(mockData)
      const result = await service.findOneEvaluation(1)
      expect(result).toEqual(mockData)
    })
  })

  describe('createEvaluation', () => {
    it('creates evaluation with weighted scoring', async () => {
      prisma.supplierEvaluation.create.mockResolvedValue({ id: 1 })
      prisma.mdSupplier.update.mockResolvedValue({})

      const result = await service.createEvaluation({
        supplierId: 1,
        qualityScore: 90,
        deliveryScore: 85,
        costScore: 80,
        serviceScore: 95,
        period: '2026-Q4',
      }, 2)

      expect(prisma.supplierEvaluation.create).toHaveBeenCalled()
      const evalData = prisma.supplierEvaluation.create.mock.calls[0][0].data
      expect(evalData.qualityScore).toBe(90)
      expect(evalData.deliveryScore).toBe(85)
      expect(evalData.costScore).toBe(80)
      expect(evalData.serviceScore).toBe(95)
      expect(evalData.totalScore).toBe(87)
      expect(evalData.level).toBe('B')

      expect(prisma.mdSupplier.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { rating: 'B' },
      })
    })

    it('assigns level A for score >= 90', async () => {
      prisma.supplierEvaluation.create.mockResolvedValue({ id: 1 })
      prisma.mdSupplier.update.mockResolvedValue({})

      await service.createEvaluation({
        supplierId: 1,
        qualityScore: 95,
        deliveryScore: 95,
        costScore: 95,
        serviceScore: 95,
      }, 2)

      const evalData = prisma.supplierEvaluation.create.mock.calls[0][0].data
      expect(evalData.level).toBe('A')
    })

    it('assigns level C for score >= 70', async () => {
      prisma.supplierEvaluation.create.mockResolvedValue({ id: 1 })
      prisma.mdSupplier.update.mockResolvedValue({})

      await service.createEvaluation({
        supplierId: 1,
        qualityScore: 75,
        deliveryScore: 75,
        costScore: 75,
        serviceScore: 75,
      }, 2)

      const evalData = prisma.supplierEvaluation.create.mock.calls[0][0].data
      expect(evalData.level).toBe('C')
    })

    it('assigns level D for score < 70', async () => {
      prisma.supplierEvaluation.create.mockResolvedValue({ id: 1 })
      prisma.mdSupplier.update.mockResolvedValue({})

      await service.createEvaluation({
        supplierId: 1,
        qualityScore: 60,
        deliveryScore: 60,
        costScore: 60,
        serviceScore: 60,
      }, 2)

      const evalData = prisma.supplierEvaluation.create.mock.calls[0][0].data
      expect(evalData.level).toBe('D')
    })
  })

  // ==================== Supplier Audit ====================

  describe('findAllAudits', () => {
    it('returns audits with filters', async () => {
      prisma.supplierAudit.findMany.mockResolvedValue([])
      await service.findAllAudits({ supplierId: 1, auditType: 'annual' })
      expect(prisma.supplierAudit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { supplierId: 1, auditType: 'annual' } }),
      )
    })
  })

  describe('findOneAudit', () => {
    it('returns audit with includes', async () => {
      const mockData = { id: 1, result: 'pass' }
      prisma.supplierAudit.findUniqueOrThrow.mockResolvedValue(mockData)
      const result = await service.findOneAudit(1)
      expect(result).toEqual(mockData)
    })
  })

  describe('createAudit', () => {
    it('creates audit with defaults', async () => {
      prisma.supplierAudit.create.mockResolvedValue({ id: 1 })
      await service.createAudit({
        supplierId: 1,
        auditType: 'annual',
        auditDate: '2026-10-27',
        findings: 'Good practices',
      }, 2)

      expect(prisma.supplierAudit.create).toHaveBeenCalled()
      const auditData = prisma.supplierAudit.create.mock.calls[0][0].data
      expect(auditData.result).toBe('pass')
      expect(auditData.auditorId).toBe(2)
    })

    it('creates audit with custom result', async () => {
      prisma.supplierAudit.create.mockResolvedValue({ id: 1 })
      await service.createAudit({
        supplierId: 1,
        auditType: 'special',
        result: 'fail',
        findings: 'Issues found',
        correctiveActions: 'Fix required',
        followUpDate: '2026-12-01',
      }, 2)

      const auditData = prisma.supplierAudit.create.mock.calls[0][0].data
      expect(auditData.result).toBe('fail')
      expect(auditData.correctiveActions).toBe('Fix required')
      expect(auditData.followUpDate).toBeInstanceOf(Date)
    })
  })

  describe('updateAudit', () => {
    it('updates audit', async () => {
      prisma.supplierAudit.update.mockResolvedValue({ id: 1 })
      await service.updateAudit(1, {
        result: 'pass',
        findings: 'Updated findings',
        correctiveActions: 'Updated actions',
        followUpDate: '2026-12-15',
      })

      expect(prisma.supplierAudit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            result: 'pass',
            findings: 'Updated findings',
          }),
        }),
      )
    })
  })

  // ==================== Statistics ====================

  describe('getOverviewStats', () => {
    it('returns aggregated statistics', async () => {
      prisma.purchaseRequest.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(15)
      prisma.purchaseOrder.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(50)
      prisma.mdSupplier.count
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(25)
      prisma.purchaseOrder.aggregate.mockResolvedValue({
        _sum: { totalAmount: 500000 },
      })

      const result = await service.getOverviewStats()

      expect(result.totalRequests).toBe(100)
      expect(result.pendingRequests).toBe(15)
      expect(result.totalOrders).toBe(200)
      expect(result.activeOrders).toBe(50)
      expect(result.totalSuppliers).toBe(30)
      expect(result.qualifiedSuppliers).toBe(25)
      expect(result.totalOrderAmount).toBe(500000)
    })

    it('handles null aggregate sum', async () => {
      prisma.purchaseRequest.count.mockResolvedValue(0)
      prisma.purchaseOrder.count.mockResolvedValue(0)
      prisma.mdSupplier.count.mockResolvedValue(0)
      prisma.purchaseOrder.aggregate.mockResolvedValue({
        _sum: { totalAmount: null },
      })

      const result = await service.getOverviewStats()
      expect(result.totalOrderAmount).toBe(0)
    })
  })

  describe('getSupplierPerformance', () => {
    it('returns performance metrics for qualified suppliers', async () => {
      prisma.mdSupplier.findMany.mockResolvedValue([
        {
          id: 1,
          supplierName: 'Supplier A',
          supplierCode: 'SUP001',
          level: 'A',
          rating: 'A',
          evaluations: [{ totalScore: 92 }],
          _count: { purchaseOrders: 15, evaluations: 5 },
        },
        {
          id: 2,
          supplierName: 'Supplier B',
          supplierCode: 'SUP002',
          level: 'B',
          rating: 'B',
          evaluations: [],
          _count: { purchaseOrders: 8, evaluations: 2 },
        },
      ])

      const result = await service.getSupplierPerformance()

      expect(result).toHaveLength(2)
      expect(result[0].supplierName).toBe('Supplier A')
      expect(result[0].latestScore).toBe(92)
      expect(result[0].totalOrders).toBe(15)
      expect(result[0].totalEvaluations).toBe(5)
      expect(result[1].latestScore).toBeNull()
    })
  })
})
