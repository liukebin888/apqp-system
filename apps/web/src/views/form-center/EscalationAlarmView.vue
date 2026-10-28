<template>
  <div class="escalation-alarm-view">
    <div class="page-header">
      <el-page-header @back="$router.back()" title="返回">
        <template #content>
          <span class="page-title">升级报警单</span>
        </template>
      </el-page-header>
    </div>

    <div class="toolbar">
      <el-button type="primary" @click="showCreateDialog = true">新建报警单</el-button>
      <el-select v-model="filterLevel" placeholder="报警级别" style="width: 140px; margin-left: 12px" clearable @change="loadData">
        <el-option label="L1 项目级" value="L1" />
        <el-option label="L2 部门级" value="L2" />
        <el-option label="L3 公司级" value="L3" />
        <el-option label="L4 客户级" value="L4" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" style="width: 120px; margin-left: 8px" clearable @change="loadData">
        <el-option label="待处理" value="open" />
        <el-option label="处理中" value="in_progress" />
        <el-option label="已关闭" value="closed" />
      </el-select>
    </div>

    <el-table :data="filteredAlarms" stripe>
      <el-table-column prop="alarmCode" label="报警编号" width="140" />
      <el-table-column prop="title" label="报警标题" min-width="200" />
      <el-table-column prop="level" label="级别" width="100">
        <template #default="{ row }">
          <el-tag :type="levelType(row.level)" size="small">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sourceType" label="来源" width="100">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.sourceType || '—' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="escalatedByName" label="报警人" width="100" />
      <el-table-column prop="createdAt" label="报警时间" width="120">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="handleView(row)">查看</el-button>
          <el-button v-if="row.status !== 'closed'" size="small" text type="success" @click="handleClose(row)">关闭</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!filteredAlarms.length" description="暂无报警记录" />

    <el-dialog v-model="showCreateDialog" title="新建升级报警单" width="600px">
      <el-form :model="newAlarm" label-width="100px">
        <el-form-item label="报警标题" required>
          <el-input v-model="newAlarm.title" />
        </el-form-item>
        <el-form-item label="报警级别" required>
          <el-select v-model="newAlarm.level" style="width: 100%">
            <el-option label="L1 项目级" value="L1" />
            <el-option label="L2 部门级" value="L2" />
            <el-option label="L3 公司级" value="L3" />
            <el-option label="L4 客户级" value="L4" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源类型">
          <el-select v-model="newAlarm.sourceType" style="width: 100%">
            <el-option label="问题跟踪" value="quality_issue" />
            <el-option label="8D报告" value="8d_report" />
            <el-option label="客户投诉" value="customer_complaint" />
            <el-option label="审核发现" value="audit_finding" />
            <el-option label="手动报警" value="manual" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联问题ID">
          <el-input v-model="newAlarm.sourceId" type="number" />
        </el-form-item>
        <el-form-item label="报警描述">
          <el-input v-model="newAlarm.description" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="要求响应时间">
          <el-date-picker v-model="newAlarm.requiredResponseTime" type="datetime" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="报警单详情" width="600px">
      <el-descriptions :column="2" border v-if="currentAlarm">
        <el-descriptions-item label="报警编号">{{ currentAlarm.alarmCode }}</el-descriptions-item>
        <el-descriptions-item label="报警标题">{{ currentAlarm.title }}</el-descriptions-item>
        <el-descriptions-item label="级别">
          <el-tag :type="levelType(currentAlarm.level)" size="small">{{ currentAlarm.level }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(currentAlarm.status)" size="small">{{ statusText(currentAlarm.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="来源类型">{{ currentAlarm.sourceType || '—' }}</el-descriptions-item>
        <el-descriptions-item label="报警人">{{ currentAlarm.escalatedByName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="报警时间">{{ formatDate(currentAlarm.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="要求响应">{{ formatDate(currentAlarm.requiredResponseTime) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentAlarm.description || '—' }}</el-descriptions-item>
        <el-descriptions-item label="处理记录" :span="2">
          <div v-for="h in currentAlarm.history || []" :key="h.id" class="history-item">
            <span>{{ formatDate(h.createdAt) }} — {{ h.action }}</span>
            <span v-if="h.note">: {{ h.note }}</span>
          </div>
          <span v-if="!currentAlarm.history?.length">暂无处理记录</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { qualityApi } from '@/api'

const route = useRoute()
const projectId = Number(route.params.projectId)

const alarms = ref<any[]>([])
const filterLevel = ref('')
const filterStatus = ref('')
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const currentAlarm = ref<any>(null)
const creating = ref(false)

const newAlarm = ref({
  title: '',
  level: 'L1',
  sourceType: 'manual',
  sourceId: '',
  description: '',
  requiredResponseTime: '',
})

const filteredAlarms = computed(() => {
  let result = alarms.value
  if (filterLevel.value) result = result.filter(a => a.level === filterLevel.value)
  if (filterStatus.value) result = result.filter(a => a.status === filterStatus.value)
  return result
})

function levelType(level: string) {
  const map: Record<string, string> = { L1: 'warning', L2: 'danger', L3: 'danger', L4: 'danger' }
  return (map[level] || 'info') as any
}

function statusType(status: string) {
  const map: Record<string, string> = { open: 'danger', in_progress: 'warning', closed: 'success' }
  return (map[status] || 'info') as any
}

function statusText(status: string) {
  const map: Record<string, string> = { open: '待处理', in_progress: '处理中', closed: '已关闭' }
  return map[status] || status || '—'
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-CN')
}

async function loadData() {
  try {
    const res = await qualityApi.escalation.projectHistory(projectId)
    alarms.value = (res as any).data?.list || (res as any).data || []
  } catch {
    alarms.value = []
  }
}

function handleView(row: any) {
  currentAlarm.value = row
  showDetailDialog.value = true
}

async function handleClose(row: any) {
  try {
    await qualityApi.problems.close(row.sourceId || row.id)
    ElMessage.success('已关闭')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '关闭失败')
  }
}

async function handleCreate() {
  if (!newAlarm.value.title) {
    ElMessage.warning('请填写报警标题')
    return
  }
  const problemId = Number(newAlarm.value.sourceId)
  if (!problemId) {
    ElMessage.warning('请填写关联问题ID')
    return
  }
  creating.value = true
  try {
    await qualityApi.escalation.manualEscalate(problemId, newAlarm.value.level)
    ElMessage.success('报警单已创建')
    showCreateDialog.value = false
    newAlarm.value = { title: '', level: 'L1', sourceType: 'manual', sourceId: '', description: '', requiredResponseTime: '' }
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '创建失败')
  } finally {
    creating.value = false
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.escalation-alarm-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.history-item {
  font-size: 13px;
  color: #606266;
  padding: 4px 0;
  border-bottom: 1px dashed #ebeef5;
}
</style>
