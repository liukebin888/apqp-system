import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { IssueService } from '../modules/issue/issue.service'
import { PrismaService } from '../common/services/prisma.service'
import { createMockPrismaService } from './helpers/prisma.mock'

describe('IssueService', () => {
  let service: IssueService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(async () => {
    prisma = createMockPrismaService()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssueService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(IssueService)
  })

  const mockIssue = {
    id: 1,
    issueNo: 'QI202610270001',
    title: '测试问题',
    issueType: 'design',
    severity: 'major',
    status: 'open',
    projectId: 1,
    reporterId: 1,
    createdAt: new Date(),
    reporter: { id: 1, realName: '张三' },
  }

  describe('findAllIssues', () => {
    it('should return issues with pagination', async () => {
      prisma.qualityIssue.findMany.mockResolvedValue([mockIssue])
      prisma.qualityIssue.count.mockResolvedValue(1)

      const result = await service.findAllIssues({ skip: 0, take: 50 })

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should filter by projectId', async () => {
      prisma.qualityIssue.findMany.mockResolvedValue([])
      prisma.qualityIssue.count.mockResolvedValue(0)

      await service.findAllIssues({ projectId: '5' })

      expect(prisma.qualityIssue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 5 }),
        }),
      )
    })

    it('should filter by status', async () => {
      prisma.qualityIssue.findMany.mockResolvedValue([])
      prisma.qualityIssue.count.mockResolvedValue(0)

      await service.findAllIssues({ status: 'open' })

      expect(prisma.qualityIssue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'open' }),
        }),
      )
    })

    it('should filter by issueType and severity', async () => {
      prisma.qualityIssue.findMany.mockResolvedValue([])
      prisma.qualityIssue.count.mockResolvedValue(0)

      await service.findAllIssues({ issueType: 'design', severity: 'critical' })

      expect(prisma.qualityIssue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            issueType: 'design',
            severity: 'critical',
          }),
        }),
      )
    })
  })

  describe('findOneIssue', () => {
    it('should return issue by id', async () => {
      prisma.qualityIssue.findUnique.mockResolvedValue({
        ...mockIssue,
        owner: { id: 1, realName: '李四' },
      })

      const result = await service.findOneIssue(1)

      expect(result.title).toBe('测试问题')
    })

    it('should throw NotFoundException if issue not found', async () => {
      prisma.qualityIssue.findUnique.mockResolvedValue(null)

      await expect(service.findOneIssue(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('createIssue', () => {
    it('should create issue with auto-generated number', async () => {
      prisma.qualityIssue.count.mockResolvedValue(0)
      prisma.qualityIssue.create.mockResolvedValue(mockIssue)

      const result = await service.createIssue(
        { projectId: 1, title: '测试问题', issueType: 'design', severity: 'major' },
        1,
      )

      expect(prisma.qualityIssue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            issueNo: expect.stringMatching(/^QI\d{8}\d{4}$/),
            reporterId: 1,
          }),
        }),
      )
      expect(result.title).toBe('测试问题')
    })
  })
})
