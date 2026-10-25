<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>流程实例跟踪</h2>
      <div>
        <el-button @click="$router.back()">返回</el-button>
      </div>
    </div>

    <template v-if="instance">
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="16">
          <el-card>
            <template #header><span>流程信息</span></template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="流程标题">{{ instance.title }}</el-descriptions-item>
              <el-descriptions-item label="流程定义">{{ instance.definition?.name }}</el-descriptions-item>
              <el-descriptions-item label="业务类型">{{ instance.definition?.bizType }}</el-descriptions-item>
              <el-descriptions-item label="当前状态">
                <el-tag :type="instanceStatusType(instance.status)" size="small">{{ instanceStatus(instance.status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="发起人">{{ instance.initiator?.realName }}</el-descriptions-item>
              <el-descriptions-item label="发起时间">{{ formatDate(instance.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="业务数据" :span="2">
                <el-text type="info">{{ instance.bizData ? JSON.stringify(instance.bizData) : '-' }}</el-text>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card>
            <template #header><span>操作</span></template>
            <div v-if="currentNodeInstance">
              <el-alert :title="`当前节点: ${currentNodeInstance.nodeName}`" type="info" :closable="false" show-icon style="margin-bottom: 16px" />
              <div style="display: flex; gap: 12px">
                <el-button type="success" @click="handleApprove" :loading="actionLoading">通过</el-button>
                <el-button type="danger" @click="handleReject" :loading="actionLoading">驳回</el-button>
              </div>
            </div>
            <el-empty v-else description="无待办节点" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>

      <el-card style="margin-bottom: 20px">
        <template #header><span>流程进度</span></template>
        <el-steps :active="activeStep" finish-status="success" align-center>
          <el-step
            v-for="(node, index) in instance.definition?.nodeDefinitions || []"
            :key="node.nodeKey"
            :title="node.nodeName"
            :status="getNodeStatus(node.nodeKey, index)"
          >
            <template #icon>
              <el-icon v-if="getNodeStatus(node.nodeKey, index) === 'success'"><CircleCheck /></el-icon>
              <el-icon v-else-if="getNodeStatus(node.nodeKey, index) === 'process'"><Loading /></el-icon>
            </template>
          </el-step>
        </el-steps>
      </el-card>

      <el-card>
        <template #header><span>审批历史</span></template>
        <el-timeline v-if="logs.length">
          <el-timeline-item
            v-for="log in logs"
            :key="log.id"
            :timestamp="formatDate(log.createdAt)"
            :type="logType(log.action)"
            :hollow="log.action === 'start'"
          >
            <el-card shadow="hover">
              <div style="display: flex; justify-content: space-between; align-items: center">
                <div>
                  <el-tag :type="logType(log.action)" size="small" style="margin-right: 8px">{{ logAction(log.action) }}</el-tag>
                  <strong>{{ log.nodeName }}</strong>
                  <span v-if="log.operator" style="margin-left: 8px; color: #909399">操作人: {{ log.operator?.realName }}</span>
                </div>
              </div>
              <div v-if="log.opinion" style="margin-top: 8px; color: #606266">{{ log.opinion }}</div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无审批记录" :image-size="80" />
      </el-card>
    </template>

    <el-empty v-if="!instance && !loading" description="流程实例不存在" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workflowApi } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const instanceId = +route.params.instanceId
const loading = ref(false)
const actionLoading = ref(false)
const instance = ref<any>(null)
const logs = ref<any[]>([])

const currentNodeInstance = computed(() => {
  return instance.value?.nodeInstances?.find((n: any) => n.status === 'pending')
})

const activeStep = computed(() => {
  if (!instance.value?.definition?.nodeDefinitions) return 0
  const nodes = instance.value.definition.nodeDefinitions
  const pendingIdx = nodes.findIndex((n: any) =>
    instance.value.nodeInstances?.some((ni: any) => ni.nodeKey === n.nodeKey && ni.status === 'pending')
  )
  if (pendingIdx >= 0) return pendingIdx
  const completedCount = instance.value.nodeInstances?.filter((n: any) => n.status === 'completed').length || 0
  return completedCount
})

function formatDate(d: string) { return d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-' }

function instanceStatus(s: string) {
  const map: Record<string, string> = { running: '进行中', completed: '已完成', rejected: '已驳回', rolled_back: '已回退', cancelled: '已取消' }
  return map[s] || s
}

function instanceStatusType(s: string) {
  const map: Record<string, string> = { running: 'primary', completed: 'success', rejected: 'danger', rolled_back: 'warning', cancelled: 'info' }
  return map[s] || 'info'
}

function getNodeStatus(nodeKey: string, index: number): string {
  if (!instance.value?.nodeInstances) return 'wait'
  const nodeInst = instance.value.nodeInstances.find((n: any) => n.nodeKey === nodeKey)
  if (nodeInst?.status === 'completed') return 'success'
  if (nodeInst?.status === 'pending') return 'process'
  if (nodeInst?.status === 'rejected') return 'error'
  if (index < activeStep.value) return 'success'
  return 'wait'
}

function logType(action: string) {
  const map: Record<string, string> = { start: 'primary', approve: 'success', reject: 'danger', rollback: 'warning' }
  return map[action] || 'info'
}

function logAction(action: string) {
  const map: Record<string, string> = { start: '发起', approve: '通过', reject: '驳回', rollback: '回退' }
  return map[action] || action
}

async function loadData() {
  loading.value = true
  try {
    const res: any = await workflowApi.instances.detail(instanceId)
    instance.value = res
    logs.value = res?.logs || []
  } finally {
    loading.value = false
  }
}

async function handleApprove() {
  const { value } = await ElMessageBox.prompt('请输入审批意见', '审批通过', {
    confirmButtonText: '通过',
    cancelButtonText: '取消',
  }).catch(() => ({ value: '' }))

  if (!currentNodeInstance.value) return
  actionLoading.value = true
  try {
    await workflowApi.instances.approve(currentNodeInstance.value.id, value)
    ElMessage.success('审批通过')
    await loadData()
  } finally {
    actionLoading.value = false
  }
}

async function handleReject() {
  const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回', {
    confirmButtonText: '驳回',
    cancelButtonText: '取消',
    inputValidator: (v: string) => !!v || '请输入驳回原因',
  }).catch(() => ({ value: '' }))

  if (!value || !currentNodeInstance.value) return
  actionLoading.value = true
  try {
    await workflowApi.instances.reject(currentNodeInstance.value.id, value)
    ElMessage.success('已驳回')
    await loadData()
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => loadData())
</script>
