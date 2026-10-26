<template>
  <div class="tool-qual-tab">
    <div class="toolbar">
      <el-select v-model="filterStatus" placeholder="鉴定状态" clearable style="width: 160px" @change="loadData">
        <el-option v-for="(v, k) in TOOL_QUALIFICATION_STATUS" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="filterLevel" placeholder="可信度等级" clearable style="width: 160px" @change="loadData">
        <el-option v-for="(v, k) in TOOL_CONFIDENCE_LEVEL" :key="k" :label="v" :value="k" />
      </el-select>
      <el-button type="primary" @click="openDialog()">新增工具鉴定</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="toolNo" label="编号" width="150" />
      <el-table-column prop="toolName" label="工具名称" min-width="180" />
      <el-table-column prop="toolType" label="工具类型" width="120">
        <template #default="{ row }"><el-tag size="small">{{ TOOL_TYPE[row.toolType] || row.toolType }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="manufacturer" label="厂商" width="140" />
      <el-table-column prop="version" label="版本" width="100" />
      <el-table-column prop="confidenceLevel" label="可信度" width="130">
        <template #default="{ row }">
          <el-tag :type="row.confidenceLevel === 'TB3' ? 'success' : row.confidenceLevel === 'TB2' ? 'warning' : 'info'" size="small">{{ TOOL_CONFIDENCE_LEVEL[row.confidenceLevel] || row.confidenceLevel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="diaReference" label="DIA引用" width="140" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }"><el-tag :type="row.status === 'qualified' ? 'success' : row.status === 'blacklisted' ? 'danger' : 'warning'" size="small">{{ TOOL_QUALIFICATION_STATUS[row.status] || row.status }}</el-tag></template>
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
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑工具鉴定' : '新增工具鉴定'" width="650px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="工具名称"><el-input v-model="form.toolName" /></el-form-item>
        <el-form-item label="工具类型">
          <el-select v-model="form.toolType">
            <el-option v-for="(v, k) in TOOL_TYPE" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商"><el-input v-model="form.manufacturer" /></el-form-item>
        <el-form-item label="版本"><el-input v-model="form.version" /></el-form-item>
        <el-form-item label="可信度等级">
          <el-select v-model="form.confidenceLevel">
            <el-option v-for="(v, k) in TOOL_CONFIDENCE_LEVEL" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="鉴定方法"><el-input v-model="form.qualificationMethod" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="鉴定证据URL"><el-input v-model="form.qualificationEvidence" /></el-form-item>
        <el-form-item label="DIA引用"><el-input v-model="form.diaReference" /></el-form-item>
        <el-form-item label="关联项目">
          <el-select v-model="form.projectId" clearable filterable>
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="鉴定日期"><el-date-picker v-model="form.qualifiedAt" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="有效期至"><el-date-picker v-model="form.expiresAt" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option v-for="(v, k) in TOOL_QUALIFICATION_STATUS" :key="k" :label="v" :value="k" />
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
import { TOOL_CONFIDENCE_LEVEL, TOOL_QUALIFICATION_STATUS, TOOL_TYPE } from '@apqp/shared/constants/safety.constants'
import { ElMessage } from 'element-plus'
import { request } from '@/api'

const props = defineProps<{ projectId: number }>()
const list = ref<any[]>([])
const projects = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const filterStatus = ref('')
const filterLevel = ref('')
const form = ref<any>({})

async function loadData() {
  loading.value = true
  try {
    const params: any = {}
    if (filterStatus.value) params.status = filterStatus.value
    if (filterLevel.value) params.confidenceLevel = filterLevel.value
    const res = await safetyApi.tools.list(params)
    list.value = res.data.items
  } finally { loading.value = false }
}

async function loadProjects() {
  const res = await request.get('/projects', { params: { take: 200 } })
  projects.value = res.data.items || []
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { toolName: '', toolType: 'verification', manufacturer: '', version: '', confidenceLevel: 'TB2', qualificationMethod: '', qualificationEvidence: '', diaReference: '', projectId: null, qualifiedAt: null, expiresAt: null, status: 'not_qualified' }
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (form.value.id) await safetyApi.tools.update(form.value.id, form.value)
    else await safetyApi.tools.create(form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally { saving.value = false }
}

async function handleDelete(id: number) {
  await safetyApi.tools.delete(id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(() => { loadData(); loadProjects() })
</script>
