import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class GateReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { projectId?: number; gateType?: string; status?: string }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.gateType) where.gateType = params.gateType
    if (params.status) where.status = params.status

    return this.prisma.gateReview.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        chairperson: { select: { id: true, realName: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        participants: {
          include: { user: { select: { id: true, realName: true } } },
        },
      },
      orderBy: { plannedDate: 'desc' },
    })
  }

  async findOne(id: number) {
    const review = await this.prisma.gateReview.findUnique({
      where: { id },
      include: {
        project: true,
        chairperson: { select: { id: true, realName: true, email: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        participants: {
          include: { user: { select: { id: true, realName: true, email: true, department: true } } },
        },
      },
    })
    if (!review) throw new NotFoundException('Gate评审不存在')
    return review
  }

  async create(data: any, userId: number) {
    const project = await this.prisma.prjProject.findUnique({ where: { id: data.projectId } })
    if (!project) throw new NotFoundException('项目不存在')

    const gateNames: Record<string, string> = {
      G0: '立项评审',
      G1: 'P1→P2 评审',
      G2: 'P2→P3 评审',
      G3: 'P3→P4 评审',
      G4: 'P4→P5 评审',
      G5: '结项评审',
    }

    const { chairUserId, ...rest } = data
    return this.prisma.gateReview.create({
      data: {
        ...rest,
        chairpersonId: chairUserId || data.chairpersonId,
        gateName: gateNames[data.gateType] || data.gateType,
        createdById: userId,
      },
      include: {
        items: true,
        participants: true,
      },
    })
  }

  async update(id: number, data: any) {
    const review = await this.prisma.gateReview.findUnique({ where: { id } })
    if (!review) throw new NotFoundException('Gate评审不存在')
    return this.prisma.gateReview.update({
      where: { id },
      data,
      include: {
        items: true,
        participants: true,
      },
    })
  }

  async delete(id: number) {
    const review = await this.prisma.gateReview.findUnique({ where: { id } })
    if (!review) throw new NotFoundException('Gate评审不存在')
    await this.prisma.gateReview.delete({ where: { id } })
    return { message: '删除成功' }
  }

  // Review Items
  async addReviewItem(reviewId: number, data: any) {
    const review = await this.prisma.gateReview.findUnique({ where: { id: reviewId } })
    if (!review) throw new NotFoundException('Gate评审不存在')

    const maxOrder = await this.prisma.gateReviewItem.findFirst({
      where: { reviewId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    return this.prisma.gateReviewItem.create({
      data: {
        reviewId,
        ...data,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    })
  }

  async updateReviewItem(itemId: number, data: any) {
    return this.prisma.gateReviewItem.update({ where: { id: itemId }, data })
  }

  async deleteReviewItem(itemId: number) {
    await this.prisma.gateReviewItem.delete({ where: { id: itemId } })
    return { message: '删除成功' }
  }

  // Participants
  async addParticipant(reviewId: number, userId: number, role: string) {
    const review = await this.prisma.gateReview.findUnique({ where: { id: reviewId } })
    if (!review) throw new NotFoundException('Gate评审不存在')

    return this.prisma.gateReviewParticipant.create({
      data: {
        reviewId,
        userId,
        role,
        attendance: 'invited',
      },
    })
  }

  async updateParticipantAttendance(participantId: number, attendance: string, signature?: string) {
    return this.prisma.gateReviewParticipant.update({
      where: { id: participantId },
      data: {
        attendance,
        signature,
        signedAt: attendance === 'attended' ? new Date() : undefined,
      },
    })
  }

  async removeParticipant(participantId: number) {
    await this.prisma.gateReviewParticipant.delete({ where: { id: participantId } })
    return { message: '移除成功' }
  }

  // Complete Review
  async completeReview(id: number, data: { status: string; conclusion?: string; followUpActions?: string }) {
    const review = await this.prisma.gateReview.findUnique({ where: { id } })
    if (!review) throw new NotFoundException('Gate评审不存在')

    const validStatuses = ['passed', 'failed', 'cancelled']
    if (!validStatuses.includes(data.status)) {
      throw new BadRequestException('无效的状态值')
    }

    return this.prisma.gateReview.update({
      where: { id },
      data: {
        status: data.status,
        actualDate: new Date(),
        conclusion: data.conclusion,
        followUpActions: data.followUpActions,
      },
    })
  }

  // Generate Gate Review Template
  async generateTemplate(gateType: string) {
    const templates: Record<string, any[]> = {
      G0: [
        { category: 'document', itemName: '预立项定点通知', requirement: '必须提供客户定点通知书' },
        { category: 'document', itemName: '可行性分析报告', requirement: '四维评估完成' },
        { category: 'document', itemName: '技术方案', requirement: '技术方案已提交客户' },
        { category: 'document', itemName: '报价单', requirement: '报价已批准' },
        { category: 'process', itemName: '项目章程', requirement: '项目目标、范围、约束明确' },
      ],
      G1: [
        { category: 'document', itemName: '需求规格书', requirement: '需求冻结，变更走CR流程' },
        { category: 'document', itemName: '初始BOM', requirement: 'BOM清单完整' },
        { category: 'document', itemName: '项目主计划', requirement: 'WBS分解完成，关键路径明确' },
        { category: 'deliverable', itemName: '特殊特性清单', requirement: '关键特性识别完成' },
      ],
      G2: [
        { category: 'document', itemName: 'DFMEA', requirement: '设计失效模式分析完成' },
        { category: 'document', itemName: 'OTS样件报告', requirement: 'OTS认可通过' },
        { category: 'deliverable', itemName: '设计输出文件', requirement: '图纸、规范完整' },
      ],
      G3: [
        { category: 'document', itemName: 'PFMEA', requirement: '过程失效模式分析完成' },
        { category: 'document', itemName: '控制计划', requirement: '样件/试生产/量产CP完整' },
        { category: 'document', itemName: 'PV报告', requirement: '产品验证完成' },
        { category: 'process', itemName: '过程能力研究', requirement: 'Cpk/Ppk达标' },
      ],
      G4: [
        { category: 'document', itemName: 'PPAP文件包', requirement: 'PPAP checklist完整' },
        { category: 'document', itemName: 'PSW', requirement: '零件提交保证书签署' },
        { category: 'document', itemName: '试产报告', requirement: '试产问题闭环' },
      ],
      G5: [
        { category: 'document', itemName: '结项报告', requirement: '项目总结完整' },
        { category: 'document', itemName: '经验教训', requirement: '经验教训库更新' },
        { category: 'process', itemName: '归档完整性', requirement: '所有文档归档' },
      ],
    }

    return templates[gateType] || []
  }
}
