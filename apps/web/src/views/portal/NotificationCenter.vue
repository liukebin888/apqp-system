<template>
  <div class="page-container">
    <div class="page-header">
      <h2>通知中心</h2>
      <el-button type="primary" plain @click="handleMarkAllRead">全部已读</el-button>
    </div>

    <el-tabs v-model="activeTab" @tab-change="loadData">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="未读" name="unread" />
    </el-tabs>

    <el-table :data="tableData" v-loading="loading" border stripe>
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="typeTag(row.type)" size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isRead ? 'info' : 'danger'" size="small">{{ row.isRead ? '已读' : '未读' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button v-if="!row.isRead" type="primary" link size="small" @click="handleMarkRead(row.id)">标为已读</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-pagination">
      <el-pagination v-model:current-page="pagination.page" :total="pagination.total" layout="total, prev, pager, next" @current-change="loadData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { notificationApi } from '@/api'
import { useNotificationStore } from '@/stores/notification.store'
import dayjs from 'dayjs'

const notificationStore = useNotificationStore()
const loading = ref(false)
const tableData = ref<any[]>([])
const activeTab = ref('all')
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

function typeTag(type: string) { return { task: 'primary', approval: 'warning', alert: 'danger', system: 'info' }[type] || 'info' }
function formatDate(d: string) { return dayjs(d).format('YYYY-MM-DD HH:mm') }

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.pageSize }
    if (activeTab.value === 'unread') params.isRead = false
    const res: any = await notificationApi.list(params)
    tableData.value = res?.list || []
    pagination.total = res?.total || 0
  } finally { loading.value = false }
}

async function handleMarkRead(id: number) {
  await notificationApi.markRead([id])
  notificationStore.fetchUnreadCount()
  loadData()
}

async function handleMarkAllRead() {
  await notificationApi.markAllRead()
  notificationStore.fetchUnreadCount()
  ElMessage.success('全部已读')
  loadData()
}
</script>
