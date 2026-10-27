import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../common/services/prisma.service'

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sysConfig.findMany({
      orderBy: { configKey: 'asc' },
    })
  }

  async findOne(key: string) {
    const item = await this.prisma.sysConfig.findUnique({ where: { configKey: key } })
    if (!item) throw new NotFoundException(`Config '${key}' not found`)
    return item
  }

  async getValue(key: string): Promise<string | null> {
    const item = await this.prisma.sysConfig.findUnique({ where: { configKey: key } })
    return item?.configValue ?? null
  }

  async upsert(key: string, data: { configValue: string; description?: string }) {
    return this.prisma.sysConfig.upsert({
      where: { configKey: key },
      create: { configKey: key, ...data },
      update: { configValue: data.configValue, description: data.description },
    })
  }

  async delete(key: string) {
    await this.prisma.sysConfig.delete({ where: { configKey: key } })
    return { success: true }
  }

  async bulkUpsert(items: Array<{ configKey: string; configValue: string; description?: string }>) {
    const results = await Promise.all(
      items.map(item =>
        this.prisma.sysConfig.upsert({
          where: { configKey: item.configKey },
          create: item,
          update: { configValue: item.configValue, description: item.description },
        }),
      ),
    )
    return results
  }
}
