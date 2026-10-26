<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>预警中心</span>
        <el-tag type="danger" size="small">{{ totalCount }} 项</el-tag>
      </div>
    </template>
    <div v-if="totalCount === 0" class="empty-state">
      <el-empty description="暂无预警" :image-size="60" />
    </div>
    <div v-else class="warning-list">
      <div v-for="item in allWarnings" :key="item.key" class="warning-item">
        <div class="warning-icon" :style="{ color: severityColor(item.severity) }">
          <el-icon :size="16"><WarningFilled /></el-icon>
        </div>
        <div class="warning-content">
          <div class="warning-title">{{ item.title }}</div>
          <div class="warning-meta">
            <el-tag :type="categoryTagType(item.category)" size="small">{{ categoryLabel(item.category) }}</el-tag>
            <span v-if="item.project" class="project-name">{{ item.project }}</span>
            <span v-if="item.date" class="warning-date">{{ formatDate(item.date) }}</span>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const props = defineProps<{
  warnings: {
    delayedMilestones: any[]
    criticalRisks: any[]
    unresolvedAlerts: any[]
    overdueTasks: any[]
    openCriticalProblems: any[]
    budgetOverruns: any[]
  }
}>()

interface WarningItem {
  key: string
  title: string
  severity: string
  category: string
  project?: string
  date?: string
}

const allWarnings = computed<WarningItem[]>(() => {
  const items: WarningItem[] = []

  for (const m of props.warnings.delayedMilestones) {
    items.push({
      key: `ms-${m.id}`, title: `里程碑延期: ${m.name}`,
      severity: 'warning', category: 'milestone',
      project: m.project?.projectName, date: m.plannedDate,
    })
  }

  for (const r of props.warnings.criticalRisks) {
    items.push({
      key: `risk-${r.id}`, title: `高风险: ${r.description || '未命名风险'}`,
      severity: 'critical', category: 'risk',
      project: r.project?.projectName,
    })
  }

  for (const a of props.warnings.unresolvedAlerts) {
    items.push({
      key: `alert-${a.id}`, title: a.title || '系统告警',
      severity: a.severity, category: 'alert',
      date: a.triggeredAt,
    })
  }

  for (const t of props.warnings.overdueTasks) {
    items.push({
      key: `task-${t.id}`, title: `任务超时: ${t.taskName}`,
      severity: 'warning', category: 'task',
      project: t.projectName, date: t.plannedEnd,
    })
  }

  for (const p of props.warnings.openCriticalProblems) {
    items.push({
      key: `prob-${p.id}`, title: `严重问题: ${p.title}`,
      severity: 'critical', category: 'problem',
      project: p.project?.projectName,
    })
  }

  for (const b of props.warnings.budgetOverruns) {
    items.push({
      key: `cost-${b.id}`, title: `预算超支: ${b.budgetCategory} (${b.varianceRate}%)`,
      severity: 'critical', category: 'cost',
      project: b.project?.projectName,
    })
  }

  return items
})

const totalCount = computed(() => allWarnings.value.length)

function severityColor(severity: string): string {
  return severity === 'critical' ? '#f56c6c' : '#e6a23c'
}

function categoryTagType(category: string): string {
  const map: Record<string, string> = {
    milestone: 'warning', risk: 'danger', alert: 'danger',
    task: 'warning', problem: 'danger', cost: 'danger',
  }
  return map[category] || 'info'
}

function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    milestone: '里程碑', risk: '风险', alert: '告警',
    task: '任务', problem: '问题', cost: '成本',
  }
  return map[category] || category
}

function formatDate(date: string): string {
  return dayjs(date).format('MM-DD')
}
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.warning-list {
  max-height: 360px;
  overflow-y: auto;
}
.warning-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.warning-item:last-child {
  border-bottom: none;
}
.warning-icon {
  margin-top: 2px;
  flex-shrink: 0;
}
.warning-content {
  flex: 1;
  min-width: 0;
}
.warning-title {
  font-size: 13px;
  color: #303133;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.warning-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
}
.project-name {
  color: #909399;
}
.warning-date {
  color: #b0b3b8;
}
.empty-state {
  padding: 20px 0;
}
</style>
