import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { DefinitionService } from './definition.service'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('工作流定义')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('workflows/definitions')
export class DefinitionController {
  constructor(private readonly service: DefinitionService) {}

  @Get()
  @ApiOperation({ summary: '流程定义列表' })
  async findAll(@Query('bizType') bizType?: string, @Query('status') status?: string) {
    return this.service.findAll(bizType, status)
  }

  @Get(':id')
  @ApiOperation({ summary: '流程定义详情' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(+id)
  }

  @Post()
  @ApiOperation({ summary: '创建流程定义' })
  async create(@Body() body: any, @CurrentUser('userId') userId: number) {
    return this.service.create({ ...body, createdById: userId })
  }

  @Put(':id')
  @ApiOperation({ summary: '更新流程定义' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body)
  }

  @Put(':id/activate')
  @ApiOperation({ summary: '激活流程定义' })
  async activate(@Param('id') id: string) {
    return this.service.activate(+id)
  }

  @Put(':id/deprecate')
  @ApiOperation({ summary: '废弃流程定义' })
  async deprecate(@Param('id') id: string) {
    return this.service.deprecate(+id)
  }
}
