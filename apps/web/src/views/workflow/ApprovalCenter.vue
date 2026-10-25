<template>
  <div class="page-container">
    <div class="page-header"><h2>审批中心</h2></div>
    <el-table :data="pendingTasks" v-loading="loading" border stripe>
      <el-table-column label="流程标题" min-width="200">
        <template #default="{ row }">{{ row.instance?.title }}</template>
      </el-table-column>
      <el-table-column prop="nodeName" label="当前节点" width="150" />
      <el-table-column label="业务类型" width="120">
        <template #default="{ row }">{{ row.instance?.definition?.bizType }}</template>
      </el-table-column>
      <el-table-column label="流程名称" width="150">
        <template #default="{ row }">{{ row.instance?.definition?.name }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleApprove(row)">通过</el-button>
          <el-button type="danger" link size="small" @click="handleReject(row)">驳回</el-button>
          <el-button type="info" link size="small" @click="$router.push(`/workflow/instances/${row.instanceId}`)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && pendingTasks.length === 0" description="暂无待办事项" />

    <el-dialog v-model="detailVisible" title="流程详情" width="700px">
      <el-timeline v-if="detailData">
        <el-timeline-item
          v-for="log in detailData.logs"
          :key="log.id"
          :timestamp="log.createdAt"
          :type="log.action === 'approve' ? 'success' : log.action === 'reject' ? 'danger' : 'primary'"
        >
          <strong>{{ log.action }}</strong> - {{ log.opinion || '无意见' }}
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workflowApi } from '@/api'

const loading = ref(false)
const pendingTasks = ref<any[]>([])
const detailVisible = ref(false)
const detailData = ref<any>(null)

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const res: any = await workflowApi.instances.myPending()
    pendingTasks.value = res || []
  } finally { loading.value = false }
}

async function handleApprove(row: any) {
  const { value } = await ElMessageBox.prompt('请输入审批意见', '审批通过', { confirmButtonText: '通过', cancelButtonText: '取消' }).catch(() => ({ value: '' }))
  await workflowApi.instances.approve(row.id, value)
  ElMessage.success('审批通过')
  loadData()
}

async function handleReject(row: any) {
  const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回', { confirmButtonText: '驳回', cancelButtonText: '取消', inputValidator: (v: string) => !!v || '请输入驳回原因' }).catch(() => ({ value: '' }))
  if (!value) return
  await workflowApi.instances.reject(row.id, value)
  ElMessage.success('已驳回')
  loadData()
}

async function showDetail(row: any) {
  const res: any = await workflowApi.instances.detail(row.instanceId)
  detailData.value = res
  detailVisible.value = true
}
</script>
