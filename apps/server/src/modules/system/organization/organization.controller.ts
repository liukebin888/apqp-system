import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { OrganizationService } from './organization.service'

@ApiTags('组织架构')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('departments')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get('tree')
  @ApiOperation({ summary: '获取部门树' })
  async getTree() {
    return this.service.getTree()
  }

  @Get()
  @ApiOperation({ summary: '获取所有部门' })
  async getAll() {
    return this.service.getAll()
  }

  @Post()
  @ApiOperation({ summary: '创建部门' })
  async create(@Body() body: any) {
    return this.service.create(body)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新部门' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除部门' })
  async delete(@Param('id') id: string) {
    await this.service.delete(+id)
    return { message: '删除成功' }
  }
}
