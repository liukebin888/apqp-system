import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { UserService } from './user.service'
import { PaginationDto } from '../../../common/dto/pagination.dto'

@ApiTags('用户管理')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  @ApiOperation({ summary: '用户列表' })
  async findAll(
    @Query() query: PaginationDto,
    @Query('keyword') keyword?: string,
    @Query('departmentId') departmentId?: number,
    @Query('status') status?: number,
  ) {
    return this.service.findAll({ ...query, keyword, departmentId, status })
  }

  @Get(':id')
  @ApiOperation({ summary: '用户详情' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(+id)
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  async create(@Body() body: any) {
    return this.service.create(body)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  async delete(@Param('id') id: string) {
    return this.service.delete(+id)
  }

  @Put(':id/reset-password')
  @ApiOperation({ summary: '重置密码' })
  async resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
    return this.service.resetPassword(+id, body.newPassword)
  }
}
