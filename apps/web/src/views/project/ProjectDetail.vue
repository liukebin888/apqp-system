<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>{{ project?.projectName }}</h2>
      <div>
        <el-tag :type="statusType(project?.status)" size="large">{{ statusLabel(project?.status) }}</el-tag>
        <el-button style="margin-left: 12px" @click="$router.push('/projects')">返回列表</el-button>
      </div>
    </div>

    <el-row :gutter="20" v-if="project">
      <el-col :span="8">
        <el-card>
          <template #header><span>项目信息</span></template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="项目编号">{{ project.projectCode }}</el-descriptions-item>
            <el-descriptions-item label="客户">{{ project.customer?.customerName }}</el-descriptions-item>
            <el-descriptions-item label="产品">{{ project.product?.productName }}</el-descriptions-item>
            <el-descriptions-item label="项目级别">{{ project.projectLevel }}</el-descriptions-item>
            <el-descriptions-item label="APQP阶段">Phase {{ project.apqpPhase }}</el-descriptions-item>
            <el-descriptions-item label="计划周期">{{ formatDate(project.startDate) }} ~ {{ formatDate(project.endDate) }}</el-descriptions-item>
            <el-descriptions-item label="描述">{{ project.description || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header><span>项目团队</span></template>
          <el-table :data="project.teams" size="small">
            <el-table-column prop="user.realName" label="姓名" />
            <el-table-column prop="role" label="角色" width="120">
              <template #default="{ row }">{{ roleLabel(row.role) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header><span>里程碑</span></template>
          <el-timeline>
            <el-timeline-item
              v-for="m in project.milestones"
              :key="m.id"
              :timestamp="formatDate(m.plannedDate)"
              :type="m.status === 'completed' ? 'success' : m.status === 'delayed' ? 'danger' : 'primary'"
            >
              {{ m.name }}
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="!project.milestones?.length" description="暂无里程碑" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px" v-if="project">
      <template #header><span>风险登记</span></template>
      <el-table :data="project.risks" size="small">
        <el-table-column prop="riskCode" label="风险编号" width="140" />
        <el-table-column prop="description" label="风险描述" min-width="200" />
        <el-table-column prop="category" label="类别" width="100" />
        <el-table-column prop="riskLevel" label="等级" width="90">
          <template #default="{ row }">
            <el-tag :type="riskType(row.riskLevel)" size="small">{{ row.riskLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" />
      </el-table>
      <el-empty v-if="!project.risks?.length" description="暂无风险" :image-size="60" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { projectApi } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const loading = ref(false)
const project = ref<any>(null)

const statusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  active: { label: '进行中', type: 'success' },
  on_hold: { label: '暂停', type: 'warning' },
  completed: { label: '已完成', type: '' },
  cancelled: { label: '已取消', type: 'danger' },
}

function statusLabel(s: string) { return statusMap[s]?.label || s }
function statusType(s: string) { return statusMap[s]?.type || 'info' }
function riskType(level: string) { return { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' }[level] || 'info' }
function roleLabel(role: string) { return { pm: '项目经理', qe: '质量工程师', pe: '产品工程师', me: '工艺工程师', buyer: '采购员' }[role] || role }
function formatDate(d: string | null) { return d ? dayjs(d).format('YYYY-MM-DD') : '-' }

onMounted(async () => {
  loading.value = true
  try {
    const res: any = await projectApi.get(+route.params.id)
    project.value = res
  } finally { loading.value = false }
})
</script>
