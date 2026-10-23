import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../../common/services/prisma.service'

@Injectable()
export class InstanceService {
  constructor(private readonly prisma: PrismaService) {}

  async startFlow(data: {
    definitionId: number
    bizType: string
    bizId: number
    bizNo?: string
    title: string
    initiatorId: number
    variables?: Record<string, any>
  }) {
    const definition = await this.prisma.wfDefinition.findUnique({
      where: { id: data.definitionId },
      include: {
        nodeDefinitions: { orderBy: { sortOrder: 'asc' } },
        transitions: { orderBy: { priority: 'desc' } },
      },
    })
    if (!definition) throw new NotFoundException('流程定义不存在')
    if (definition.status !== 'active') throw new BadRequestException('流程定义未激活')

    const startNode = definition.nodeDefinitions.find((n) => n.nodeType === 'start')
    if (!startNode) throw new BadRequestException('流程定义缺少起始节点')

    const firstTransition = definition.transitions.find((t) => t.fromNodeKey === startNode.nodeKey)
    if (!firstTransition) throw new BadRequestException('流程定义缺少起始连线')

    const firstApprovalNode = definition.nodeDefinitions.find(
      (n) => n.nodeKey === firstTransition.toNodeKey,
    )

    return this.prisma.$transaction(async (tx) => {
      const instance = await tx.wfInstance.create({
        data: {
          definitionId: definition.id,
          bizType: data.bizType,
          bizId: data.bizId,
          bizNo: data.bizNo,
          title: data.title,
          initiatorId: data.initiatorId,
          status: 'running',
          currentNodesJson: [firstApprovalNode?.nodeKey || startNode.nodeKey] as any,
          variablesJson: (data.variables || {}) as any,
        },
      })

      if (firstApprovalNode && firstApprovalNode.nodeType !== 'end') {
        const assigneeUserId = await this.resolveAssignee(
          firstApprovalNode,
          data.initiatorId,
          tx,
        )
        await tx.wfNodeInstance.create({
          data: {
            instanceId: instance.id,
            nodeKey: firstApprovalNode.nodeKey,
            nodeName: firstApprovalNode.nodeName,
            nodeType: firstApprovalNode.nodeType,
            assigneeUserId,
            status: 'pending',
            countersignTotal: firstApprovalNode.nodeType === 'countersign' ? 1 : 0,
          },
        })
      }

      await tx.wfLog.create({
        data: {
          instanceId: instance.id,
          action: 'submit',
          operatorId: data.initiatorId,
          opinion: '提交流程',
        },
      })

      return instance
    })
  }

