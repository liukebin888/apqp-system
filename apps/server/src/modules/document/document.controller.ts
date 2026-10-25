import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseInterceptors, UploadedFile, Req, Res, StreamableFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { DocumentService } from './document.service'

@Controller('documents')
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  @Get()
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('bizType') bizType?: string,
    @Query('docType') docType?: string,
    @Query('status') status?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAll({
        projectId: projectId ? +projectId : undefined,
        bizType,
        docType,
        status,
      }),
      message: 'success',
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { code: 0, data: await this.service.findOne(+id), message: 'success' }
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.create({ ...body, uploadedById: userId }),
      message: 'success',
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.service.update(+id, body), message: 'success' }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return { code: 0, data: await this.service.delete(+id), message: 'success' }
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.uploadFile(+id, file, userId),
      message: 'success',
    }
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 1
    return { code: 0, data: await this.service.approve(+id, userId), message: 'success' }
  }

  @Put(':id/release')
  async release(@Param('id') id: string) {
    return { code: 0, data: await this.service.release(+id), message: 'success' }
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: any) {
    const file = await this.service.downloadFile(+id)
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.filename)}"`,
      'Content-Length': file.buffer.length,
    })
    res.send(file.buffer)
  }

  @Put(':id/permissions')
  async setPermissions(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.setPermissions(+id, body.permissions || []),
      message: 'success',
    }
  }
}
