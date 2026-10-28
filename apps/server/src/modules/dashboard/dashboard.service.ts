import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: number) {
    const [
      totalProjects, activeProjects, onHoldProjects, completedProjects,
      myWbsTasks, myRisks, myEcrs, myEcnActions,
      myProblems, myCapas, myDfmeaActions, myPfmeaActions,
      workflowPending,
      openProblems, criticalProblems, openCapas,
      openEcrs, activeEcns,
      highApCount,
      pendingRequests, activeOrders,
      unresolvedAlerts, unreadNotifications,
    ] = await Promise.all([
      this.prisma.prjProject.count(),
      this.prisma.prjProject.count({ where: { status: 'active' } }),
      this.prisma.prjProject.count({ where: { status: 'on_hold' } }),
      this.prisma.prjProject.count({ where: { status: 'completed' } }),

      this.prisma.prjWbsTask.count({ where: { responsibleId: userId, status: { notIn: ['completed', 'cancelled'] } } }),
      this.prisma.prjRisk.count({ where: { ownerUserId: userId, status: { notIn: ['closed', 'accepted'] } } }),
      this.prisma.chgEcr.count({ where: { assignedToId: userId, status: { notIn: ['closed', 'rejected'] } } }),
      this.prisma.chgEcnActionItem.count({ where: { assignedToId: userId, status: { notIn: ['completed', 'verified'] } } }),
      this.prisma.qualityProblem.count({ where: { ownerId: userId, status: { notIn: ['closed'] } } }),
      this.prisma.qualityCAPA.count({ where: { assignedToId: userId, status: { notIn: ['verified', 'closed'] } } }),
      this.prisma.fmeaDfmeaItem.count({ where: { actionResponsibleId: userId, actionStatus: { notIn: ['completed'] } } }),
      this.prisma.fmeaPfmeaItem.count({ where: { actionResponsibleId: userId, actionStatus: { notIn: ['completed'] } } }),
      this.prisma.wfNodeInstance.count({ where: { assigneeUserId: userId, status: 'pending' } }),

      this.prisma.qualityProblem.count({ where: { status: { notIn: ['closed'] } } }),
      this.prisma.qualityProblem.count({ where: { severity: 'critical', status: { notIn: ['closed'] } } }),
      this.prisma.qualityCAPA.count({ where: { status: { notIn: ['verified', 'closed'] } } }),

      this.prisma.chgEcr.count({ where: { status: { notIn: ['closed', 'rejected'] } } }),
      this.prisma.chgEcn.count({ where: { status: { notIn: ['closed'] } } }),

      this.prisma.fmeaDfmeaItem.count({ where: { apRating: 'H' } })
        .then(dfmeaHigh =>
          this.prisma.fmeaPfmeaItem.count({ where: { apRating: 'H' } })
            .then(pfmeaHigh => dfmeaHigh + pfmeaHigh)
        ),

      this.prisma.purchaseRequest.count({ where: { status: { in: ['draft', 'pending'] } } }),
      this.prisma.purchaseOrder.count({ where: { status: { in: ['confirmed', 'in_transit'] } } }),

      this.prisma.msgAlertRecord.count({ where: { status: { in: ['triggered', 'acknowledged'] } } }),
      this.prisma.msgNotification.count({ where: { userId, isRead: false } }),
    ])

    return {
      projects: { total: totalProjects, active: activeProjects, onHold: onHoldProjects, completed: completedProjects },
      myTasks: {
        wbsTasks: myWbsTasks,
        risks: myRisks,
        ecrs: myEcrs,
        ecnActions: myEcnActions,
        problems: myProblems,
        capas: myCapas,
        fmeaActions: myDfmeaActions + myPfmeaActions,
        workflowPending,
      },
      quality: { openProblems, criticalProblems, openCapas },
      changes: { openEcrs, activeEcns },
      fmea: { highApCount },
      procurement: { pendingRequests, activeOrders },
      alerts: { unresolvedCount: unresolvedAlerts },
      unreadNotifications,
    }
  }

  async getWarnings(userId: number) {
    const now = new Date()

    const [delayedMilestones, criticalRisks, unresolvedAlerts, overdueTasks, openCriticalProblems, budgetOverruns] =
      await Promise.all([
        this.prisma.prjMilestone.findMany({
          where: {
            status: 'planned',
            plannedDate: { lt: now },
            project: { status: 'active' },
          },
          select: {
            id: true, name: true, plannedDate: true,
            project: { select: { id: true, projectName: true } },
          },
          orderBy: { plannedDate: 'asc' },
          take: 10,
        }),

        this.prisma.prjRisk.findMany({
          where: {
            riskLevel: 'critical',
            status: { notIn: ['closed', 'accepted'] },
          },
          select: {
            id: true, description: true, riskLevel: true,
            project: { select: { id: true, projectName: true } },
          },
          take: 10,
        }),

        this.prisma.msgAlertRecord.findMany({
          where: {
            severity: { in: ['critical', 'warning'] },
            status: { in: ['triggered', 'acknowledged'] },
          },
          select: { id: true, title: true, severity: true, status: true, triggeredAt: true, targetBizType: true },
          orderBy: { triggeredAt: 'desc' },
          take: 10,
        }),

        this.prisma.prjWbsTask.findMany({
          where: {
            responsibleId: userId,
            status: { notIn: ['completed', 'cancelled'] },
            plannedEnd: { lt: now },
          },
          select: {
            id: true, taskName: true, status: true, plannedEnd: true,
            schedule: {
              select: {
                project: { select: { id: true, projectName: true } },
              },
            },
          },
          orderBy: { plannedEnd: 'asc' },
          take: 10,
        }),

        this.prisma.qualityProblem.findMany({
          where: {
            severity: 'critical',
            status: { notIn: ['closed'] },
          },
          select: {
            id: true, title: true, severity: true, status: true,
            project: { select: { id: true, projectName: true } },
          },
          take: 10,
        }),

        this.prisma.prjCost.findMany({
          where: {
            actualAmount: { gt: 0 },
            budgetAmount: { gt: 0 },
          },
          select: {
            id: true, budgetCategory: true, budgetAmount: true, actualAmount: true,
            project: { select: { id: true, projectName: true } },
          },
          take: 50,
        }),
      ])

    const overruns = budgetOverruns
      .filter(c => Number(c.actualAmount) > Number(c.budgetAmount) * 1.1)
      .map(c => ({
        id: c.id,
        budgetCategory: c.budgetCategory,
        budgetAmount: c.budgetAmount,
        actualAmount: c.actualAmount,
        varianceRate: ((Number(c.actualAmount) - Number(c.budgetAmount)) / Number(c.budgetAmount) * 100).toFixed(1),
        project: c.project,
      }))
      .slice(0, 10)

    return {
      delayedMilestones,
      criticalRisks,
      unresolvedAlerts,
      overdueTasks: overdueTasks.map(t => ({
        ...t,
        projectName: t.schedule?.project?.projectName,
        projectId: t.schedule?.project?.id,
      })),
      openCriticalProblems,
      budgetOverruns: overruns,
    }
  }

  async getMyTasks(userId: number) {
    const now = new Date()

    const [wbsTasks, risks, ecrs, ecnActions, problems, capas, dfmeaItems, pfmeaItems] =
      await Promise.all([
        this.prisma.prjWbsTask.findMany({
          where: { responsibleId: userId, status: { notIn: ['completed', 'cancelled'] } },
          select: {
            id: true, taskName: true, status: true, plannedEnd: true,
            schedule: { select: { project: { select: { id: true, projectName: true } } } },
          },
          take: 20,
        }),

        this.prisma.prjRisk.findMany({
          where: { ownerUserId: userId, status: { notIn: ['closed', 'accepted'] } },
          select: {
            id: true, description: true, status: true, riskLevel: true,
            project: { select: { id: true, projectName: true } },
          },
          take: 20,
        }),

        this.prisma.chgEcr.findMany({
          where: { assignedToId: userId, status: { notIn: ['closed', 'rejected'] } },
          select: {
            id: true, title: true, status: true, priority: true,
            project: { select: { id: true, projectName: true } },
          },
          take: 20,
        }),

        this.prisma.chgEcnActionItem.findMany({
          where: { assignedToId: userId, status: { notIn: ['completed', 'verified'] } },
          select: {
            id: true, description: true, status: true, dueDate: true,
            ecn: {
              select: {
                project: { select: { id: true, projectName: true } },
              },
            },
          },
          take: 20,
        }),

        this.prisma.qualityProblem.findMany({
          where: { ownerId: userId, status: { notIn: ['closed'] } },
          select: {
            id: true, title: true, status: true, severity: true, dueDate: true,
            project: { select: { id: true, projectName: true } },
          },
          take: 20,
        }),

        this.prisma.qualityCAPA.findMany({
          where: { assignedToId: userId, status: { notIn: ['verified', 'closed'] } },
          select: {
            id: true, title: true, status: true, targetDate: true,
            project: { select: { id: true, projectName: true } },
          },
          take: 20,
        }),

        this.prisma.fmeaDfmeaItem.findMany({
          where: { actionResponsibleId: userId, actionStatus: { notIn: ['completed'] } },
          select: {
            id: true, recommendedAction: true, actionStatus: true, actionDueDate: true,
            dfmea: {
              select: {
                project: { select: { id: true, projectName: true } },
              },
            },
          },
          take: 20,
        }),

        this.prisma.fmeaPfmeaItem.findMany({
          where: { actionResponsibleId: userId, actionStatus: { notIn: ['completed'] } },
          select: {
            id: true, recommendedAction: true, actionStatus: true, actionDueDate: true,
            pfmea: {
              select: {
                project: { select: { id: true, projectName: true } },
              },
            },
          },
          take: 20,
        }),
      ])

    interface UnifiedTask {
      id: number
      type: string
      title: string
      status: string
      priority?: string
      dueDate?: Date | null
      projectName?: string
      projectId?: number
      moduleRoute: string
    }

    const tasks: UnifiedTask[] = []

    for (const t of wbsTasks) {
      tasks.push({
        id: t.id, type: 'wbs_task', title: t.taskName, status: t.status,
        dueDate: t.plannedEnd,
        projectName: t.schedule?.project?.projectName,
        projectId: t.schedule?.project?.id,
        moduleRoute: '/projects',
      })
    }

    for (const r of risks) {
      tasks.push({
        id: r.id, type: 'risk', title: r.description || 'Risk', status: r.status,
        priority: r.riskLevel,
        projectName: r.project?.projectName,
        projectId: r.project?.id,
        moduleRoute: '/projects',
      })
    }

    for (const e of ecrs) {
      tasks.push({
        id: e.id, type: 'ecr', title: e.title, status: e.status,
        priority: e.priority,
        projectName: e.project?.projectName,
        projectId: e.project?.id,
        moduleRoute: '/change-management',
      })
    }

    for (const a of ecnActions) {
      tasks.push({
        id: a.id, type: 'ecn_action', title: a.description, status: a.status,
        dueDate: a.dueDate,
        projectName: a.ecn?.project?.projectName,
        projectId: a.ecn?.project?.id,
        moduleRoute: '/change-management',
      })
    }

    for (const p of problems) {
      tasks.push({
        id: p.id, type: 'problem', title: p.title, status: p.status,
        priority: p.severity, dueDate: p.dueDate,
        projectName: p.project?.projectName,
        projectId: p.project?.id,
        moduleRoute: '/quality',
      })
    }

    for (const c of capas) {
      tasks.push({
        id: c.id, type: 'capa', title: c.title, status: c.status,
        dueDate: c.targetDate,
        projectName: c.project?.projectName,
        projectId: c.project?.id,
        moduleRoute: '/quality',
      })
    }

    for (const d of dfmeaItems) {
      tasks.push({
        id: d.id, type: 'fmea_item', title: d.recommendedAction || 'DFMEA Action',
        status: d.actionStatus, dueDate: d.actionDueDate,
        projectName: d.dfmea?.project?.projectName,
        projectId: d.dfmea?.project?.id,
        moduleRoute: '/quality-engineering',
      })
    }

    for (const p of pfmeaItems) {
      tasks.push({
        id: p.id, type: 'fmea_item', title: p.recommendedAction || 'PFMEA Action',
        status: p.actionStatus, dueDate: p.actionDueDate,
        projectName: p.pfmea?.project?.projectName,
        projectId: p.pfmea?.project?.id,
        moduleRoute: '/quality-engineering',
      })
    }

    tasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
    })

    return tasks.slice(0, 30)
  }

  async getTrends(months: number = 6) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)

    const [projects, problems, costs, ecrs, ecns] = await Promise.all([
      this.prisma.prjProject.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, status: true },
      }),
      this.prisma.qualityProblem.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, status: true, severity: true },
      }),
      this.prisma.prjCostEntry.findMany({
        where: { entryDate: { gte: startDate } },
        select: { entryDate: true, amount: true },
      }),
      this.prisma.chgEcr.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      this.prisma.chgEcn.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, status: true },
      }),
    ])

    const monthKeys: string[] = []
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate)
      d.setMonth(d.getMonth() + i)
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const getMonth = (date: Date) => {
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }

    const projectTrends = monthKeys.map(month => ({
      month,
      created: projects.filter(p => getMonth(p.createdAt) === month).length,
      completed: projects.filter(p => getMonth(p.createdAt) === month && p.status === 'completed').length,
    }))

    const qualityTrends = monthKeys.map(month => ({
      month,
      opened: problems.filter(p => getMonth(p.createdAt) === month).length,
      closed: problems.filter(p => getMonth(p.createdAt) === month && p.status === 'closed').length,
      critical: problems.filter(p => getMonth(p.createdAt) === month && p.severity === 'critical').length,
    }))

    const costTrends = monthKeys.map(month => ({
      month,
      amount: costs
        .filter(c => getMonth(c.entryDate) === month)
        .reduce((sum, c) => sum + Number(c.amount), 0),
    }))

    const changeTrends = monthKeys.map(month => ({
      month,
      ecrsCreated: ecrs.filter(e => getMonth(e.createdAt) === month).length,
      ecnsClosed: ecns.filter(e => getMonth(e.createdAt) === month && e.status === 'closed').length,
    }))

    return { projectTrends, qualityTrends, costTrends, changeTrends }
  }

  async getProcessOverview(projectId: number) {
    const project = await this.prisma.prjProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectName: true,
        apqpPhase: true,
        grdLevel: true,
        projectGrade: true,
        startDate: true,
        endDate: true,
      },
    })

    if (!project) return null

    const [gateReviews, milestones, checklistProgress, aspiceSummary, otsDocProgress] = await Promise.all([
      this.prisma.gateReview.findMany({
        where: { projectId },
        select: { gateType: true, status: true, plannedDate: true },
        orderBy: { plannedDate: 'asc' },
      }),
      this.prisma.prjMilestone.findMany({
        where: { projectId },
        select: { milestoneType: true, status: true, plannedDate: true, actualDate: true },
        orderBy: { plannedDate: 'asc' },
      }),
      this.prisma.apqpChecklist.findMany({
        where: { projectId },
        select: { phase: true, status: true, completedPct: true },
      }),
      this.prisma.aspiceProcess.findMany({
        where: { projectId },
        select: { processGroup: true, processId: true, achievedLevel: true, assessmentStatus: true },
      }),
      this.prisma.otsDocChecklist.findMany({
        where: { projectId },
        select: { status: true, completedPct: true },
      }),
    ])

    const phases = [
      { phase: 1, name: '计划定义', gate: 'G1' },
      { phase: 2, name: '产品设计开发', gate: 'G2' },
      { phase: 3, name: '过程设计开发', gate: 'G3' },
      { phase: 4, name: '产品与过程确认', gate: 'G4' },
      { phase: 5, name: '量产与反馈', gate: 'G5' },
    ]

    const phaseStatus = phases.map(p => {
      const gateReview = gateReviews.find(g => g.gateType === `gate${p.phase}`)
      const phaseMilestones = milestones.filter(m => {
        if (p.phase === 1) return m.milestoneType === 'gate1'
        if (p.phase === 2) return m.milestoneType === 'gate2'
        if (p.phase === 3) return m.milestoneType === 'gate3'
        if (p.phase === 4) return m.milestoneType === 'gate4'
        return m.milestoneType === 'gate5'
      })
      const phaseChecklists = checklistProgress.filter(c => c.phase === `phase${p.phase}`)

      return {
        ...p,
        gateStatus: gateReview?.status || 'not_started',
        gateDate: gateReview?.plannedDate || null,
        milestonesCompleted: phaseMilestones.filter(m => m.status === 'completed').length,
        milestonesTotal: phaseMilestones.length,
        checklistProgress: phaseChecklists.length > 0
          ? phaseChecklists.reduce((sum, c) => sum + Number(c.completedPct), 0) / phaseChecklists.length
          : 0,
      }
    })

    const aspiceByGroup: Record<string, { total: number; assessed: number; avgLevel: number }> = {}
    for (const a of aspiceSummary) {
      if (!aspiceByGroup[a.processGroup]) {
        aspiceByGroup[a.processGroup] = { total: 0, assessed: 0, avgLevel: 0 }
      }
      aspiceByGroup[a.processGroup].total++
      if (a.assessmentStatus === 'assessed') {
        aspiceByGroup[a.processGroup].assessed++
        aspiceByGroup[a.processGroup].avgLevel += a.achievedLevel
      }
    }
    for (const g of Object.values(aspiceByGroup)) {
      g.avgLevel = g.assessed > 0 ? g.avgLevel / g.assessed : 0
    }

    const otsDocCompletion = otsDocProgress.length > 0
      ? otsDocProgress.reduce((sum, c) => sum + Number(c.completedPct), 0) / otsDocProgress.length
      : 0

    return {
      project,
      phases: phaseStatus,
      aspiceByGroup,
      otsDocCompletion,
      currentPhase: project.apqpPhase,
    }
  }
}
