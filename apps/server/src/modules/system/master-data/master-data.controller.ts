import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { MasterDataService } from './master-data.service'
import { PaginationDto } from '../../../common/dto/pagination.dto'

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
