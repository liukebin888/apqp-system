<template>
  <div class="dfa-tab">
    <div class="toolbar">
      <el-select v-model="filterType" placeholder="失效类型" clearable style="width: 200px" @change="loadData">
        <el-option v-for="(v, k) in DFA_FAILURE_TYPE" :key="k" :label="v" :value="k" />
      </el-select>
      <el-button type="primary" @click="openDialog()">新增DFA记录</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="dfaNo" label="编号" width="150" />
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column prop="failureType" label="失效类型" width="160">
        <template #default="{ row }"><el-tag :type="row.failureType === 'common_cause' ? 'danger' : 'warning'" size="small">{{ DFA_FAILURE_TYPE[row.failureType] || row.failureType }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="failureGroup" label="失效组" width="150" />
      <el-table-column prop="rootCause" label="根因" min-width="180" show-overflow-tooltip />
      <el-table-column label="安全目标" width="120">
        <template #default="{ row }">{{ row.safetyGoal?.goalNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }"><el-tag size="small">{{ DFA_STATUS[row.status] || row.status }}</el-tag></template>
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
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑DFA' : '新增DFA'" width="650px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="失效类型">
          <el-select v-model="form.failureType">
            <el-option v-for="(v, k) in DFA_FAILURE_TYPE" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="失效组"><el-input v-model="form.failureGroup" /></el-form-item>
        <el-form-item label="根因分析"><el-input v-model="form.rootCause" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="受影响组件"><el-input v-model="form.affectedComponents" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="缓解措施"><el-input v-model="form.mitigationMeasures" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="关联安全目标">
          <el-select v-model="form.safetyGoalId" clearable filterable>
            <el-option v-for="g in goals" :key="g.id" :label="`${g.goalNo} - ${g.title}`" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option v-for="(v, k) in DFA_STATUS" :key="k" :label="v" :value="k" />
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
import { DFA_FAILURE_TYPE, DFA_STATUS } from '@apqp/shared/constants/safety.constants'
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
    if (filterType.value) params.failureType = filterType.value
    const res = await safetyApi.dfa.list(params)
    list.value = res.data.items
  } finally { loading.value = false }
}

async function loadGoals() {
  const res = await safetyApi.goals.list({ projectId: props.projectId, take: 200 })
  goals.value = res.data.items
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { title: '', failureType: 'coupled', description: '', failureGroup: '', rootCause: '', affectedComponents: '', mitigationMeasures: '', safetyGoalId: null, status: 'draft', projectId: props.projectId }
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (form.value.id) await safetyApi.dfa.update(form.value.id, form.value)
    else await safetyApi.dfa.create(form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally { saving.value = false }
}

async function handleDelete(id: number) {
  await safetyApi.dfa.delete(id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(() => { loadData(); loadGoals() })
</script>
