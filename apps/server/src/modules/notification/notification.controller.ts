import { Controller, Get, Put, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { NotificationService } from './notification.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('通知中心')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '我的通知列表' })
  async getMyNotifications(
    @CurrentUser('userId') userId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('isRead') isRead?: boolean,
  ) {
    return this.service.getMyNotifications(userId, page || 1, pageSize || 20, isRead)
  }

  @Get('unread-count')
  @ApiOperation({ summary: '未读通知数量' })
  async getUnreadCount(@CurrentUser('userId') userId: number) {
    return { count: await this.service.getUnreadCount(userId) }
  }

  @Put('read')
  @ApiOperation({ summary: '标记为已读' })
  async markAsRead(@Body() body: { ids: number[] }, @CurrentUser('userId') userId: number) {
    return this.service.markAsRead(body.ids, userId)
  }

  @Put('read-all')
  @ApiOperation({ summary: '全部标记为已读' })
  async markAllAsRead(@CurrentUser('userId') userId: number) {
    return this.service.markAllAsRead(userId)
  }
}
