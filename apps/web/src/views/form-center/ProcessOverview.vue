<template>
  <div class="process-overview">
    <div class="page-header">
      <el-page-header @back="$router.back()" title="返回">
        <template #content>
          <span class="page-title">流程总览 — {{ projectName }}</span>
        </template>
      </el-page-header>
    </div>

    <el-row :gutter="20" class="phase-pipeline">
      <el-col :span="4" v-for="phase in phases" :key="phase.key">
        <div class="phase-card" :class="{ current: phase.key === currentPhase }">
          <div class="phase-number">P{{ phase.index }}</div>
          <div class="phase-name">{{ phase.name }}</div>
          <el-progress
            :percentage="phase.progress"
            :color="phase.color"
            :stroke-width="6"
          />
          <div class="phase-stats">
            <div v-for="stat in phase.stats" :key="stat.label" class="stat-item">
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-divider />

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>Gate 评审状态</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="gate in gateReviews"
              :key="gate.id"
              :type="gateStatusType(gate.reviewResult)"
              :timestamp="gate.scheduledDate"
              placement="top"
            >
              <div class="gate-item">
                <strong>{{ gate.gateType }} — {{ gate.projectName }}</strong>
                <el-tag size="small" :type="gateStatusType(gate.reviewResult)">
                  {{ gateStatusText(gate.reviewResult) }}
                </el-tag>
              </div>
              <div v-if="gate.conclusion" class="gate-conclusion">{{ gate.conclusion }}</div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="!gateReviews.length" description="暂无评审记录" :image-size="60" />
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>里程碑进度</span>
          </template>
          <el-table :data="milestones" size="small" stripe>
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="plannedDate" label="计划日期" width="120" />
            <el-table-column prop="actualDate" label="实际日期" width="120" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'completed' ? '已完成' : '进行中' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!milestones.length" description="暂无里程碑" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="8">
        <el-card>
          <template #header><span>APQP 检查表</span></template>
          <div class="checklist-summary">
            <el-progress type="circle" :percentage="apqpProgress" :width="100" />
            <div class="checklist-detail">
              <div>已完成项：{{ apqpCompleted }}/{{ apqpTotal }}</div>
              <div>检查表数：{{ apqpChecklistCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header><span>ASPICE 过程评估</span></template>
          <div class="checklist-summary">
            <el-progress type="circle" :percentage="aspiceProgress" :width="100" />
            <div class="checklist-detail">
              <div>已评估过程：{{ aspiceAssessed }}/{{ aspiceTotal }}</div>
              <div v-for="group in aspiceByGroup" :key="group.name" class="aspice-group">
                {{ group.name }}: {{ group.count }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header><span>OTS 文档检查</span></template>
          <div class="checklist-summary">
            <el-progress type="circle" :percentage="otsDocProgress" :width="100" />
            <div class="checklist-detail">
              <div>已通过：{{ otsDocPassed }}/{{ otsDocTotal }}</div>
              <div>检查表数：{{ otsDocChecklistCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { dashboardApi, projectApi, gateReviewApi, milestoneApi, checklistApi, aspiceTrackingApi, otsApi } from '@/api'

const route = useRoute()
const projectId = Number(route.params.projectId)
const projectName = ref('')

const overviewData = ref<any>({})
const gateReviews = ref<any[]>([])
const milestones = ref<any[]>([])
const apqpProgressData = ref<any>({})
const aspiceSummary = ref<any>({})
const otsDocData = ref<any[]>([])

const phases = computed(() => {
  const data = overviewData.value
  return [
    { key: 'phase1', index: 1, name: '计划与定义', color: '#409EFF', progress: data.phase1Progress || 0, stats: data.phase1Stats || [] },
    { key: 'phase2', index: 2, name: '产品设计开发', color: '#67C23A', progress: data.phase2Progress || 0, stats: data.phase2Stats || [] },
    { key: 'phase3', index: 3, name: '过程设计开发', color: '#E6A23C', progress: data.phase3Progress || 0, stats: data.phase3Stats || [] },
    { key: 'phase4', index: 4, name: '产品与过程确认', color: '#F56C6C', progress: data.phase4Progress || 0, stats: data.phase4Stats || [] },
    { key: 'phase5', index: 5, name: '量产与反馈', color: '#909399', progress: data.phase5Progress || 0, stats: data.phase5Stats || [] },
    { key: 'gates', index: 0, name: '门禁总览', color: '#8B5CF6', progress: data.gateProgress || 0, stats: data.gateStats || [] },
  ]
})

const currentPhase = computed(() => {
  const data = overviewData.value
  return data.currentPhase || 'phase1'
})

const apqpProgress = computed(() => apqpProgressData.value.overallPercent || 0)
const apqpCompleted = computed(() => apqpProgressData.value.completedItems || 0)
const apqpTotal = computed(() => apqpProgressData.value.totalItems || 0)
const apqpChecklistCount = computed(() => apqpProgressData.value.checklistCount || 0)

const aspiceProgress = computed(() => {
  const total = aspiceSummary.value.totalProcesses || 0
  const assessed = aspiceSummary.value.assessedProcesses || 0
  return total > 0 ? Math.round((assessed / total) * 100) : 0
})
const aspiceAssessed = computed(() => aspiceSummary.value.assessedProcesses || 0)
const aspiceTotal = computed(() => aspiceSummary.value.totalProcesses || 0)
const aspiceByGroup = computed(() => aspiceSummary.value.byGroup || [])

const otsDocProgress = computed(() => {
  const total = otsDocData.value.reduce((sum: number, d: any) => sum + (d.totalItems || 0), 0)
  const passed = otsDocData.value.reduce((sum: number, d: any) => sum + (d.passedItems || 0), 0)
  return total > 0 ? Math.round((passed / total) * 100) : 0
})
const otsDocPassed = computed(() => otsDocData.value.reduce((sum: number, d: any) => sum + (d.passedItems || 0), 0))
const otsDocTotal = computed(() => otsDocData.value.reduce((sum: number, d: any) => sum + (d.totalItems || 0), 0))
const otsDocChecklistCount = computed(() => otsDocData.value.length)

function gateStatusType(status: string) {
  const map: Record<string, string> = { approved: 'success', rejected: 'danger', pending: 'warning', conditional: 'info' }
  return (map[status] || 'info') as any
}

function gateStatusText(status: string) {
  const map: Record<string, string> = { approved: '通过', rejected: '不通过', pending: '待审', conditional: '有条件通过' }
  return map[status] || status || '—'
}

onMounted(async () => {
  try {
    const [projectRes, overviewRes, gateRes, milestoneRes, apqpRes, aspiceRes, otsRes] = await Promise.allSettled([
      projectApi.get(projectId),
      dashboardApi.processOverview(projectId),
      gateReviewApi.list({ projectId }),
      milestoneApi.list(projectId),
      checklistApi.progress(projectId),
      aspiceTrackingApi.summary(projectId),
      otsApi.docChecklists.list({ projectId }),
    ])

    if (projectRes.status === 'fulfilled') projectName.value = (projectRes.value as any).data?.projectName || ''
    if (overviewRes.status === 'fulfilled') overviewData.value = (overviewRes.value as any).data || {}
    if (gateRes.status === 'fulfilled') gateReviews.value = ((gateRes.value as any).data?.list || (gateRes.value as any).data || [])
    if (milestoneRes.status === 'fulfilled') milestones.value = ((milestoneRes.value as any).data?.list || (milestoneRes.value as any).data || [])
    if (apqpRes.status === 'fulfilled') apqpProgressData.value = (apqpRes.value as any).data || {}
    if (aspiceRes.status === 'fulfilled') aspiceSummary.value = (aspiceRes.value as any).data || {}
    if (otsRes.status === 'fulfilled') otsDocData.value = (otsRes.value as any).data?.list || (otsRes.value as any).data || []
  } catch (e) {
    console.error('Failed to load process overview', e)
  }
})
</script>

<style scoped lang="scss">
.process-overview {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.phase-pipeline {
  margin-bottom: 20px;
}

.phase-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.3s;

  &.current {
    border-color: #409EFF;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
  }

  .phase-number {
    font-size: 24px;
    font-weight: bold;
    color: #409EFF;
  }

  .phase-name {
    font-size: 14px;
    margin: 8px 0;
    font-weight: 500;
  }

  .phase-stats {
    margin-top: 12px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    padding: 2px 0;
  }

  .stat-label {
    color: #909399;
  }

  .stat-value {
    font-weight: 600;
  }
}

.gate-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gate-conclusion {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.checklist-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 0;
}

.checklist-detail {
  font-size: 14px;
  line-height: 2;
}

.aspice-group {
  font-size: 12px;
  color: #606266;
}
</style>
