import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../common/services/prisma.service'
import { PaginationDto } from '../../../common/dto/pagination.dto'

@Injectable()
export class MasterDataService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Customers ----
  async getCustomers(query: PaginationDto & { keyword?: string }) {
    const where: any = {}
    if (query.keyword) {
      where.OR = [
        { customerCode: { contains: query.keyword } },
        { customerName: { contains: query.keyword } },
      ]
    }
    const skip = (query.page - 1) * query.pageSize
    const take = query.pageSize
    const [list, total] = await Promise.all([
      this.prisma.mdCustomer.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.mdCustomer.count({ where }),
    ])
    return { list, total, page: query.page, pageSize: query.pageSize }
  }

  async createCustomer(data: any) {
    return this.prisma.mdCustomer.create({ data })
  }

  async updateCustomer(id: number, data: any) {
    const customer = await this.prisma.mdCustomer.findUnique({ where: { id } })
    if (!customer) throw new NotFoundException('客户不存在')
    return this.prisma.mdCustomer.update({ where: { id }, data })
  }

  async deleteCustomer(id: number) {
    await this.prisma.mdCustomer.delete({ where: { id } })
    return { message: '删除成功' }
  }

  // ---- Products ----
  async getProducts(query: PaginationDto & { keyword?: string; categoryId?: number }) {
    const where: any = {}
    if (query.keyword) {
      where.OR = [
        { productCode: { contains: query.keyword } },
        { productName: { contains: query.keyword } },
      ]
    }
    if (query.categoryId) where.categoryId = query.categoryId
    const skip = (query.page - 1) * query.pageSize
    const take = query.pageSize
    const [list, total] = await Promise.all([
      this.prisma.mdProduct.findMany({
        where,
        include: { category: true, customer: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mdProduct.count({ where }),
    ])
    return { list, total, page: query.page, pageSize: query.pageSize }
  }

  async createProduct(data: any) {
    return this.prisma.mdProduct.create({ data })
  }

  async updateProduct(id: number, data: any) {
    return this.prisma.mdProduct.update({ where: { id }, data })
  }

  async deleteProduct(id: number) {
    await this.prisma.mdProduct.delete({ where: { id } })
    return { message: '删除成功' }
  }

  // ---- Suppliers ----
  async getSuppliers(query: PaginationDto & { keyword?: string }) {
    const where: any = {}
    if (query.keyword) {
      where.OR = [
        { supplierCode: { contains: query.keyword } },
        { supplierName: { contains: query.keyword } },
      ]
    }
    const skip = (query.page - 1) * query.pageSize
    const take = query.pageSize
    const [list, total] = await Promise.all([
      this.prisma.mdSupplier.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.mdSupplier.count({ where }),
    ])
    return { list, total, page: query.page, pageSize: query.pageSize }
  }

  async createSupplier(data: any) {
    return this.prisma.mdSupplier.create({ data })
  }

  async updateSupplier(id: number, data: any) {
    return this.prisma.mdSupplier.update({ where: { id }, data })
  }

  async deleteSupplier(id: number) {
    await this.prisma.mdSupplier.delete({ where: { id } })
    return { message: '删除成功' }
  }

  // ---- Product Categories ----
  async getProductCategories() {
    return this.prisma.mdProductCategory.findMany({
      include: { children: true },
      where: { parentId: null },
    })
  }
}
