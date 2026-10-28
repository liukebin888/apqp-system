<template>
  <div class="apqp-checklist-view">
    <div class="page-header">
      <el-page-header @back="$router.back()" title="返回">
        <template #content>
          <span class="page-title">APQP 检查表</span>
        </template>
      </el-page-header>
    </div>

    <div class="toolbar">
      <el-button type="primary" @click="handleInstantiate" :loading="instantiating">
        初始化五阶段检查表
      </el-button>
      <el-select v-model="activePhase" placeholder="选择阶段" style="width: 200px; margin-left: 12px">
        <el-option v-for="p in phaseOptions" :key="p.value" :label="p.label" :value="p.value" />
      </el-select>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="progress-card">
          <template #header><span>总体进度</span></template>
          <el-progress type="circle" :percentage="overallProgress" :width="120" />
          <div class="progress-detail">
            <div>已完成: {{ completedCount }}/{{ totalCount }}</div>
            <div>检查表: {{ checklists.length }} 份</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ currentPhaseName }}</span>
              <el-tag>{{ currentPhaseChecklists.length }} 份检查表</el-tag>
            </div>
          </template>

          <el-collapse v-model="expandedChecklists" accordion>
            <el-collapse-item
              v-for="checklist in currentPhaseChecklists"
              :key="checklist.id"
              :name="checklist.id"
            >
              <template #title>
                <div class="checklist-title">
                  <span>{{ checklist.phaseName }} — {{ checklist.checklistType }}</span>
                  <el-progress
                    :percentage="calcChecklistProgress(checklist)"
                    :stroke-width="4"
                    style="width: 120px; margin-left: 12px"
                  />
                  <el-tag :type="checklistStatusType(checklist.status)" size="small" style="margin-left: 8px">
                    {{ checklistStatusText(checklist.status) }}
                  </el-tag>
                </div>
              </template>

              <el-table :data="checklist.items || []" size="small" stripe>
                <el-table-column prop="seqNo" label="序号" width="60" />
                <el-table-column prop="itemName" label="检查项" min-width="200" />
                <el-table-column prop="checkResult" label="结果" width="100">
                  <template #default="{ row }">
                    <el-select v-model="row.checkResult" size="small" @change="handleItemUpdate(row)">
                      <el-option label="通过" value="pass" />
                      <el-option label="不通过" value="fail" />
                      <el-option label="不适用" value="na" />
                      <el-option label="待检查" value="pending" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" width="150">
                  <template #default="{ row }">
                    <el-input v-model="row.remark" size="small" placeholder="备注" @blur="handleItemUpdate(row)" />
                  </template>
                </el-table-column>
                <el-table-column prop="checkedByName" label="检查人" width="100" />
                <el-table-column prop="checkedAt" label="检查日期" width="120">
                  <template #default="{ row }">{{ formatDate(row.checkedAt) }}</template>
                </el-table-column>
              </el-table>
            </el-collapse-item>
          </el-collapse>

          <el-empty v-if="!currentPhaseChecklists.length" description="暂无检查表，点击初始化" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { checklistApi } from '@/api'

const route = useRoute()
const projectId = Number(route.params.projectId)

const checklists = ref<any[]>([])
const activePhase = ref('phase1')
const expandedChecklists = ref<number | string>('')
const instantiating = ref(false)

const phaseOptions = [
  { value: 'phase1', label: 'P1 计划与定义' },
  { value: 'phase2', label: 'P2 产品设计开发' },
  { value: 'phase3', label: 'P3 过程设计开发' },
  { value: 'phase4', label: 'P4 产品与过程确认' },
  { value: 'phase5', label: 'P5 量产与反馈' },
]

const currentPhaseName = computed(() => phaseOptions.find(p => p.value === activePhase.value)?.label || '')
const currentPhaseChecklists = computed(() =>
  checklists.value.filter(c => (c.apqpPhase || c.phase) === activePhase.value)
)

const totalCount = computed(() => checklists.value.reduce((s, c) => s + (c.items?.length || 0), 0))
const completedCount = computed(() =>
  checklists.value.reduce(
    (s, c) => s + (c.items?.filter((i: any) => i.checkResult === 'pass' || i.checkResult === 'na').length || 0),
    0,
  )
)
const overallProgress = computed(() => (totalCount.value > 0 ? Math.round((completedCount.value / totalCount.value) * 100) : 0))

function calcChecklistProgress(checklist: any) {
  const items = checklist.items || []
  if (!items.length) return 0
  const done = items.filter((i: any) => i.checkResult === 'pass' || i.checkResult === 'na').length
  return Math.round((done / items.length) * 100)
}

function checklistStatusType(status: string) {
  const map: Record<string, string> = { completed: 'success', in_progress: 'warning', not_started: 'info' }
  return (map[status] || 'info') as any
}

function checklistStatusText(status: string) {
  const map: Record<string, string> = { completed: '已完成', in_progress: '进行中', not_started: '未开始' }
  return map[status] || status || '—'
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-CN')
}

async function loadData() {
  try {
    const res = await checklistApi.list({ projectId })
    checklists.value = (res as any).data?.list || (res as any).data || []
  } catch (e) {
    console.error(e)
  }
}

async function handleInstantiate() {
  instantiating.value = true
  try {
    await checklistApi.instantiate(projectId)
    ElMessage.success('检查表初始化完成')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '初始化失败')
  } finally {
    instantiating.value = false
  }
}

async function handleItemUpdate(item: any) {
  try {
    await checklistApi.updateItem(item.id, {
      checkResult: item.checkResult,
      remark: item.remark,
    })
  } catch (e) {
    console.error(e)
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.apqp-checklist-view {
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

.progress-card {
  text-align: center;

  .progress-detail {
    margin-top: 16px;
    font-size: 14px;
    line-height: 2;
    color: #606266;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checklist-title {
  display: flex;
  align-items: center;
  width: 100%;
}
</style>
