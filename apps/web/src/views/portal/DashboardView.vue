<template>
  <div class="page-container">
    <div class="page-header">
      <h2>工作台</h2>
      <span class="welcome">欢迎回来，{{ authStore.user?.realName }}</span>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color: #409eff">{{ stats.total }}</div>
          <div class="stat-label">项目总数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color: #67c23a">{{ stats.active }}</div>
          <div class="stat-label">进行中</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color: #e6a23c">{{ pendingCount }}</div>
          <div class="stat-label">待审批</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color: #f56c6c">{{ notificationStore.unreadCount }}</div>
          <div class="stat-label">未读通知</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>我的待办</span>
          </template>
          <el-table :data="pendingTasks" style="width: 100%">
            <el-table-column prop="instance.title" label="流程标题" />
            <el-table-column prop="nodeName" label="当前节点" width="120" />
            <el-table-column prop="instance.bizType" label="业务类型" width="120" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link size="small">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最新通知</span>
          </template>
          <el-table :data="recentNotifications" style="width: 100%">
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="type" label="类型" width="80" />
            <el-table-column prop="createdAt" label="时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { projectApi, workflowApi, notificationApi } from '@/api'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const stats = ref({ total: 0, active: 0, onHold: 0, completed: 0 })
const pendingTasks = ref<any[]>([])
const pendingCount = ref(0)
const recentNotifications = ref<any[]>([])

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(async () => {
  try {
    const [projectStats, tasks, notifications]: any[] = await Promise.all([
      projectApi.stats(),
      workflowApi.instances.myPending(),
      notificationApi.list({ page: 1, pageSize: 5 }),
    ])
    stats.value = projectStats
    pendingTasks.value = tasks || []
    pendingCount.value = tasks?.length || 0
    recentNotifications.value = notifications?.list || []
  } catch {}
})
</script>

<style scoped lang="scss">
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  .stat-value {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  .stat-label {
    font-size: 14px;
    color: #909399;
  }
}

.welcome {
  color: #606266;
  font-size: 14px;
}
</style>
