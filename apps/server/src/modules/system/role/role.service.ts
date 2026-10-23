import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../common/services/prisma.service'

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sysRole.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
      orderBy: { id: 'asc' },
    })
  }

  async findOne(id: number) {
    const role = await this.prisma.sysRole.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    })
    if (!role) throw new NotFoundException('角色不存在')
    return role
  }

  async create(data: { code: string; name: string; description?: string; permissionIds?: number[] }) {
    const { permissionIds, ...roleData } = data
    return this.prisma.sysRole.create({
      data: {
        ...roleData,
        rolePermissions: permissionIds?.length
          ? { create: permissionIds.map((permissionId) => ({ permissionId })) }
          : undefined,
      },
    })
  }

  async update(id: number, data: { name?: string; description?: string; permissionIds?: number[] }) {
    const role = await this.prisma.sysRole.findUnique({ where: { id } })
    if (!role) throw new NotFoundException('角色不存在')
    if (role.isSystem) throw new Error('系统内置角色不可修改')

    const { permissionIds, ...roleData } = data

    if (permissionIds !== undefined) {
      await this.prisma.sysRolePermission.deleteMany({ where: { roleId: id } })
      if (permissionIds.length > 0) {
        await this.prisma.sysRolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
        })
      }
    }

    return this.prisma.sysRole.update({ where: { id }, data: roleData })
  }

  async delete(id: number) {
    const role = await this.prisma.sysRole.findUnique({ where: { id } })
    if (!role) throw new NotFoundException('角色不存在')
    if (role.isSystem) throw new Error('系统内置角色不可删除')

    const userCount = await this.prisma.sysUserRole.count({ where: { roleId: id } })
    if (userCount > 0) throw new Error('该角色下有关联用户，无法删除')

    await this.prisma.sysRolePermission.deleteMany({ where: { roleId: id } })
    await this.prisma.sysRole.delete({ where: { id } })
    return { message: '删除成功' }
  }

  async getAllPermissions() {
    return this.prisma.sysPermission.findMany({ orderBy: { module: 'asc' } })
  }
}
