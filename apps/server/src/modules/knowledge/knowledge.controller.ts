import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { KnowledgeService } from './knowledge.service'

@Controller('knowledge')
@UseGuards(AuthGuard('jwt'))
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  // ==================== Lessons ====================

  @Get('lessons')
  async findAllLessons(
    @Query('category') category?: string,
    @Query('projectId') projectId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllLessons({
        category, projectId,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('lessons/:id')
  async findOneLesson(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneLesson(+id),
      message: 'success',
    }
  }

  @Post('lessons')
  async createLesson(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createLesson(body, userId),
      message: 'success',
    }
  }

  @Put('lessons/:id')
  async updateLesson(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateLesson(+id, body),
      message: 'success',
    }
  }

  @Delete('lessons/:id')
  async deleteLesson(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteLesson(+id),
      message: 'success',
    }
  }

  // ==================== Templates ====================

  @Get('templates')
  async findAllTemplates(
    @Query('category') category?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllTemplates({
        category,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('templates/:id')
  async findOneTemplate(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneTemplate(+id),
      message: 'success',
    }
  }

  @Post('templates')
  async createTemplate(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createTemplate(body, userId),
      message: 'success',
    }
  }

  @Put('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateTemplate(+id, body),
      message: 'success',
    }
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteTemplate(+id),
      message: 'success',
    }
  }

  // ==================== Checklists ====================

  @Get('checklists')
  async findAllChecklists(
    @Query('category') category?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllChecklists({
        category,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('checklists/:id')
  async findOneChecklist(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneChecklist(+id),
      message: 'success',
    }
  }

  @Post('checklists')
  async createChecklist(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createChecklist(body, userId),
      message: 'success',
    }
  }

  @Put('checklists/:id')
  async updateChecklist(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateChecklist(+id, body),
      message: 'success',
    }
  }

  @Delete('checklists/:id')
  async deleteChecklist(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteChecklist(+id),
      message: 'success',
    }
  }
}
