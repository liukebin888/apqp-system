import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../../common/services/prisma.service'

@Injectable()
export class DefinitionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(bizType?: string, status?: string) {
    const where: any = {}
    if (bizType) where.bizType = bizType
    if (status) where.status = status
    return this.prisma.wfDefinition.findMany({
      where,
      include: {
        nodeDefinitions: { orderBy: { sortOrder: 'asc' } },
        transitions: true,
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findOne(id: number) {
    const def = await this.prisma.wfDefinition.findUnique({
      where: { id },
      include: {
        nodeDefinitions: { orderBy: { sortOrder: 'asc' } },
        transitions: true,
      },
    })
    if (!def) throw new NotFoundException('流程定义不存在')
    return def
  }

  async create(data: {
    code: string
    name: string
    bizType: string
    definitionJson?: any
    createdById: number
    nodes: Array<{
      nodeKey: string
      nodeName: string
      nodeType: string
      assigneeType?: string
      assigneeValue?: any
      propertiesJson?: any
      sortOrder: number
    }>
    transitions: Array<{
      fromNodeKey: string
      toNodeKey: string
      conditionExpression?: string
      priority?: number
    }>
  }) {
    const { nodes, transitions, ...defData } = data
    return this.prisma.$transaction(async (tx) => {
      const definition = await tx.wfDefinition.create({ data: defData })
      if (nodes.length > 0) {
        await tx.wfNodeDefinition.createMany({
          data: nodes.map((n) => ({ ...n, definitionId: definition.id })),
        })
      }
      if (transitions.length > 0) {
        await tx.wfTransition.createMany({
          data: transitions.map((t) => ({ ...t, definitionId: definition.id })),
        })
      }
      return this.findOne(definition.id)
    })
  }

  async update(id: number, data: {
    name?: string
    status?: string
    definitionJson?: any
    nodes?: Array<{
      nodeKey: string
      nodeName: string
      nodeType: string
      assigneeType?: string
      assigneeValue?: any
      propertiesJson?: any
      sortOrder: number
    }>
    transitions?: Array<{
      fromNodeKey: string
      toNodeKey: string
      conditionExpression?: string
      priority?: number
    }>
  }) {
    const existing = await this.prisma.wfDefinition.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('流程定义不存在')

    return this.prisma.$transaction(async (tx) => {
      await tx.wfDefinition.update({
        where: { id },
        data: {
          name: data.name,
          status: data.status,
          definitionJson: data.definitionJson,
        },
      })

      if (data.nodes !== undefined) {
        await tx.wfNodeDefinition.deleteMany({ where: { definitionId: id } })
        if (data.nodes.length > 0) {
          await tx.wfNodeDefinition.createMany({
            data: data.nodes.map((n) => ({ ...n, definitionId: id })),
          })
        }
      }

      if (data.transitions !== undefined) {
        await tx.wfTransition.deleteMany({ where: { definitionId: id } })
        if (data.transitions.length > 0) {
          await tx.wfTransition.createMany({
            data: data.transitions.map((t) => ({ ...t, definitionId: id })),
          })
        }
      }

      return this.findOne(id)
    })
  }

  async activate(id: number) {
    const existing = await this.prisma.wfDefinition.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('流程定义不存在')
    if (existing.status !== 'draft' && existing.status !== 'deprecated') {
      throw new BadRequestException('只有草稿或已废弃的流程可以激活')
    }
    return this.prisma.wfDefinition.update({
      where: { id },
      data: { status: 'active' },
    })
  }

  async deprecate(id: number) {
    return this.prisma.wfDefinition.update({
      where: { id },
      data: { status: 'deprecated' },
    })
  }
}
