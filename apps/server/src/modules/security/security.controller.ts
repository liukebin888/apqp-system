import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { SecurityService } from './security.service'

@Controller('security')
@UseGuards(AuthGuard('jwt'))
export class SecurityController {
  constructor(private readonly service: SecurityService) {}

  // ==================== TARA ====================

  @Get('tara')
  async findAllTaras(
    @Query('projectId') projectId?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllTaras({
        projectId, riskLevel,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('tara/:id')
  async findOneTara(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneTara(+id),
      message: 'success',
    }
  }

  @Post('tara')
  async createTara(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createTara(body, userId),
      message: 'success',
    }
  }

  @Put('tara/:id')
  async updateTara(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateTara(+id, body),
      message: 'success',
    }
  }

  @Delete('tara/:id')
  async deleteTara(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteTara(+id),
      message: 'success',
    }
  }

  // ==================== Cyber Requirements ====================

  @Get('cyber-requirements')
  async findAllCyberReqs(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllCyberReqs({
        projectId, status,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('cyber-requirements/:id')
  async findOneCyberReq(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneCyberReq(+id),
      message: 'success',
    }
  }

  @Post('cyber-requirements')
  async createCyberReq(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createCyberReq(body, userId),
      message: 'success',
    }
  }

  @Put('cyber-requirements/:id')
  async updateCyberReq(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateCyberReq(+id, body),
      message: 'success',
    }
  }

  @Delete('cyber-requirements/:id')
  async deleteCyberReq(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteCyberReq(+id),
      message: 'success',
    }
  }

  // ==================== Vulnerabilities ====================

  @Get('vulnerabilities')
  async findAllVulns(
    @Query('projectId') projectId?: string,
    @Query('severity') severity?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllVulns({
        projectId, severity,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('vulnerabilities/:id')
  async findOneVuln(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneVuln(+id),
      message: 'success',
    }
  }

  @Post('vulnerabilities')
  async createVuln(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createVuln(body, userId),
      message: 'success',
    }
  }

  @Put('vulnerabilities/:id')
  async updateVuln(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateVuln(+id, body),
      message: 'success',
    }
  }

  @Delete('vulnerabilities/:id')
  async deleteVuln(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteVuln(+id),
      message: 'success',
    }
  }

  // ==================== CSMS Compliance ====================

  @Get('csms')
  async findAllCsms(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllCsms({
        projectId, status,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('csms/:id')
  async findOneCsms(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneCsms(+id),
      message: 'success',
    }
  }

  @Post('csms')
  async createCsms(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createCsms(body, userId),
      message: 'success',
    }
  }

  @Put('csms/:id')
  async updateCsms(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateCsms(+id, body),
      message: 'success',
    }
  }

  @Delete('csms/:id')
  async deleteCsms(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteCsms(+id),
      message: 'success',
    }
  }

  // ==================== Supply Chains ====================

  @Get('supply-chains')
  async findAllSupplyChains(
    @Query('projectId') projectId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return {
      code: 0,
      data: await this.service.findAllSupplyChains({
        projectId,
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
      }),
      message: 'success',
    }
  }

  @Get('supply-chains/:id')
  async findOneSupplyChain(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.findOneSupplyChain(+id),
      message: 'success',
    }
  }

  @Post('supply-chains')
  async createSupplyChain(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || 1
    return {
      code: 0,
      data: await this.service.createSupplyChain(body, userId),
      message: 'success',
    }
  }

  @Put('supply-chains/:id')
  async updateSupplyChain(@Param('id') id: string, @Body() body: any) {
    return {
      code: 0,
      data: await this.service.updateSupplyChain(+id, body),
      message: 'success',
    }
  }

  @Delete('supply-chains/:id')
  async deleteSupplyChain(@Param('id') id: string) {
    return {
      code: 0,
      data: await this.service.deleteSupplyChain(+id),
      message: 'success',
    }
  }
}
