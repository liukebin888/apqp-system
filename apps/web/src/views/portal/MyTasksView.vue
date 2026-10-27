<template>
  <div class="my-tasks-view">
    <div class="page-header">
      <h2>我的任务</h2>
      <div class="header-actions">
        <el-select v-model="filter.status" placeholder="状态" clearable style="width: 120px" @change="loadTasks">
          <el-option label="待处理" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已逾期" value="overdue" />
        </el-select>
        <el-select v-model="filter.type" placeholder="类型" clearable style="width: 120px" @change="loadTasks">
          <el-option label="项目任务" value="task" />
          <el-option label="风险" value="risk" />
          <el-option label="变更" value="change" />
          <el-option label="问题" value="issue" />
          <el-option label="审批" value="approval" />
        </el-select>
      </div>
    </div>

    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">全部任务</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card pending">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待处理</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card progress">
          <div class="stat-value">{{ stats.inProgress }}</div>
          <div class="stat-label">进行中</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card overdue">
          <div class="stat-value">{{ stats.overdue }}</div>
          <div class="stat-label">已逾期</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <el-table :data="tasks" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTagMap[row.type] || 'info'" size="small">{{ typeNameMap[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="projectName" label="所属项目" width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagMap[row.status] || 'info'" size="small">{{ statusNameMap[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="截止日" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isOverdue(row) }">{{ formatDate(row.dueDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="priorityTagMap[row.priority] || 'info'" size="small">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { dashboardApi } from '@/api'

const loading = ref(false)
const tasks = ref<any[]>([])
const filter = reactive({ status: '', type: '' })
const stats = reactive({ total: 0, pending: 0, inProgress: 0, overdue: 0 })

const typeTagMap: Record<string, string> = { task: '', risk: 'warning', change: 'primary', issue: 'danger', approval: 'success' }
const typeNameMap: Record<string, string> = { task: '任务', risk: '风险', change: '变更', issue: '问题', approval: '审批' }
const statusTagMap: Record<string, string> = { pending: 'warning', in_progress: '', completed: 'success', overdue: 'danger' }
const statusNameMap: Record<string, string> = { pending: '待处理', in_progress: '进行中', completed: '已完成', overdue: '已逾期' }
const priorityTagMap: Record<string, string> = { high: 'danger', medium: 'warning', low: 'info' }

function isOverdue(row: any) {
  if (!row.dueDate || row.status === 'completed') return false
  return new Date(row.dueDate) < new Date()
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

async function loadTasks() {
  loading.value = true
  try {
    const res = await dashboardApi.myTasks()
    const allTasks = res.data?.data || res.data || []
    let filtered = allTasks
    if (filter.status) {
      filtered = filtered.filter(t => t.status === filter.status)
    }
    if (filter.type) {
      filtered = filtered.filter(t => t.type === filter.type)
    }
    tasks.value = filtered
    stats.total = allTasks.length
    stats.pending = allTasks.filter(t => t.status === 'pending').length
    stats.inProgress = allTasks.filter(t => t.status === 'in_progress').length
    stats.overdue = allTasks.filter(t => isOverdue(t)).length
  } catch {
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadTasks)
</script>

<style scoped>
.my-tasks-view { padding: 0; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h2 { margin: 0; font-size: 18px; }
.header-actions { display: flex; gap: 8px; }
.stat-cards { margin-bottom: 16px; }
.stat-card { text-align: center; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; }
.stat-card.pending .stat-value { color: #e6a23c; }
.stat-card.progress .stat-value { color: #409eff; }
.stat-card.overdue .stat-value { color: #f56c6c; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
.text-danger { color: #f56c6c; font-weight: 600; }
</style>
