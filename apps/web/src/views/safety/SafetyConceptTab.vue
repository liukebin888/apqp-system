<template>
  <div class="safety-concept-tab">
    <div class="toolbar">
      <el-select v-model="filterType" placeholder="概念类型" clearable style="width: 180px" @change="loadData">
        <el-option v-for="(v, k) in SAFETY_CONCEPT_TYPE" :key="k" :label="v" :value="k" />
      </el-select>
      <el-button type="primary" @click="openDialog()">新增安全概念</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="conceptNo" label="编号" width="160" />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="conceptType" label="类型" width="160">
        <template #default="{ row }">
          <el-tag :type="row.conceptType === 'FSC' ? 'primary' : 'success'">{{ SAFETY_CONCEPT_TYPE[row.conceptType] || row.conceptType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关联安全目标" width="160">
        <template #default="{ row }">{{ row.goal?.goalNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ SAFETY_CONCEPT_STATUS[row.status] || row.status }}</el-tag>
        </template>
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
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑安全概念' : '新增安全概念'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.conceptType">
            <el-option v-for="(v, k) in SAFETY_CONCEPT_TYPE" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="关联安全目标">
          <el-select v-model="form.goalId" clearable filterable placeholder="选择安全目标">
            <el-option v-for="g in goals" :key="g.id" :label="`${g.goalNo} - ${g.title}`" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="架构映射"><el-input v-model="form.architectureMapping" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option v-for="(v, k) in SAFETY_CONCEPT_STATUS" :key="k" :label="v" :value="k" />
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
import { SAFETY_CONCEPT_TYPE, SAFETY_CONCEPT_STATUS } from '@apqp/shared/constants/safety.constants'
import { ElMessage } from 'element-plus'

const props = defineProps<{ projectId: number }>()
const list = ref<any[]>([])
const goals = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const filterType = ref('')
const form = ref<any>({})

function statusType(s: string) {
  const m: Record<string, string> = { draft: 'info', in_progress: 'warning', in_review: 'warning', approved: 'success', deprecated: 'danger' }
  return m[s] || 'info'
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { projectId: props.projectId }
    if (filterType.value) params.conceptType = filterType.value
    const res = await safetyApi.concepts.list(params)
    list.value = res.data.items
  } finally { loading.value = false }
}

async function loadGoals() {
  const res = await safetyApi.goals.list({ projectId: props.projectId, take: 200 })
  goals.value = res.data.items
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { title: '', conceptType: 'FSC', description: '', goalId: null, architectureMapping: '', status: 'draft', projectId: props.projectId }
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (form.value.id) await safetyApi.concepts.update(form.value.id, form.value)
    else await safetyApi.concepts.create(form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally { saving.value = false }
}

async function handleDelete(id: number) {
  await safetyApi.concepts.delete(id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(() => { loadData(); loadGoals() })
</script>
