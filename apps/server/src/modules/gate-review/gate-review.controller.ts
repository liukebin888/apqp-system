import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req,
} from '@nestjs/common'
import { GateReviewService } from './gate-review.service'

@Controller('gate-reviews')
export class GateReviewController {
  constructor(private readonly service: GateReviewService) {}

  @Get()
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('gateType') gateType?: string,
    @Query('status') status?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAll({
        projectId: projectId ? +projectId : undefined,
        gateType,
        status,
      }),
      message: 'success',
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOne(+id), message: 'success' }
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.create(body, userId),
      message: 'success',
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.update(+id, body), message: 'success' }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return { code: 0, data: await this.service.delete(+id), message: 'success' }
  }

  // Review Items
  @Post(':id/items')
  async addReviewItem(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.addReviewItem(+id, body),
      message: 'success',
    }
  }

  @Put('items/:itemId')
  async updateReviewItem(@Param('itemId') itemId: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateReviewItem(+itemId, body),
      message: 'success',
    }
  }

  @Delete('items/:itemId')
  async deleteReviewItem(@Param('itemId') itemId: string) {
    return { code: 0, data: await this.service.deleteReviewItem(+itemId), message: 'success' }
  }

  // Participants
  @Post(':id/participants')
  async addParticipant(
    @Param('id') id: string,
    @Body('userId') userId: number,
    @Body('role') role: string,
  ) {
    return {
      code: 0,
      data: await this.service.addParticipant(+id, userId, role),
      message: 'success',
    }
  }

  @Put('participants/:participantId')
  async updateParticipantAttendance(
    @Param('participantId') participantId: string,
    @Body('attendance') attendance: string,
    @Body('signature') signature?: string,
  ) {
    return {
      code: 0,
      data: await this.service.updateParticipantAttendance(+participantId, attendance, signature),
      message: 'success',
    }
  }

  @Delete('participants/:participantId')
  async removeParticipant(@Param('participantId') participantId: string) {
    return {
      code: 0,
      data: await this.service.removeParticipant(+participantId),
      message: 'success',
    }
  }

  // Complete Review
  @Put(':id/complete')
  async completeReview(
    @Param('id') id: string,
    @Body() body: { status: string; conclusion?: string; followUpActions?: string },
  ) {
    return {
      code: 0,
      data: await this.service.completeReview(+id, body),
      message: 'success',
    }
  }

  // Generate Template
  @Get('template/:gateType')
  async generateTemplate(@Param('gateType') gateType: string) {
    return {
      code: 0,
      data: await this.service.generateTemplate(gateType),
      message: 'success',
    }
  }
}
