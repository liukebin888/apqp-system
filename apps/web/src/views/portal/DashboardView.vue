<template>
  <div class="page-container">
    <div class="page-header">
      <h2>工作台</h2>
      <div class="header-actions">
        <span class="welcome">欢迎回来，{{ authStore.user?.realName }}</span>
        <el-button :icon="Refresh" circle @click="loadData" :loading="loading" />
      </div>
    </div>

    <!-- Row 1: KPI Cards -->
    <el-row :gutter="12" class="kpi-row">
      <KpiStatCard
        label="项目总数" :value="overview.projects.total"
        icon="FolderOpened" color="#409eff"
        :subText="`${overview.projects.active} 进行中`" to="/projects"
      />
      <KpiStatCard
        label="我的待办" :value="totalMyTasks"
        icon="List" color="#e6a23c"
        :subText="`${overview.myTasks.workflowPending} 审批`"
      />
      <KpiStatCard
        label="工程变更" :value="overview.changes.openEcrs + overview.changes.activeEcns"
        icon="Switch" color="#b37feb"
        :subText="`${overview.changes.openEcrs} ECR / ${overview.changes.activeEcns} ECN`" to="/change-management"
      />
      <KpiStatCard
        label="质量问题" :value="overview.quality.openProblems"
        icon="WarningFilled" color="#f56c6c"
        :subText="`${overview.quality.criticalProblems} 严重`" to="/quality"
      />
      <KpiStatCard
        label="FMEA 高AP" :value="overview.fmea.highApCount"
        icon="DataAnalysis" color="#eb2f96"
        subText="需关注" to="/quality-engineering"
      />
      <KpiStatCard
        label="采购待处理" :value="overview.procurement.pendingRequests"
        icon="ShoppingCart" color="#13c2c2"
        :subText="`${overview.procurement.activeOrders} 在途订单`" to="/procurement"
      />
      <KpiStatCard
        label="开放 CAPA" :value="overview.quality.openCapas"
        icon="Checked" color="#52c41a"
        subText="待验证关闭" to="/quality"
      />
      <KpiStatCard
        label="预警" :value="overview.alerts.unresolvedCount"
        icon="Bell" color="#fa8c16"
        :subText="`${overview.unreadNotifications} 未读通知`"
      />
    </el-row>

    <!-- Row 2: Charts -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="8">
        <ProjectStatusChart
          :active="overview.projects.active"
          :onHold="overview.projects.onHold"
          :completed="overview.projects.completed"
        />
      </el-col>
      <el-col :span="8">
        <QualityTrendChart :data="trends.qualityTrends" />
      </el-col>
      <el-col :span="8">
        <ApDistributionChart :dfmea="apDist.dfmea" :pfmea="apDist.pfmea" />
      </el-col>
    </el-row>

    <!-- Row 3: Tasks + Warnings -->
    <el-row :gutter="16" class="content-row">
      <el-col :span="16">
        <MyTasksTable :tasks="myTasks" />
      </el-col>
      <el-col :span="8">
        <WarningsPanel :warnings="warnings" />
      </el-col>
    </el-row>

    <!-- Row 4: Activity + Shortcuts -->
    <el-row :gutter="16" class="content-row">
      <el-col :span="12">
        <ActivityFeed :notifications="recentNotifications" />
      </el-col>
      <el-col :span="12">
        <QuickEntryShortcuts />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth.store'
import { dashboardApi, notificationApi, fmeaApi } from '@/api'
import KpiStatCard from './components/KpiStatCard.vue'
import ProjectStatusChart from './components/ProjectStatusChart.vue'
import QualityTrendChart from './components/QualityTrendChart.vue'
import ApDistributionChart from './components/ApDistributionChart.vue'
import MyTasksTable from './components/MyTasksTable.vue'
import WarningsPanel from './components/WarningsPanel.vue'
import ActivityFeed from './components/ActivityFeed.vue'
import QuickEntryShortcuts from './components/QuickEntryShortcuts.vue'

const authStore = useAuthStore()
const loading = ref(false)

const overview = ref({
  projects: { total: 0, active: 0, onHold: 0, completed: 0 },
  myTasks: { wbsTasks: 0, risks: 0, ecrs: 0, ecnActions: 0, problems: 0, capas: 0, fmeaActions: 0, workflowPending: 0 },
  quality: { openProblems: 0, criticalProblems: 0, openCapas: 0 },
  changes: { openEcrs: 0, activeEcns: 0 },
  fmea: { highApCount: 0 },
  procurement: { pendingRequests: 0, activeOrders: 0 },
  alerts: { unresolvedCount: 0 },
  unreadNotifications: 0,
})

const warnings = ref({
  delayedMilestones: [], criticalRisks: [], unresolvedAlerts: [],
  overdueTasks: [], openCriticalProblems: [], budgetOverruns: [],
})

const myTasks = ref<any[]>([])
const trends = ref({ projectTrends: [], qualityTrends: [], costTrends: [], changeTrends: [] })
const apDist = ref({ dfmea: { high: 0, medium: 0, low: 0 }, pfmea: { high: 0, medium: 0, low: 0 } })
const recentNotifications = ref<any[]>([])

const totalMyTasks = computed(() => {
  const t = overview.value.myTasks
  return t.wbsTasks + t.risks + t.ecrs + t.ecnActions + t.problems + t.capas + t.fmeaActions + t.workflowPending
})

async function loadData() {
  loading.value = true
  try {
    const [overviewData, warningsData, tasksData, trendsData, apData, notifications]: any[] = await Promise.all([
      dashboardApi.overview(),
      dashboardApi.warnings(),
      dashboardApi.myTasks(),
      dashboardApi.trends({ months: 6 }),
      fmeaApi.stats.apDistribution(),
      notificationApi.list({ page: 1, pageSize: 8 }),
    ])
    overview.value = overviewData
    warnings.value = warningsData
    myTasks.value = tasksData || []
    trends.value = trendsData
    if (apData) {
      apDist.value = {
        dfmea: apData.dfmea || { high: 0, medium: 0, low: 0 },
        pfmea: apData.pfmea || { high: 0, medium: 0, low: 0 },
      }
    }
    recentNotifications.value = notifications?.list || []
  } catch (e) {
    console.error('Dashboard load error:', e)
  } finally {
    loading.value = false
  }
}

let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadData()
  refreshTimer = setInterval(loadData, 60000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 20px;
    color: #303133;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.welcome {
  color: #606266;
  font-size: 14px;
}

.kpi-row {
  margin-bottom: 16px;
}

.chart-row {
  margin-bottom: 16px;
}

.content-row {
  margin-bottom: 16px;
}
</style>
