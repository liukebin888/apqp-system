import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { SecurityAuditService } from './security-audit.service'

@Controller('security-audits')
@UseGuards(AuthGuard('jwt'))
export class SecurityAuditController {
  constructor(private readonly service: SecurityAuditService) {}

  // ==================== ComplianceReport (must be before :id) ====================

  @Get('reports')
  async findAllReports(
    @Query('reportType') reportType?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllReports({
        reportType, status,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('reports/:id')
  async findOneReport(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneReport(+id),
      message: 'success',
    }
  }

  @Post('reports')
  async createReport(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createReport(body, userId),
      message: 'success',
    }
  }

  @Put('reports/:id')
  async updateReport(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateReport(+id, body),
      message: 'success',
    }
  }

  @Delete('reports/:id')
  async deleteReport(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteReport(+id),
      message: 'success',
    }
  }

  // ==================== SecAudit ====================

  @Get()
  async findAllAudits(
    @Query('auditType') auditType?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllAudits({
        auditType, status,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get(':id')
  async findOneAudit(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneAudit(+id),
      message: 'success',
    }
  }

  @Post()
  async createAudit(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createAudit(body, userId),
      message: 'success',
    }
  }

  @Put(':id')
  async updateAudit(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateAudit(+id, body),
      message: 'success',
    }
  }

  @Delete(':id')
  async deleteAudit(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteAudit(+id),
      message: 'success',
    }
  }
}
