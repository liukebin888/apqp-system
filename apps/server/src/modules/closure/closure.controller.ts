import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ClosureService } from './closure.service'

@Controller('closures')
@UseGuards(AuthGuard('jwt'))
export class ClosureController {
  constructor(private readonly service: ClosureService) {}

  // ==================== Handovers (must be before :id) ====================

  @Get('handovers')
  async findAllHandovers(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllHandovers({
        projectId, status,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('handovers/:id')
  async findOneHandover(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneHandover(+id),
      message: 'success',
    }
  }

  @Post('handovers')
  async createHandover(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createHandover(body, userId),
      message: 'success',
    }
  }

  @Put('handovers/:id')
  async updateHandover(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateHandover(+id, body),
      message: 'success',
    }
  }

  @Delete('handovers/:id')
  async deleteHandover(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteHandover(+id),
      message: 'success',
    }
  }

  // ==================== Production Traces (must be before :id) ====================

  @Get('traces')
  async findAllTraces(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllTraces({
        projectId, status,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('traces/:id')
  async findOneTrace(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneTrace(+id),
      message: 'success',
    }
  }

  @Post('traces')
  async createTrace(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createTrace(body, userId),
      message: 'success',
    }
  }

  @Put('traces/:id')
  async updateTrace(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateTrace(+id, body),
      message: 'success',
    }
  }

  @Delete('traces/:id')
  async deleteTrace(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteTrace(+id),
      message: 'success',
    }
  }

  // ==================== Closures ====================

  @Get()
  async findAllClosures(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllClosures({
        projectId, status,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get(':id')
  async findOneClosure(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneClosure(+id),
      message: 'success',
    }
  }

  @Post()
  async createClosure(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createClosure(body, userId),
      message: 'success',
    }
  }

  @Put(':id')
  async updateClosure(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateClosure(+id, body),
      message: 'success',
    }
  }

  @Delete(':id')
  async deleteClosure(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteClosure(+id),
      message: 'success',
    }
  }

  @Put(':id/approve')
  async approveClosure(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.approveClosure(+id, userId),
      message: 'success',
    }
  }
}
