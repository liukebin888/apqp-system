<template>
  <div class="page-container">
    <div class="page-header"><h2>我发起的流程</h2></div>
    <el-table :data="tableData" v-loading="loading" border stripe>
      <el-table-column prop="title" label="流程标题" min-width="200" />
      <el-table-column label="流程名称" width="150">
        <template #default="{ row }">{{ row.definition?.name }}</template>
      </el-table-column>
      <el-table-column label="业务类型" width="120">
        <template #default="{ row }">{{ row.definition?.bizType }}</template>
      </el-table-column>
      <el-table-column prop="bizNo" label="业务编号" width="140" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="instanceStatusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发起时间" width="170">
        <template #default="{ row }">{{ formatDate(row.startedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="$router.push(`/workflow/instances/${row.id}`)">跟踪</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-pagination">
      <el-pagination v-model:current-page="pagination.page" :total="pagination.total" layout="total, prev, pager, next" @current-change="loadData" />
    </div>

    <el-dialog v-model="detailVisible" title="流程详情" width="700px">
      <el-timeline v-if="detailData">
        <el-timeline-item v-for="log in detailData.logs" :key="log.id" :timestamp="log.createdAt" :type="log.action === 'approve' ? 'success' : log.action === 'reject' ? 'danger' : 'primary'">
          <strong>{{ log.action }}</strong> - {{ log.opinion || '无意见' }}
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { workflowApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref<any[]>([])
const detailVisible = ref(false)
const detailData = ref<any>(null)
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

function instanceStatusType(s: string) { return { running: 'primary', completed: 'success', rejected: 'danger', cancelled: 'info', suspended: 'warning' }[s] || 'info' }
function formatDate(d: string) { return dayjs(d).format('YYYY-MM-DD HH:mm') }

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const res: any = await workflowApi.instances.myInitiated(pagination)
    tableData.value = res?.list || []
    pagination.total = res?.total || 0
  } finally { loading.value = false }
}

async function showDetail(id: number) {
  const res: any = await workflowApi.instances.detail(id)
  detailData.value = res
  detailVisible.value = true
}
</script>
