import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  // ==================== Purchase Requests ====================

  async findAllRequests(params: {
    projectId?: number
    status?: string
    category?: string
    applicantId?: number
  }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.status) where.status = params.status
    if (params.category) where.category = params.category
    if (params.applicantId) where.applicantId = params.applicantId

    return this.prisma.purchaseRequest.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        applicant: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        items: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneRequest(id: number) {
    return this.prisma.purchaseRequest.findUniqueOrThrow({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        applicant: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        orders: {
          include: {
            supplier: { select: { id: true, supplierName: true, supplierCode: true } },
          },
        },
      },
    })
  }

  async createRequest(data: any, userId: number) {
    const requestNo = await this.generateRequestNo()
    const items = data.items || []
    const processedItems = items.map((item: any) => ({
      ...item,
      amount: item.amount || (Number(item.quantity) * Number(item.expectedPrice)),
    }))
    const totalAmount = processedItems.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)

    return this.prisma.purchaseRequest.create({
      data: {
        requestNo,
        projectId: data.projectId,
        applicantId: userId,
        department: data.department,
        category: data.category,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        reason: data.reason,
        remarks: data.remarks,
        totalAmount,
        items: {
          create: processedItems.map((item: any, index: number) => ({
            materialCode: item.materialCode,
            materialName: item.materialName,
            specification: item.specification,
            quantity: item.quantity,
            unit: item.unit,
            expectedPrice: item.expectedPrice,
            amount: item.amount,
            remarks: item.remarks,
            sortOrder: index,
          })),
        },
      },
      include: { items: true },
    })
  }

  async updateRequest(id: number, data: any) {
    const items = data.items
    if (items) {
      await this.prisma.purchaseRequestItem.deleteMany({ where: { requestId: id } })
    }

    const totalAmount = items
      ? items.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)
      : data.totalAmount

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        department: data.department,
        category: data.category,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
        reason: data.reason,
        remarks: data.remarks,
        totalAmount,
        ...(items && {
          items: {
            create: items.map((item: any, index: number) => ({
              materialCode: item.materialCode,
              materialName: item.materialName,
              specification: item.specification,
              quantity: item.quantity,
              unit: item.unit,
              expectedPrice: item.expectedPrice,
              amount: item.amount,
              remarks: item.remarks,
              sortOrder: index,
            })),
          },
        }),
      },
      include: { items: true },
    })
  }

  async deleteRequest(id: number) {
    return this.prisma.purchaseRequest.delete({ where: { id } })
  }

  async submitRequest(id: number) {
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: 'pending' },
    })
  }

  async approveRequest(id: number, approverId: number) {
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    })
  }

  async rejectRequest(id: number) {
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: 'rejected' },
    })
  }

  async cancelRequest(id: number) {
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    })
  }

  async addRequestItem(requestId: number, data: any) {
    const item = await this.prisma.purchaseRequestItem.create({
      data: {
        requestId,
        materialCode: data.materialCode,
        materialName: data.materialName,
        specification: data.specification,
        quantity: data.quantity,
        unit: data.unit,
        expectedPrice: data.expectedPrice,
        amount: data.amount,
        remarks: data.remarks,
        sortOrder: data.sortOrder || 0,
      },
    })
    await this.recalculateRequestTotal(requestId)
    return item
  }

  async updateRequestItem(id: number, data: any) {
    const item = await this.prisma.purchaseRequestItem.update({
      where: { id },
      data: {
        materialCode: data.materialCode,
        materialName: data.materialName,
        specification: data.specification,
        quantity: data.quantity,
        unit: data.unit,
        expectedPrice: data.expectedPrice,
        amount: data.amount,
        remarks: data.remarks,
        sortOrder: data.sortOrder,
      },
    })
    await this.recalculateRequestTotal(item.requestId)
    return item
  }

  async deleteRequestItem(id: number) {
    const item = await this.prisma.purchaseRequestItem.delete({ where: { id } })
    await this.recalculateRequestTotal(item.requestId)
    return item
  }

  private async recalculateRequestTotal(requestId: number) {
    const items = await this.prisma.purchaseRequestItem.findMany({
      where: { requestId },
      select: { amount: true },
    })
    const total = items.reduce((sum, item) => sum + Number(item.amount), 0)
    await this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { totalAmount: total },
    })
  }

  private async generateRequestNo(): Promise<string> {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await this.prisma.purchaseRequest.count({
      where: { requestNo: { startsWith: `PR${dateStr}` } },
    })
    return `PR${dateStr}${String(count + 1).padStart(4, '0')}`
  }

  // ==================== Purchase Orders ====================

  async findAllOrders(params: {
    supplierId?: number
    projectId?: number
    status?: string
    requestId?: number
  }) {
    const where: any = {}
    if (params.supplierId) where.supplierId = params.supplierId
    if (params.projectId) where.projectId = params.projectId
    if (params.status) where.status = params.status
    if (params.requestId) where.requestId = params.requestId

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, supplierName: true, supplierCode: true, level: true } },
        request: { select: { id: true, requestNo: true } },
        createdBy: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneOrder(id: number) {
    return this.prisma.purchaseOrder.findUniqueOrThrow({
      where: { id },
      include: {
        supplier: { select: { id: true, supplierName: true, supplierCode: true, contactName: true, contactPhone: true } },
        request: { include: { items: true } },
        createdBy: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })
  }

  async createOrderFromRequest(requestId: number, data: any, userId: number) {
    const request = await this.prisma.purchaseRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { items: true },
    })

    if (request.status !== 'approved') {
      throw new BadRequestException('Only approved requests can be converted to orders')
    }

    const orderNo = await this.generateOrderNo()
    const orderItems = request.items.map((item, index) => ({
      materialCode: item.materialCode,
      materialName: item.materialName,
      specification: item.specification,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: data.unitPrices?.[index] || item.expectedPrice,
      amount: Number(data.unitPrices?.[index] || item.expectedPrice) * Number(item.quantity),
      sortOrder: index,
    }))

    const totalAmount = orderItems.reduce((sum, item) => sum + Number(item.amount), 0)

    const order = await this.prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierId: data.supplierId,
        requestId,
        projectId: request.projectId,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        paymentTerms: data.paymentTerms,
        qualityRequirements: data.qualityRequirements,
        penaltyClauses: data.penaltyClauses,
        totalAmount,
        status: 'draft',
        createdById: userId,
        items: { create: orderItems },
      },
      include: { items: true },
    })

    await this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: 'completed' },
    })

    return order
  }

  async createOrder(data: any, userId: number) {
    const orderNo = await this.generateOrderNo()
    const items = data.items || []
    const totalAmount = items.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)

    return this.prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierId: data.supplierId,
        requestId: data.requestId,
        projectId: data.projectId,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        paymentTerms: data.paymentTerms,
        qualityRequirements: data.qualityRequirements,
        penaltyClauses: data.penaltyClauses,
        totalAmount,
        status: data.status || 'draft',
        createdById: userId,
        remarks: data.remarks,
        items: {
          create: items.map((item: any, index: number) => ({
            materialCode: item.materialCode,
            materialName: item.materialName,
            specification: item.specification,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            amount: item.amount,
            remarks: item.remarks,
            sortOrder: index,
          })),
        },
      },
      include: { items: true },
    })
  }

  async updateOrder(id: number, data: any) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: data.supplierId,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        paymentTerms: data.paymentTerms,
        qualityRequirements: data.qualityRequirements,
        penaltyClauses: data.penaltyClauses,
        remarks: data.remarks,
      },
    })
  }

  async deleteOrder(id: number) {
    return this.prisma.purchaseOrder.delete({ where: { id } })
  }

  async confirmOrder(id: number) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'confirmed' },
    })
  }

  async receiveOrder(id: number, receivedItems: { itemId: number; receivedQty: number }[]) {
    for (const item of receivedItems) {
      await this.prisma.purchaseOrderItem.update({
        where: { id: item.itemId },
        data: { receivedQty: item.receivedQty },
      })
    }

    const orderItems = await this.prisma.purchaseOrderItem.findMany({
      where: { orderId: id },
    })

    const allReceived = orderItems.every((item) => item.receivedQty >= item.quantity)

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: allReceived ? 'received' : 'in_transit' },
    })
  }

  async closeOrder(id: number) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'closed' },
    })
  }

  async cancelOrder(id: number) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    })
  }

  async addOrderItem(orderId: number, data: any) {
    const item = await this.prisma.purchaseOrderItem.create({
      data: {
        orderId,
        materialCode: data.materialCode,
        materialName: data.materialName,
        specification: data.specification,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        amount: data.amount,
        remarks: data.remarks,
        sortOrder: data.sortOrder || 0,
      },
    })
    await this.recalculateOrderTotal(orderId)
    return item
  }

  async updateOrderItem(id: number, data: any) {
    const item = await this.prisma.purchaseOrderItem.update({
      where: { id },
      data: {
        materialCode: data.materialCode,
        materialName: data.materialName,
        specification: data.specification,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        amount: data.amount,
        remarks: data.remarks,
        sortOrder: data.sortOrder,
      },
    })
    await this.recalculateOrderTotal(item.orderId)
    return item
  }

  async deleteOrderItem(id: number) {
    const item = await this.prisma.purchaseOrderItem.delete({ where: { id } })
    await this.recalculateOrderTotal(item.orderId)
    return item
  }

  private async recalculateOrderTotal(orderId: number) {
    const items = await this.prisma.purchaseOrderItem.findMany({
      where: { orderId },
      select: { amount: true },
    })
    const total = items.reduce((sum, item) => sum + Number(item.amount), 0)
    await this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { totalAmount: total },
    })
  }

  private async generateOrderNo(): Promise<string> {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await this.prisma.purchaseOrder.count({
      where: { orderNo: { startsWith: `PO${dateStr}` } },
    })
    return `PO${dateStr}${String(count + 1).padStart(4, '0')}`
  }

  // ==================== Supplier Management ====================

  async findAllSuppliers(params: {
    category?: string
    level?: string
    qualificationStatus?: string
    keyword?: string
  }) {
    const where: any = {}
    if (params.category) where.category = params.category
    if (params.level) where.level = params.level
    if (params.qualificationStatus) where.qualificationStatus = params.qualificationStatus
    if (params.keyword) {
      where.OR = [
        { supplierName: { contains: params.keyword } },
        { supplierCode: { contains: params.keyword } },
      ]
    }

    return this.prisma.mdSupplier.findMany({
      where,
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            evaluations: true,
            ratings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneSupplier(id: number) {
    return this.prisma.mdSupplier.findUniqueOrThrow({
      where: { id },
      include: {
        documents: true,
        ratings: { orderBy: { createdAt: 'desc' }, take: 5 },
        evaluations: { orderBy: { evaluationDate: 'desc' }, take: 5 },
        audits: { orderBy: { auditDate: 'desc' }, take: 5 },
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            _count: { select: { items: true } },
          },
        },
        approvedBy: { select: { id: true, realName: true } },
      },
    })
  }

  async admitSupplier(id: number, data: any, userId: number) {
    return this.prisma.mdSupplier.update({
      where: { id },
      data: {
        qualificationStatus: 'qualified',
        level: data.level,
        category: data.category,
        admissionDate: new Date(),
        approvedById: userId,
      },
    })
  }

  async blacklistSupplier(id: number, reason?: string) {
    return this.prisma.mdSupplier.update({
      where: { id },
      data: {
        qualificationStatus: 'blacklisted',
        status: 0,
      },
    })
  }

  async restoreSupplier(id: number) {
    return this.prisma.mdSupplier.update({
      where: { id },
      data: {
        qualificationStatus: 'probation',
        status: 1,
      },
    })
  }

  // ==================== Supplier Evaluation ====================

  async findAllEvaluations(params: { supplierId?: number; period?: string }) {
    const where: any = {}
    if (params.supplierId) where.supplierId = params.supplierId
    if (params.period) where.period = params.period

    return this.prisma.supplierEvaluation.findMany({
      where,
      include: {
        supplier: { select: { id: true, supplierName: true, supplierCode: true } },
        evaluator: { select: { id: true, realName: true } },
      },
      orderBy: { evaluationDate: 'desc' },
    })
  }

  async findOneEvaluation(id: number) {
    return this.prisma.supplierEvaluation.findUniqueOrThrow({
      where: { id },
      include: {
        supplier: { select: { id: true, supplierName: true, supplierCode: true } },
        evaluator: { select: { id: true, realName: true } },
      },
    })
  }

  async createEvaluation(data: any, userId: number) {
    const quality = Number(data.qualityScore)
    const delivery = Number(data.deliveryScore)
    const cost = Number(data.costScore)
    const service = Number(data.serviceScore)
    const totalScore = quality * 0.4 + delivery * 0.3 + cost * 0.2 + service * 0.1

    let level: string
    if (totalScore >= 90) level = 'A'
    else if (totalScore >= 80) level = 'B'
    else if (totalScore >= 70) level = 'C'
    else level = 'D'

    const evaluation = await this.prisma.supplierEvaluation.create({
      data: {
        supplierId: data.supplierId,
        evaluatorId: userId,
        evaluationDate: data.evaluationDate ? new Date(data.evaluationDate) : new Date(),
        qualityScore: quality,
        deliveryScore: delivery,
        costScore: cost,
        serviceScore: service,
        totalScore,
        level,
        period: data.period,
        remarks: data.remarks,
      },
    })

    await this.prisma.mdSupplier.update({
      where: { id: data.supplierId },
      data: { rating: level },
    })

    return evaluation
  }

  // ==================== Supplier Audit ====================

  async findAllAudits(params: { supplierId?: number; auditType?: string }) {
    const where: any = {}
    if (params.supplierId) where.supplierId = params.supplierId
    if (params.auditType) where.auditType = params.auditType

    return this.prisma.supplierAudit.findMany({
      where,
      include: {
        supplier: { select: { id: true, supplierName: true, supplierCode: true } },
        auditor: { select: { id: true, realName: true } },
      },
      orderBy: { auditDate: 'desc' },
    })
  }

  async findOneAudit(id: number) {
    return this.prisma.supplierAudit.findUniqueOrThrow({
      where: { id },
      include: {
        supplier: { select: { id: true, supplierName: true, supplierCode: true } },
        auditor: { select: { id: true, realName: true } },
      },
    })
  }

  async createAudit(data: any, userId: number) {
    return this.prisma.supplierAudit.create({
      data: {
        supplierId: data.supplierId,
        auditorId: userId,
        auditType: data.auditType,
        auditDate: data.auditDate ? new Date(data.auditDate) : new Date(),
        result: data.result || 'pass',
        findings: data.findings,
        correctiveActions: data.correctiveActions,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        remarks: data.remarks,
      },
    })
  }

  async updateAudit(id: number, data: any) {
    return this.prisma.supplierAudit.update({
      where: { id },
      data: {
        result: data.result,
        findings: data.findings,
        correctiveActions: data.correctiveActions,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        remarks: data.remarks,
      },
    })
  }

  // ==================== Statistics ====================

  async getOverviewStats() {
    const [
      totalRequests,
      pendingRequests,
      totalOrders,
      activeOrders,
      totalSuppliers,
      qualifiedSuppliers,
      totalOrderAmount,
    ] = await Promise.all([
      this.prisma.purchaseRequest.count(),
      this.prisma.purchaseRequest.count({ where: { status: 'pending' } }),
      this.prisma.purchaseOrder.count(),
      this.prisma.purchaseOrder.count({
        where: { status: { in: ['confirmed', 'in_transit'] } },
      }),
      this.prisma.mdSupplier.count(),
      this.prisma.mdSupplier.count({ where: { qualificationStatus: 'qualified' } }),
      this.prisma.purchaseOrder.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: 'cancelled' } },
      }),
    ])

    return {
      totalRequests,
      pendingRequests,
      totalOrders,
      activeOrders,
      totalSuppliers,
      qualifiedSuppliers,
      totalOrderAmount: totalOrderAmount._sum.totalAmount || 0,
    }
  }

  async getSupplierPerformance() {
    const suppliers = await this.prisma.mdSupplier.findMany({
      where: { qualificationStatus: 'qualified' },
      include: {
        evaluations: {
          orderBy: { evaluationDate: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            purchaseOrders: { where: { status: 'received' } },
            evaluations: true,
          },
        },
      },
    })

    return suppliers.map((s) => ({
      id: s.id,
      supplierName: s.supplierName,
      supplierCode: s.supplierCode,
      level: s.level,
      rating: s.rating,
      latestScore: s.evaluations[0]?.totalScore || null,
      totalOrders: s._count.purchaseOrders,
      totalEvaluations: s._count.evaluations,
    }))
  }
}
