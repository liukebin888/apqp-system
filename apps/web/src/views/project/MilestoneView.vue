<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>{{ project?.projectName }} - 里程碑管理</h2>
      <div>
        <el-button @click="$router.push(`/projects/${projectId}`)">返回项目</el-button>
        <el-button type="primary" @click="openCreateDialog">添加里程碑</el-button>
      </div>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总里程碑" :value="milestoneStats.total" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="已完成" :value="milestoneStats.completed" value-style="color: #67c23a" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="进行中" :value="milestoneStats.planned" value-style="color: #409eff" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="延期" :value="milestoneStats.delayed" value-style="color: #f56c6c" />
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>里程碑列表</span>
          <el-select v-model="filter.status" placeholder="状态筛选" clearable size="small" style="width: 150px" @change="loadMilestones">
            <el-option label="计划中" value="planned" />
            <el-option label="已完成" value="completed" />
            <el-option label="延期" value="delayed" />
          </el-select>
        </div>
      </template>

      <el-table :data="milestones" border stripe>
        <el-table-column prop="name" label="里程碑名称" min-width="200" />
        <el-table-column prop="milestoneType" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ typeLabel(row.milestoneType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="计划日期" width="130">
          <template #default="{ row }">{{ formatDate(row.plannedDate) }}</template>
        </el-table-column>
        <el-table-column label="实际日期" width="130">
          <template #default="{ row }">{{ formatDate(row.actualDate) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteMilestone(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!milestones.length && !loading" description="暂无里程碑" :image-size="100" />
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header><span>里程碑时间线</span></template>
      <el-timeline v-if="milestones.length">
        <el-timeline-item
          v-for="m in milestones"
          :key="m.id"
          :timestamp="formatDate(m.plannedDate)"
          :type="m.status === 'completed' ? 'success' : m.status === 'delayed' ? 'danger' : 'primary'"
          :hollow="m.status === 'planned'"
        >
          <el-card shadow="hover">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <div>
                <h4 style="margin: 0 0 8px 0">{{ m.name }}</h4>
                <el-tag size="small" style="margin-right: 8px">{{ typeLabel(m.milestoneType) }}</el-tag>
                <el-tag :type="statusType(m.status)" size="small">{{ statusLabel(m.status) }}</el-tag>
              </div>
              <div v-if="m.actualDate" style="color: #909399; font-size: 12px">
                实际完成：{{ formatDate(m.actualDate) }}
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无里程碑" :image-size="60" />
    </el-card>

    <el-dialog v-model="showDialog" :title="editingMilestone ? '编辑里程碑' : '添加里程碑'" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="formData.name" placeholder="请输入里程碑名称" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="formData.milestoneType" style="width: 100%">
            <el-option label="APQP Gate 1" value="gate1" />
            <el-option label="APQP Gate 2" value="gate2" />
            <el-option label="APQP Gate 3" value="gate3" />
            <el-option label="APQP Gate 4" value="gate4" />
            <el-option label="APQP Gate 5" value="gate5" />
            <el-option label="OTS" value="ots" />
            <el-option label="PVS" value="pvs" />
            <el-option label="SOP" value="sop" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划日期" required>
          <el-date-picker
            v-model="formData.plannedDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="实际日期">
          <el-date-picker
            v-model="formData.actualDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" required>
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="计划中" value="planned" />
            <el-option label="已完成" value="completed" />
            <el-option label="延期" value="delayed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMilestone">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { projectApi, milestoneApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const projectId = +route.params.projectId
const loading = ref(false)
const project = ref<any>(null)
const milestones = ref<any[]>([])
const showDialog = ref(false)
const editingMilestone = ref<any>(null)
const filter = reactive({ status: '' })

const formData = reactive({
  name: '',
  milestoneType: 'gate1',
  plannedDate: '',
  actualDate: '',
  status: 'planned',
})

const typeMap: Record<string, string> = {
  gate1: 'APQP Gate 1',
  gate2: 'APQP Gate 2',
  gate3: 'APQP Gate 3',
  gate4: 'APQP Gate 4',
  gate5: 'APQP Gate 5',
  ots: 'OTS',
  pvs: 'PVS',
  sop: 'SOP',
}

const statusMap: Record<string, { label: string; type: string }> = {
  planned: { label: '计划中', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  delayed: { label: '延期', type: 'danger' },
}

function typeLabel(t: string) { return typeMap[t] || t }
function statusLabel(s: string) { return statusMap[s]?.label || s }
function statusType(s: string) { return statusMap[s]?.type || 'info' }
function formatDate(d: string | null) { return d ? dayjs(d).format('YYYY-MM-DD') : '-' }

const milestoneStats = computed(() => ({
  total: milestones.value.length,
  completed: milestones.value.filter((m) => m.status === 'completed').length,
  planned: milestones.value.filter((m) => m.status === 'planned').length,
  delayed: milestones.value.filter((m) => m.status === 'delayed').length,
}))

async function loadProject() {
  try {
    const res: any = await projectApi.get(projectId)
    project.value = res
  } catch (e) {
    console.error('Failed to load project', e)
  }
}

async function loadMilestones() {
  loading.value = true
  try {
    const res: any = await milestoneApi.list(projectId)
    let data = res
    if (filter.status) {
      data = data.filter((m: any) => m.status === filter.status)
    }
    milestones.value = data
  } catch (e) {
    console.error('Failed to load milestones', e)
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  editingMilestone.value = null
  Object.assign(formData, {
    name: '',
    milestoneType: 'gate1',
    plannedDate: '',
    actualDate: '',
    status: 'planned',
  })
  showDialog.value = true
}

function openEditDialog(milestone: any) {
  editingMilestone.value = milestone
  Object.assign(formData, {
    name: milestone.name,
    milestoneType: milestone.milestoneType,
    plannedDate: milestone.plannedDate ? dayjs(milestone.plannedDate).format('YYYY-MM-DD') : '',
    actualDate: milestone.actualDate ? dayjs(milestone.actualDate).format('YYYY-MM-DD') : '',
    status: milestone.status,
  })
  showDialog.value = true
}

async function saveMilestone() {
  if (!formData.name || !formData.milestoneType || !formData.plannedDate) {
    ElMessage.warning('请填写必填项')
    return
  }

  try {
    if (editingMilestone.value) {
      await milestoneApi.update(projectId, editingMilestone.value.id, { ...formData })
      ElMessage.success('更新成功')
    } else {
      await milestoneApi.create(projectId, { ...formData })
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    await loadMilestones()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function deleteMilestone(id: number) {
  try {
    await ElMessageBox.confirm('确定删除此里程碑？', '提示', { type: 'warning' })
    await milestoneApi.delete(projectId, id)
    ElMessage.success('删除成功')
    await loadMilestones()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

onMounted(async () => {
  await loadProject()
  await loadMilestones()
})
</script>
