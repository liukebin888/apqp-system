<template>
  <div class="asil-decomp-tab">
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">新增ASIL分解</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="decompositionNo" label="编号" width="150" />
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column label="安全目标" width="140">
        <template #default="{ row }">{{ row.goal?.goalNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="originalAsil" label="原始ASIL" width="100" align="center">
        <template #default="{ row }"><el-tag :type="asilTagType(row.originalAsil)" size="small">{{ row.originalAsil }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="decomposedAsilA" label="分解A" width="90" align="center">
        <template #default="{ row }"><el-tag size="small">{{ row.decomposedAsilA }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="decomposedAsilB" label="分解B" width="90" align="center">
        <template #default="{ row }"><el-tag size="small">{{ row.decomposedAsilB }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="justification" label="分解依据" min-width="200" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }"><el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'" size="small">{{ ASIL_DECOMPOSITION_STATUS[row.status] || row.status }}</el-tag></template>
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
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑ASIL分解' : '新增ASIL分解'" width="650px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="关联安全目标">
          <el-select v-model="form.goalId" filterable>
            <el-option v-for="g in goals" :key="g.id" :label="`${g.goalNo} - ${g.title} (${g.targetAsil})`" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="原始ASIL">
              <el-select v-model="form.originalAsil">
                <el-option v-for="(v, k) in ASIL_LEVEL" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分解A">
              <el-select v-model="form.decomposedAsilA">
                <el-option v-for="(v, k) in ASIL_LEVEL" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分解B">
              <el-select v-model="form.decomposedAsilB">
                <el-option v-for="(v, k) in ASIL_LEVEL" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="分解依据"><el-input v-model="form.justification" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="冗余要求"><el-input v-model="form.redundancyRequirements" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option v-for="(v, k) in ASIL_DECOMPOSITION_STATUS" :key="k" :label="v" :value="k" />
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
import { ASIL_LEVEL, ASIL_DECOMPOSITION_STATUS } from '@apqp/shared/constants/safety.constants'
import { ElMessage } from 'element-plus'

const props = defineProps<{ projectId: number }>()
const list = ref<any[]>([])
const goals = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const form = ref<any>({})

function asilTagType(a: string) {
  const m: Record<string, string> = { QM: 'info', A: 'success', B: 'warning', C: 'danger', D: 'danger' }
  return m[a] || ''
}

async function loadData() {
  loading.value = true
  try {
    const res = await safetyApi.decompositions.list({ projectId: props.projectId })
    list.value = res.data.items
  } finally { loading.value = false }
}

async function loadGoals() {
  const res = await safetyApi.goals.list({ projectId: props.projectId, take: 200 })
  goals.value = res.data.items
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { title: '', description: '', goalId: null, originalAsil: 'D', decomposedAsilA: 'B', decomposedAsilB: 'B', justification: '', redundancyRequirements: '', status: 'proposed', projectId: props.projectId }
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (form.value.id) await safetyApi.decompositions.update(form.value.id, form.value)
    else await safetyApi.decompositions.create(form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally { saving.value = false }
}

async function handleDelete(id: number) {
  await safetyApi.decompositions.delete(id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(() => { loadData(); loadGoals() })
</script>
