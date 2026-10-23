import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../../../common/services/prisma.service'
import { PaginationDto } from '../../../common/dto/pagination.dto'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto & { keyword?: string; departmentId?: number; status?: number }) {
    const where: any = {}
    if (query.keyword) {
      where.OR = [
        { username: { contains: query.keyword } },
        { realName: { contains: query.keyword } },
        { email: { contains: query.keyword } },
      ]
    }
    if (query.departmentId) where.departmentId = query.departmentId
    if (query.status !== undefined) where.status = query.status

    const skip = (query.page - 1) * query.pageSize
    const take = query.pageSize

    const [list, total] = await Promise.all([
      this.prisma.sysUser.findMany({
        where,
        select: {
          id: true,
          username: true,
          realName: true,
          email: true,
          phone: true,
          avatar: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          department: { select: { id: true, name: true } },
          position: { select: { id: true, name: true } },
          userRoles: { select: { role: { select: { id: true, code: true, name: true } } } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysUser.count({ where }),
    ])

    return { list, total, page: query.page, pageSize: query.pageSize }
  }

  async findOne(id: number) {
    const user = await this.prisma.sysUser.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        userRoles: { include: { role: true } },
      },
    })
    if (!user) throw new NotFoundException('用户不存在')
    return user
  }

  async create(data: {
    username: string
    password: string
    realName: string
    email?: string
    phone?: string
    departmentId?: number
    positionId?: number
    roleIds?: number[]
  }) {
    const existing = await this.prisma.sysUser.findUnique({ where: { username: data.username } })
    if (existing) throw new ConflictException('用户名已存在')

    const passwordHash = await bcrypt.hash(data.password, 10)
    const { roleIds, ...userData } = data

    const user = await this.prisma.sysUser.create({
      data: {
        ...userData,
        passwordHash,
        userRoles: roleIds?.length ? { create: roleIds.map((roleId) => ({ roleId })) } : undefined,
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        userRoles: { select: { role: { select: { id: true, code: true, name: true } } } },
      },
    })

    return user
  }

  async update(id: number, data: {
    realName?: string
    email?: string
    phone?: string
    departmentId?: number
    positionId?: number
    status?: number
    roleIds?: number[]
  }) {
    const user = await this.prisma.sysUser.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('用户不存在')

    const { roleIds, ...userData } = data

    if (roleIds !== undefined) {
      await this.prisma.sysUserRole.deleteMany({ where: { userId: id } })
      if (roleIds.length > 0) {
        await this.prisma.sysUserRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
        })
      }
    }

    return this.prisma.sysUser.update({
      where: { id },
      data: userData,
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        userRoles: { select: { role: { select: { id: true, code: true, name: true } } } },
      },
    })
  }

  async delete(id: number) {
    await this.prisma.sysUser.delete({ where: { id } })
    return { message: '删除成功' }
  }

  async resetPassword(id: number, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await this.prisma.sysUser.update({ where: { id }, data: { passwordHash } })
    return { message: '密码重置成功' }
  }
}