  async approve(nodeInstanceId: number, userId: number, opinion?: string) {
    const nodeInstance = await this.prisma.wfNodeInstance.findUnique({
      where: { id: nodeInstanceId },
      include: { instance: { include: { definition: { include: { nodeDefinitions: true, transitions: true } } } } },
    })
    if (!nodeInstance) throw new NotFoundException('节点实例不存在')
    if (nodeInstance.status !== 'pending') throw new BadRequestException('节点已处理')

    const instance = nodeInstance.instance
    const definition = instance.definition

    return this.prisma.$transaction(async (tx) => {
      if (nodeInstance.nodeType === 'countersign') {
        await tx.wfNodeInstance.update({
          where: { id: nodeInstanceId },
          data: {
            status: 'approved',
            opinion,
            actedBy: userId,
            actedAt: new Date(),
            countersignDone: { increment: 1 },
          },
        })

        const updated = await tx.wfNodeInstance.findUnique({ where: { id: nodeInstanceId } })
        if (updated && updated.countersignDone < updated.countersignTotal) {
          await tx.wfLog.create({
            data: { instanceId: instance.id, nodeInstanceId, action: 'countersign', operatorId: userId, opinion },
          })
          return { message: '会签完成，等待其他审批人' }
        }
      }

      await tx.wfNodeInstance.update({
        where: { id: nodeInstanceId },
        data: { status: 'approved', opinion, actedBy: userId, actedAt: new Date() },
      })

      const transitions = definition.transitions.filter((t) => t.fromNodeKey === nodeInstance.nodeKey)
      const nextTransition = await this.evaluateTransitions(transitions, instance.variablesJson as any, definition.nodeDefinitions)

      if (!nextTransition) {
        const endNode = definition.nodeDefinitions.find((n) => n.nodeType === 'end')
        if (endNode) {
          await tx.wfNodeInstance.create({
            data: {
              instanceId: instance.id,
              nodeKey: endNode.nodeKey,
              nodeName: endNode.nodeName,
              nodeType: 'end',
              status: 'approved',
              actedAt: new Date(),
            },
          })
        }
        await tx.wfInstance.update({
          where: { id: instance.id },
          data: { status: 'completed', completedAt: new Date(), currentNodesJson: [] as any },
        })
      } else {
        const nextNode = definition.nodeDefinitions.find((n) => n.nodeKey === nextTransition.toNodeKey)
        if (nextNode && nextNode.nodeType !== 'end') {
          const assigneeUserId = await this.resolveAssignee(nextNode, instance.initiatorId, tx)
          await tx.wfNodeInstance.create({
            data: {
              instanceId: instance.id,
              nodeKey: nextNode.nodeKey,
              nodeName: nextNode.nodeName,
              nodeType: nextNode.nodeType,
              assigneeUserId,
              status: 'pending',
              countersignTotal: nextNode.nodeType === 'countersign' ? 1 : 0,
            },
          })
          await tx.wfInstance.update({
            where: { id: instance.id },
            data: { currentNodesJson: [nextNode.nodeKey] as any },
          })
        } else {
          await tx.wfInstance.update({
            where: { id: instance.id },
            data: { status: 'completed', completedAt: new Date(), currentNodesJson: [] as any },
          })
        }
      }

      await tx.wfLog.create({
        data: { instanceId: instance.id, nodeInstanceId, action: 'approve', operatorId: userId, opinion },
      })

      return { message: '审批通过' }
    })
  }

  async reject(nodeInstanceId: number, userId: number, opinion?: string) {
    const nodeInstance = await this.prisma.wfNodeInstance.findUnique({
      where: { id: nodeInstanceId },
    })
    if (!nodeInstance) throw new NotFoundException('节点实例不存在')

    return this.prisma.$transaction(async (tx) => {
      await tx.wfNodeInstance.update({
        where: { id: nodeInstanceId },
        data: { status: 'rejected', opinion, actedBy: userId, actedAt: new Date() },
      })

      await tx.wfInstance.update({
        where: { id: nodeInstance.instanceId },
        data: { status: 'rejected', completedAt: new Date() },
      })

      await tx.wfLog.create({
        data: {
          instanceId: nodeInstance.instanceId,
          nodeInstanceId,
          action: 'reject',
          operatorId: userId,
          opinion,
        },
      })

      return { message: '已驳回' }
    })
  }

  async rollback(instanceId: number, targetNodeKey: string, userId: number, reason?: string) {
    const instance = await this.prisma.wfInstance.findUnique({
      where: { id: instanceId },
      include: { definition: { include: { nodeDefinitions: true } } },
    })
    if (!instance) throw new NotFoundException('流程实例不存在')
    if (instance.status !== 'running') throw new BadRequestException('流程已结束，无法回退')

    const targetNode = instance.definition.nodeDefinitions.find((n) => n.nodeKey === targetNodeKey)
    if (!targetNode) throw new BadRequestException('目标节点不存在')

    return this.prisma.$transaction(async (tx) => {
      await tx.wfNodeInstance.updateMany({
        where: { instanceId, status: 'pending' },
        data: { status: 'skipped' },
      })

      const assigneeUserId = await this.resolveAssignee(targetNode, instance.initiatorId, tx)
      await tx.wfNodeInstance.create({
        data: {
          instanceId,
          nodeKey: targetNode.nodeKey,
          nodeName: targetNode.nodeName,
          nodeType: targetNode.nodeType,
          assigneeUserId,
          status: 'pending',
        },
      })

      await tx.wfInstance.update({
        where: { id: instanceId },
        data: { currentNodesJson: [targetNodeKey] as any },
      })

      await tx.wfRollback.create({
        data: {
          instanceId,
          fromNodeKey: instance.currentNodesJson ? (instance.currentNodesJson as string[])[0] : '',
          toNodeKey: targetNodeKey,
          reason,
          operatorId: userId,
        },
      })

      await tx.wfLog.create({
        data: { instanceId, action: 'rollback', operatorId: userId, opinion: reason },
      })

      return { message: '回退成功' }
    })
  }

