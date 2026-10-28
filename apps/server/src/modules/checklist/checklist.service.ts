import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByProject(projectId: number) {
    return this.prisma.apqpChecklist.findMany({
      where: { projectId },
      include: {
        createdBy: { select: { id: true, realName: true } },
        items: {
          include: {
            checkedBy: { select: { id: true, realName: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ phase: 'asc' }, { createdAt: 'asc' }],
    })
  }

  async findOne(id: number) {
    const checklist = await this.prisma.apqpChecklist.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, realName: true } },
        items: {
          include: {
            checkedBy: { select: { id: true, realName: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
    if (!checklist) throw new NotFoundException('检查表不存在')
    return checklist
  }

  async create(data: any, userId: number) {
    return this.prisma.apqpChecklist.create({
      data: {
        ...data,
        createdById: userId,
      },
    })
  }

  async instantiateFromTemplate(projectId: number, phase: string, templateItems: any[], userId: number) {
    const checklist = await this.prisma.apqpChecklist.create({
      data: {
        projectId,
        phase,
        name: `APQP 检查表 - ${phase}`,
        createdById: userId,
        items: {
          create: templateItems.map((item, idx) => ({
            sortOrder: idx + 1,
            checkDomain: item.domain || item.checkDomain,
            checkItem: item.item || item.checkItem,
            responsible: item.responsible,
          })),
        },
      },
      include: { items: true },
    })
    return checklist
  }

  async instantiateAllPhases(projectId: number, userId: number) {
    const templateByPhase: Record<string, any[]> = {
      phase1: [
        { domain: 'APQP', item: '客户需求与技术协议确认并评审', responsible: '项目经理' },
        { domain: 'APQP', item: '立项申请书完成：GRD/L 综合等级评定、三大里程碑时间确定', responsible: '项目经理' },
        { domain: '功能安全', item: 'HARA 完成并评审，ASIL 等级确定（P-FS1）', responsible: '功能安全经理' },
        { domain: '信息安全', item: '产品联网属性确认，TARA 初版完成（P-CS1）', responsible: '信息安全经理' },
        { domain: '外购外协', item: '自制/外购分析完成，外购外协清单及风险分级确定', responsible: '采购/SQE' },
        { domain: 'APQP', item: '项目里程碑计划（P1–P8+并行节点）编制并经评审发布', responsible: '项目经理' },
      ],
      phase2: [
        { domain: 'APQP', item: 'DFMEA 完成并经跨部门评审', responsible: '研发工程师' },
        { domain: 'APQP', item: '设计验证计划（DVP&R）已批准', responsible: '试验负责人' },
        { domain: '功能安全', item: '功能安全概念（FSC）与技术安全需求（TSR）完成', responsible: '功能安全经理' },
        { domain: '信息安全', item: '网络安全概念与 CS 需求完成', responsible: '信息安全经理' },
        { domain: 'ASPICE', item: 'SYS.2/SYS.3 过程域证据就绪', responsible: '系统工程师' },
        { domain: '外购外协', item: '关键外购外协件已定点，技术协议已签', responsible: 'SQE' },
        { domain: 'APQP', item: '工程发布（P2）：图纸/规范/BOM 冻结', responsible: '研发工程师' },
      ],
      phase3: [
        { domain: 'APQP', item: 'PFMEA 完成并经跨部门评审', responsible: '制造工程' },
        { domain: 'APQP', item: '控制计划（试生产版）已发布', responsible: '质量工程师' },
        { domain: '工装产线', item: '工装/夹具设计批准并制作完成（P-T1）', responsible: '工装/模具组' },
        { domain: '工装产线', item: '生产线改造方案确定，节拍与产能测算完成', responsible: '制造工程' },
        { domain: 'ASPICE', item: 'SWE.1–SWE.3 / HWE.1–3 过程域证据就绪', responsible: '软件/硬件经理' },
        { domain: '外购外协', item: '供应商 PFMEA/控制计划已评审确认', responsible: 'SQE' },
      ],
      phase4: [
        { domain: 'APQP', item: 'DV/PV 试验按计划完成并合格', responsible: '试验负责人' },
        { domain: '文档', item: '设计文档完成并归档，13A 文档齐套率 100%', responsible: '文档工程师' },
        { domain: 'APQP', item: '工装试制样件 100% 全尺寸/材质合格', responsible: '质量工程师' },
        { domain: 'APQP', item: 'OTS 认可完成', responsible: '质量经理' },
        { domain: '功能安全', item: '安全集成测试与安全确认评审通过', responsible: '功能安全经理' },
        { domain: '信息安全', item: '渗透测试/SBOM 完成，高危漏洞闭环', responsible: '信息安全经理' },
        { domain: 'ASPICE', item: 'ASPICE 内部评估通过', responsible: 'QA' },
      ],
      phase5: [
        { domain: 'APQP', item: '试生产节拍与产能满足合同要求', responsible: '制造部' },
        { domain: 'APQP', item: 'PPAP 提交并获客户批准', responsible: '质量/销售' },
        { domain: '功能安全', item: 'Safety Case 保持更新', responsible: '功能安全经理' },
        { domain: '信息安全', item: 'PSIRT 运营与漏洞监控响应机制上线', responsible: '运维负责人' },
        { domain: '外购外协', item: '供应商绩效评价建立', responsible: 'SQE' },
      ],
    }

    const results = []
    for (const [phase, items] of Object.entries(templateByPhase)) {
      const existing = await this.prisma.apqpChecklist.findFirst({
        where: { projectId, phase },
      })
      if (!existing) {
        const checklist = await this.instantiateFromTemplate(projectId, phase, items, userId)
        results.push(checklist)
      }
    }
    return results
  }

  async updateItem(id: number, data: any) {
    return this.prisma.apqpChecklistItem.update({ where: { id }, data })
  }

  async batchUpdateItems(checklistId: number, items: any[]) {
    const results = []
    for (const item of items) {
      if (item.id) {
        const updated = await this.prisma.apqpChecklistItem.update({
          where: { id: item.id },
          data: { result: item.result, evidence: item.evidence },
        })
        results.push(updated)
      }
    }
    return results
  }

  async getProgress(projectId: number) {
    const checklists = await this.prisma.apqpChecklist.findMany({
      where: { projectId },
      include: { items: true },
    })

    const progress = {
      total: 0,
      completed: 0,
      byPhase: {} as Record<string, { total: number; completed: number }>,
    }

    for (const cl of checklists) {
      const phaseTotal = cl.items.length
      const phaseCompleted = cl.items.filter(i => i.result === 'pass' || i.result === 'na').length
      progress.total += phaseTotal
      progress.completed += phaseCompleted
      progress.byPhase[cl.phase] = { total: phaseTotal, completed: phaseCompleted }
    }

    return progress
  }

  async delete(id: number) {
    const checklist = await this.prisma.apqpChecklist.findUnique({ where: { id } })
    if (!checklist) throw new NotFoundException('检查表不存在')
    await this.prisma.apqpChecklist.delete({ where: { id } })
    return { message: '删除成功' }
  }
}
