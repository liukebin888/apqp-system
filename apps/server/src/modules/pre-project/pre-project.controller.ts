import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req,
} from '@nestjs/common'
import { PreProjectService } from './pre-project.service'

@Controller('pre-project')
export class PreProjectController {
  constructor(private readonly service: PreProjectService) {}

  // RFQ Endpoints
  @Get('rfqs')
  async findAllRfqs(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllRfqs({
        customerId: customerId ? +customerId : undefined,
        status,
      }),
      message: 'success',
    }
  }

  @Get('rfqs/:id')
  async findOneRfq(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOneRfq(+id), message: 'success' }
  }

  @Post('rfqs')
  async createRfq(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createRfq(body, userId),
      message: 'success',
    }
  }

  @Put('rfqs/:id')
  async updateRfq(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateRfq(+id, body), message: 'success' }
  }

  @Delete('rfqs/:id')
  async deleteRfq(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteRfq(+id), message: 'success' }
  }

  @Put('rfqs/:id/status')
  async updateRfqStatus(@Param('id') id: string, @Body('status') status: string) {
    return { code: 0, data: await this.service.updateRfqStatus(+id, status), message: 'success' }
  }

  // Quotation Endpoints
  @Post('rfqs/:rfqId/quotations')
  async createQuotation(
    @Param('rfqId') rfqId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createQuotation(+rfqId, body, userId),
      message: 'success',
    }
  }

  @Put('quotations/:id')
  async updateQuotation(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updateQuotation(+id, body), message: 'success' }
  }

  // Technical Proposal Endpoints
  @Post('rfqs/:rfqId/proposals')
  async createProposal(
    @Param('rfqId') rfqId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createProposal(+rfqId, body, userId),
      message: 'success',
    }
  }

  @Put('proposals/:id/approve')
  async approveProposal(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.approveProposal(+id, userId),
      message: 'success',
    }
  }

  // Feasibility Study Endpoints
  @Post('rfqs/:rfqId/feasibility')
  async createOrUpdateFeasibility(
    @Param('rfqId') rfqId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createOrUpdateFeasibility(+rfqId, body, userId),
      message: 'success',
    }
  }

  // Nomination Endpoints
  @Post('rfqs/:rfqId/nominations')
  async createNomination(
    @Param('rfqId') rfqId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createNomination(+rfqId, body, userId),
      message: 'success',
    }
  }
}
