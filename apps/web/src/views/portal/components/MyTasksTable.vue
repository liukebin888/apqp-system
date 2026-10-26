<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>我的待办</span>
        <el-tag type="info" size="small">{{ tasks.length }} 项</el-tag>
      </div>
    </template>
    <el-table :data="tasks" style="width: 100%" :empty-text="'暂无待办事项'">
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="typeTagMap[row.type]" size="small">{{ typeLabelMap[row.type] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="projectName" label="项目" width="140" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="截止日" width="110">
        <template #default="{ row }">
          <span :class="{ 'text-danger': isOverdue(row.dueDate) }">{{ formatDate(row.dueDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="70">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="$router.push(row.moduleRoute)">处理</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

defineProps<{
  tasks: Array<{
    id: number; type: string; title: string; status: string;
    priority?: string; dueDate?: string | null; projectName?: string;
    projectId?: number; moduleRoute: string;
  }>
}>()

const typeTagMap: Record<string, string> = {
  wbs_task: '', risk: 'danger', ecr: 'warning', ecn_action: 'warning',
  problem: 'danger', capa: 'warning', fmea_item: 'info',
}

const typeLabelMap: Record<string, string> = {
  wbs_task: '任务', risk: '风险', ecr: 'ECR', ecn_action: 'ECN',
  problem: '问题', capa: 'CAPA', fmea_item: 'FMEA',
}

function statusTagType(status: string): string {
  const map: Record<string, string> = {
    pending: 'info', in_progress: 'warning', new: 'info',
    analyzing: 'warning', correcting: 'warning', open: 'warning',
    blocked: 'danger', submitted: 'warning', draft: 'info',
  }
  return map[status] || 'info'
}

function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false
  return dayjs(date).isBefore(dayjs(), 'day')
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.text-danger {
  color: #f56c6c;
  font-weight: 500;
}
</style>
