import { BadRequestException } from '@nestjs/common'
import { ChangeService } from '../modules/change/change.service'
import { createMockPrismaService } from './helpers/prisma.mock'

describe('ChangeService', () => {
  let service: ChangeService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(() => {
    prisma = createMockPrismaService()
    service = new ChangeService(prisma as any)
  })

  // ==================== ECR CRUD ====================

  describe('findAllEcrs', () => {
    it('returns ECRs with filters', async () => {
      const mockData = [{ id: 1, ecrCode: 'ECR202610270001' }]
      prisma.chgEcr.findMany.mockResolvedValue(mockData)
      const result = await service.findAllEcrs(1, 'draft', 'design', 'high')
      expect(result).toEqual(mockData)
      expect(prisma.chgEcr.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 1, status: 'draft', changeType: 'design', priority: 'high' },
        }),
      )
    })

    it('returns all ECRs when no filters', async () => {
      prisma.chgEcr.findMany.mockResolvedValue([])
      await service.findAllEcrs()
      expect(prisma.chgEcr.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      )
    })
  })

  describe('findOneEcr', () => {
    it('returns ECR with includes', async () => {
      const mockData = { id: 1, ecrCode: 'ECR202610270001', impactItems: [], ccbReviews: [], ecns: [] }
      prisma.chgEcr.findUnique.mockResolvedValue(mockData)
      const result = await service.findOneEcr(1)
      expect(result).toEqual(mockData)
    })
  })

  describe('createEcr', () => {
    it('creates ECR with auto-number', async () => {
      prisma.chgEcr.count.mockResolvedValue(0)
      prisma.chgEcr.create.mockResolvedValue({ id: 1 })
      await service.createEcr({
        title: 'Design Change',
        description: 'Update design spec',
        changeType: 'design',
        priority: 'high',
        projectId: 1,
        targetDate: '2026-12-01',
        estimatedCost: '5000.50',
        safetyRelated: true,
      }, 2)

      expect(prisma.chgEcr.create).toHaveBeenCalled()
      const callData = prisma.chgEcr.create.mock.calls[0][0].data
      expect(callData.ecrCode).toMatch(/^ECR\d{8}\d{4}$/)
      expect(callData.title).toBe('Design Change')
      expect(callData.priority).toBe('high')
      expect(callData.estimatedCost).toBe(5000.5)
      expect(callData.safetyRelated).toBe(true)
      expect(callData.status).toBe('draft')
      expect(callData.requesterId).toBe(2)
    })
  })

  describe('updateEcr', () => {
    it('updates draft ECR', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'draft', title: 'Old' })
      prisma.chgEcr.update.mockResolvedValue({ id: 1 })
      await service.updateEcr(1, { title: 'Updated' })
      expect(prisma.chgEcr.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'Updated' }),
        }),
      )
    })

    it('throws if ECR not found', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue(null)
      await expect(service.updateEcr(1, { title: 'Updated' }))
        .rejects.toThrow(BadRequestException)
    })

    it('throws if ECR is not draft', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'submitted' })
      await expect(service.updateEcr(1, { title: 'Updated' }))
        .rejects.toThrow('Can only edit ECR in draft status')
    })
  })

  describe('deleteEcr', () => {
    it('deletes draft ECR', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'draft' })
      prisma.chgEcr.delete.mockResolvedValue({})
      await service.deleteEcr(1)
      expect(prisma.chgEcr.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })

    it('throws if ECR not found', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue(null)
      await expect(service.deleteEcr(1))
        .rejects.toThrow(BadRequestException)
    })

    it('throws if ECR is not draft', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'approved' })
      await expect(service.deleteEcr(1))
        .rejects.toThrow('Can only delete ECR in draft status')
    })
  })

  // ==================== ECR Workflow ====================

  describe('ECR workflow transitions', () => {
    it('submitEcr transitions draft to submitted', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'draft' })
      prisma.chgEcr.update.mockResolvedValue({ id: 1, status: 'submitted' })
      await service.submitEcr(1)
      expect(prisma.chgEcr.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'submitted', submittedAt: expect.any(Date) }),
        }),
      )
    })

    it('startImpactAnalysis transitions submitted to impact_analysis', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'submitted' })
      prisma.chgEcr.update.mockResolvedValue({ id: 1, status: 'impact_analysis' })
      await service.startImpactAnalysis(1)
      expect(prisma.chgEcr.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'impact_analysis' }),
        }),
      )
    })

    it('submitToCcb transitions impact_analysis to ccb_review', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'impact_analysis' })
      prisma.chgEcr.update.mockResolvedValue({ id: 1, status: 'ccb_review' })
      await service.submitToCcb(1)
      expect(prisma.chgEcr.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ccb_review' }),
        }),
      )
    })

    it('throws on invalid transition', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'draft' })
      await expect(service.startImpactAnalysis(1))
        .rejects.toThrow('Cannot transition from draft to impact_analysis')
    })

    it('closeEcr transitions approved to closed', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'approved' })
      prisma.chgEcr.update.mockResolvedValue({ id: 1, status: 'closed' })
      await service.closeEcr(1)
      expect(prisma.chgEcr.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'closed', closedAt: expect.any(Date) }),
        }),
      )
    })
  })

  describe('approveEcr', () => {
    it('approves ECR in ccb_review and creates review record', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'ccb_review' })
      prisma.chgCcbReview.create.mockResolvedValue({ id: 1 })
      prisma.chgEcr.update.mockResolvedValue({ id: 1, status: 'approved' })

      await service.approveEcr(1, 2, 'Looks good', 'No conditions')

      expect(prisma.chgCcbReview.create).toHaveBeenCalledWith({
        data: {
          ecrId: 1,
          reviewerId: 2,
          decision: 'approve',
          opinion: 'Looks good',
          conditions: 'No conditions',
        },
      })
      expect(prisma.chgEcr.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'approved', approvedAt: expect.any(Date) }),
        }),
      )
    })

    it('throws if ECR not found', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue(null)
      await expect(service.approveEcr(1, 2))
        .rejects.toThrow(BadRequestException)
    })

    it('throws if ECR is not in ccb_review', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'submitted' })
      await expect(service.approveEcr(1, 2))
        .rejects.toThrow('ECR must be in CCB review status to approve')
    })
  })

  describe('rejectEcr', () => {
    it('rejects ECR in ccb_review and creates review record', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'ccb_review' })
      prisma.chgCcbReview.create.mockResolvedValue({ id: 1 })
      prisma.chgEcr.update.mockResolvedValue({ id: 1, status: 'rejected' })

      await service.rejectEcr(1, 2, 'Needs rework')

      expect(prisma.chgCcbReview.create).toHaveBeenCalledWith({
        data: {
          ecrId: 1,
          reviewerId: 2,
          decision: 'reject',
          opinion: 'Needs rework',
        },
      })
      expect(prisma.chgEcr.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'rejected' }),
        }),
      )
    })

    it('throws if ECR is not in ccb_review', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'approved' })
      await expect(service.rejectEcr(1, 2))
        .rejects.toThrow('ECR must be in CCB review status to reject')
    })
  })

  // ==================== ECR Impact Items ====================

  describe('createImpactItem', () => {
    it('creates impact item with auto sortOrder', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1 })
      prisma.chgEcrImpactItem.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } })
      prisma.chgEcrImpactItem.create.mockResolvedValue({ id: 1, sortOrder: 3 })

      await service.createImpactItem(1, {
        impactArea: 'bom',
        affectedItem: 'M001',
        impactLevel: 'high',
        description: 'BOM update required',
      })

      expect(prisma.chgEcrImpactItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ecrId: 1,
          impactArea: 'bom',
          sortOrder: 3,
        }),
      })
    })

    it('throws if ECR not found', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue(null)
      await expect(service.createImpactItem(1, { impactArea: 'bom' }))
        .rejects.toThrow(BadRequestException)
    })
  })

  describe('updateImpactItem', () => {
    it('updates impact item', async () => {
      prisma.chgEcrImpactItem.update.mockResolvedValue({ id: 1 })
      await service.updateImpactItem(1, { impactLevel: 'low' })
      expect(prisma.chgEcrImpactItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { impactLevel: 'low' },
        }),
      )
    })
  })

  describe('deleteImpactItem', () => {
    it('deletes impact item', async () => {
      prisma.chgEcrImpactItem.delete.mockResolvedValue({})
      await service.deleteImpactItem(1)
      expect(prisma.chgEcrImpactItem.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })
  })

  // ==================== CCB Reviews ====================

  describe('findCcbReviews', () => {
    it('returns reviews with filters', async () => {
      prisma.chgCcbReview.findMany.mockResolvedValue([])
      await service.findCcbReviews(1, 'approve')
      expect(prisma.chgCcbReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ecrId: 1, decision: 'approve' } }),
      )
    })
  })

  describe('createCcbReview', () => {
    it('creates CCB review', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1 })
      prisma.chgCcbReview.create.mockResolvedValue({ id: 1 })
      await service.createCcbReview(1, {
        reviewerId: 2,
        decision: 'conditional',
        opinion: 'Approved with conditions',
        conditions: 'Must pass testing',
        nextReviewDate: '2026-11-15',
      })

      expect(prisma.chgCcbReview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ecrId: 1,
            reviewerId: 2,
            decision: 'conditional',
            nextReviewDate: expect.any(Date),
          }),
        }),
      )
    })

    it('throws if ECR not found', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue(null)
      await expect(service.createCcbReview(1, { reviewerId: 2, decision: 'approve' }))
        .rejects.toThrow(BadRequestException)
    })
  })

  describe('updateCcbReview', () => {
    it('updates CCB review', async () => {
      prisma.chgCcbReview.update.mockResolvedValue({ id: 1 })
      await service.updateCcbReview(1, { decision: 'reject', opinion: 'Rejected' })
      expect(prisma.chgCcbReview.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { decision: 'reject', opinion: 'Rejected' },
        }),
      )
    })
  })

  // ==================== ECN CRUD ====================

  describe('findAllEcns', () => {
    it('returns ECNs with filters', async () => {
      prisma.chgEcn.findMany.mockResolvedValue([])
      await service.findAllEcns(1, 'planning', 5)
      expect(prisma.chgEcn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId: 1, status: 'planning', ecrId: 5 } }),
      )
    })
  })

  describe('findOneEcn', () => {
    it('returns ECN with includes', async () => {
      const mockData = { id: 1, ecnCode: 'ECN202610270001', actionItems: [] }
      prisma.chgEcn.findUnique.mockResolvedValue(mockData)
      const result = await service.findOneEcn(1)
      expect(result).toEqual(mockData)
    })
  })

  describe('createEcnFromEcr', () => {
    it('creates ECN from approved ECR', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({
        id: 1,
        status: 'approved',
        projectId: 10,
        title: 'Design Change',
        proposedChange: 'Update spec',
      })
      prisma.chgEcn.count.mockResolvedValue(0)
      prisma.chgEcn.create.mockResolvedValue({ id: 1 })

      await service.createEcnFromEcr(1, {
        title: 'ECN Title',
        effectiveDate: '2026-12-01',
      }, 2)

      expect(prisma.chgEcn.create).toHaveBeenCalled()
      const callData = prisma.chgEcn.create.mock.calls[0][0].data
      expect(callData.ecnCode).toMatch(/^ECN\d{8}\d{4}$/)
      expect(callData.ecrId).toBe(1)
      expect(callData.projectId).toBe(10)
      expect(callData.title).toBe('ECN Title')
      expect(callData.status).toBe('planning')
    })

    it('throws if ECR not found', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue(null)
      await expect(service.createEcnFromEcr(1, {}, 2))
        .rejects.toThrow(BadRequestException)
    })

    it('throws if ECR is not approved', async () => {
      prisma.chgEcr.findUnique.mockResolvedValue({ id: 1, status: 'submitted' })
      await expect(service.createEcnFromEcr(1, {}, 2))
        .rejects.toThrow('Can only create ECN from approved ECR')
    })
  })

  describe('updateEcn', () => {
    it('updates ECN', async () => {
      prisma.chgEcn.findUnique.mockResolvedValue({ id: 1, title: 'Old' })
      prisma.chgEcn.update.mockResolvedValue({ id: 1 })
      await service.updateEcn(1, { title: 'Updated', effectiveDate: '2026-12-15' })
      expect(prisma.chgEcn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Updated',
            effectiveDate: expect.any(Date),
          }),
        }),
      )
    })

    it('throws if ECN not found', async () => {
      prisma.chgEcn.findUnique.mockResolvedValue(null)
      await expect(service.updateEcn(1, { title: 'Updated' }))
        .rejects.toThrow(BadRequestException)
    })
  })

  // ==================== ECN Workflow ====================

  describe('ECN workflow transitions', () => {
    it('startEcnExecution transitions planning to executing', async () => {
      prisma.chgEcn.findUnique.mockResolvedValue({ id: 1, status: 'planning' })
      prisma.chgEcn.update.mockResolvedValue({ id: 1, status: 'executing' })
      await service.startEcnExecution(1)
      expect(prisma.chgEcn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'executing' }),
        }),
      )
    })

    it('startEcnVerification transitions executing to verifying', async () => {
      prisma.chgEcn.findUnique.mockResolvedValue({ id: 1, status: 'executing' })
      prisma.chgEcn.update.mockResolvedValue({ id: 1, status: 'verifying' })
      await service.startEcnVerification(1)
      expect(prisma.chgEcn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'verifying' }),
        }),
      )
    })

    it('throws on invalid transition', async () => {
      prisma.chgEcn.findUnique.mockResolvedValue({ id: 1, status: 'planning' })
      await expect(service.startEcnVerification(1))
        .rejects.toThrow('Cannot transition from planning to verifying')
    })
  })

  describe('closeEcn', () => {
    it('closes ECN in verifying status with no pending actions', async () => {
      prisma.chgEcn.findUnique.mockResolvedValue({ id: 1, status: 'verifying' })
      prisma.chgEcnActionItem.count.mockResolvedValue(0)
      prisma.chgEcn.update.mockResolvedValue({ id: 1, status: 'closed' })

      await service.closeEcn(1, 2)

      expect(prisma.chgEcn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'closed',
            verifiedById: 2,
            verifiedAt: expect.any(Date),
            closedAt: expect.any(Date),
          }),
        }),
      )
    })

    it('throws if ECN not found', async () => {
      prisma.chgEcn.findUnique.mockResolvedValue(null)
      await expect(service.closeEcn(1, 2))
        .rejects.toThrow(BadRequestException)
    })

    it('throws if ECN is not in verifying', async () => {
      prisma.chgEcn.findUnique.mockResolvedValue({ id: 1, status: 'executing' })
      await expect(service.closeEcn(1, 2))
        .rejects.toThrow('ECN must be in verifying status to close')
    })

    it('throws if there are pending action items', async () => {
      prisma.chgEcn.findUnique.mockResolvedValue({ id: 1, status: 'verifying' })
      prisma.chgEcnActionItem.count.mockResolvedValue(3)
      await expect(service.closeEcn(1, 2))
        .rejects.toThrow('Cannot close ECN: 3 action items still pending')
    })
  })

  // ==================== ECN Action Items ====================

  describe('createActionItem', () => {
    it('creates action item with auto sortOrder', async () => {
      prisma.chgEcn.findUnique.mockResolvedValue({ id: 1 })
      prisma.chgEcnActionItem.aggregate.mockResolvedValue({ _max: { sortOrder: 1 } })
      prisma.chgEcnActionItem.create.mockResolvedValue({ id: 1, sortOrder: 2 })

      await service.createActionItem(1, {
        actionType: 'update_bom',
        description: 'Update BOM',
        assignedToId: 3,
        dueDate: '2026-11-30',
      })

      expect(prisma.chgEcnActionItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ecnId: 1,
            actionType: 'update_bom',
            sortOrder: 2,
            status: 'pending',
          }),
        }),
      )
    })

    it('throws if ECN not found', async () => {
      prisma.chgEcn.findUnique.mockResolvedValue(null)
      await expect(service.createActionItem(1, { actionType: 'update_bom' }))
        .rejects.toThrow(BadRequestException)
    })
  })

  describe('updateActionItem', () => {
    it('updates action item', async () => {
      prisma.chgEcnActionItem.update.mockResolvedValue({ id: 1 })
      await service.updateActionItem(1, { description: 'Updated', dueDate: '2026-12-15' })
      expect(prisma.chgEcnActionItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            description: 'Updated',
            dueDate: expect.any(Date),
          }),
        }),
      )
    })
  })

  describe('deleteActionItem', () => {
    it('deletes action item', async () => {
      prisma.chgEcnActionItem.delete.mockResolvedValue({})
      await service.deleteActionItem(1)
      expect(prisma.chgEcnActionItem.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })
  })

  describe('completeActionItem', () => {
    it('completes pending action item', async () => {
      prisma.chgEcnActionItem.findUnique.mockResolvedValue({ id: 1, status: 'pending' })
      prisma.chgEcnActionItem.update.mockResolvedValue({ id: 1, status: 'completed' })
      await service.completeActionItem(1)
      expect(prisma.chgEcnActionItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'completed', completedAt: expect.any(Date) }),
        }),
      )
    })

    it('completes in_progress action item', async () => {
      prisma.chgEcnActionItem.findUnique.mockResolvedValue({ id: 1, status: 'in_progress' })
      prisma.chgEcnActionItem.update.mockResolvedValue({ id: 1, status: 'completed' })
      await service.completeActionItem(1)
      expect(prisma.chgEcnActionItem.update).toHaveBeenCalled()
    })

    it('throws if action item not found', async () => {
      prisma.chgEcnActionItem.findUnique.mockResolvedValue(null)
      await expect(service.completeActionItem(1))
        .rejects.toThrow(BadRequestException)
    })

    it('throws if action item is not pending or in_progress', async () => {
      prisma.chgEcnActionItem.findUnique.mockResolvedValue({ id: 1, status: 'verified' })
      await expect(service.completeActionItem(1))
        .rejects.toThrow('Can only complete pending or in-progress items')
    })
  })

  describe('verifyActionItem', () => {
    it('verifies completed action item', async () => {
      prisma.chgEcnActionItem.findUnique.mockResolvedValue({ id: 1, status: 'completed' })
      prisma.chgEcnActionItem.update.mockResolvedValue({ id: 1, status: 'verified' })
      await service.verifyActionItem(1, 'All checks passed')
      expect(prisma.chgEcnActionItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'verified', verificationNote: 'All checks passed' }),
        }),
      )
    })

    it('throws if action item not found', async () => {
      prisma.chgEcnActionItem.findUnique.mockResolvedValue(null)
      await expect(service.verifyActionItem(1))
        .rejects.toThrow(BadRequestException)
    })

    it('throws if action item is not completed', async () => {
      prisma.chgEcnActionItem.findUnique.mockResolvedValue({ id: 1, status: 'pending' })
      await expect(service.verifyActionItem(1))
        .rejects.toThrow('Can only verify completed items')
    })
  })

  // ==================== Statistics ====================

  describe('getOverviewStats', () => {
    it('returns aggregated statistics', async () => {
      prisma.chgEcr.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(5)
      prisma.chgEcn.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(25)

      const result = await service.getOverviewStats(1)

      expect(result.totalEcrs).toBe(100)
      expect(result.openEcrs).toBe(30)
      expect(result.pendingCcb).toBe(5)
      expect(result.totalEcns).toBe(50)
      expect(result.activeEcns).toBe(20)
      expect(result.closedEcns).toBe(25)
      expect(result.closureRate).toBe(50)
    })

    it('calculates closure rate as 0 when no ECNs', async () => {
      prisma.chgEcr.count.mockResolvedValue(0)
      prisma.chgEcn.count.mockResolvedValue(0)

      const result = await service.getOverviewStats()
      expect(result.closureRate).toBe(0)
    })
  })
})
