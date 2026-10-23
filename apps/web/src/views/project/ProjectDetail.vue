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
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>项目团队</span>
              <el-button type="primary" size="small" @click="showAddMemberDialog = true">添加成员</el-button>
            </div>
          </template>
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

    <el-dialog v-model="showAddMemberDialog" title="添加团队成员" width="500px">
      <el-form :model="newMember" label-width="80px">
        <el-form-item label="选择用户">
          <el-select v-model="newMember.userId" placeholder="请选择用户" filterable style="width: 100%">
            <el-option v-for="user in availableUsers" :key="user.id" :label="user.realName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="newMember.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="项目经理" value="pm" />
            <el-option label="质量工程师" value="qe" />
            <el-option label="产品工程师" value="pe" />
            <el-option label="工艺工程师" value="me" />
            <el-option label="采购员" value="buyer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddMemberDialog = false">取消</el-button>
        <el-button type="primary" @click="addMember">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { projectApi, userApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const loading = ref(false)
const project = ref<any>(null)
const showAddMemberDialog = ref(false)
const availableUsers = ref<any[]>([])
const newMember = ref({ userId: null as number | null, role: 'pm' })

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

async function loadUsers() {
  try {
    const res: any = await userApi.list({ page: 1, pageSize: 100 })
    availableUsers.value = res.list
  } catch (e) {
    console.error('Failed to load users', e)
  }
}

async function addMember() {
  if (!newMember.value.userId || !newMember.value.role) {
    ElMessage.warning('请选择用户和角色')
    return
  }

  try {
    const currentTeams = project.value.teams || []
    const updatedTeams = [...currentTeams, { userId: newMember.value.userId, role: newMember.value.role }]
    await projectApi.updateTeam(+route.params.id, updatedTeams)
    ElMessage.success('添加成功')
    showAddMemberDialog.value = false
    newMember.value = { userId: null, role: 'pm' }
    // Reload project data
    const res: any = await projectApi.get(+route.params.id)
    project.value = res
  } catch (e: any) {
    ElMessage.error(e.message || '添加失败')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res: any = await projectApi.get(+route.params.id)
    project.value = res
    await loadUsers()
  } finally { loading.value = false }
})
</script>
