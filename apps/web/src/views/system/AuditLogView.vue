<template>
  <div class="page-container">
    <div class="page-header">
      <h2>审计日志</h2>
    </div>

    <div class="search-bar">
      <el-input v-model="search.module" placeholder="模块" clearable style="width: 120px" />
      <el-input v-model="search.action" placeholder="操作类型" clearable style="width: 120px" />
      <el-date-picker v-model="search.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px" />
      <el-button @click="loadData">查询</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" border stripe>
      <el-table-column prop="createdAt" label="时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作人" width="120">
        <template #default="{ row }">{{ row.user?.realName || row.user?.username }}</template>
      </el-table-column>
      <el-table-column prop="action" label="操作类型" width="100">
        <template #default="{ row }">
          <el-tag :type="actionTagType(row.action)" size="small">{{ row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="module" label="模块" width="120" />
      <el-table-column prop="resourceType" label="资源类型" width="120" />
      <el-table-column prop="resourceId" label="资源ID" width="100" />
      <el-table-column prop="ipAddress" label="IP地址" width="140" />
    </el-table>

    <div class="table-pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @current-change="loadData"
        @size-change="loadData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { auditLogApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref<any[]>([])
const search = reactive({ module: '', action: '', dateRange: null as [Date, Date] | null })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function actionTagType(action: string) {
  const map: Record<string, string> = { CREATE: 'success', UPDATE: 'warning', DELETE: 'danger', APPROVE: '', REJECT: 'danger', LOGIN: 'info' }
  return (map[action] || 'info') as any
}

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const params: any = { ...pagination }
    if (search.module) params.module = search.module
    if (search.action) params.action = search.action
    if (search.dateRange) {
      params.startDate = dayjs(search.dateRange[0]).format('YYYY-MM-DD')
      params.endDate = dayjs(search.dateRange[1]).format('YYYY-MM-DD')
    }
    const res: any = await auditLogApi.list(params)
    tableData.value = res.list
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}
</script>
