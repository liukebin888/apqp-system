import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Auto-numbering ====================

  async generateTaraNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `TARA${d}`
    const c = await this.prisma.secTara.count({ where: { taraNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  async generateCyberReqNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `SCR${d}`
    const c = await this.prisma.secCyberRequirement.count({ where: { reqNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  async generateVulnNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const p = `VUL${d}`
    const c = await this.prisma.secVulnerability.count({ where: { vulnNo: { startsWith: p } } })
    return `${p}${String(c+1).padStart(4,'0')}`
  }

  // ==================== SecTara ====================

  async findAllTaras(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.riskLevel) where.riskLevel = params.riskLevel
    const [items, total] = await Promise.all([
      this.prisma.secTara.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.secTara.count({ where }),
    ])
    return { items, total }
  }

  async findOneTara(id: number) {
    const item = await this.prisma.secTara.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`TARA ${id} not found`)
    return item
  }

  async createTara(data: any, userId: number) {
    return this.prisma.secTara.create({
      data: {
        ...data,
        projectId: +data.projectId,
        taraNo: await this.generateTaraNo(),
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateTara(id: number, data: any) {
    const existing = await this.prisma.secTara.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`TARA ${id} not found`)
    return this.prisma.secTara.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteTara(id: number) {
    await this.prisma.secTara.delete({ where: { id } })
    return { success: true }
  }

  // ==================== SecCyberRequirement ====================

  async findAllCyberReqs(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    const [items, total] = await Promise.all([
      this.prisma.secCyberRequirement.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.secCyberRequirement.count({ where }),
    ])
    return { items, total }
  }

  async findOneCyberReq(id: number) {
    const item = await this.prisma.secCyberRequirement.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Cyber Requirement ${id} not found`)
    return item
  }

  async createCyberReq(data: any, userId: number) {
    return this.prisma.secCyberRequirement.create({
      data: {
        ...data,
        projectId: +data.projectId,
        reqNo: await this.generateCyberReqNo(),
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateCyberReq(id: number, data: any) {
    const existing = await this.prisma.secCyberRequirement.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Cyber Requirement ${id} not found`)
    return this.prisma.secCyberRequirement.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteCyberReq(id: number) {
    await this.prisma.secCyberRequirement.delete({ where: { id } })
    return { success: true }
  }

  // ==================== SecVulnerability ====================

  async findAllVulns(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.severity) where.severity = params.severity
    const [items, total] = await Promise.all([
      this.prisma.secVulnerability.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.secVulnerability.count({ where }),
    ])
    return { items, total }
  }

  async findOneVuln(id: number) {
    const item = await this.prisma.secVulnerability.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Vulnerability ${id} not found`)
    return item
  }

  async createVuln(data: any, userId: number) {
    return this.prisma.secVulnerability.create({
      data: {
        ...data,
        projectId: +data.projectId,
        vulnNo: await this.generateVulnNo(),
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateVuln(id: number, data: any) {
    const existing = await this.prisma.secVulnerability.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Vulnerability ${id} not found`)
    return this.prisma.secVulnerability.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteVuln(id: number) {
    await this.prisma.secVulnerability.delete({ where: { id } })
    return { success: true }
  }

  // ==================== SecCsmsCompliance ====================

  async findAllCsms(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    if (params.status) where.status = params.status
    const [items, total] = await Promise.all([
      this.prisma.secCsmsCompliance.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.secCsmsCompliance.count({ where }),
    ])
    return { items, total }
  }

  async findOneCsms(id: number) {
    const item = await this.prisma.secCsmsCompliance.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`CSMS Compliance ${id} not found`)
    return item
  }

  async createCsms(data: any, userId: number) {
    return this.prisma.secCsmsCompliance.create({
      data: {
        ...data,
        projectId: +data.projectId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateCsms(id: number, data: any) {
    const existing = await this.prisma.secCsmsCompliance.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`CSMS Compliance ${id} not found`)
    return this.prisma.secCsmsCompliance.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteCsms(id: number) {
    await this.prisma.secCsmsCompliance.delete({ where: { id } })
    return { success: true }
  }

  // ==================== SecSupplyChain ====================

  async findAllSupplyChains(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = +params.projectId
    const [items, total] = await Promise.all([
      this.prisma.secSupplyChain.findMany({
        where, include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0, take: params.take || 50,
      }),
      this.prisma.secSupplyChain.count({ where }),
    ])
    return { items, total }
  }

  async findOneSupplyChain(id: number) {
    const item = await this.prisma.secSupplyChain.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`Supply Chain ${id} not found`)
    return item
  }

  async createSupplyChain(data: any, userId: number) {
    return this.prisma.secSupplyChain.create({
      data: {
        ...data,
        projectId: +data.projectId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateSupplyChain(id: number, data: any) {
    const existing = await this.prisma.secSupplyChain.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Supply Chain ${id} not found`)
    return this.prisma.secSupplyChain.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteSupplyChain(id: number) {
    await this.prisma.secSupplyChain.delete({ where: { id } })
    return { success: true }
  }
}
