import { QualityService } from '../modules/quality/quality.service'
import { createMockPrismaService } from './helpers/prisma.mock'

describe('QualityService', () => {
  let service: QualityService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(() => {
    prisma = createMockPrismaService()
    service = new QualityService(prisma as any)
  })

  // ==================== Quality Problems ====================

  describe('Quality Problems', () => {
    it('should list problems with filters', async () => {
      prisma.qualityProblem.findMany.mockResolvedValue([{ id: 1 }])

      const result = await service.findAllProblems({ projectId: 1, status: 'open', severity: 'critical' })

      expect(prisma.qualityProblem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 1, status: 'open', severity: 'critical' },
        }),
      )
      expect(result).toEqual([{ id: 1 }])
    })

    it('should create problem with auto-generated number', async () => {
      prisma.qualityProblem.count.mockResolvedValue(2)
      prisma.qualityProblem.create.mockResolvedValue({ id: 1, problemNo: 'QR202610270003' })

      const result = await service.createProblem(
        { projectId: 1, title: '焊接不良', severity: 'major', classification: 'process' },
        10,
      )

      expect(prisma.qualityProblem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            problemNo: expect.stringMatching(/^QR\d{8}\d{4}$/),
            status: 'new',
            createdById: 10,
          }),
        }),
      )
      expect(result.problemNo).toMatch(/^QR\d{8}\d{4}$/)
    })

    it('should assign problem and change status to analyzing', async () => {
      prisma.qualityProblem.update.mockResolvedValue({ id: 1, status: 'analyzing' })

      await service.assignProblem(1, 5)

      expect(prisma.qualityProblem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { ownerId: 5, status: 'analyzing' },
        }),
      )
    })

    it('should close problem with user and timestamp', async () => {
      prisma.qualityProblem.update.mockResolvedValue({ id: 1, status: 'closed' })

      await service.closeProblem(1, 5)

      expect(prisma.qualityProblem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'closed',
            closedById: 5,
            closedAt: expect.any(Date),
          }),
        }),
      )
    })

    it('should escalate problem status', async () => {
      prisma.qualityProblem.update.mockResolvedValue({ id: 1, status: 'escalated' })

      await service.escalateProblem(1)

      expect(prisma.qualityProblem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'escalated' },
        }),
      )
    })
  })

  // ==================== 8D Reports ====================

  describe('8D Reports', () => {
    it('should create 8D report and update problem status', async () => {
      prisma.quality8DReport.count.mockResolvedValue(0)
      prisma.quality8DReport.create.mockResolvedValue({ id: 1, reportNo: '8D202610270001' })
      prisma.qualityProblem.update.mockResolvedValue({})
      prisma.quality8DReport.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'in_progress' })

      const result = await service.create8DReport(5, 10)

      expect(prisma.quality8DReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            problemId: 5,
            status: 'in_progress',
            completionRate: 0,
          }),
        }),
      )
      expect(prisma.qualityProblem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { has8DReport: true, status: 'analyzing' },
        }),
      )
    })

    it('should update D1 step and calculate completion rate', async () => {
      prisma.quality8DReport.update.mockResolvedValue({ id: 1, completionRate: 12.5 })

      const result = await service.update8DStep(1, 'd1', {
        d1Team: '质量团队',
        d1ProblemDescription: '焊接不良问题',
      })

      expect(prisma.quality8DReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            d1Team: '质量团队',
            d1ProblemDescription: '焊接不良问题',
            completionRate: 12.5,
          }),
        }),
      )
    })

    it('should only extract fields for the specified step when updating', async () => {
      prisma.quality8DReport.update.mockResolvedValue({ id: 1, completionRate: 12.5 })

      await service.update8DStep(1, 'd8', {
        d8LessonsLearned: 'lessons',
      })

      expect(prisma.quality8DReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            d8LessonsLearned: 'lessons',
            completionRate: 12.5,
          }),
        }),
      )
    })

    it('should convert date fields when updating 8D steps', async () => {
      prisma.quality8DReport.update.mockResolvedValue({ id: 1 })

      await service.update8DStep(1, 'd2', {
        d2ContainmentDate: '2026-10-27',
      })

      expect(prisma.quality8DReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            d2ContainmentDate: expect.any(Date),
          }),
        }),
      )
    })
  })

  // ==================== Nonconformances ====================

  describe('Nonconformances', () => {
    it('should create nonconformance with auto-number', async () => {
      prisma.qualityNonconformance.count.mockResolvedValue(0)
      prisma.qualityNonconformance.create.mockResolvedValue({ id: 1, ncNo: 'NC202610270001' })

      const result = await service.createNonconformance(
        { projectId: 1, title: '尺寸超差', defectType: 'dimensional' },
        10,
      )

      expect(result.ncNo).toMatch(/^NC\d{8}\d{4}$/)
    })

    it('should dispose nonconformance with cost impact', async () => {
      prisma.qualityNonconformance.update.mockResolvedValue({ id: 1, disposition: 'rework' })

      await service.disposeNonconformance(1, 'rework', 5, 1000)

      expect(prisma.qualityNonconformance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            disposition: 'rework',
            dispositionById: 5,
            costImpact: 1000,
            dispositionDate: expect.any(Date),
          }),
        }),
      )
    })
  })

  // ==================== CAPA ====================

  describe('CAPA', () => {
    it('should create CAPA with auto-number and pending status', async () => {
      prisma.qualityCAPA.count.mockResolvedValue(0)
      prisma.qualityCAPA.create.mockResolvedValue({ id: 1, capaNo: 'CA202610270001', status: 'pending' })

      const result = await service.createCapa(
        { projectId: 1, title: '纠正措施', type: 'corrective', rootCause: '焊接温度低' },
        10,
      )

      expect(prisma.qualityCAPA.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'pending',
            createdById: 10,
          }),
        }),
      )
    })

    it('should verify CAPA and set effectiveness result', async () => {
      prisma.qualityCAPA.update.mockResolvedValue({ id: 1, status: 'verified' })

      await service.verifyCapa(1, 5, '措施有效')

      expect(prisma.qualityCAPA.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'verified',
            verifiedById: 5,
            effectivenessResult: '措施有效',
            verifiedAt: expect.any(Date),
          }),
        }),
      )
    })

    it('should close CAPA', async () => {
      prisma.qualityCAPA.update.mockResolvedValue({ id: 1, status: 'closed' })

      await service.closeCapa(1)

      expect(prisma.qualityCAPA.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'closed',
            completedAt: expect.any(Date),
          }),
        }),
      )
    })
  })

  // ==================== Inspections ====================

  describe('Inspections', () => {
    it('should create inspection with pass result', async () => {
      prisma.qualityInspection.count.mockResolvedValue(0)
      prisma.qualityInspection.create.mockResolvedValue({ id: 1, inspectionNo: 'IR202610270001', result: 'pass' })

      const result = await service.createInspection(
        { projectId: 1, title: '首件检验', type: 'first_article', result: 'pass' },
        10,
      )

      expect(prisma.qualityInspection.create).toHaveBeenCalled()
      expect(prisma.qualityNonconformance.create).not.toHaveBeenCalled()
    })

    it('should auto-create nonconformance when inspection fails', async () => {
      prisma.qualityInspection.count.mockResolvedValue(0)
      prisma.qualityInspection.create.mockResolvedValue({ id: 1, inspectionNo: 'IR202610270001', result: 'fail' })
      prisma.qualityNonconformance.count.mockResolvedValue(0)
      prisma.qualityNonconformance.create.mockResolvedValue({ id: 1 })

      await service.createInspection(
        { projectId: 1, title: '来料检验', type: 'incoming', result: 'fail', defectType: 'surface', sampleSize: 100, defectCount: 5 },
        10,
      )

      expect(prisma.qualityNonconformance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            relatedInspectionId: 1,
            defectType: 'surface',
            quantity: 100,
            defectQuantity: 5,
          }),
        }),
      )
    })
  })

  // ==================== Statistics ====================

  describe('Statistics', () => {
    it('should get overview stats with all KPIs', async () => {
      prisma.qualityProblem.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(5)
      prisma.quality8DReport.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(40)
      prisma.qualityNonconformance.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(50)
      prisma.qualityCAPA.count
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(60)
      prisma.qualityInspection.count
        .mockResolvedValueOnce(500)
        .mockResolvedValueOnce(25)

      const stats = await service.getOverviewStats()

      expect(stats.problems.total).toBe(100)
      expect(stats.problems.open).toBe(30)
      expect(stats.problems.critical).toBe(5)
      expect(stats.eightD.closureRate).toBe(80)
      expect(stats.inspections.passRate).toBe(95)
    })

    it('should calculate problem aging buckets', async () => {
      const now = Date.now()
      prisma.qualityProblem.findMany.mockResolvedValue([
        { createdAt: new Date(now - 2 * 86400000), severity: 'critical' },
        { createdAt: new Date(now - 5 * 86400000), severity: 'major' },
        { createdAt: new Date(now - 10 * 86400000), severity: 'minor' },
        { createdAt: new Date(now - 20 * 86400000), severity: 'critical' },
        { createdAt: new Date(now - 45 * 86400000), severity: 'major' },
      ])

      const buckets = await service.getProblemAgingAnalysis()

      expect(buckets['0-3']).toBe(1)
      expect(buckets['4-7']).toBe(1)
      expect(buckets['8-14']).toBe(1)
      expect(buckets['15-30']).toBe(1)
      expect(buckets['30+']).toBe(1)
    })

    it('should get quality cost summary by disposition', async () => {
      prisma.qualityNonconformance.findMany.mockResolvedValue([
        { defectType: 'dimensional', costImpact: 1000, disposition: 'rework' },
        { defectType: 'dimensional', costImpact: 500, disposition: 'scrap' },
        { defectType: 'surface', costImpact: 200, disposition: 'rework' },
      ])

      const summary = await service.getQualityCostSummary()

      expect(summary.totalCost).toBe(1700)
      expect(summary.byDisposition.rework).toBe(1200)
      expect(summary.byDisposition.scrap).toBe(500)
      expect(summary.byType.dimensional).toBe(1500)
      expect(summary.byType.surface).toBe(200)
    })

    it('should get top defect types sorted by quantity', async () => {
      prisma.qualityNonconformance.findMany.mockResolvedValue([
        { defectType: 'dimensional', quantity: 10, defectQuantity: 5 },
        { defectType: 'surface', quantity: 20, defectQuantity: 8 },
        { defectType: 'dimensional', quantity: 15, defectQuantity: 3 },
      ])

      const top = await service.getTopDefectTypes(5)

      expect(top).toHaveLength(2)
      expect(top[0].defectQty).toBe(8)
      expect(top[1].defectQty).toBe(8)
    })
  })

  // ==================== PPM Records ====================

  describe('PPM Records', () => {
    it('should create PPM record with auto-calculated value and status', async () => {
      prisma.prjProject.findUniqueOrThrow.mockResolvedValue({ id: 1, projectLevel: 'L2' })
      prisma.qualityPpmRecord.create.mockResolvedValue({ id: 1 })

      await service.createPpmRecord(
        { projectId: 1, period: '2026-10', totalParts: 10000, defectParts: 3 },
        10,
      )

      expect(prisma.qualityPpmRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ppmValue: 300,
            targetPpm: 50,
            status: 'exceeded',
          }),
        }),
      )
    })

    it('should set status to on_track when PPM is within target', async () => {
      prisma.prjProject.findUniqueOrThrow.mockResolvedValue({ id: 1, projectLevel: 'L1' })
      prisma.qualityPpmRecord.create.mockResolvedValue({ id: 1 })

      await service.createPpmRecord(
        { projectId: 1, period: '2026-10', totalParts: 100000, defectParts: 1 },
        10,
      )

      expect(prisma.qualityPpmRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ppmValue: 10,
            targetPpm: 10,
            status: 'on_track',
          }),
        }),
      )
    })

    it('should set status to warning when PPM is between target and 1.5x', async () => {
      prisma.prjProject.findUniqueOrThrow.mockResolvedValue({ id: 1, projectLevel: 'L3' })
      prisma.qualityPpmRecord.create.mockResolvedValue({ id: 1 })

      await service.createPpmRecord(
        { projectId: 1, period: '2026-10', totalParts: 100000, defectParts: 12 },
        10,
      )

      expect(prisma.qualityPpmRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ppmValue: 120,
            targetPpm: 100,
            status: 'warning',
          }),
        }),
      )
    })

    it('should calculate PPM from nonconformance data', async () => {
      prisma.qualityNonconformance.findMany.mockResolvedValue([
        { quantity: 1000, defectQuantity: 5, createdAt: new Date('2026-10-15') },
        { quantity: 2000, defectQuantity: 10, createdAt: new Date('2026-10-20') },
      ])
      prisma.prjProject.findUniqueOrThrow.mockResolvedValue({ id: 1, projectLevel: 'L3' })
      prisma.qualityPpmRecord.create.mockResolvedValue({ id: 1 })

      await service.calculatePpm(1, '2026-10', 10)

      expect(prisma.qualityPpmRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalParts: 3000,
            defectParts: 15,
            ppmValue: 5000,
            targetPpm: 100,
          }),
        }),
      )
    })

    it('should get PPM compliance stats', async () => {
      prisma.qualityPpmRecord.findMany.mockResolvedValue([
        { status: 'on_track' },
        { status: 'on_track' },
        { status: 'warning' },
        { status: 'exceeded' },
      ])

      const compliance = await service.getPpmCompliance()

      expect(compliance.total).toBe(4)
      expect(compliance.onTrack).toBe(2)
      expect(compliance.complianceRate).toBe(50)
    })
  })

  // ==================== Escalation ====================

  describe('Manual Escalation', () => {
    it('should create escalation history and alert', async () => {
      const problemDate = new Date()
      problemDate.setDate(problemDate.getDate() - 10)

      prisma.qualityProblem.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        title: '焊接不良',
        severity: 'critical',
        status: 'open',
        ownerId: 5,
        createdAt: problemDate,
        project: { id: 1, projectName: '电池托盘项目' },
      })
      prisma.msgAlertRecord.create.mockResolvedValue({ id: 100 })
      prisma.qualityEscalationHistory.create.mockResolvedValue({ id: 1, escalationLevel: 'L1' })
      prisma.qualityProblem.update.mockResolvedValue({})
      prisma.msgNotification.create.mockResolvedValue({})

      const result = await service.manualEscalate(1, 10, 'L1')

      expect(prisma.msgAlertRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            severity: 'critical',
            targetBizType: 'quality_escalation',
          }),
        }),
      )
      expect(prisma.qualityEscalationHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            escalationLevel: 'L1',
            escalateTo: '总经理',
            triggeredBy: 'manual',
          }),
        }),
      )
      expect(prisma.qualityProblem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'escalated' },
        }),
      )
      expect(prisma.msgNotification.create).toHaveBeenCalled()
    })
  })

  // ==================== 8D Closure Trend ====================

  describe('8D Closure Trend', () => {
    it('should build monthly trend data', async () => {
      const now = new Date()
      prisma.quality8DReport.findMany
        .mockResolvedValueOnce([
          { createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 15) },
          { createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 10) },
        ])
        .mockResolvedValueOnce([
          { updatedAt: new Date(now.getFullYear(), now.getMonth() - 1, 20) },
        ])

      const trend = await service.getEightDClosureTrend(3)

      expect(trend.length).toBeGreaterThan(0)
      expect(trend[0]).toHaveProperty('month')
      expect(trend[0]).toHaveProperty('created')
      expect(trend[0]).toHaveProperty('completed')
    })
  })
})
