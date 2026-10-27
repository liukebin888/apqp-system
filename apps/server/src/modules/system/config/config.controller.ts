import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ConfigService } from './config.service'

@Controller('system/config')
@UseGuards(AuthGuard('jwt'))
export class ConfigController {
  constructor(private readonly service: ConfigService) {}

  @Get()
  async findAll() {
    return { code: 0, data: await this.service.findAll(), message: 'success' }
  }

  @Get(':key')
  async findOne(@Param('key') key: string) {
    return { code: 0, data: await this.service.findOne(key), message: 'success' }
  }

  @Put(':key')
  async upsert(
    @Param('key') key: string,
    @Body() body: { configValue: string; description?: string },
  ) {
    return { code: 0, data: await this.service.upsert(key, body), message: 'success' }
  }

  @Delete(':key')
  async delete(@Param('key') key: string) {
    return { code: 0, data: await this.service.delete(key), message: 'success' }
  }

  @Post('batch')
  async bulkUpsert(
    @Body() body: Array<{ configKey: string; configValue: string; description?: string }>,
  ) {
    return { code: 0, data: await this.service.bulkUpsert(body), message: 'success' }
  }
}
