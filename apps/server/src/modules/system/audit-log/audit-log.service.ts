import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../common/services/prisma.service'
import { PaginationDto } from '../../../common/dto/pagination.dto'

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto & { module?: string; userId?: number; action?: string; startDate?: string; endDate?: string }) {
    const where: any = {}
    if (query.module) where.module = query.module
    if (query.userId) where.userId = query.userId
    if (query.action) where.action = query.action
    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) where.createdAt.gte = new Date(query.startDate)
      if (query.endDate) where.createdAt.lte = new Date(query.endDate)
    }

    const skip = (query.page - 1) * query.pageSize
    const take = query.pageSize

    const [list, total] = await Promise.all([
      this.prisma.sysAuditLog.findMany({
        where,
        include: { user: { select: { id: true, realName: true, username: true } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysAuditLog.count({ where }),
    ])

    return { list, total, page: query.page, pageSize: query.pageSize }
  }
}
