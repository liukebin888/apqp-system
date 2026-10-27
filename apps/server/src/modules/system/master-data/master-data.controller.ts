import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { Response } from 'express'
import { MasterDataService } from './master-data.service'
import { PaginationDto } from '../../../common/dto/pagination.dto'
import { generateCsv, sendCsv } from '../../../common/utils/csv.util'

@ApiTags('主数据管理')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('master-data')
export class MasterDataController {
  constructor(private readonly service: MasterDataService) {}

  // ---- Customers ----
  @Get('customers')
  @ApiOperation({ summary: '客户列表' })
  async getCustomers(@Query() query: PaginationDto, @Query('keyword') keyword?: string) {
    return this.service.getCustomers({ ...query, keyword })
  }

  @Post('customers')
  @ApiOperation({ summary: '创建客户' })
  async createCustomer(@Body() body: any) {
    return this.service.createCustomer(body)
  }

  @Put('customers/:id')
  @ApiOperation({ summary: '更新客户' })
  async updateCustomer(@Param('id') id: string, @Body() body: any) {
    return this.service.updateCustomer(+id, body)
  }

  @Delete('customers/:id')
  @ApiOperation({ summary: '删除客户' })
  async deleteCustomer(@Param('id') id: string) {
    return this.service.deleteCustomer(+id)
  }

  // ---- Products ----
  @Get('products')
  @ApiOperation({ summary: '产品列表' })
  async getProducts(
    @Query() query: PaginationDto,
    @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: number,
  ) {
    return this.service.getProducts({ ...query, keyword, categoryId })
  }

  @Post('products')
  @ApiOperation({ summary: '创建产品' })
  async createProduct(@Body() body: any) {
    return this.service.createProduct(body)
  }

  @Put('products/:id')
  @ApiOperation({ summary: '更新产品' })
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.service.updateProduct(+id, body)
  }

  @Delete('products/:id')
  @ApiOperation({ summary: '删除产品' })
  async deleteProduct(@Param('id') id: string) {
    return this.service.deleteProduct(+id)
  }

  // ---- Suppliers ----
  @Get('suppliers')
  @ApiOperation({ summary: '供应商列表' })
  async getSuppliers(@Query() query: PaginationDto, @Query('keyword') keyword?: string) {
    return this.service.getSuppliers({ ...query, keyword })
  }

  @Get('suppliers/export')
  @ApiOperation({ summary: '导出供应商CSV' })
  async exportSuppliers(@Res() res: Response, @Query('keyword') keyword?: string) {
    const result = await this.service.getSuppliers({ page: 1, pageSize: 10000, keyword } as any)
    const list = (result as any)?.list || []
    const headers = ['供应商名称', '联系人', '电话', '邮箱', '地址', '等级', '状态']
    const rows = list.map((s: any) => [s.name, s.contact, s.phone, s.email, s.address, s.level, s.status])
    sendCsv(res, `suppliers_${Date.now()}.csv`, generateCsv(headers, rows))
  }

  @Get('customers/export')
  @ApiOperation({ summary: '导出客户CSV' })
  async exportCustomers(@Res() res: Response, @Query('keyword') keyword?: string) {
    const result = await this.service.getCustomers({ page: 1, pageSize: 10000, keyword } as any)
    const list = (result as any)?.list || []
    const headers = ['客户名称', '联系人', '电话', '邮箱', '地址', '行业']
    const rows = list.map((c: any) => [c.name, c.contact, c.phone, c.email, c.address, c.industry])
    sendCsv(res, `customers_${Date.now()}.csv`, generateCsv(headers, rows))
  }

  @Post('suppliers')
  @ApiOperation({ summary: '创建供应商' })
  async createSupplier(@Body() body: any) {
    return this.service.createSupplier(body)
  }

  @Put('suppliers/:id')
  @ApiOperation({ summary: '更新供应商' })
  async updateSupplier(@Param('id') id: string, @Body() body: any) {
    return this.service.updateSupplier(+id, body)
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: '删除供应商' })
  async deleteSupplier(@Param('id') id: string) {
    return this.service.deleteSupplier(+id)
  }

  // ---- Product Categories ----
  @Get('product-categories')
  @ApiOperation({ summary: '产品分类树' })
  async getProductCategories() {
    return this.service.getProductCategories()
  }
}
