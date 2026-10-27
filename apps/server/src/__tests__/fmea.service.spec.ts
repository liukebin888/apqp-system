import { FmeaService } from '../modules/fmea/fmea.service'
import { createMockPrismaService } from './helpers/prisma.mock'

describe('FmeaService', () => {
  let service: FmeaService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(() => {
    prisma = createMockPrismaService()
    service = new FmeaService(prisma as any)
  })

  // ==================== DFMEA ====================

  describe('DFMEA', () => {
    it('should list all DFMEAs with project filter', async () => {
      prisma.fmeaDfmea.findMany.mockResolvedValue([{ id: 1 }])

      const result = await service.findAllDfmeas(1)

      expect(prisma.fmeaDfmea.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId: 1 } }),
      )
      expect(result).toEqual([{ id: 1 }])
    })

    it('should create DFMEA with auto-generated number', async () => {
      prisma.sysSequence.upsert.mockResolvedValue({ seqName: 'dfmea_seq', currentVal: 1 })
      prisma.fmeaDfmea.create.mockResolvedValue({ id: 1, fmeaNo: 'DF202610270001' })

      const result = await service.createDfmea({ projectId: 1, title: '电池托盘 DFMEA' }, 10)

      expect(prisma.fmeaDfmea.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fmeaNo: expect.stringMatching(/^DF\d{8}\d{4}$/),
            status: 'draft',
            createdById: 10,
          }),
        }),
      )
    })

    it('should approve DFMEA', async () => {
      prisma.fmeaDfmea.update.mockResolvedValue({ id: 1, status: 'approved' })

      await service.approveDfmea(1, 5)

      expect(prisma.fmeaDfmea.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'approved',
            approvedById: 5,
            approvedAt: expect.any(Date),
          }),
        }),
      )
    })

    it('should copy DFMEA with recursive items', async () => {
      prisma.fmeaDfmea.findUnique.mockResolvedValue({
        id: 1,
        projectId: 1,
        title: 'Original DFMEA',
        scope: 'system',
        teamLeaderId: 5,
        items: [
          { id: 10, parentId: null, level: 1, itemName: 'System', children: [{ id: 11, parentId: 10, level: 2, itemName: 'Subsystem', children: [] }] },
        ],
      })
      prisma.sysSequence.upsert.mockResolvedValue({ currentVal: 2 })
      prisma.fmeaDfmea.create.mockResolvedValue({ id: 2, fmeaNo: 'DF202610270002' })
      prisma.fmeaDfmeaItem.create.mockResolvedValue({ id: 20 })
      prisma.fmeaDfmea.findUnique.mockResolvedValueOnce({
        id: 1, projectId: 1, title: 'Original DFMEA', scope: 'system', teamLeaderId: 5,
        items: [{ id: 10, parentId: null, level: 1, itemName: 'System', children: [] }],
      })
      prisma.fmeaDfmea.findUnique.mockResolvedValue({
        id: 2, fmeaNo: 'DF202610270002', title: 'Original DFMEA (Copy)',
        project: {}, teamLeader: {}, approvedBy: {}, createdBy: {},
        items: [],
      })

      const result = await service.copyDfmea(1, 10)

      expect(prisma.fmeaDfmea.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Original DFMEA (Copy)',
            status: 'draft',
            version: 1,
          }),
        }),
      )
    })

    it('should throw error when copying non-existent DFMEA', async () => {
      prisma.fmeaDfmea.findUnique.mockResolvedValue(null)
      await expect(service.copyDfmea(999, 10)).rejects.toThrow('DFMEA not found')
    })
  })

  // ==================== DFMEA Items & AP Calculation ====================

  describe('DFMEA Items & AP Calculation', () => {
    it('should create DFMEA item with auto-calculated AP rating', async () => {
      prisma.fmeaDfmeaItem.create.mockResolvedValue({ id: 1, apRating: 'H' })

      const result = await service.createDfmeaItem(1, {
        severityRating: 9,
        occurrenceRating: 8,
        detectionRating: 7,
        itemName: '焊接强度不足',
      })

      expect(prisma.fmeaDfmeaItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            apRating: 'H',
          }),
        }),
      )
      expect(result.apRating).toBe('H')
    })

    it('should recalculate AP when updating item ratings', async () => {
      prisma.fmeaDfmeaItem.findUnique.mockResolvedValue({
        id: 1,
        severityRating: 5,
        occurrenceRating: 5,
        detectionRating: 5,
      })
      prisma.fmeaDfmeaItem.update.mockResolvedValue({ id: 1, apRating: 'M' })

      await service.updateDfmeaItem(1, { severityRating: 3, occurrenceRating: 4, detectionRating: 5 })

      expect(prisma.fmeaDfmeaItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            apRating: 'M',
          }),
        }),
      )
    })

    it('should delete DFMEA item and all children', async () => {
      prisma.fmeaDfmeaItem.deleteMany.mockResolvedValue({ count: 2 })
      prisma.fmeaDfmeaItem.delete.mockResolvedValue({})

      await service.deleteDfmeaItem(10)

      expect(prisma.fmeaDfmeaItem.deleteMany).toHaveBeenCalledWith({ where: { parentId: 10 } })
      expect(prisma.fmeaDfmeaItem.delete).toHaveBeenCalledWith({ where: { id: 10 } })
    })
  })

  // ==================== Process Flow ====================

  describe('Process Flow', () => {
    it('should create process flow with auto-number', async () => {
      prisma.sysSequence.upsert.mockResolvedValue({ currentVal: 1 })
      prisma.fmeaProcessFlow.create.mockResolvedValue({ id: 1, flowNo: 'PF202610270001' })

      await service.createProcessFlow({ projectId: 1, title: '焊接工艺流程' }, 10)

      expect(prisma.fmeaProcessFlow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            flowNo: expect.stringMatching(/^PF\d{8}\d{4}$/),
          }),
        }),
      )
    })

    it('should add step to process flow', async () => {
      prisma.fmeaProcessFlowStep.create.mockResolvedValue({ id: 1 })

      await service.addProcessFlowStep(1, { stepNo: 'OP10', operationName: '上料' })

      expect(prisma.fmeaProcessFlowStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ flowId: 1, stepNo: 'OP10' }),
        }),
      )
    })
  })

  // ==================== PFMEA ====================

  describe('PFMEA', () => {
    it('should create PFMEA with auto-number', async () => {
      prisma.sysSequence.upsert.mockResolvedValue({ currentVal: 1 })
      prisma.fmeaPfmea.create.mockResolvedValue({ id: 1, fmeaNo: 'PF202610270001' })

      await service.createPfmea({ projectId: 1, title: '焊接 PFMEA' }, 10)

      expect(prisma.fmeaPfmea.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fmeaNo: expect.stringMatching(/^PF\d{8}\d{4}$/),
            status: 'draft',
          }),
        }),
      )
    })

    it('should create PFMEA item with AP calculation', async () => {
      prisma.fmeaPfmeaItem.create.mockResolvedValue({ id: 1, apRating: 'L' })

      const result = await service.createPfmeaItem(1, {
        severityRating: 2,
        occurrenceRating: 3,
        detectionRating: 4,
      })

      expect(result.apRating).toBe('L')
    })

    it('should approve PFMEA', async () => {
      prisma.fmeaPfmea.update.mockResolvedValue({ id: 1, status: 'approved' })

      await service.approvePfmea(1, 5)

      expect(prisma.fmeaPfmea.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'approved',
            approvedById: 5,
          }),
        }),
      )
    })
  })

  // ==================== Control Plan ====================

  describe('Control Plan', () => {
    it('should create control plan with auto-number', async () => {
      prisma.sysSequence.upsert.mockResolvedValue({ currentVal: 1 })
      prisma.fmeaControlPlan.create.mockResolvedValue({ id: 1, cpNo: 'CP202610270001' })

      await service.createControlPlan({ projectId: 1, title: '焊接控制计划', cpType: 'mass_production' }, 10)

      expect(prisma.fmeaControlPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cpNo: expect.stringMatching(/^CP\d{8}\d{4}$/),
            status: 'draft',
          }),
        }),
      )
    })

    it('should generate control plan items from approved PFMEA', async () => {
      prisma.fmeaControlPlan.findUnique.mockResolvedValue({
        id: 1,
        projectId: 1,
        project: { id: 1, projectName: 'Test' },
      })
      prisma.fmeaPfmea.findMany.mockResolvedValue([
        {
          id: 10,
          items: [
            {
              id: 100,
              processFlowStep: { operationName: '焊接' },
              processStep: 'OP10',
              failureMode: '虚焊',
              currentDetectionCtrl: 'X-ray检测',
              currentPreventionCtrl: '参数监控',
              recommendedAction: '增加检测频次',
              specialCharId: 'SC001',
            },
          ],
        },
      ])
      prisma.fmeaControlPlanItem.create.mockResolvedValue({ id: 1 })

      const result = await service.generateControlPlanFromPfmea(1)

      expect(result.generated).toBe(1)
      expect(prisma.fmeaControlPlanItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            controlPlanId: 1,
            partProcessName: '焊接',
            characteristicDesc: '虚焊',
            measurementMethod: 'X-ray检测',
            controlMethod: '参数监控',
          }),
        }),
      )
    })

    it('should throw error when generating from non-existent control plan', async () => {
      prisma.fmeaControlPlan.findUnique.mockResolvedValue(null)
      await expect(service.generateControlPlanFromPfmea(999)).rejects.toThrow('Control Plan not found')
    })
  })

  // ==================== Special Characteristics ====================

  describe('Special Characteristics', () => {
    it('should get traceability across DFMEA/PFMEA/ControlPlan', async () => {
      prisma.fmeaSpecialCharacteristic.findUnique.mockResolvedValue({
        id: 1,
        charCode: 'CC001',
        charType: 'critical',
      })
      prisma.fmeaDfmeaItem.findMany.mockResolvedValue([
        { id: 10, dfmea: { fmeaNo: 'DF001', title: 'DFMEA 1' } },
      ])
      prisma.fmeaPfmeaItem.findMany.mockResolvedValue([
        { id: 20, pfmea: { fmeaNo: 'PF001', title: 'PFMEA 1' } },
      ])
      prisma.fmeaControlPlanItem.findMany.mockResolvedValue([
        { id: 30, controlPlan: { cpNo: 'CP001', title: 'CP 1' } },
      ])

      const trace = await service.getSpecialCharTraceability(1)

      expect(trace.specialChar.charCode).toBe('CC001')
      expect(trace.dfmeaItems).toHaveLength(1)
      expect(trace.pfmeaItems).toHaveLength(1)
      expect(trace.cpItems).toHaveLength(1)
    })

    it('should throw error for non-existent special characteristic', async () => {
      prisma.fmeaSpecialCharacteristic.findUnique.mockResolvedValue(null)
      await expect(service.getSpecialCharTraceability(999)).rejects.toThrow('Special characteristic not found')
    })
  })

  // ==================== SPC Studies ====================

  describe('SPC Studies', () => {
    it('should create SPC study with auto-number', async () => {
      prisma.sysSequence.upsert.mockResolvedValue({ currentVal: 1 })
      prisma.qeSpcStudy.create.mockResolvedValue({ id: 1, studyNo: 'SPC202610270001' })

      await service.createSpcStudy({ projectId: 1, title: '焊接强度 SPC', chartType: 'Xbar_R' }, 10)

      expect(prisma.qeSpcStudy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studyNo: expect.stringMatching(/^SPC\d{8}\d{4}$/),
          }),
        }),
      )
    })

    it('should calculate SPC capability indices (Cp/Cpk/Pp/Ppk)', async () => {
      prisma.qeSpcStudy.findUnique
        .mockResolvedValueOnce({
          id: 1,
          subgroupSize: 5,
          usl: 100,
          lsl: 80,
          chartType: 'Xbar_R',
          dataPoints: [
            { id: 1, subgroupNo: 1, subgroupMean: 90, subgroupRange: 5, sampleValues: [88, 90, 92, 89, 91] },
            { id: 2, subgroupNo: 2, subgroupMean: 91, subgroupRange: 4, sampleValues: [89, 91, 93, 90, 92] },
            { id: 3, subgroupNo: 3, subgroupMean: 89, subgroupRange: 6, sampleValues: [87, 89, 91, 88, 90] },
          ],
        })
        .mockResolvedValueOnce({
          id: 1,
          chartType: 'Xbar_R',
          ucl: 95,
          lcl: 85,
          cp: 1.2,
          cpk: 1.1,
          pp: 1.15,
          ppk: 1.05,
          capabilityResult: 'marginal',
          dataPoints: [],
        })
      prisma.qeSpcStudy.update.mockResolvedValue({ id: 1 })
      prisma.qeSpcDataPoint.update.mockResolvedValue({})

      const result = await service.calculateSpc(1)

      expect(prisma.qeSpcStudy.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            capabilityResult: expect.any(String),
            ucl: expect.any(Number),
            lcl: expect.any(Number),
          }),
        }),
      )
    })

    it('should throw error when calculating SPC with no data', async () => {
      prisma.qeSpcStudy.findUnique.mockResolvedValue({
        id: 1,
        dataPoints: [],
      })

      await expect(service.calculateSpc(1)).rejects.toThrow('No data points')
    })

    it('should get SPC chart data', async () => {
      prisma.qeSpcStudy.findUnique.mockResolvedValue({
        id: 1,
        chartType: 'Xbar_R',
        ucl: 95,
        lcl: 85,
        usl: 100,
        lsl: 80,
        cp: 1.33,
        cpk: 1.2,
        pp: 1.25,
        ppk: 1.1,
        capabilityResult: 'capable',
        dataPoints: [
          { subgroupNo: 1, subgroupMean: 90, subgroupRange: 5, isOutOfControl: false, violationRule: null },
        ],
      })

      const chart = await service.getSpcChartData(1)

      expect(chart.study.chartType).toBe('Xbar_R')
      expect(chart.study.cp).toBe(1.33)
      expect(chart.dataPoints).toHaveLength(1)
    })
  })

  // ==================== MSA Studies ====================

  describe('MSA Studies', () => {
    it('should create MSA study with auto-number', async () => {
      prisma.sysSequence.upsert.mockResolvedValue({ currentVal: 1 })
      prisma.qeMsaStudy.create.mockResolvedValue({ id: 1, studyNo: 'MSA202610270001' })

      await service.createMsaStudy({ projectId: 1, title: '量具 R&R 研究', studyType: 'grt' }, 10)

      expect(prisma.qeMsaStudy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studyNo: expect.stringMatching(/^MSA\d{8}\d{4}$/),
          }),
        }),
      )
    })

    it('should calculate MSA GRR with EV/AV/GRR/PV/TV/NDC', async () => {
      prisma.qeMsaStudy.findUnique.mockResolvedValue({
        id: 1,
        numOperators: 3,
        numParts: 5,
        numTrials: 2,
        tolerance: 10,
        measurements: [
          { partId: 1, operatorId: 1, trialNo: 1, measuredValue: 5.1 },
          { partId: 1, operatorId: 1, trialNo: 2, measuredValue: 5.2 },
          { partId: 1, operatorId: 2, trialNo: 1, measuredValue: 5.0 },
          { partId: 1, operatorId: 2, trialNo: 2, measuredValue: 5.1 },
          { partId: 1, operatorId: 3, trialNo: 1, measuredValue: 5.2 },
          { partId: 1, operatorId: 3, trialNo: 2, measuredValue: 5.3 },
          { partId: 2, operatorId: 1, trialNo: 1, measuredValue: 4.8 },
          { partId: 2, operatorId: 1, trialNo: 2, measuredValue: 4.9 },
          { partId: 2, operatorId: 2, trialNo: 1, measuredValue: 4.7 },
          { partId: 2, operatorId: 2, trialNo: 2, measuredValue: 4.8 },
          { partId: 2, operatorId: 3, trialNo: 1, measuredValue: 4.9 },
          { partId: 2, operatorId: 3, trialNo: 2, measuredValue: 5.0 },
        ],
      })
      prisma.qeMsaStudy.update.mockResolvedValue({ id: 1, grrPercent: 15, acceptanceResult: 'marginal' })

      const result = await service.calculateMsaGrr(1)

      expect(prisma.qeMsaStudy.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            grrPercent: expect.any(Number),
            evPercent: expect.any(Number),
            avPercent: expect.any(Number),
            ndc: expect.any(Number),
            acceptanceResult: expect.stringMatching(/acceptable|marginal|unacceptable/),
          }),
        }),
      )
    })

    it('should throw error when calculating GRR with no measurements', async () => {
      prisma.qeMsaStudy.findUnique.mockResolvedValue({
        id: 1,
        measurements: [],
      })

      await expect(service.calculateMsaGrr(1)).rejects.toThrow('No measurements')
    })
  })

  // ==================== Knowledge Base ====================

  describe('Knowledge Base', () => {
    it('should recommend entries by keyword matching', async () => {
      prisma.fmeaKnowledgeBase.findMany.mockResolvedValue([
        { id: 1, title: '焊接虚焊对策', description: '调整焊接参数', tags: '焊接,虚焊,参数', applicableFmeaType: 'pfmea', usageCount: 10 },
        { id: 2, title: '尺寸偏差对策', description: '校准夹具', tags: '尺寸,偏差,夹具', applicableFmeaType: 'pfmea', usageCount: 5 },
        { id: 3, title: '焊接裂纹对策', description: '预热处理', tags: '焊接,裂纹,预热', applicableFmeaType: 'both', usageCount: 8 },
      ])

      const results = await service.recommendKbEntries('焊接 虚焊', 'pfmea')

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].score).toBeGreaterThan(0)
    })

    it('should increment knowledge base usage count', async () => {
      prisma.fmeaKnowledgeBase.update.mockResolvedValue({ id: 1, usageCount: 11 })

      await service.incrementKbUsage(1)

      expect(prisma.fmeaKnowledgeBase.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { usageCount: { increment: 1 } },
      })
    })

    it('should get reference tables for severity/occurrence/detection', async () => {
      const tables = await service.getReferenceTables()

      expect(tables.severityTable).toHaveLength(10)
      expect(tables.occurrenceTable).toHaveLength(10)
      expect(tables.detectionTable).toHaveLength(10)
      expect(tables.severityTable[0].rating).toBe(1)
      expect(tables.severityTable[9].rating).toBe(10)
    })
  })

  // ==================== Statistics ====================

  describe('Statistics', () => {
    it('should get overview stats with all counts', async () => {
      prisma.fmeaDfmea.count.mockResolvedValue(10)
      prisma.fmeaPfmea.count.mockResolvedValue(8)
      prisma.fmeaControlPlan.count.mockResolvedValue(5)
      prisma.fmeaSpecialCharacteristic.count.mockResolvedValue(20)
      prisma.qeSpcStudy.count.mockResolvedValue(3)
      prisma.qeMsaStudy.count.mockResolvedValue(2)
      prisma.fmeaDfmeaItem.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(5)
      prisma.fmeaPfmeaItem.count
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(3)

      const stats = await service.getOverviewStats(1)

      expect(stats.dfmeas).toBe(10)
      expect(stats.pfmeas).toBe(8)
      expect(stats.controlPlans).toBe(5)
      expect(stats.specialChars).toBe(20)
      expect(stats.highApCount).toBe(8)
    })

    it('should get AP distribution by H/M/L', async () => {
      prisma.fmeaDfmeaItem.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(85)
      prisma.fmeaPfmeaItem.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(70)

      const dist = await service.getApDistribution(1)

      expect(dist.dfmea.high).toBe(5)
      expect(dist.dfmea.medium).toBe(10)
      expect(dist.dfmea.low).toBe(85)
      expect(dist.pfmea.high).toBe(3)
      expect(dist.pfmea.medium).toBe(7)
      expect(dist.pfmea.low).toBe(70)
    })
  })
})
