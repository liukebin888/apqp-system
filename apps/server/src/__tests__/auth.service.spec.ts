import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { AuthService } from '../modules/auth/auth.service'
import { PrismaService } from '../common/services/prisma.service'
import { createMockPrismaService } from './helpers/prisma.mock'

jest.mock('bcryptjs')

describe('AuthService', () => {
  let service: AuthService
  let prisma: ReturnType<typeof createMockPrismaService>
  let jwtService: JwtService

  beforeEach(async () => {
    prisma = createMockPrismaService()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get(AuthService)
    jwtService = module.get(JwtService)
  })

  const mockUser = {
    id: 1,
    username: 'admin',
    realName: '管理员',
    email: 'admin@test.com',
    phone: null,
    avatar: null,
    passwordHash: '$2a$10$hashed',
    status: 1,
    department: { id: 1, name: '技术部' },
    position: { id: 1, name: '工程师' },
    userRoles: [
      {
        role: {
          code: 'admin',
          rolePermissions: [
            { permission: { code: 'system:user:view' } },
            { permission: { code: 'system:user:create' } },
          ],
        },
      },
    ],
  }

  describe('login', () => {
    it('should return tokens and user data on valid credentials', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      prisma.sysUser.update.mockResolvedValue({})

      const result = await service.login('admin', 'admin123')

      expect(result.accessToken).toBe('mock-token')
      expect(result.refreshToken).toBe('mock-token')
      expect(result.user.username).toBe('admin')
      expect(result.user.roles).toEqual(['admin'])
      expect(result.user.permissions).toContain('system:user:view')
      expect(prisma.sysUser.update).toHaveBeenCalled()
    })

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(null)

      await expect(service.login('unknown', 'pass')).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for disabled user', async () => {
      prisma.sysUser.findUnique.mockResolvedValue({ ...mockUser, status: 2 })

      await expect(service.login('admin', 'pass')).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for wrong password', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(service.login('admin', 'wrong')).rejects.toThrow(UnauthorizedException)
    })

    it('should deduplicate permissions', async () => {
      const userWithDupes = {
        ...mockUser,
        userRoles: [
          {
            role: {
              code: 'admin',
              rolePermissions: [{ permission: { code: 'system:user:view' } }],
            },
          },
          {
            role: {
              code: 'manager',
              rolePermissions: [{ permission: { code: 'system:user:view' } }],
            },
          },
        ],
      }
      prisma.sysUser.findUnique.mockResolvedValue(userWithDupes)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      prisma.sysUser.update.mockResolvedValue({})

      const result = await service.login('admin', 'pass')
      const viewPerms = result.user.permissions.filter(p => p === 'system:user:view')
      expect(viewPerms).toHaveLength(1)
    })
  })

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      ;(jwtService.verify as jest.Mock).mockReturnValue({ userId: 1 })
      prisma.sysUser.findUnique.mockResolvedValue(mockUser)

      const result = await service.refreshToken('valid-refresh-token')

      expect(result.accessToken).toBe('mock-token')
      expect(result.refreshToken).toBe('mock-token')
    })

    it('should throw UnauthorizedException for invalid token', async () => {
      ;(jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid')
      })

      await expect(service.refreshToken('bad-token')).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for disabled user', async () => {
      ;(jwtService.verify as jest.Mock).mockReturnValue({ userId: 1 })
      prisma.sysUser.findUnique.mockResolvedValue({ ...mockUser, status: 2 })

      await expect(service.refreshToken('token')).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(mockUser)

      const result = await service.getProfile(1)

      expect(result.id).toBe(1)
      expect(result.username).toBe('admin')
      expect(result.roles).toEqual(['admin'])
    })

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(null)

      await expect(service.getProfile(999)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('changePassword', () => {
    it('should update password hash on valid old password', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$newhash')
      prisma.sysUser.update.mockResolvedValue({})

      const result = await service.changePassword(1, 'old', 'new')

      expect(result.message).toBe('密码修改成功')
      expect(bcrypt.hash).toHaveBeenCalledWith('new', 10)
      expect(prisma.sysUser.update).toHaveBeenCalled()
    })

    it('should throw if user not found', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(null)

      await expect(service.changePassword(999, 'old', 'new')).rejects.toThrow(UnauthorizedException)
    })

    it('should throw if old password is wrong', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(service.changePassword(1, 'wrong', 'new')).rejects.toThrow(UnauthorizedException)
    })
  })
})
