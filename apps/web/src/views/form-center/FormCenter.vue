<template>
  <div class="form-center">
    <div class="page-header">
      <h2>表单中心</h2>
      <p class="subtitle">APQP 五阶段 18 张标准管理表单</p>
    </div>

    <div class="project-selector">
      <el-select v-model="selectedProjectId" placeholder="选择项目" filterable style="width: 360px" @change="onProjectChange">
        <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
      </el-select>
    </div>

    <div v-for="phase in phaseList" :key="phase.id" class="phase-section">
      <div class="phase-header" :style="{ borderLeftColor: phase.color }">
        <h3>{{ phase.icon }} {{ phase.name }}</h3>
        <span class="phase-desc">{{ phase.description }}</span>
      </div>
      <el-row :gutter="16">
        <el-col :span="6" v-for="form in phase.forms" :key="form.code">
          <el-card
            shadow="hover"
            class="form-card"
            :class="{ active: form.routeName }"
            @click="form.routeName && navigateTo(form)"
          >
            <div class="form-code">{{ form.code }}</div>
            <div class="form-name">{{ form.name }}</div>
            <div class="form-status">
              <el-tag :type="getFormStatusType(form.code)" size="small">
                {{ getFormStatusText(form.code) }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { projectApi } from '@/api'

const router = useRouter()
const selectedProjectId = ref<number | null>(null)
const projects = ref<any[]>([])

const projectRequiredRoutes = [
  'ProcessOverview', 'ApqpChecklist', 'AspiceTracking',
  'OtsDocChecklist', 'EscalationAlarm', 'ProjectSchedule', 'ProjectRisks',
]

onMounted(async () => {
  try {
    const res = await projectApi.list({ pageSize: 200 })
    projects.value = (res as any).data?.list || (res as any).data || []
    if (projects.value.length && !selectedProjectId.value) {
      selectedProjectId.value = projects.value[0].id
    }
  } catch (e) {
    console.error(e)
  }
})

const phaseList = [
  {
    id: 1, name: '第一阶段：计划与定义', description: '项目立项、可行性评估、初始计划',
    icon: '📋', color: '#409EFF',
    forms: [
      { code: '00', name: '流程总览', routeName: 'ProcessOverview' },
      { code: '01', name: '立项申请书', routeName: 'ProjectCreate' },
      { code: '02', name: '项目计划', routeName: 'ProjectSchedule' },
      { code: '03', name: 'APQP检查表', routeName: 'ApqpChecklist' },
    ],
  },
  {
    id: 2, name: '第二阶段：产品设计与开发', description: '设计FMEA、特殊特性、OTS样件',
    icon: '🔧', color: '#67C23A',
    forms: [
      { code: '04', name: 'OTS申请单', routeName: 'OtsList' },
      { code: '09', name: '功能安全跟踪', routeName: 'FunctionalSafety' },
      { code: '10', name: 'ASPICE跟踪', routeName: 'AspiceTracking' },
      { code: '11', name: '信息安全跟踪', routeName: 'Security' },
    ],
  },
  {
    id: 3, name: '第三阶段：过程设计与开发', description: '过程FMEA、控制计划、测量系统',
    icon: '⚙️', color: '#E6A23C',
    forms: [
      { code: '05', name: 'PPAP清单', routeName: 'PpapList' },
      { code: '12', name: '外购外协件管控', routeName: 'SupplierCollab' },
      { code: '12B', name: '需求下单到货跟踪', routeName: 'Procurement' },
      { code: '13', name: 'OTS评审报告', routeName: 'OtsList' },
    ],
  },
  {
    id: 4, name: '第四阶段：产品与过程确认', description: '试生产、过程确认、PPAP提交',
    icon: '✅', color: '#F56C6C',
    forms: [
      { code: '13A', name: 'OTS文档检查表', routeName: 'OtsDocChecklist' },
      { code: '14', name: '风险管控', routeName: 'ProjectRisks' },
      { code: '08', name: '评审记录', routeName: 'GateReviewList' },
      { code: '07', name: '问题跟踪表', routeName: 'IssueManagement' },
    ],
  },
  {
    id: 5, name: '第五阶段：量产与反馈', description: '量产监控、持续改进、结项',
    icon: '🏭', color: '#909399',
    forms: [
      { code: '06', name: '变更申请单', routeName: 'ChangeManagement' },
      { code: '15', name: '升级报警单', routeName: 'EscalationAlarm' },
    ],
  },
]

function onProjectChange(val: number) {
  selectedProjectId.value = val
}

function navigateTo(form: any) {
  const needsProject = projectRequiredRoutes.includes(form.routeName)
  if (needsProject) {
    if (!selectedProjectId.value) {
      ElMessage.warning('请先选择一个项目')
      return
    }
    router.push({ name: form.routeName, params: { projectId: selectedProjectId.value } })
  } else {
    router.push({ name: form.routeName })
  }
}

function getFormStatusType(code: string) {
  const statusMap: Record<string, string> = {
    '00': 'primary', '01': 'success', '02': 'success', '03': 'warning',
    '04': 'success', '05': 'success', '06': 'success', '07': 'success',
    '08': 'success', '09': 'success', '10': 'warning', '11': 'success',
    '12': 'success', '12B': 'success', '13': 'success', '13A': 'warning',
    '14': 'success', '15': 'info',
  }
  return (statusMap[code] || 'info') as any
}

function getFormStatusText(code: string) {
  const statusMap: Record<string, string> = {
    '00': '新建', '01': '已有', '02': '已有', '03': '新建',
    '04': '已有', '05': '已有', '06': '已有', '07': '已有',
    '08': '已有', '09': '已有', '10': '新建', '11': '已有',
    '12': '已有', '12B': '已有', '13': '已有', '13A': '新建',
    '14': '已有', '15': '新建',
  }
  return statusMap[code] || '—'
}
</script>

<style scoped lang="scss">
.form-center {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 4px;
    font-size: 22px;
  }

  .subtitle {
    color: #909399;
    font-size: 14px;
    margin: 0;
  }
}

.phase-section {
  margin-bottom: 24px;
}

.phase-header {
  border-left: 4px solid #409EFF;
  padding: 8px 16px;
  margin-bottom: 12px;
  background: #f5f7fa;
  border-radius: 0 4px 4px 0;

  h3 {
    margin: 0;
    font-size: 16px;
  }

  .phase-desc {
    font-size: 12px;
    color: #909399;
  }
}

.form-card {
  cursor: pointer;
  margin-bottom: 16px;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &.active {
    border-left: 3px solid #409EFF;
  }

  .form-code {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
  }

  .form-name {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 8px;
  }
}

.project-selector {
  margin-bottom: 20px;
}
</style>
