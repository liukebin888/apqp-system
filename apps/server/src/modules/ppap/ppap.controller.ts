import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req,
} from '@nestjs/common'
import { PpapService } from './ppap.service'

@Controller('ppap')
export class PpapController {
  constructor(private readonly service: PpapService) {}

  // ==================== Package Endpoints ====================

  @Get('packages')
  async findAllPackages(
    @Query('projectId') projectId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllPackages({
        projectId: projectId ? +projectId : undefined,
        customerId: customerId ? +customerId : undefined,
        status,
      }),
      message: 'success',
    }
  }

  @Get('packages/:id')
  async findOnePackage(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOnePackage(+id), message: 'success' }
  }

  @Post('packages')
  async createPackage(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.createPackage(body, userId), message: 'success' }
  }

  @Put('packages/:id')
  async updatePackage(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.updatePackage(+id, body), message: 'success' }
  }

  @Delete('packages/:id')
  async deletePackage(@Param('id') id: string) {
    return { code: 0, data: await this.service.deletePackage(+id), message: 'success' }
  }

  @Put('packages/:id/status')
  async updatePackageStatus(@Param('id') id: string, @Body('status') status: string) {
    return { code: 0, data: await this.service.updatePackageStatus(+id, status), message: 'success' }
  }

  // ==================== Item Endpoints ====================

  @Post('packages/:packageId/items')
  async createItem(
    @Param('packageId') packageId: string,
    @Body() body: any,
  ) {
    return {
      code: 0,
      data: await this.service.createItem(+packageId, body),
      message: 'success',
    }
  }

  @Put('items/:id')
  async updateItem(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.updateItem(+id, body, userId), message: 'success' }
  }

  @Delete('items/:id')
  async deleteItem(@Param('id') id: string) {
    return { code: 0, data: await this.service.deleteItem(+id), message: 'success' }
  }

  @Post('packages/:packageId/init-items')
  async initDefaultItems(@Param('packageId') packageId: string) {
    return {
      code: 0,
      data: await this.service.initDefaultItems(+packageId),
      message: 'success',
    }
  }

  // ==================== Submission Endpoints ====================

  @Post('packages/:packageId/submissions')
  async createSubmission(
    @Param('packageId') packageId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createSubmission(+packageId, body, userId),
      message: 'success',
    }
  }

  @Put('submissions/:id/review')
  async reviewSubmission(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.reviewSubmission(+id, body, userId),
      message: 'success',
    }
  }
}
