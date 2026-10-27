import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ProjectService } from '../modules/project/project.service'
import { PrismaService } from '../common/services/prisma.service'
import { SequenceService } from '../common/services/sequence.service'
import { createMockPrismaService } from './helpers/prisma.mock'

describe('ProjectService', () => {
  let service: ProjectService
  let prisma: ReturnType<typeof createMockPrismaService>
  let sequenceService: SequenceService

  beforeEach(async () => {
    prisma = createMockPrismaService()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: SequenceService,
          useValue: { nextNo: jest.fn().mockResolvedValue('PRJ202610270001') },
        },
      ],
    }).compile()

    service = module.get(ProjectService)
    sequenceService = module.get(SequenceService)
  })

  const mockProject = {
    id: 1,
    projectCode: 'PRJ202610270001',
    projectName: '测试项目',
    status: 'active',
    customerId: 1,
    managerId: 1,
    createdAt: new Date(),
    customer: { id: 1, customerName: '客户A' },
    product: { id: 1, productName: '产品A' },
    manager: { id: 1, realName: '张三' },
    teams: [],
  }

  describe('findAll', () => {
    it('should return paginated list', async () => {
      prisma.prjProject.findMany.mockResolvedValue([mockProject])
      prisma.prjProject.count.mockResolvedValue(1)

      const result = await service.findAll({ page: 1, pageSize: 20 } as any)

      expect(result.list).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('should filter by status', async () => {
      prisma.prjProject.findMany.mockResolvedValue([])
      prisma.prjProject.count.mockResolvedValue(0)

      await service.findAll({ page: 1, pageSize: 20, status: 'active' } as any)

      expect(prisma.prjProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      )
    })

    it('should filter by keyword', async () => {
      prisma.prjProject.findMany.mockResolvedValue([])
      prisma.prjProject.count.mockResolvedValue(0)

      await service.findAll({ page: 1, pageSize: 20, keyword: '电池' } as any)

      expect(prisma.prjProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { projectCode: { contains: '电池' } },
              { projectName: { contains: '电池' } },
            ],
          }),
        }),
      )
    })

    it('should calculate skip correctly for page 2', async () => {
      prisma.prjProject.findMany.mockResolvedValue([])
      prisma.prjProject.count.mockResolvedValue(0)

      await service.findAll({ page: 2, pageSize: 10 } as any)

      expect(prisma.prjProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      )
    })
  })

  describe('findOne', () => {
    it('should return project by id', async () => {
      prisma.prjProject.findUnique.mockResolvedValue({
        ...mockProject,
        schedules: [],
        milestones: [],
        risks: [],
      })

      const result = await service.findOne(1)

      expect(result.projectName).toBe('测试项目')
    })

    it('should throw NotFoundException if project not found', async () => {
      prisma.prjProject.findUnique.mockResolvedValue(null)

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create project with auto-generated code', async () => {
      prisma.prjProject.create.mockResolvedValue(mockProject)

      const result = await service.create({
        projectName: '测试项目',
        customerId: 1,
      })

      expect(sequenceService.nextNo).toHaveBeenCalledWith('PRJ')
      expect(prisma.prjProject.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectCode: 'PRJ202610270001',
            projectName: '测试项目',
          }),
        }),
      )
      expect(result.projectName).toBe('测试项目')
    })
  })
})
