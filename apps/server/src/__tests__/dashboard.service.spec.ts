import { createMockPrismaService } from './helpers/prisma.mock'

const prisma = createMockPrismaService()

jest.mock('../common/services/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => prisma),
}))

import { DashboardService } from '../modules/dashboard/dashboard.service'

describe('DashboardService', () => {
  let service: DashboardService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new DashboardService(prisma as any)
  })

  // ============================================================
  // getOverview
  // ============================================================

  describe('getOverview', () => {
    it('should return overview with all counts', async () => {
      const userId = 1
      const counts = [
        10, 5, 2, 3,       // projects: total, active, onHold, completed
        8, 4, 3, 2,        // myTasks: wbs, risks, ecrs, ecnActions
        6, 3, 2, 1,        // myTasks: problems, capas, dfmea, pfmea
        5,                  // workflowPending
        7, 2, 4,           // quality: open, critical, capas
        3, 2,              // changes: ecrs, ecns
        6,                  // fmea highAp (3+3)
        4, 3,              // procurement: requests, orders
        2, 1,              // alerts, notifications
      ]
      counts.forEach((c, i) => {
        if (i === 16) {
          // highApCount: dfmea returns 3, then chained .then for pfmea returns 3 → total 6
          prisma.fmeaDfmeaItem.count.mockResolvedValue(3)
          prisma.fmeaPfmeaItem.count.mockResolvedValue(3)
        } else {
          // Find the right model for each count call
        }
      })

      // Set up all count mocks in order of Promise.all
      let callIndex = 0
      const countValues = [10, 5, 2, 3, 8, 4, 3, 2, 6, 3, 2, 1, 5, 7, 2, 4, 3, 2, 4, 3, 2, 1]

      // Map each count call to the right model
      const countCalls: Array<{ model: any; value: number }> = [
        { model: prisma.prjProject, value: 10 },   // totalProjects
        { model: prisma.prjProject, value: 5 },    // activeProjects
        { model: prisma.prjProject, value: 2 },    // onHoldProjects
        { model: prisma.prjProject, value: 3 },    // completedProjects
        { model: prisma.prjWbsTask, value: 8 },    // myWbsTasks
        { model: prisma.prjRisk, value: 4 },       // myRisks
        { model: prisma.chgEcr, value: 3 },        // myEcrs
        { model: prisma.chgEcnActionItem, value: 2 }, // myEcnActions
        { model: prisma.qualityProblem, value: 6 },   // myProblems
        { model: prisma.qualityCAPA, value: 3 },      // myCapas
        { model: prisma.fmeaDfmeaItem, value: 2 },    // myDfmeaActions
        { model: prisma.fmeaPfmeaItem, value: 1 },    // myPfmeaActions
        { model: prisma.wfNodeInstance, value: 5 },   // workflowPending
        { model: prisma.qualityProblem, value: 7 },   // openProblems
        { model: prisma.qualityProblem, value: 2 },   // criticalProblems
        { model: prisma.qualityCAPA, value: 4 },      // openCapas
        { model: prisma.chgEcr, value: 3 },           // openEcrs
        { model: prisma.chgEcn, value: 2 },           // activeEcns
        // highApCount handled separately
        { model: prisma.purchaseRequest, value: 4 },  // pendingRequests
        { model: prisma.purchaseOrder, value: 3 },    // activeOrders
        { model: prisma.msgAlertRecord, value: 2 },   // unresolvedAlerts
        { model: prisma.msgNotification, value: 1 },  // unreadNotifications
      ]

      // Since multiple calls go to the same model, we need sequential mock behavior
      // prjProject.count is called 4 times
      prisma.prjProject.count
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(5)   // active
        .mockResolvedValueOnce(2)   // onHold
        .mockResolvedValueOnce(3)   // completed

      prisma.prjWbsTask.count.mockResolvedValue(8)
      prisma.prjRisk.count.mockResolvedValue(4)

      // chgEcr.count called 2 times (myEcrs + openEcrs)
      prisma.chgEcr.count
        .mockResolvedValueOnce(3)   // myEcrs
        .mockResolvedValueOnce(3)   // openEcrs

      prisma.chgEcnActionItem.count.mockResolvedValue(2)

      // qualityProblem.count called 3 times (myProblems, openProblems, criticalProblems)
      prisma.qualityProblem.count
        .mockResolvedValueOnce(6)   // myProblems
        .mockResolvedValueOnce(7)   // openProblems
        .mockResolvedValueOnce(2)   // criticalProblems

      // qualityCAPA.count called 2 times (myCapas, openCapas)
      prisma.qualityCAPA.count
        .mockResolvedValueOnce(3)   // myCapas
        .mockResolvedValueOnce(4)   // openCapas

      // fmeaDfmeaItem.count called 2 times (myDfmeaActions, highAp)
      prisma.fmeaDfmeaItem.count
        .mockResolvedValueOnce(2)   // myDfmeaActions
        .mockResolvedValueOnce(3)   // highAp dfmea

      // fmeaPfmeaItem.count called 2 times (myPfmeaActions, highAp)
      prisma.fmeaPfmeaItem.count
        .mockResolvedValueOnce(1)   // myPfmeaActions
        .mockResolvedValueOnce(3)   // highAp pfmea

      prisma.wfNodeInstance.count.mockResolvedValue(5)
      prisma.chgEcn.count.mockResolvedValue(2)
      prisma.purchaseRequest.count.mockResolvedValue(4)
      prisma.purchaseOrder.count.mockResolvedValue(3)
      prisma.msgAlertRecord.count.mockResolvedValue(2)
      prisma.msgNotification.count.mockResolvedValue(1)

      const result = await service.getOverview(userId)

      expect(result.projects).toEqual({ total: 10, active: 5, onHold: 2, completed: 3 })
      expect(result.myTasks.wbsTasks).toBe(8)
      expect(result.myTasks.risks).toBe(4)
      expect(result.myTasks.ecrs).toBe(3)
      expect(result.myTasks.ecnActions).toBe(2)
      expect(result.myTasks.problems).toBe(6)
      expect(result.myTasks.capas).toBe(3)
      expect(result.myTasks.fmeaActions).toBe(3) // 2 + 1
      expect(result.myTasks.workflowPending).toBe(5)
      expect(result.quality.openProblems).toBe(7)
      expect(result.quality.criticalProblems).toBe(2)
      expect(result.quality.openCapas).toBe(4)
      expect(result.changes.openEcrs).toBe(3)
      expect(result.changes.activeEcns).toBe(2)
      expect(result.fmea.highApCount).toBe(6) // 3 + 3
      expect(result.procurement.pendingRequests).toBe(4)
      expect(result.procurement.activeOrders).toBe(3)
      expect(result.alerts.unresolvedCount).toBe(2)
      expect(result.unreadNotifications).toBe(1)
    })
  })

  // ============================================================
  // getWarnings
  // ============================================================

  describe('getWarnings', () => {
    it('should return all warning categories', async () => {
      const userId = 1
      const now = new Date()
      const pastDate = new Date(now.getTime() - 86400000)
      const futureDate = new Date(now.getTime() + 86400000)

      prisma.prjMilestone.findMany.mockResolvedValue([
        { id: 1, name: 'M1', plannedDate: pastDate, project: { id: 1, projectName: 'P1' } },
      ])
      prisma.prjRisk.findMany.mockResolvedValue([
        { id: 1, description: 'Risk1', riskLevel: 'critical', project: { id: 1, projectName: 'P1' } },
      ])
      prisma.msgAlertRecord.findMany.mockResolvedValue([
        { id: 1, title: 'Alert1', severity: 'critical', status: 'triggered', triggeredAt: now },
      ])
      prisma.prjWbsTask.findMany.mockResolvedValue([
        {
          id: 1, taskName: 'Task1', status: 'in_progress', plannedEnd: pastDate,
          schedule: { project: { id: 1, projectName: 'P1' } },
        },
      ])
      prisma.qualityProblem.findMany.mockResolvedValue([
        { id: 1, title: 'Problem1', severity: 'critical', status: 'open', project: { id: 1, projectName: 'P1' } },
      ])
      prisma.prjCost.findMany.mockResolvedValue([
        { id: 1, budgetCategory: 'material', budgetAmount: 100, actualAmount: 120, project: { id: 1, projectName: 'P1' } },
        { id: 2, budgetCategory: 'labor', budgetAmount: 200, actualAmount: 250, project: { id: 1, projectName: 'P1' } },
      ])

      const result = await service.getWarnings(userId)

      expect(result.delayedMilestones).toHaveLength(1)
      expect(result.criticalRisks).toHaveLength(1)
      expect(result.unresolvedAlerts).toHaveLength(1)
      expect(result.overdueTasks).toHaveLength(1)
      expect(result.openCriticalProblems).toHaveLength(1)
    })

    it('should filter budget overruns exceeding 10% threshold', async () => {
      const userId = 1

      prisma.prjMilestone.findMany.mockResolvedValue([])
      prisma.prjRisk.findMany.mockResolvedValue([])
      prisma.msgAlertRecord.findMany.mockResolvedValue([])
      prisma.prjWbsTask.findMany.mockResolvedValue([])
      prisma.qualityProblem.findMany.mockResolvedValue([])
      prisma.prjCost.findMany.mockResolvedValue([
        { id: 1, budgetCategory: 'material', budgetAmount: 100, actualAmount: 105, project: { id: 1, projectName: 'P1' } },
        { id: 2, budgetCategory: 'labor', budgetAmount: 200, actualAmount: 250, project: { id: 1, projectName: 'P1' } },
      ])

      const result = await service.getWarnings(userId)

      // 105/100 = 5% < 10%, filtered out; 250/200 = 25% > 10%, included
      expect(result.budgetOverruns).toHaveLength(1)
      expect(result.budgetOverruns[0].budgetCategory).toBe('labor')
      expect(result.budgetOverruns[0].varianceRate).toBe('25.0')
    })

    it('should flatten overdue tasks with project info', async () => {
      const userId = 1
      const pastDate = new Date(Date.now() - 86400000)

      prisma.prjMilestone.findMany.mockResolvedValue([])
      prisma.prjRisk.findMany.mockResolvedValue([])
      prisma.msgAlertRecord.findMany.mockResolvedValue([])
      prisma.prjWbsTask.findMany.mockResolvedValue([
        {
          id: 1, taskName: 'Task1', status: 'in_progress', plannedEnd: pastDate,
          schedule: { project: { id: 10, projectName: 'ProjectX' } },
        },
      ])
      prisma.qualityProblem.findMany.mockResolvedValue([])
      prisma.prjCost.findMany.mockResolvedValue([])

      const result = await service.getWarnings(userId)

      expect(result.overdueTasks[0].projectName).toBe('ProjectX')
      expect(result.overdueTasks[0].projectId).toBe(10)
    })
  })

  // ============================================================
  // getMyTasks
  // ============================================================

  describe('getMyTasks', () => {
    it('should aggregate tasks from multiple sources', async () => {
      const userId = 1
      const futureDate = new Date(Date.now() + 86400000 * 5)
      const nearDate = new Date(Date.now() + 86400000 * 2)

      prisma.prjWbsTask.findMany.mockResolvedValue([
        {
          id: 1, taskName: 'WBS Task', status: 'in_progress', plannedEnd: nearDate,
          schedule: { project: { id: 1, projectName: 'P1' } },
        },
      ])
      prisma.prjRisk.findMany.mockResolvedValue([
        { id: 2, description: 'Risk desc', status: 'open', riskLevel: 'high', project: { id: 1, projectName: 'P1' } },
      ])
      prisma.chgEcr.findMany.mockResolvedValue([
        { id: 3, title: 'ECR title', status: 'submitted', priority: 'urgent', project: { id: 2, projectName: 'P2' } },
      ])
      prisma.chgEcnActionItem.findMany.mockResolvedValue([
        {
          id: 4, description: 'ECN action', status: 'pending', dueDate: futureDate,
          ecn: { project: { id: 2, projectName: 'P2' } },
        },
      ])
      prisma.qualityProblem.findMany.mockResolvedValue([
        { id: 5, title: 'Problem', status: 'open', severity: 'critical', dueDate: nearDate, project: { id: 1, projectName: 'P1' } },
      ])
      prisma.qualityCAPA.findMany.mockResolvedValue([
        { id: 6, title: 'CAPA', status: 'in_progress', targetDate: futureDate, project: { id: 1, projectName: 'P1' } },
      ])
      prisma.fmeaDfmeaItem.findMany.mockResolvedValue([
        {
          id: 7, recommendedAction: 'DFMEA action', actionStatus: 'open', actionDueDate: nearDate,
          dfmea: { project: { id: 3, projectName: 'P3' } },
        },
      ])
      prisma.fmeaPfmeaItem.findMany.mockResolvedValue([
        {
          id: 8, recommendedAction: 'PFMEA action', actionStatus: 'open', actionDueDate: futureDate,
          pfmea: { project: { id: 3, projectName: 'P3' } },
        },
      ])

      const result = await service.getMyTasks(userId)

      expect(result).toHaveLength(8)
      // Should be sorted by dueDate (nearest first)
      expect(result[0].id).toBe(1) // nearDate
      expect(result[0].type).toBe('wbs_task')
      expect(result[0].moduleRoute).toBe('/projects')

      // Check types
      const types = result.map(t => t.type)
      expect(types).toContain('wbs_task')
      expect(types).toContain('risk')
      expect(types).toContain('ecr')
      expect(types).toContain('ecn_action')
      expect(types).toContain('problem')
      expect(types).toContain('capa')
      expect(types).toContain('fmea_item')
    })

    it('should handle tasks without due dates', async () => {
      const userId = 1

      prisma.prjWbsTask.findMany.mockResolvedValue([
        { id: 1, taskName: 'No date', status: 'open', plannedEnd: null, schedule: null },
      ])
      prisma.prjRisk.findMany.mockResolvedValue([])
      prisma.chgEcr.findMany.mockResolvedValue([])
      prisma.chgEcnActionItem.findMany.mockResolvedValue([])
      prisma.qualityProblem.findMany.mockResolvedValue([])
      prisma.qualityCAPA.findMany.mockResolvedValue([])
      prisma.fmeaDfmeaItem.findMany.mockResolvedValue([])
      prisma.fmeaPfmeaItem.findMany.mockResolvedValue([])

      const result = await service.getMyTasks(userId)

      expect(result).toHaveLength(1)
      expect(result[0].dueDate).toBeNull()
      expect(result[0].projectName).toBeUndefined()
    })

    it('should limit results to 30 tasks', async () => {
      const userId = 1
      const manyTasks = Array.from({ length: 35 }, (_, i) => ({
        id: i + 1, taskName: `Task ${i}`, status: 'open',
        plannedEnd: new Date(Date.now() + (i + 1) * 86400000),
        schedule: { project: { id: 1, projectName: 'P1' } },
      }))

      prisma.prjWbsTask.findMany.mockResolvedValue(manyTasks)
      prisma.prjRisk.findMany.mockResolvedValue([])
      prisma.chgEcr.findMany.mockResolvedValue([])
      prisma.chgEcnActionItem.findMany.mockResolvedValue([])
      prisma.qualityProblem.findMany.mockResolvedValue([])
      prisma.qualityCAPA.findMany.mockResolvedValue([])
      prisma.fmeaDfmeaItem.findMany.mockResolvedValue([])
      prisma.fmeaPfmeaItem.findMany.mockResolvedValue([])

      const result = await service.getMyTasks(userId)

      expect(result).toHaveLength(30)
    })

    it('should assign correct module routes', async () => {
      const userId = 1

      prisma.prjWbsTask.findMany.mockResolvedValue([])
      prisma.prjRisk.findMany.mockResolvedValue([])
      prisma.chgEcr.findMany.mockResolvedValue([
        { id: 1, title: 'ECR', status: 'draft', priority: 'general', project: null },
      ])
      prisma.chgEcnActionItem.findMany.mockResolvedValue([
        { id: 2, description: 'ECN', status: 'pending', dueDate: null, ecn: null },
      ])
      prisma.qualityProblem.findMany.mockResolvedValue([
        { id: 3, title: 'Prob', status: 'open', severity: 'low', dueDate: null, project: null },
      ])
      prisma.qualityCAPA.findMany.mockResolvedValue([
        { id: 4, title: 'CAPA', status: 'open', targetDate: null, project: null },
      ])
      prisma.fmeaDfmeaItem.findMany.mockResolvedValue([
        { id: 5, recommendedAction: 'Act', actionStatus: 'open', actionDueDate: null, dfmea: null },
      ])
      prisma.fmeaPfmeaItem.findMany.mockResolvedValue([])

      const result = await service.getMyTasks(userId)

      const ecr = result.find(t => t.type === 'ecr')
      const ecn = result.find(t => t.type === 'ecn_action')
      const prob = result.find(t => t.type === 'problem')
      const capa = result.find(t => t.type === 'capa')
      const fmea = result.find(t => t.type === 'fmea_item')

      expect(ecr?.moduleRoute).toBe('/change-management')
      expect(ecn?.moduleRoute).toBe('/change-management')
      expect(prob?.moduleRoute).toBe('/quality')
      expect(capa?.moduleRoute).toBe('/quality')
      expect(fmea?.moduleRoute).toBe('/quality-engineering')
    })
  })

  // ============================================================
  // getTrends
  // ============================================================

  describe('getTrends', () => {
    it('should return monthly trends for all categories', async () => {
      const now = new Date()
      const twoMonthsAgo = new Date(now)
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
      twoMonthsAgo.setDate(15)

      const threeMonthsAgo = new Date(now)
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      threeMonthsAgo.setDate(10)

      prisma.prjProject.findMany.mockResolvedValue([
        { createdAt: twoMonthsAgo, status: 'active' },
        { createdAt: threeMonthsAgo, status: 'completed' },
      ])
      prisma.qualityProblem.findMany.mockResolvedValue([
        { createdAt: twoMonthsAgo, status: 'open', severity: 'critical' },
        { createdAt: twoMonthsAgo, status: 'closed', severity: 'low' },
      ])
      prisma.prjCostEntry.findMany.mockResolvedValue([
        { entryDate: twoMonthsAgo, amount: 1000 },
        { entryDate: threeMonthsAgo, amount: 2000 },
      ])
      prisma.chgEcr.findMany.mockResolvedValue([
        { createdAt: twoMonthsAgo },
      ])
      prisma.chgEcn.findMany.mockResolvedValue([
        { createdAt: threeMonthsAgo, status: 'closed' },
      ])

      const result = await service.getTrends(6)

      expect(result.projectTrends).toHaveLength(6)
      expect(result.qualityTrends).toHaveLength(6)
      expect(result.costTrends).toHaveLength(6)
      expect(result.changeTrends).toHaveLength(6)

      // Verify month keys format
      const monthKeys = result.projectTrends.map(t => t.month)
      monthKeys.forEach(key => {
        expect(key).toMatch(/^\d{4}-\d{2}$/)
      })
    })

    it('should default to 6 months', async () => {
      prisma.prjProject.findMany.mockResolvedValue([])
      prisma.qualityProblem.findMany.mockResolvedValue([])
      prisma.prjCostEntry.findMany.mockResolvedValue([])
      prisma.chgEcr.findMany.mockResolvedValue([])
      prisma.chgEcn.findMany.mockResolvedValue([])

      const result = await service.getTrends()

      expect(result.projectTrends).toHaveLength(6)
    })

    it('should aggregate costs by month', async () => {
      const now = new Date()
      const oneMonthAgo = new Date(now)
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      oneMonthAgo.setDate(15)

      prisma.prjProject.findMany.mockResolvedValue([])
      prisma.qualityProblem.findMany.mockResolvedValue([])
      prisma.prjCostEntry.findMany.mockResolvedValue([
        { entryDate: oneMonthAgo, amount: 500 },
        { entryDate: oneMonthAgo, amount: 300 },
      ])
      prisma.chgEcr.findMany.mockResolvedValue([])
      prisma.chgEcn.findMany.mockResolvedValue([])

      const result = await service.getTrends(3)

      const monthKey = `${oneMonthAgo.getFullYear()}-${String(oneMonthAgo.getMonth() + 1).padStart(2, '0')}`
      const monthCost = result.costTrends.find(t => t.month === monthKey)
      expect(monthCost?.amount).toBe(800)
    })
  })
})
