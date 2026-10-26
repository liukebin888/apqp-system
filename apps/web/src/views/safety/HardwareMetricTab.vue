<template>
  <div class="hw-metric-tab">
    <div class="toolbar">
      <el-select v-model="filterType" placeholder="指标类型" clearable style="width: 200px" @change="loadData">
        <el-option v-for="(v, k) in HARDWARE_METRIC_TYPE" :key="k" :label="v" :value="k" />
      </el-select>
      <el-button type="primary" @click="openDialog()">新增度量指标</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="metricNo" label="编号" width="150" />
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column prop="metricType" label="指标类型" width="180">
        <template #default="{ row }"><el-tag>{{ HARDWARE_METRIC_TYPE[row.metricType] || row.metricType }}</el-tag></template>
      </el-table-column>
      <el-table-column label="目标值" width="120" align="right">
        <template #default="{ row }">{{ Number(row.targetValue).toFixed(4) }}</template>
      </el-table-column>
      <el-table-column label="计算值" width="120" align="right">
        <template #default="{ row }">{{ Number(row.calculatedValue).toFixed(4) }}</template>
      </el-table-column>
      <el-table-column label="达标" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="Number(row.calculatedValue) >= Number(row.targetValue) ? 'success' : 'danger'" size="small">
            {{ Number(row.calculatedValue) >= Number(row.targetValue) ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="安全目标" width="120">
        <template #default="{ row }">{{ row.safetyGoal?.goalNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }"><el-tag :type="row.status === 'passed' ? 'success' : row.status === 'failed' ? 'danger' : 'info'" size="small">{{ HARDWARE_METRIC_STATUS[row.status] || row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-popconfirm title="确认删除?" @confirm="handleDelete(row.id)">
            <template #reference><el-button link type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑度量指标' : '新增度量指标'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="指标类型">
          <el-select v-model="form.metricType">
            <el-option v-for="(v, k) in HARDWARE_METRIC_TYPE" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="目标值"><el-input-number v-model="form.targetValue" :min="0" :step="0.01" :precision="6" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="计算值"><el-input-number v-model="form.calculatedValue" :min="0" :step="0.01" :precision="6" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="关联安全目标">
          <el-select v-model="form.safetyGoalId" clearable filterable>
            <el-option v-for="g in goals" :key="g.id" :label="`${g.goalNo} - ${g.title}`" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option v-for="(v, k) in HARDWARE_METRIC_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { safetyApi } from '@/api'
import { HARDWARE_METRIC_TYPE, HARDWARE_METRIC_STATUS } from '@apqp/shared/constants/safety.constants'
import { ElMessage } from 'element-plus'

const props = defineProps<{ projectId: number }>()
const list = ref<any[]>([])
const goals = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const filterType = ref('')
const form = ref<any>({})

async function loadData() {
  loading.value = true
  try {
    const params: any = { projectId: props.projectId }
    if (filterType.value) params.metricType = filterType.value
    const res = await safetyApi.metrics.list(params)
    list.value = res.data.items
  } finally { loading.value = false }
}

async function loadGoals() {
  const res = await safetyApi.goals.list({ projectId: props.projectId, take: 200 })
  goals.value = res.data.items
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { title: '', metricType: 'SPFM', description: '', targetValue: 0, calculatedValue: 0, safetyGoalId: null, status: 'draft', projectId: props.projectId }
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (form.value.id) await safetyApi.metrics.update(form.value.id, form.value)
    else await safetyApi.metrics.create(form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally { saving.value = false }
}

async function handleDelete(id: number) {
  await safetyApi.metrics.delete(id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(() => { loadData(); loadGoals() })
</script>
