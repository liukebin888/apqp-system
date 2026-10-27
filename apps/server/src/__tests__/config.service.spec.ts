import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ConfigService } from '../modules/system/config/config.service'
import { PrismaService } from '../common/services/prisma.service'
import { createMockPrismaService } from './helpers/prisma.mock'

describe('ConfigService', () => {
  let service: ConfigService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(async () => {
    prisma = createMockPrismaService()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(ConfigService)
  })

  describe('findAll', () => {
    it('should return all configs ordered by key', async () => {
      const configs = [
        { configKey: 'app.name', configValue: 'APQP' },
        { configKey: 'app.version', configValue: '2.6' },
      ]
      prisma.sysConfig.findMany.mockResolvedValue(configs)

      const result = await service.findAll()

      expect(result).toEqual(configs)
      expect(prisma.sysConfig.findMany).toHaveBeenCalledWith({
        orderBy: { configKey: 'asc' },
      })
    })
  })

  describe('findOne', () => {
    it('should return config by key', async () => {
      const config = { configKey: 'app.name', configValue: 'APQP' }
      prisma.sysConfig.findUnique.mockResolvedValue(config)

      const result = await service.findOne('app.name')

      expect(result).toEqual(config)
    })

    it('should throw NotFoundException if config not found', async () => {
      prisma.sysConfig.findUnique.mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getValue', () => {
    it('should return config value string', async () => {
      prisma.sysConfig.findUnique.mockResolvedValue({
        configKey: 'app.name',
        configValue: 'APQP',
      })

      const result = await service.getValue('app.name')

      expect(result).toBe('APQP')
    })

    it('should return null if config not found', async () => {
      prisma.sysConfig.findUnique.mockResolvedValue(null)

      const result = await service.getValue('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('upsert', () => {
    it('should create or update config', async () => {
      const config = { configKey: 'app.name', configValue: 'APQP v3' }
      prisma.sysConfig.upsert.mockResolvedValue(config)

      const result = await service.upsert('app.name', {
        configValue: 'APQP v3',
        description: '应用名称',
      })

      expect(result).toEqual(config)
      expect(prisma.sysConfig.upsert).toHaveBeenCalledWith({
        where: { configKey: 'app.name' },
        create: expect.objectContaining({ configKey: 'app.name', configValue: 'APQP v3' }),
        update: expect.objectContaining({ configValue: 'APQP v3' }),
      })
    })
  })

  describe('delete', () => {
    it('should delete config and return success', async () => {
      prisma.sysConfig.delete.mockResolvedValue({})

      const result = await service.delete('app.name')

      expect(result).toEqual({ success: true })
      expect(prisma.sysConfig.delete).toHaveBeenCalledWith({
        where: { configKey: 'app.name' },
      })
    })
  })

  describe('bulkUpsert', () => {
    it('should upsert multiple configs', async () => {
      const items = [
        { configKey: 'a', configValue: '1' },
        { configKey: 'b', configValue: '2' },
      ]
      prisma.sysConfig.upsert.mockResolvedValueOnce(items[0]).mockResolvedValueOnce(items[1])

      const result = await service.bulkUpsert(items)

      expect(result).toHaveLength(2)
      expect(prisma.sysConfig.upsert).toHaveBeenCalledTimes(2)
    })
  })
})
