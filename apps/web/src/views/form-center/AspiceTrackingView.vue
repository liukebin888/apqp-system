<template>
  <div class="aspice-tracking-view">
    <div class="page-header">
      <el-page-header @back="$router.back()" title="返回">
        <template #content>
          <span class="page-title">ASPICE 过程跟踪</span>
        </template>
      </el-page-header>
    </div>

    <div class="toolbar">
      <el-button type="primary" @click="handleInit" :loading="initializing">
        初始化标准 ASPICE 过程集
      </el-button>
      <el-select v-model="activeGroup" placeholder="过程组" style="width: 180px; margin-left: 12px">
        <el-option v-for="g in groupOptions" :key="g.value" :label="g.label" :value="g.value" />
      </el-select>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="summary-card">
          <template #header><span>评估总览</span></template>
          <div class="summary-stats">
            <div class="stat-row">
              <span>总过程数</span>
              <strong>{{ summary.totalProcesses || 0 }}</strong>
            </div>
            <div class="stat-row">
              <span>已评估</span>
              <strong>{{ summary.assessedProcesses || 0 }}</strong>
            </div>
            <div class="stat-row">
              <span>平均能力等级</span>
              <strong>{{ summary.avgCapabilityLevel || '—' }}</strong>
            </div>
            <el-divider />
            <div v-for="g in summary.byGroup || []" :key="g.name" class="group-stat">
              <span>{{ g.name }}</span>
              <el-progress :percentage="g.completionPercent || 0" :stroke-width="4" />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card>
          <template #header>
            <span>{{ currentGroupName }}</span>
          </template>

          <el-table :data="currentProcesses" stripe row-key="id">
            <el-table-column prop="processId" label="过程ID" width="100" />
            <el-table-column prop="processName" label="过程名称" min-width="180" />
            <el-table-column prop="capabilityLevel" label="能力等级" width="100">
              <template #default="{ row }">
                <el-select v-model="row.capabilityLevel" size="small" style="width: 80px" @change="handleProcessUpdate(row)">
                  <el-option v-for="cl in capabilityLevels" :key="cl.value" :label="cl.label" :value="cl.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="processStatusType(row.status)" size="small">
                  {{ processStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="基础实践 (BP)" min-width="300">
              <template #default="{ row }">
                <div class="bp-list">
                  <div v-for="bp in row.basePractices || []" :key="bp.id" class="bp-item">
                    <span class="bp-id">{{ bp.practiceId }}</span>
                    <el-select v-model="bp.rating" size="small" style="width: 60px" @change="handlePracticeUpdate(row)">
                      <el-option v-for="r in bpRatings" :key="r.value" :label="r.label" :value="r.value" />
                    </el-select>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="assessmentNote" label="评估备注" width="150">
              <template #default="{ row }">
                <el-input v-model="row.assessmentNote" size="small" @blur="handleProcessUpdate(row)" />
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!currentProcesses.length" description="暂无过程数据，点击初始化" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { aspiceTrackingApi } from '@/api'

const route = useRoute()
const projectId = Number(route.params.projectId)

const processes = ref<any[]>([])
const summary = ref<any>({})
const activeGroup = ref('SYS')
const initializing = ref(false)

const groupOptions = [
  { value: 'SYS', label: 'SYS 系统' },
  { value: 'SWE', label: 'SWE 软件' },
  { value: 'SUP', label: 'SUP 支持' },
  { value: 'MAN', label: 'MAN 管理' },
  { value: 'ACQ', label: 'ACQ 采购' },
]

const capabilityLevels = [
  { value: 'CL0', label: 'CL0' },
  { value: 'CL1', label: 'CL1' },
  { value: 'CL2', label: 'CL2' },
  { value: 'CL3', label: 'CL3' },
  { value: 'CL4', label: 'CL4' },
  { value: 'CL5', label: 'CL5' },
]

const bpRatings = [
  { value: 'N', label: 'N' },
  { value: 'P', label: 'P' },
  { value: 'L', label: 'L' },
  { value: 'F', label: 'F' },
]

const currentGroupName = computed(() => groupOptions.find(g => g.value === activeGroup.value)?.label || '')
const currentProcesses = computed(() =>
  processes.value.filter(p => (p.processGroup || p.processId?.split('.')[0]) === activeGroup.value)
)

function processStatusType(status: string) {
  const map: Record<string, string> = { assessed: 'success', in_progress: 'warning', not_started: 'info' }
  return (map[status] || 'info') as any
}

function processStatusText(status: string) {
  const map: Record<string, string> = { assessed: '已评估', in_progress: '评估中', not_started: '未开始' }
  return map[status] || status || '—'
}

async function loadData() {
  try {
    const [procRes, sumRes] = await Promise.allSettled([
      aspiceTrackingApi.list({ projectId }),
      aspiceTrackingApi.summary(projectId),
    ])
    if (procRes.status === 'fulfilled') processes.value = (procRes.value as any).data?.list || (procRes.value as any).data || []
    if (sumRes.status === 'fulfilled') summary.value = (sumRes.value as any).data || {}
  } catch (e) {
    console.error(e)
  }
}

async function handleInit() {
  initializing.value = true
  try {
    await aspiceTrackingApi.init(projectId)
    ElMessage.success('ASPICE 过程集初始化完成')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '初始化失败')
  } finally {
    initializing.value = false
  }
}

async function handleProcessUpdate(row: any) {
  try {
    await aspiceTrackingApi.update(row.id, {
      capabilityLevel: row.capabilityLevel,
      status: row.status,
      assessmentNote: row.assessmentNote,
    })
  } catch (e) {
    console.error(e)
  }
}

async function handlePracticeUpdate(process: any) {
  try {
    await aspiceTrackingApi.batchUpdatePractices(process.id, process.basePractices || [])
  } catch (e) {
    console.error(e)
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.aspice-tracking-view {
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

.summary-card {
  .summary-stats {
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;

      strong {
        color: #409EFF;
      }
    }

    .group-stat {
      margin-bottom: 8px;
      font-size: 13px;
    }
  }
}

.bp-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.bp-item {
  display: flex;
  align-items: center;
  gap: 4px;

  .bp-id {
    font-size: 11px;
    color: #909399;
    min-width: 30px;
  }
}
</style>
