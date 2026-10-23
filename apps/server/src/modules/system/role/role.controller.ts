import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { RoleService } from './role.service'

@ApiTags('角色管理')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('roles')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get()
  @ApiOperation({ summary: '角色列表' })
  async findAll() {
    return this.service.findAll()
  }

  @Get('permissions')
  @ApiOperation({ summary: '所有权限列表' })
  async getAllPermissions() {
    return this.service.getAllPermissions()
  }

  @Get(':id')
  @ApiOperation({ summary: '角色详情' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(+id)
  }

  @Post()
  @ApiOperation({ summary: '创建角色' })
  async create(@Body() body: any) {
    return this.service.create(body)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  async delete(@Param('id') id: string) {
    return this.service.delete(+id)
  }
}
