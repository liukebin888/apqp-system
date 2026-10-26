<template>
  <div class="confirm-measure-tab">
    <div class="toolbar">
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 140px" @change="loadData">
        <el-option v-for="(v, k) in CONFIRMATION_MEASURE_STATUS" :key="k" :label="v" :value="k" />
      </el-select>
      <el-button type="primary" @click="openDialog()">新增确认措施</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="measureNo" label="编号" width="150" />
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column prop="measureType" label="确认方法" width="140">
        <template #default="{ row }"><el-tag size="small">{{ CONFIRMATION_METHOD[row.measureType] || row.measureType }}</el-tag></template>
      </el-table-column>
      <el-table-column label="关联Safety Case" width="140">
        <template #default="{ row }">{{ row.safetyCase?.caseNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="关联安全目标" width="120">
        <template #default="{ row }">{{ row.safetyGoal?.goalNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="计划日期" width="120">
        <template #default="{ row }">{{ row.plannedDate ? new Date(row.plannedDate).toLocaleDateString() : '-' }}</template>
      </el-table-column>
      <el-table-column label="实际日期" width="120">
        <template #default="{ row }">{{ row.actualDate ? new Date(row.actualDate).toLocaleDateString() : '-' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ CONFIRMATION_MEASURE_STATUS[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="success" @click="openCompleteDialog(row)" v-if="row.status !== 'passed' && row.status !== 'failed'">完成</el-button>
          <el-popconfirm title="确认删除?" @confirm="handleDelete(row.id)">
            <template #reference><el-button link type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑确认措施' : '新增确认措施'" width="650px">
      <el-form :model="form" label-width="130px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="确认方法">
          <el-select v-model="form.measureType">
            <el-option v-for="(v, k) in CONFIRMATION_METHOD" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="关联Safety Case">
          <el-select v-model="form.safetyCaseId" clearable filterable>
            <el-option v-for="c in cases" :key="c.id" :label="`${c.caseNo} - ${c.title}`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联安全目标">
          <el-select v-model="form.safetyGoalId" clearable filterable>
            <el-option v-for="g in goals" :key="g.id" :label="`${g.goalNo} - ${g.title}`" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划日期"><el-date-picker v-model="form.plannedDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option v-for="(v, k) in CONFIRMATION_MEASURE_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="完成确认措施" width="500px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="结果"><el-input v-model="completeForm.result" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="证据URL"><el-input v-model="completeForm.evidenceUrl" /></el-form-item>
        <el-form-item label="是否通过"><el-switch v-model="completeForm.passed" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleComplete" :loading="saving">确认完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { safetyApi } from '@/api'
import { CONFIRMATION_MEASURE_STATUS, CONFIRMATION_METHOD } from '@apqp/shared/constants/safety.constants'
import { ElMessage } from 'element-plus'

const props = defineProps<{ projectId: number }>()
const list = ref<any[]>([])
const goals = ref<any[]>([])
const cases = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const completeDialogVisible = ref(false)
const filterStatus = ref('')
const form = ref<any>({})
const completeForm = ref<any>({})
const completeId = ref<number>(0)

function statusType(s: string) {
  const m: Record<string, string> = { planned: 'info', in_progress: 'warning', completed: '', passed: 'success', failed: 'danger' }
  return m[s] || 'info'
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { projectId: props.projectId }
    if (filterStatus.value) params.status = filterStatus.value
    const res = await safetyApi.measures.list(params)
    list.value = res.data.items
  } finally { loading.value = false }
}

async function loadGoals() {
  const res = await safetyApi.goals.list({ projectId: props.projectId, take: 200 })
  goals.value = res.data.items
}

async function loadCases() {
  const res = await safetyApi.cases.list({ projectId: props.projectId, take: 200 })
  cases.value = res.data.items
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { title: '', measureType: 'analysis', description: '', safetyCaseId: null, safetyGoalId: null, plannedDate: null, status: 'planned', projectId: props.projectId }
  dialogVisible.value = true
}

function openCompleteDialog(row: any) {
  completeId.value = row.id
  completeForm.value = { result: '', evidenceUrl: '', passed: true }
  completeDialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (form.value.id) await safetyApi.measures.update(form.value.id, form.value)
    else await safetyApi.measures.create(form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally { saving.value = false }
}

async function handleComplete() {
  saving.value = true
  try {
    await safetyApi.measures.complete(completeId.value, completeForm.value)
    ElMessage.success('确认完成')
    completeDialogVisible.value = false
    loadData()
  } finally { saving.value = false }
}

async function handleDelete(id: number) {
  await safetyApi.measures.delete(id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(() => { loadData(); loadGoals(); loadCases() })
</script>
