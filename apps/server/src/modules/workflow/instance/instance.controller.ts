import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { InstanceService } from './instance.service'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('工作流实例')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('workflows/instances')
export class InstanceController {
  constructor(private readonly service: InstanceService) {}

  @Post('start')
  @ApiOperation({ summary: '发起流程' })
  async start(@Body() body: any, @CurrentUser('userId') userId: number) {
    return this.service.startFlow({ ...body, initiatorId: userId })
  }

  @Post(':nodeInstanceId/approve')
  @ApiOperation({ summary: '审批通过' })
  async approve(
    @Param('nodeInstanceId') nodeInstanceId: string,
    @Body() body: { opinion?: string },
    @CurrentUser('userId') userId: number,
  ) {
    return this.service.approve(+nodeInstanceId, userId, body.opinion)
  }

  @Post(':nodeInstanceId/reject')
  @ApiOperation({ summary: '审批驳回' })
  async reject(
    @Param('nodeInstanceId') nodeInstanceId: string,
    @Body() body: { opinion?: string },
    @CurrentUser('userId') userId: number,
  ) {
    return this.service.reject(+nodeInstanceId, userId, body.opinion)
  }

  @Post(':instanceId/rollback')
  @ApiOperation({ summary: '回退流程' })
  async rollback(
    @Param('instanceId') instanceId: string,
    @Body() body: { targetNodeKey: string; reason?: string },
    @CurrentUser('userId') userId: number,
  ) {
    return this.service.rollback(+instanceId, body.targetNodeKey, userId, body.reason)
  }

  @Get('my-pending')
  @ApiOperation({ summary: '我的待办' })
  async getMyPending(@CurrentUser('userId') userId: number) {
    return this.service.getMyPendingTasks(userId)
  }

  @Get('my-initiated')
  @ApiOperation({ summary: '我发起的流程' })
  async getMyInitiated(
    @CurrentUser('userId') userId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.service.getInitiatedFlows(userId, page || 1, pageSize || 20)
  }

  @Get(':id')
  @ApiOperation({ summary: '流程实例详情' })
  async getDetail(@Param('id') id: string) {
    return this.service.getInstanceDetail(+id)
  }
}
