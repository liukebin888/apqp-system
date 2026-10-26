import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../../common/services/prisma.service'

const ESCALATION_RULES = [
  { level: 'L1', severity: 'critical', days: 3, escalateTo: '总经理', description: '关键问题3天未关闭→升级至总经理' },
  { level: 'L2', severity: 'major', days: 7, escalateTo: '部门经理', description: '重大问题7天未关闭→升级至部门经理' },
  { level: 'L3', severity: 'minor', days: 14, escalateTo: '项目经理', description: '一般问题14天未关闭→升级至项目经理' },
] as const

@Injectable()
export class QualityScheduler {
  private readonly logger = new Logger(QualityScheduler.name)

  constructor(private prisma: PrismaService) {}

  @Cron('0 8 * * *')
  async handleAutoEscalation() {
    this.logger.log('Running auto-escalation check...')

    const openProblems = await this.prisma.qualityProblem.findMany({
      where: {
        status: { notIn: ['closed', 'escalated'] },
      },
      include: {
        project: { select: { id: true, projectName: true } },
        owner: { select: { id: true, realName: true } },
      },
    })

    let escalatedCount = 0

    for (const problem of openProblems) {
      const daysOpen = Math.floor(
        (Date.now() - problem.createdAt.getTime()) / 86400000,
      )

      for (const rule of ESCALATION_RULES) {
        if (problem.severity !== rule.severity || daysOpen < rule.days) continue

        const alreadyEscalated =
          await this.prisma.qualityEscalationHistory.findFirst({
            where: {
              problemId: problem.id,
              escalationLevel: rule.level,
            },
          })

        if (alreadyEscalated) continue

        const fromStatus = problem.status
        const alertRecord = await this.prisma.msgAlertRecord.create({
          data: {
            targetBizType: 'quality_escalation',
            targetBizId: problem.id,
            severity: rule.level === 'L1' ? 'critical' : 'warning',
            title: `质量问题的升级 [${rule.level}]`,
            content: `${problem.project.projectName} - ${problem.title} 已超${daysOpen}天未关闭，自动升级至${rule.escalateTo}`,
            status: 'triggered',
          },
        })

        await this.prisma.qualityEscalationHistory.create({
          data: {
            problemId: problem.id,
            fromStatus,
            toStatus: 'escalated',
            escalationLevel: rule.level,
            severity: problem.severity,
            daysOpen,
            escalateTo: rule.escalateTo,
            alertRecordId: alertRecord.id,
            triggeredBy: 'auto',
            remark: rule.description,
          },
        })

        await this.prisma.qualityProblem.update({
          where: { id: problem.id },
          data: { status: 'escalated' },
        })

        if (problem.ownerId) {
          await this.prisma.msgNotification.create({
            data: {
              userId: problem.ownerId,
              type: 'alert',
              title: `质量问题升级通知 [${rule.level}]`,
              content: `您负责的问题「${problem.title}」已超${daysOpen}天未关闭，已升级至${rule.escalateTo}`,
              bizType: 'quality_escalation',
              bizId: problem.id,
            },
          })
        }

        escalatedCount++
        this.logger.log(
          `Escalated problem #${problem.id} to ${rule.level} (${rule.escalateTo})`,
        )
        break
      }
    }

    this.logger.log(`Auto-escalation complete: ${escalatedCount} problems escalated`)
  }
}
