import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../common/services/prisma.service'

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getTree() {
    const departments = await this.prisma.sysDepartment.findMany({
      include: { children: true },
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
    })
    return departments
  }

  async getAll() {
    return this.prisma.sysDepartment.findMany({
      include: { parent: true, leader: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async create(data: { name: string; code: string; parentId?: number; sortOrder?: number; leaderId?: number }) {
    return this.prisma.sysDepartment.create({ data })
  }

  async update(id: number, data: Partial<{ name: string; code: string; parentId: number; sortOrder: number; leaderId: number; status: number }>) {
    return this.prisma.sysDepartment.update({ where: { id }, data })
  }

  async delete(id: number) {
    const children = await this.prisma.sysDepartment.count({ where: { parentId: id } })
    if (children > 0) throw new Error('该部门下有子部门，无法删除')
    const users = await this.prisma.sysUser.count({ where: { departmentId: id } })
    if (users > 0) throw new Error('该部门下有用户，无法删除')
    return this.prisma.sysDepartment.delete({ where: { id } })
  }
}
