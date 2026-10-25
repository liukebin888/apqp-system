import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req,
} from '@nestjs/common'
import { ProcurementService } from './procurement.service'

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly service: ProcurementService) {}

  // ==================== Purchase Request Endpoints ====================

  @Get('requests')
  async findAllRequests(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('applicantId') applicantId?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllRequests({
        projectId: projectId ? +projectId : undefined,
        status,
        category,
        applicantId: applicantId ? +applicantId : undefined,
      }),
      message: 'success',
    }
  }

  @Get('requests/:id')
  async findOneRequest(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneRequest(+id),
      message: 'success',
    }
  }

  @Post('requests')
  async createRequest(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createRequest(body, userId),
      message: 'success',
    }
  }

  @Put('requests/:id')
  async updateRequest(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateRequest(+id, body),
      message: 'success',
    }
  }

  @Delete('requests/:id')
  async deleteRequest(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteRequest(+id),
      message: 'success',
    }
  }

  @Post('requests/:id/submit')
  async submitRequest(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.submitRequest(+id),
      message: 'success',
    }
  }

  @Put('requests/:id/approve')
  async approveRequest(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.approveRequest(+id, userId),
      message: 'success',
    }
  }

  @Put('requests/:id/reject')
  async rejectRequest(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.rejectRequest(+id),
      message: 'success',
    }
  }

  @Put('requests/:id/cancel')
  async cancelRequest(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.cancelRequest(+id),
      message: 'success',
    }
  }

  // ==================== Request Item Endpoints ====================

  @Post('requests/:id/items')
  async addRequestItem(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.addRequestItem(+id, body),
      message: 'success',
    }
  }

  @Put('request-items/:id')
  async updateRequestItem(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateRequestItem(+id, body),
      message: 'success',
    }
  }

  @Delete('request-items/:id')
  async deleteRequestItem(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteRequestItem(+id),
      message: 'success',
    }
  }

  // ==================== Purchase Order Endpoints ====================

  @Get('orders')
  async findAllOrders(
    @Query('supplierId') supplierId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('requestId') requestId?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllOrders({
        supplierId: supplierId ? +supplierId : undefined,
        projectId: projectId ? +projectId : undefined,
        status,
        requestId: requestId ? +requestId : undefined,
      }),
      message: 'success',
    }
  }

  @Get('orders/:id')
  async findOneOrder(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneOrder(+id),
      message: 'success',
    }
  }

  @Post('orders')
  async createOrder(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createOrder(body, userId),
      message: 'success',
    }
  }

  @Post('orders/from-request/:requestId')
  async createOrderFromRequest(
    @Param('requestId') requestId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createOrderFromRequest(+requestId, body, userId),
      message: 'success',
    }
  }

  @Put('orders/:id')
  async updateOrder(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateOrder(+id, body),
      message: 'success',
    }
  }

  @Delete('orders/:id')
  async deleteOrder(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteOrder(+id),
      message: 'success',
    }
  }

  @Put('orders/:id/confirm')
  async confirmOrder(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.confirmOrder(+id),
      message: 'success',
    }
  }

  @Post('orders/:id/receive')
  async receiveOrder(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.receiveOrder(+id, body.items),
      message: 'success',
    }
  }

  @Put('orders/:id/close')
  async closeOrder(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.closeOrder(+id),
      message: 'success',
    }
  }

  @Put('orders/:id/cancel')
  async cancelOrder(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.cancelOrder(+id),
      message: 'success',
    }
  }

  // ==================== Order Item Endpoints ====================

  @Post('orders/:id/items')
  async addOrderItem(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.addOrderItem(+id, body),
      message: 'success',
    }
  }

  @Put('order-items/:id')
  async updateOrderItem(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateOrderItem(+id, body),
      message: 'success',
    }
  }

  @Delete('order-items/:id')
  async deleteOrderItem(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteOrderItem(+id),
      message: 'success',
    }
  }

  // ==================== Supplier Endpoints ====================

  @Get('suppliers')
  async findAllSuppliers(
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('qualificationStatus') qualificationStatus?: string,
    @Query('keyword') keyword?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllSuppliers({
        category,
        level,
        qualificationStatus,
        keyword,
      }),
      message: 'success',
    }
  }

  @Get('suppliers/:id')
  async findOneSupplier(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneSupplier(+id),
      message: 'success',
    }
  }

  @Post('suppliers/:id/admit')
  async admitSupplier(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.admitSupplier(+id, body, userId),
      message: 'success',
    }
  }

  @Put('suppliers/:id/blacklist')
  async blacklistSupplier(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.blacklistSupplier(+id, body.reason),
      message: 'success',
    }
  }

  @Put('suppliers/:id/restore')
  async restoreSupplier(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.restoreSupplier(+id),
      message: 'success',
    }
  }

  // ==================== Evaluation Endpoints ====================

  @Get('evaluations')
  async findAllEvaluations(
    @Query('supplierId') supplierId?: string,
    @Query('period') period?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllEvaluations({
        supplierId: supplierId ? +supplierId : undefined,
        period,
      }),
      message: 'success',
    }
  }

  @Get('evaluations/:id')
  async findOneEvaluation(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneEvaluation(+id),
      message: 'success',
    }
  }

  @Post('evaluations')
  async createEvaluation(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createEvaluation(body, userId),
      message: 'success',
    }
  }

  // ==================== Audit Endpoints ====================

  @Get('audits')
  async findAllAudits(
    @Query('supplierId') supplierId?: string,
    @Query('auditType') auditType?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllAudits({
        supplierId: supplierId ? +supplierId : undefined,
        auditType,
      }),
      message: 'success',
    }
  }

  @Get('audits/:id')
  async findOneAudit(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneAudit(+id),
      message: 'success',
    }
  }

  @Post('audits')
  async createAudit(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createAudit(body, userId),
      message: 'success',
    }
  }

  @Put('audits/:id')
  async updateAudit(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateAudit(+id, body),
      message: 'success',
    }
  }

  // ==================== Statistics Endpoints ====================

  @Get('stats/overview')
  async getOverviewStats() {
    return {
      code: 0,
      data: await this.service.getOverviewStats(),
      message: 'success',
    }
  }

  @Get('stats/supplier-performance')
  async getSupplierPerformance() {
    return {
      code: 0,
      data: await this.service.getSupplierPerformance(),
      message: 'success',
    }
  }
}
