<template>
  <div class="analytics-view">
    <h2>数据分析</h2>

    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <!-- ==================== Tab 1: 项目统计 ==================== -->
      <el-tab-pane label="项目统计" name="project">
        <el-row :gutter="16" class="summary-cards">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--blue">
              <div class="stat-value">{{ projectStats.totalProjects.toLocaleString() }}</div>
              <div class="stat-label">项目总数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--green">
              <div class="stat-value">{{ projectStats.activeProjects.toLocaleString() }}</div>
              <div class="stat-label">进行中</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--purple">
              <div class="stat-value">{{ projectStats.completedProjects.toLocaleString() }}</div>
              <div class="stat-label">已完成</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--red">
              <div class="stat-value">{{ projectStats.atRiskProjects.toLocaleString() }}</div>
              <div class="stat-label">风险项目</div>
            </el-card>
          </el-col>
        </el-row>

        <el-table :data="projectStats.projects" border stripe v-loading="loading.project" style="margin-top: 16px">
          <el-table-column prop="projectName" label="项目名称" min-width="180" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="progress" label="进度" width="140">
            <template #default="{ row }">
              <el-progress :percentage="row.progress" :stroke-width="14" :text-inside="true" />
            </template>
          </el-table-column>
          <el-table-column prop="phase" label="阶段" width="140" />
          <el-table-column prop="manager" label="负责人" width="120" />
        </el-table>
      </el-tab-pane>

      <!-- ==================== Tab 2: 成本统计 ==================== -->
      <el-tab-pane label="成本统计" name="cost">
        <el-row :gutter="16" class="summary-cards">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--blue">
              <div class="stat-value">{{ formatCurrency(costStats.totalBudget) }}</div>
              <div class="stat-label">总预算</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--orange">
              <div class="stat-value">{{ formatCurrency(costStats.totalActual) }}</div>
              <div class="stat-label">实际成本</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--red">
              <div class="stat-value">{{ formatCurrency(costStats.variance) }}</div>
              <div class="stat-label">偏差</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--green">
              <div class="stat-value">{{ costStats.costPerformanceIndex?.toFixed(2) ?? '-' }}</div>
              <div class="stat-label">CPI</div>
            </el-card>
          </el-col>
        </el-row>

        <el-table :data="costStats.items" border stripe v-loading="loading.cost" style="margin-top: 16px">
          <el-table-column prop="projectName" label="项目名称" min-width="180" />
          <el-table-column prop="budget" label="预算" width="150" align="right">
            <template #default="{ row }">{{ formatCurrency(row.budget) }}</template>
          </el-table-column>
          <el-table-column prop="actual" label="实际" width="150" align="right">
            <template #default="{ row }">{{ formatCurrency(row.actual) }}</template>
          </el-table-column>
          <el-table-column prop="variance" label="偏差" width="150" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.variance > 0 ? '#F56C6C' : '#67C23A' }">
                {{ formatCurrency(row.variance) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="costStatusTagType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== Tab 3: 质量统计 ==================== -->
      <el-tab-pane label="质量统计" name="quality">
        <el-row :gutter="16" class="summary-cards">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--blue">
              <div class="stat-value">{{ qualityStats.totalIssues.toLocaleString() }}</div>
              <div class="stat-label">问题总数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--green">
              <div class="stat-value">{{ qualityStats.resolvedIssues.toLocaleString() }}</div>
              <div class="stat-label">已解决</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--orange">
              <div class="stat-value">{{ qualityStats.openIssues.toLocaleString() }}</div>
              <div class="stat-label">未关闭</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card stat-card--red">
              <div class="stat-value">{{ qualityStats.ppmRate?.toLocaleString() ?? '-' }}</div>
              <div class="stat-label">PPM</div>
            </el-card>
          </el-col>
        </el-row>

        <el-table :data="qualityStats.items" border stripe v-loading="loading.quality" style="margin-top: 16px">
          <el-table-column prop="projectName" label="项目名称" min-width="180" />
          <el-table-column prop="issueCount" label="问题数" width="120" align="center">
            <template #default="{ row }">{{ row.issueCount.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="resolvedCount" label="已解决" width="120" align="center">
            <template #default="{ row }">{{ row.resolvedCount.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="ppm" label="PPM" width="120" align="right">
            <template #default="{ row }">{{ row.ppm?.toLocaleString() ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="passRate" label="合格率" width="120" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.passRate >= 95 ? '#67C23A' : row.passRate >= 80 ? '#E6A23C' : '#F56C6C' }">
                {{ row.passRate?.toFixed(1) ?? '-' }}%
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== Tab 4: 趋势分析 ==================== -->
      <el-tab-pane label="趋势分析" name="trend">
        <div class="trend-toolbar">
          <span class="trend-toolbar__label">时间粒度：</span>
          <el-radio-group v-model="trendGranularity" @change="loadTrends">
            <el-radio-button value="daily">{{ TIME_GRANULARITY.daily }}</el-radio-button>
            <el-radio-button value="weekly">{{ TIME_GRANULARITY.weekly }}</el-radio-button>
            <el-radio-button value="monthly">{{ TIME_GRANULARITY.monthly }}</el-radio-button>
          </el-radio-group>
        </div>

        <el-table :data="trendData" border stripe v-loading="loading.trend" style="margin-top: 16px">
          <el-table-column prop="period" label="时间段" min-width="160" />
          <el-table-column prop="projectCount" label="项目数" width="120" align="center">
            <template #default="{ row }">{{ row.projectCount.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="completedCount" label="完成数" width="120" align="center">
            <template #default="{ row }">{{ row.completedCount.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="issueCount" label="问题数" width="120" align="center">
            <template #default="{ row }">{{ row.issueCount.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="riskCount" label="风险数" width="120" align="center">
            <template #default="{ row }">
              <span :style="{ color: row.riskCount > 5 ? '#F56C6C' : '' }">
                {{ row.riskCount.toLocaleString() }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { analyticsApi } from '@/api'
import { ANALYTICS_REPORT_TYPE, TREND_TYPE, TIME_GRANULARITY } from '@apqp/shared'

// ==================== State ====================
const activeTab = ref('project')
const trendGranularity = ref('monthly')

const loading = reactive({
  project: false,
  cost: false,
  quality: false,
  trend: false,
})

const projectStats = reactive({
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  atRiskProjects: 0,
  projects: [] as any[],
})

const costStats = reactive({
  totalBudget: 0,
  totalActual: 0,
  variance: 0,
  costPerformanceIndex: null as number | null,
  items: [] as any[],
})

const qualityStats = reactive({
  totalIssues: 0,
  resolvedIssues: 0,
  openIssues: 0,
  ppmRate: null as number | null,
  items: [] as any[],
})

const trendData = ref<any[]>([])

// ==================== Helpers ====================
function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '-'
  return `¥${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusTagType(status: string): string {
  const map: Record<string, string> = {
    '进行中': '',
    '已完成': 'success',
    '已暂停': 'warning',
    '已取消': 'info',
    '风险': 'danger',
  }
  return map[status] ?? 'info'
}

function costStatusTagType(status: string): string {
  const map: Record<string, string> = {
    '正常': 'success',
    '超支': 'danger',
    '节约': '',
    '预警': 'warning',
  }
  return map[status] ?? 'info'
}

// ==================== Data Loading ====================
async function loadProjectStats() {
  loading.project = true
  try {
    const res = await analyticsApi.projectStats()
    const data = res.data?.data ?? res.data ?? res
    Object.assign(projectStats, {
      totalProjects: data.totalProjects ?? 0,
      activeProjects: data.activeProjects ?? 0,
      completedProjects: data.completedProjects ?? 0,
      atRiskProjects: data.atRiskProjects ?? 0,
      projects: data.projects ?? [],
    })
  } catch (e) {
    console.error('Failed to load project stats', e)
  } finally {
    loading.project = false
  }
}

async function loadCostStats() {
  loading.cost = true
  try {
    const res = await analyticsApi.costStats()
    const data = res.data?.data ?? res.data ?? res
    Object.assign(costStats, {
      totalBudget: data.totalBudget ?? 0,
      totalActual: data.totalActual ?? 0,
      variance: data.variance ?? 0,
      costPerformanceIndex: data.costPerformanceIndex ?? null,
      items: data.items ?? [],
    })
  } catch (e) {
    console.error('Failed to load cost stats', e)
  } finally {
    loading.cost = false
  }
}

async function loadQualityStats() {
  loading.quality = true
  try {
    const res = await analyticsApi.qualityStats()
    const data = res.data?.data ?? res.data ?? res
    Object.assign(qualityStats, {
      totalIssues: data.totalIssues ?? 0,
      resolvedIssues: data.resolvedIssues ?? 0,
      openIssues: data.openIssues ?? 0,
      ppmRate: data.ppmRate ?? null,
      items: data.items ?? [],
    })
  } catch (e) {
    console.error('Failed to load quality stats', e)
  } finally {
    loading.quality = false
  }
}

async function loadTrends() {
  loading.trend = true
  try {
    const res = await analyticsApi.trends({ granularity: trendGranularity.value })
    const data = res.data?.data ?? res.data ?? res
    trendData.value = data.items ?? data ?? []
  } catch (e) {
    console.error('Failed to load trends', e)
  } finally {
    loading.trend = false
  }
}

function handleTabChange(tab: string | number) {
  switch (tab) {
    case 'project':
      loadProjectStats()
      break
    case 'cost':
      loadCostStats()
      break
    case 'quality':
      loadQualityStats()
      break
    case 'trend':
      loadTrends()
      break
  }
}

// ==================== Init ====================
onMounted(() => {
  loadProjectStats()
})
</script>

<style scoped>
.analytics-view {
  padding: 20px;
}

.analytics-view h2 {
  margin: 0 0 20px;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.summary-cards {
  margin-bottom: 8px;
}

.stat-card {
  text-align: center;
  padding: 8px 0;
}

.stat-card :deep(.el-card__body) {
  padding: 20px 16px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  line-height: 1.3;
}

.stat-label {
  margin-top: 8px;
  font-size: 14px;
  color: #909399;
}

/* Accent colors for different card types */
.stat-card--blue .stat-value {
  color: #409eff;
}

.stat-card--green .stat-value {
  color: #67c23a;
}

.stat-card--red .stat-value {
  color: #f56c6c;
}

.stat-card--orange .stat-value {
  color: #e6a23c;
}

.stat-card--purple .stat-value {
  color: #9b59b6;
}

/* Trend toolbar */
.trend-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trend-toolbar__label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}
</style>