  async getMyPendingTasks(userId: number) {
    return this.prisma.wfNodeInstance.findMany({
      where: { assigneeUserId: userId, status: 'pending' },
      include: {
        instance: {
          include: {
            definition: { select: { name: true, bizType: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
    })
  }

  async getInstanceDetail(instanceId: number) {
    return this.prisma.wfInstance.findUnique({
      where: { id: instanceId },
      include: {
        definition: {
          include: {
            nodeDefinitions: { orderBy: { sortOrder: 'asc' } },
            transitions: true,
          },
        },
        nodeInstances: { orderBy: { id: 'asc' } },
        logs: { orderBy: { createdAt: 'asc' } },
        rollbacks: { orderBy: { createdAt: 'asc' } },
      },
    })
  }

  async getInitiatedFlows(userId: number, page: number = 1, pageSize: number = 20) {
    const where = { initiatorId: userId }
    const [list, total] = await Promise.all([
      this.prisma.wfInstance.findMany({
        where,
        include: { definition: { select: { name: true, bizType: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.wfInstance.count({ where }),
    ])
    return { list, total, page, pageSize }
  }

  private async resolveAssignee(node: any, initiatorId: number, tx: any): Promise<number | null> {
    if (!node.assigneeType || !node.assigneeValue) return null

    const value = typeof node.assigneeValue === 'string'
      ? JSON.parse(node.assigneeValue)
      : node.assigneeValue

    switch (node.assigneeType) {
      case 'user':
        return value.userId || null
      case 'role':
        const userRole = await tx.sysUserRole.findFirst({
          where: { role: { code: value.roleCode } },
          select: { userId: true },
        })
        return userRole?.userId || null
      case 'department':
        const deptUser = await tx.sysUser.findFirst({
          where: { departmentId: value.departmentId, status: 1 },
          select: { id: true },
        })
        return deptUser?.id || null
      case 'initiator':
        return initiatorId
      default:
        return null
    }
  }

  private async evaluateTransitions(
    transitions: any[],
    variables: Record<string, any>,
    nodeDefinitions: any[],
  ) {
    if (transitions.length === 0) return null
    if (transitions.length === 1) return transitions[0]

    for (const t of transitions) {
      if (!t.conditionExpression) continue
      try {
        const result = this.evaluateCondition(t.conditionExpression, variables)
        if (result) return t
      } catch {
        continue
      }
    }

    return transitions.find((t) => !t.conditionExpression) || transitions[0]
  }

  private evaluateCondition(expression: string, variables: Record<string, any>): boolean {
    const match = expression.match(/^(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)$/)
    if (!match) return false

    const [, key, op, rawValue] = match
    const varValue = variables[key]
    const compareValue = isNaN(+rawValue) ? rawValue.replace(/['"]/g, '') : +rawValue

    switch (op) {
      case '==': return varValue == compareValue
      case '!=': return varValue != compareValue
      case '>': return varValue > compareValue
      case '<': return varValue < compareValue
      case '>=': return varValue >= compareValue
      case '<=': return varValue <= compareValue
      default: return false
    }
  }
}
