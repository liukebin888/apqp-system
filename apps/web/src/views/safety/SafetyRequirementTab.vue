<template>
  <div class="safety-req-tab">
    <div class="toolbar">
      <el-select v-model="filterType" placeholder="需求类型" clearable style="width: 180px" @change="loadData">
        <el-option v-for="(v, k) in SAFETY_REQ_TYPE" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="filterAsil" placeholder="ASIL等级" clearable style="width: 140px" @change="loadData">
        <el-option v-for="(v, k) in ASIL_LEVEL" :key="k" :label="v" :value="k" />
      </el-select>
      <el-button type="primary" @click="openDialog()">新增安全需求</el-button>
      <el-button @click="showTraceability = !showTraceability">{{ showTraceability ? '返回列表' : '追溯矩阵' }}</el-button>
    </div>
    <template v-if="!showTraceability">
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="reqNo" label="编号" width="160" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="reqType" label="类型" width="150">
          <template #default="{ row }"><el-tag size="small">{{ SAFETY_REQ_TYPE[row.reqType] || row.reqType }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="asilLevel" label="ASIL" width="80">
          <template #default="{ row }"><el-tag :type="asilTagType(row.asilLevel)" size="small">{{ row.asilLevel }}</el-tag></template>
        </el-table-column>
        <el-table-column label="安全目标" width="120">
          <template #default="{ row }">{{ row.goal?.goalNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="安全概念" width="120">
          <template #default="{ row }">{{ row.concept?.conceptNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="来源需求" width="120">
          <template #default="{ row }">{{ row.sourceReq?.reqCode || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag size="small">{{ SAFETY_REQUIREMENT_STATUS[row.status] || row.status }}</el-tag></template>
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
    </template>
    <template v-else>
      <div v-loading="traceLoading">
        <el-descriptions :column="4" border v-if="traceData">
          <el-descriptions-item label="总需求数">{{ traceData.totalRequirements }}</el-descriptions-item>
          <el-descriptions-item label="关联安全目标">{{ traceData.tracedToGoal }}</el-descriptions-item>
          <el-descriptions-item label="关联安全概念">{{ traceData.tracedToConcept }}</el-descriptions-item>
          <el-descriptions-item label="目标覆盖率">{{ traceData.goalCoverage }}%</el-descriptions-item>
        </el-descriptions>
        <el-table :data="traceData?.requirements || []" border stripe style="margin-top: 12px">
          <el-table-column prop="reqNo" label="需求编号" width="160" />
          <el-table-column prop="title" label="标题" min-width="180" />
          <el-table-column prop="asilLevel" label="ASIL" width="80" />
          <el-table-column label="安全目标" width="140">
            <template #default="{ row }">{{ row.safetyGoal?.goalNo || '未关联' }}</template>
          </el-table-column>
          <el-table-column label="安全概念" width="140">
            <template #default="{ row }">{{ row.safetyConcept?.conceptNo || '未关联' }}</template>
          </el-table-column>
          <el-table-column label="来源需求" width="140">
            <template #default="{ row }">{{ row.sourceRequirement?.reqCode || '无' }}</template>
          </el-table-column>
        </el-table>
      </div>
    </template>
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑安全需求' : '新增安全需求'" width="650px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.reqType">
            <el-option v-for="(v, k) in SAFETY_REQ_TYPE" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="ASIL等级">
          <el-select v-model="form.asilLevel">
            <el-option v-for="(v, k) in ASIL_LEVEL" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="关联安全目标">
          <el-select v-model="form.goalId" clearable filterable>
            <el-option v-for="g in goals" :key="g.id" :label="`${g.goalNo} - ${g.title}`" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联安全概念">
          <el-select v-model="form.conceptId" clearable filterable>
            <el-option v-for="c in concepts" :key="c.id" :label="`${c.conceptNo} - ${c.title}`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="验收标准"><el-input v-model="form.acceptanceCriteria" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="验证方法"><el-input v-model="form.verificationMethod" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option v-for="(v, k) in SAFETY_REQUIREMENT_STATUS" :key="k" :label="v" :value="k" />
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
import { SAFETY_REQ_TYPE, SAFETY_REQUIREMENT_STATUS, ASIL_LEVEL } from '@apqp/shared/constants/safety.constants'
import { ElMessage } from 'element-plus'

const props = defineProps<{ projectId: number }>()
const list = ref<any[]>([])
const goals = ref<any[]>([])
const concepts = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const filterType = ref('')
const filterAsil = ref('')
const form = ref<any>({})
const showTraceability = ref(false)
const traceData = ref<any>(null)
const traceLoading = ref(false)

function asilTagType(a: string) {
  const m: Record<string, string> = { QM: 'info', A: 'success', B: 'warning', C: 'danger', D: 'danger' }
  return m[a] || ''
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { projectId: props.projectId }
    if (filterType.value) params.reqType = filterType.value
    if (filterAsil.value) params.asilLevel = filterAsil.value
    const res = await safetyApi.requirements.list(params)
    list.value = res.data.items
  } finally { loading.value = false }
}

async function loadTraceability() {
  traceLoading.value = true
  try {
    const res = await safetyApi.requirements.traceability(props.projectId)
    traceData.value = res.data
  } finally { traceLoading.value = false }
}

async function loadGoals() {
  const res = await safetyApi.goals.list({ projectId: props.projectId, take: 200 })
  goals.value = res.data.items
}

async function loadConcepts() {
  const res = await safetyApi.concepts.list({ projectId: props.projectId, take: 200 })
  concepts.value = res.data.items
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { title: '', reqType: 'FSR', asilLevel: 'QM', description: '', goalId: null, conceptId: null, acceptanceCriteria: '', verificationMethod: '', status: 'draft', projectId: props.projectId }
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (form.value.id) await safetyApi.requirements.update(form.value.id, form.value)
    else await safetyApi.requirements.create(form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally { saving.value = false }
}

async function handleDelete(id: number) {
  await safetyApi.requirements.delete(id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(() => { loadData(); loadGoals(); loadConcepts() })
</script>
