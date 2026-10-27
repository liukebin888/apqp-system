import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { UserService } from '../modules/system/user/user.service'
import { PrismaService } from '../common/services/prisma.service'
import { createMockPrismaService } from './helpers/prisma.mock'

jest.mock('bcryptjs')

describe('UserService', () => {
  let service: UserService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(async () => {
    prisma = createMockPrismaService()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(UserService)
  })

  const mockUser = {
    id: 1,
    username: 'testuser',
    realName: '测试用户',
    email: 'test@example.com',
    phone: '13800138000',
    avatar: null,
    status: 1,
    department: { id: 1, name: '技术部' },
    position: { id: 1, name: '工程师' },
    userRoles: [{ role: { id: 1, code: 'user', name: '普通用户' } }],
  }

  describe('findAll', () => {
    it('should return paginated user list', async () => {
      prisma.sysUser.findMany.mockResolvedValue([mockUser])
      prisma.sysUser.count.mockResolvedValue(1)

      const result = await service.findAll({ page: 1, pageSize: 20 } as any)

      expect(result.list).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should filter by keyword', async () => {
      prisma.sysUser.findMany.mockResolvedValue([])
      prisma.sysUser.count.mockResolvedValue(0)

      await service.findAll({ page: 1, pageSize: 20, keyword: 'test' } as any)

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      )
    })

    it('should filter by departmentId', async () => {
      prisma.sysUser.findMany.mockResolvedValue([])
      prisma.sysUser.count.mockResolvedValue(0)

      await service.findAll({ page: 1, pageSize: 20, departmentId: 1 } as any)

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departmentId: 1 }),
        }),
      )
    })
  })

  describe('findOne', () => {
    it('should return user by id', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(mockUser)

      const result = await service.findOne(1)

      expect(result.username).toBe('testuser')
    })

    it('should throw NotFoundException if user not found', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(null)

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create user with hashed password', async () => {
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$hashed')
      prisma.sysUser.findUnique.mockResolvedValue(null)
      prisma.sysUser.create.mockResolvedValue(mockUser)

      const result = await service.create({
        username: 'testuser',
        password: 'password123',
        realName: '测试用户',
        email: 'test@example.com',
      })

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(result.username).toBe('testuser')
    })

    it('should throw ConflictException if username exists', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(mockUser)

      await expect(
        service.create({
          username: 'testuser',
          password: 'password123',
          realName: '测试用户',
          email: 'test@example.com',
        }),
      ).rejects.toThrow(ConflictException)
    })
  })
})
