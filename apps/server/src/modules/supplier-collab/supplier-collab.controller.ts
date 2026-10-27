import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { SupplierCollabService } from './supplier-collab.service'

@Controller('supplier-collab')
@UseGuards(AuthGuard('jwt'))
export class SupplierCollabController {
  constructor(private readonly service: SupplierCollabService) {}

  // ==================== Supplier Developments ====================

  @Get('developments')
  async findAllDevs(
    @Query('projectId') projectId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('stage') stage?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllDevs({
        projectId, supplierId, stage,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('developments/:id')
  async findOneDev(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneDev(+id),
      message: 'success',
    }
  }

  @Post('developments')
  async createDev(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createDev(body, userId),
      message: 'success',
    }
  }

  @Put('developments/:id')
  async updateDev(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateDev(+id, body),
      message: 'success',
    }
  }

  @Delete('developments/:id')
  async deleteDev(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteDev(+id),
      message: 'success',
    }
  }

  // ==================== Supplier 8D Reports ====================

  @Get('8ds')
  async findAll8Ds(
    @Query('projectId') projectId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAll8Ds({
        projectId, supplierId, status,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('8ds/:id')
  async findOne8D(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOne8D(+id),
      message: 'success',
    }
  }

  @Post('8ds')
  async create8D(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.create8D(body, userId),
      message: 'success',
    }
  }

  @Put('8ds/:id')
  async update8D(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.update8D(+id, body),
      message: 'success',
    }
  }

  @Delete('8ds/:id')
  async delete8D(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.delete8D(+id),
      message: 'success',
    }
  }

  // ==================== Supplier Performances ====================

  @Get('performances')
  async findAllPerfs(
    @Query('projectId') projectId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('period') period?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllPerfs({
        projectId, supplierId, period,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('performances/:id')
  async findOnePerf(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOnePerf(+id),
      message: 'success',
    }
  }

  @Post('performances')
  async createPerf(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createPerf(body, userId),
      message: 'success',
    }
  }

  @Put('performances/:id')
  async updatePerf(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updatePerf(+id, body),
      message: 'success',
    }
  }

  @Delete('performances/:id')
  async deletePerf(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deletePerf(+id),
      message: 'success',
    }
  }
}
