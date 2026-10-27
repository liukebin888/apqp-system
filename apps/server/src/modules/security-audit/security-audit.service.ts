import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Auto-numbering ====================

  async generateAuditNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const p = `SA${d}`
    const c = await this.prisma.secAudit.count({ where: { auditNo: { startsWith: p } } })
    return `${p}${String(c + 1).padStart(4, '0')}`
  }

  async generateReportNo(): Promise<string> {
    const now = new Date()
    const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const p = `CR${d}`
    const c = await this.prisma.complianceReport.count({ where: { reportNo: { startsWith: p } } })
    return `${p}${String(c + 1).padStart(4, '0')}`
  }

  // ==================== SecAudit CRUD ====================

  async findAllAudits(params: any) {
    const where: any = {}
    if (params.auditType) where.auditType = params.auditType
    if (params.status) where.status = params.status
    const [items, total] = await Promise.all([
      this.prisma.secAudit.findMany({
        where,
        include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      this.prisma.secAudit.count({ where }),
    ])
    return { items, total }
  }

  async findOneAudit(id: number) {
    const item = await this.prisma.secAudit.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`SecAudit ${id} not found`)
    return item
  }

  async createAudit(data: any, userId: number) {
    return this.prisma.secAudit.create({
      data: {
        ...data,
        auditNo: await this.generateAuditNo(),
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateAudit(id: number, data: any) {
    const existing = await this.prisma.secAudit.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`SecAudit ${id} not found`)
    return this.prisma.secAudit.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteAudit(id: number) {
    await this.prisma.secAudit.delete({ where: { id } })
    return { success: true }
  }

  // ==================== ComplianceReport CRUD ====================

  async findAllReports(params: any) {
    const where: any = {}
    if (params.reportType) where.reportType = params.reportType
    if (params.status) where.status = params.status
    const [items, total] = await Promise.all([
      this.prisma.complianceReport.findMany({
        where,
        include: { createdBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      this.prisma.complianceReport.count({ where }),
    ])
    return { items, total }
  }

  async findOneReport(id: number) {
    const item = await this.prisma.complianceReport.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
    if (!item) throw new NotFoundException(`ComplianceReport ${id} not found`)
    return item
  }

  async createReport(data: any, userId: number) {
    return this.prisma.complianceReport.create({
      data: {
        ...data,
        reportNo: await this.generateReportNo(),
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async updateReport(id: number, data: any) {
    const existing = await this.prisma.complianceReport.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`ComplianceReport ${id} not found`)
    return this.prisma.complianceReport.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async deleteReport(id: number) {
    await this.prisma.complianceReport.delete({ where: { id } })
    return { success: true }
  }
}
