<template>
  <div class="fmeda-tab">
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">新增FMEDA记录</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="fmedaNo" label="编号" width="150" />
      <el-table-column prop="componentName" label="组件/部件" width="160" />
      <el-table-column prop="failureMode" label="失效模式" min-width="180" />
      <el-table-column prop="severityRating" label="S" width="50" align="center" />
      <el-table-column prop="occurrenceRating" label="O" width="50" align="center" />
      <el-table-column prop="detectionRating" label="D" width="50" align="center" />
      <el-table-column label="DC" width="80" align="center">
        <template #default="{ row }">{{ row.diagnosticCoverage != null ? (Number(row.diagnosticCoverage) * 100).toFixed(1) + '%' : '-' }}</template>
      </el-table-column>
      <el-table-column label="FIT" width="100" align="center">
        <template #default="{ row }">{{ row.fitRate != null ? Number(row.fitRate).toExponential(2) : '-' }}</template>
      </el-table-column>
      <el-table-column label="安全目标" width="120">
        <template #default="{ row }">{{ row.safetyGoal?.goalNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }"><el-tag size="small">{{ FMEDA_STATUS[row.status] || row.status }}</el-tag></template>
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
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑FMEDA' : '新增FMEDA'" width="700px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="组件/部件"><el-input v-model="form.componentName" /></el-form-item>
        <el-form-item label="失效模式"><el-input v-model="form.failureMode" /></el-form-item>
        <el-form-item label="失效效应"><el-input v-model="form.failureEffect" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="失效原因"><el-input v-model="form.failureCause" type="textarea" :rows="2" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="严重度S"><el-input-number v-model="form.severityRating" :min="0" :max="4" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="发生度O"><el-input-number v-model="form.occurrenceRating" :min="0" :max="10" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="探测度D"><el-input-number v-model="form.detectionRating" :min="0" :max="10" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="诊断覆盖率"><el-input-number v-model="form.diagnosticCoverage" :min="0" :max="1" :step="0.01" :precision="4" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="FIT率"><el-input v-model="form.fitRate" type="number" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="关联安全目标">
          <el-select v-model="form.safetyGoalId" clearable filterable>
            <el-option v-for="g in goals" :key="g.id" :label="`${g.goalNo} - ${g.title}`" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="缓解措施"><el-input v-model="form.mitigationMeasure" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option v-for="(v, k) in FMEDA_STATUS" :key="k" :label="v" :value="k" />
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
import { FMEDA_STATUS } from '@apqp/shared/constants/safety.constants'
import { ElMessage } from 'element-plus'

const props = defineProps<{ projectId: number }>()
const list = ref<any[]>([])
const goals = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const form = ref<any>({})

async function loadData() {
  loading.value = true
  try {
    const res = await safetyApi.fmeda.list({ projectId: props.projectId })
    list.value = res.data.items
  } finally { loading.value = false }
}

async function loadGoals() {
  const res = await safetyApi.goals.list({ projectId: props.projectId, take: 200 })
  goals.value = res.data.items
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { title: '', componentName: '', failureMode: '', failureEffect: '', failureCause: '', severityRating: 0, occurrenceRating: 0, detectionRating: 0, diagnosticCoverage: null, fitRate: null, safetyGoalId: null, mitigationMeasure: '', status: 'draft', projectId: props.projectId }
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (form.value.id) await safetyApi.fmeda.update(form.value.id, form.value)
    else await safetyApi.fmeda.create(form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally { saving.value = false }
}

async function handleDelete(id: number) {
  await safetyApi.fmeda.delete(id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(() => { loadData(); loadGoals() })
</script>
