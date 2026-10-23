import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: number; type: string; title: string; content?: string; bizType?: string; bizId?: number }) {
    return this.prisma.msgNotification.create({ data })
  }

  async notifyRole(roleCode: string, data: { type: string; title: string; content?: string; bizType?: string; bizId?: number }) {
    const userRoles = await this.prisma.sysUserRole.findMany({
      where: { role: { code: roleCode } },
      select: { userId: true },
    })

    const notifications = userRoles.map((ur) => ({
      userId: ur.userId,
      ...data,
    }))

    if (notifications.length > 0) {
      await this.prisma.msgNotification.createMany({ data: notifications })
    }
  }

  async getMyNotifications(userId: number, page: number = 1, pageSize: number = 20, isRead?: boolean) {
    const where: any = { userId }
    if (isRead !== undefined) where.isRead = isRead

    const [list, total] = await Promise.all([
      this.prisma.msgNotification.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.msgNotification.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  async getUnreadCount(userId: number) {
    return this.prisma.msgNotification.count({ where: { userId, isRead: false } })
  }

  async markAsRead(ids: number[], userId: number) {
    await this.prisma.msgNotification.updateMany({
      where: { id: { in: ids }, userId },
      data: { isRead: true },
    })
    return { message: '已标记为已读' }
  }

  async markAllAsRead(userId: number) {
    await this.prisma.msgNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
    return { message: '全部已读' }
  }
}
