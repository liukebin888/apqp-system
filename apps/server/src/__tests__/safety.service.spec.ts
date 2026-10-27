import { NotFoundException } from '@nestjs/common'
import { SafetyService } from '../modules/safety/safety.service'
import { createMockPrismaService } from './helpers/prisma.mock'

describe('SafetyService', () => {
  let service: SafetyService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(() => {
    prisma = createMockPrismaService()
    service = new SafetyService(prisma as any)
  })

  // ==================== Hazard Analysis ====================

  describe('Hazard Analysis', () => {
    it('should list hazards with projectId filter', async () => {
      prisma.safetyHazardAnalysis.findMany.mockResolvedValue([{ id: 1 }])
      prisma.safetyHazardAnalysis.count.mockResolvedValue(1)

      const result = await service.findAllHazards({ projectId: '5' })

      expect(prisma.safetyHazardAnalysis.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId: 5 } }),
      )
      expect(result).toEqual({ items: [{ id: 1 }], total: 1 })
    })

    it('should filter hazards by status and asil', async () => {
      prisma.safetyHazardAnalysis.findMany.mockResolvedValue([])
      prisma.safetyHazardAnalysis.count.mockResolvedValue(0)

      await service.findAllHazards({ status: 'open', asil: 'D' })

      expect(prisma.safetyHazardAnalysis.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'open', calculatedAsil: 'D' },
        }),
      )
    })

    it('should find one hazard by id', async () => {
      const hazard = { id: 1, title: '电池过热' }
      prisma.safetyHazardAnalysis.findUnique.mockResolvedValue(hazard)

      const result = await service.findOneHazard(1)
      expect(result).toEqual(hazard)
    })

    it('should throw NotFoundException for missing hazard', async () => {
      prisma.safetyHazardAnalysis.findUnique.mockResolvedValue(null)
      await expect(service.findOneHazard(999)).rejects.toThrow(NotFoundException)
    })

    it('should create hazard with ASIL auto-calculation (QM)', async () => {
      const data = { projectId: '1', severityRating: 0, exposureRating: 1, controllabilityRating: 1 }
      prisma.safetyHazardAnalysis.count.mockResolvedValue(0)
      prisma.safetyHazardAnalysis.create.mockResolvedValue({ id: 1, calculatedAsil: 'QM' })

      const result = await service.createHazard(data, 10)

      expect(prisma.safetyHazardAnalysis.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            calculatedAsil: 'QM',
            createdById: 10,
          }),
        }),
      )
      expect(result.calculatedAsil).toBe('QM')
    })

    it('should calculate ASIL D for max severity/exposure/controllability', async () => {
      const data = { projectId: '1', severityRating: 4, exposureRating: 4, controllabilityRating: 3 }
      prisma.safetyHazardAnalysis.count.mockResolvedValue(0)
      prisma.safetyHazardAnalysis.create.mockResolvedValue({ id: 1, calculatedAsil: 'D' })

      const result = await service.createHazard(data, 10)
      expect(result.calculatedAsil).toBe('D')
    })

    it('should update hazard and recalculate ASIL', async () => {
      prisma.safetyHazardAnalysis.findUnique.mockResolvedValue({ id: 1, severityRating: 2, exposureRating: 2, controllabilityRating: 2 })
      prisma.safetyHazardAnalysis.update.mockResolvedValue({ id: 1, calculatedAsil: 'D' })

      const result = await service.updateHazard(1, { severityRating: 4, exposureRating: 3, controllabilityRating: 3 })

      expect(prisma.safetyHazardAnalysis.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ calculatedAsil: 'D' }),
        }),
      )
    })

    it('should throw NotFoundException when updating missing hazard', async () => {
      prisma.safetyHazardAnalysis.findUnique.mockResolvedValue(null)
      await expect(service.updateHazard(999, {})).rejects.toThrow(NotFoundException)
    })

    it('should delete hazard', async () => {
      prisma.safetyHazardAnalysis.delete.mockResolvedValue({})
      const result = await service.deleteHazard(1)
      expect(result).toEqual({ success: true })
    })

    it('should get hazard stats grouped by ASIL and status', async () => {
      prisma.safetyHazardAnalysis.findMany.mockResolvedValue([
        { calculatedAsil: 'D', status: 'open' },
        { calculatedAsil: 'D', status: 'open' },
        { calculatedAsil: 'A', status: 'closed' },
        { calculatedAsil: 'QM', status: 'open' },
      ])

      const stats = await service.getHazardStats(1)

      expect(stats.total).toBe(4)
      expect(stats.byAsil.D).toBe(2)
      expect(stats.byAsil.A).toBe(1)
      expect(stats.byAsil.QM).toBe(1)
      expect(stats.byStatus.open).toBe(3)
      expect(stats.byStatus.closed).toBe(1)
    })
  })

  // ==================== Safety Goals ====================

  describe('Safety Goals', () => {
    it('should list goals with filters', async () => {
      prisma.safetyGoal.findMany.mockResolvedValue([{ id: 1 }])
      prisma.safetyGoal.count.mockResolvedValue(1)

      const result = await service.findAllGoals({ projectId: '3', targetAsil: 'D' })

      expect(prisma.safetyGoal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 3, targetAsil: 'D' },
        }),
      )
      expect(result.items).toHaveLength(1)
    })

    it('should build goal tree from flat list', async () => {
      prisma.safetyGoal.findMany.mockResolvedValue([
        { id: 1, parentGoalId: null, title: 'Root Goal' },
        { id: 2, parentGoalId: 1, title: 'Child Goal' },
        { id: 3, parentGoalId: null, title: 'Another Root' },
      ])

      const tree = await service.getGoalTree(1)

      expect(tree).toHaveLength(2)
      expect(tree[0].children).toHaveLength(1)
      expect(tree[0].children[0].title).toBe('Child Goal')
      expect(tree[1].children).toHaveLength(0)
    })

    it('should throw NotFoundException for missing goal', async () => {
      prisma.safetyGoal.findUnique.mockResolvedValue(null)
      await expect(service.findOneGoal(999)).rejects.toThrow(NotFoundException)
    })
  })

  // ==================== FTA Events ====================

  describe('FTA Events', () => {
    it('should find top events (parentId = null)', async () => {
      prisma.safetyFtaEvent.findMany.mockResolvedValue([{ id: 1 }])
      prisma.safetyFtaEvent.count.mockResolvedValue(1)

      await service.findTopEvents({ projectId: '1' })

      expect(prisma.safetyFtaEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ parentId: null, projectId: 1 }),
        }),
      )
    })

    it('should calculate AND gate probability (product of children)', async () => {
      const events = [
        { id: 1, parentId: null, gateType: 'and', projectId: 1, probability: null, votingK: null },
        { id: 2, parentId: 1, gateType: null, projectId: 1, probability: 0.1, votingK: null },
        { id: 3, parentId: 1, gateType: null, projectId: 1, probability: 0.2, votingK: null },
      ]
      prisma.safetyFtaEvent.findUnique.mockResolvedValue(events[0])
      prisma.safetyFtaEvent.findMany.mockResolvedValue(events)
      prisma.safetyFtaEvent.update.mockResolvedValue({})

      const result = await service.calculateFtaProbabilities(1)

      expect(result.probability).toBeCloseTo(0.02)
    })

    it('should calculate OR gate probability (1 - product of complements)', async () => {
      const events = [
        { id: 1, parentId: null, gateType: 'or', projectId: 1, probability: null, votingK: null },
        { id: 2, parentId: 1, gateType: null, projectId: 1, probability: 0.1, votingK: null },
        { id: 3, parentId: 1, gateType: null, projectId: 1, probability: 0.2, votingK: null },
      ]
      prisma.safetyFtaEvent.findUnique.mockResolvedValue(events[0])
      prisma.safetyFtaEvent.findMany.mockResolvedValue(events)
      prisma.safetyFtaEvent.update.mockResolvedValue({})

      const result = await service.calculateFtaProbabilities(1)

      expect(result.probability).toBeCloseTo(0.28)
    })

    it('should throw NotFoundException for missing top event', async () => {
      prisma.safetyFtaEvent.findUnique.mockResolvedValue(null)
      await expect(service.calculateFtaProbabilities(999)).rejects.toThrow(NotFoundException)
    })

    it('should build FTA tree data', async () => {
      prisma.safetyFtaEvent.findMany.mockResolvedValue([
        { id: 1, parentId: null, title: 'Top' },
        { id: 2, parentId: 1, title: 'Mid' },
        { id: 3, parentId: 2, title: 'Leaf' },
      ])

      const tree = await service.getFtaTreeData(1)

      expect(tree).toHaveLength(1)
      expect(tree[0].children[0].children[0].title).toBe('Leaf')
    })
  })

  // ==================== Safety Cases ====================

  describe('Safety Cases', () => {
    it('should create case with auto-number', async () => {
      prisma.safetyCase.count.mockResolvedValue(2)
      prisma.safetyCase.create.mockResolvedValue({ id: 1, caseNo: 'SC202610270003' })

      const result = await service.createCase({ projectId: '1', version: '2' }, 10)

      expect(prisma.safetyCase.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 2,
            createdById: 10,
          }),
        }),
      )
    })

    it('should approve case', async () => {
      prisma.safetyCase.update.mockResolvedValue({ id: 1, status: 'approved' })

      await service.approveCase(1, 5)

      expect(prisma.safetyCase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'approved',
            approvedById: 5,
          }),
        }),
      )
    })

    it('should build compliance matrix with coverage rate', async () => {
      prisma.safetyCase.findUnique.mockResolvedValue({
        id: 1,
        arguments: [
          {
            id: 10, nodeType: 'goal', argumentNo: 'ARG-001', title: 'Goal 1',
            goal: { id: 1, goalNo: 'SG001', title: 'Safety Goal', targetAsil: 'D' },
            evidences: [
              { id: 100, evidenceType: 'test', status: 'verified' },
              { id: 101, evidenceType: 'analysis', status: 'accepted' },
            ],
          },
          {
            id: 11, nodeType: 'goal', argumentNo: 'ARG-002', title: 'Goal 2',
            goal: { id: 2, goalNo: 'SG002', title: 'Safety Goal 2', targetAsil: 'C' },
            evidences: [
              { id: 102, evidenceType: 'test', status: 'pending' },
            ],
          },
          {
            id: 12, nodeType: 'goal', argumentNo: 'ARG-003', title: 'Goal 3',
            goal: null,
            evidences: [],
          },
        ],
      })

      const matrix = await service.getComplianceMatrix(1)

      expect(matrix.totalGoals).toBe(3)
      expect(matrix.coveredGoals).toBe(1)
      expect(matrix.coverageRate).toBe(33)
      expect(matrix.matrix[0].status).toBe('covered')
      expect(matrix.matrix[1].status).toBe('partial')
      expect(matrix.matrix[2].status).toBe('uncovered')
    })

    it('should throw NotFoundException for missing safety case in compliance matrix', async () => {
      prisma.safetyCase.findUnique.mockResolvedValue(null)
      await expect(service.getComplianceMatrix(999)).rejects.toThrow(NotFoundException)
    })
  })

  // ==================== Safety Reviews ====================

  describe('Safety Reviews', () => {
    it('should create review with auto-number and default status', async () => {
      prisma.safetyReview.count.mockResolvedValue(0)
      prisma.safetyReview.create.mockResolvedValue({ id: 1, reviewNo: 'SR202610270001', status: 'planned' })

      const result = await service.createReview(
        { projectId: 1, title: 'Design Review', reviewType: 'peer', plannedDate: '2026-10-27' },
        10,
      )

      expect(prisma.safetyReview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'planned' }),
        }),
      )
    })

    it('should complete review with conclusion', async () => {
      prisma.safetyReview.update.mockResolvedValue({ id: 1, status: 'completed' })

      await service.completeReview(1, { conclusion: 'Pass', findingsSummary: 'No issues' })

      expect(prisma.safetyReview.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'completed',
            conclusion: 'Pass',
          }),
        }),
      )
    })

    it('should throw NotFoundException when updating missing review', async () => {
      prisma.safetyReview.findUnique.mockResolvedValue(null)
      await expect(service.updateReview(999, {})).rejects.toThrow(NotFoundException)
    })
  })

  // ==================== Safety Concepts ====================

  describe('Safety Concepts', () => {
    it('should build concept tree', async () => {
      prisma.safetyConcept.findMany.mockResolvedValue([
        { id: 1, parentConceptId: null, title: 'FSC' },
        { id: 2, parentConceptId: 1, title: 'TSC-1' },
        { id: 3, parentConceptId: 1, title: 'TSC-2' },
      ])

      const tree = await service.getConceptTree(1)

      expect(tree).toHaveLength(1)
      expect(tree[0].children).toHaveLength(2)
    })

    it('should create concept with auto-number', async () => {
      prisma.safetyConcept.count.mockResolvedValue(0)
      prisma.safetyConcept.create.mockResolvedValue({ id: 1, conceptNo: 'CN202610270001' })

      await service.createConcept({ projectId: '1', goalId: '5' }, 10)

      expect(prisma.safetyConcept.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            goalId: 5,
            createdById: 10,
          }),
        }),
      )
    })
  })

  // ==================== Safety Requirements ====================

  describe('Safety Requirements', () => {
    it('should get traceability matrix with coverage stats', async () => {
      prisma.safetyRequirement.findMany.mockResolvedValue([
        { id: 1, reqNo: 'SR001', title: 'Req 1', reqType: 'functional', asilLevel: 'D', status: 'approved', goalId: 1, conceptId: 1, sourceReqId: null, goal: { goalNo: 'SG001' }, concept: { conceptNo: 'CN001' }, sourceReq: null },
        { id: 2, reqNo: 'SR002', title: 'Req 2', reqType: 'technical', asilLevel: 'C', status: 'draft', goalId: null, conceptId: 1, sourceReqId: 1, goal: null, concept: { conceptNo: 'CN001' }, sourceReq: { reqCode: 'SRC001' } },
      ])

      const matrix = await service.getTraceabilityMatrix(1)

      expect(matrix.totalRequirements).toBe(2)
      expect(matrix.tracedToGoal).toBe(1)
      expect(matrix.tracedToConcept).toBe(2)
      expect(matrix.tracedToSource).toBe(1)
      expect(matrix.goalCoverage).toBe(50)
      expect(matrix.byAsil.D).toBe(1)
      expect(matrix.byAsil.C).toBe(1)
    })
  })

  // ==================== Tool Qualification ====================

  describe('Tool Qualification', () => {
    it('should create tool with date parsing', async () => {
      prisma.toolQualification.count.mockResolvedValue(0)
      prisma.toolQualification.create.mockResolvedValue({ id: 1 })

      await service.createTool(
        { projectId: '1', qualifiedAt: '2026-01-15', expiresAt: '2027-01-15' },
        10,
      )

      expect(prisma.toolQualification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            qualifiedAt: expect.any(Date),
            expiresAt: expect.any(Date),
          }),
        }),
      )
    })

    it('should throw NotFoundException when updating missing tool', async () => {
      prisma.toolQualification.findUnique.mockResolvedValue(null)
      await expect(service.updateTool(999, {})).rejects.toThrow(NotFoundException)
    })
  })

  // ==================== Confirmation Measures ====================

  describe('Confirmation Measures', () => {
    it('should complete measure with pass/fail status', async () => {
      prisma.confirmationMeasure.update.mockResolvedValue({ id: 1, status: 'passed' })

      await service.completeMeasure(1, { passed: true, result: 'All tests passed' })

      expect(prisma.confirmationMeasure.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'passed' }),
        }),
      )
    })

    it('should set status to failed when passed is false', async () => {
      prisma.confirmationMeasure.update.mockResolvedValue({ id: 1, status: 'failed' })

      await service.completeMeasure(1, { passed: false, result: 'Test failed' })

      expect(prisma.confirmationMeasure.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'failed' }),
        }),
      )
    })
  })
})
