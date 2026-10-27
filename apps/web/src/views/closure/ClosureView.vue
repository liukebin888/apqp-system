<template>
  <div class="closure-view">
    <div class="page-header">
      <h2>结项与移交</h2>
      <div class="header-actions">
        <el-select v-model="projectFilter" placeholder="选择项目" clearable style="width: 200px; margin-right: 12px" @change="loadAll">
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: 结项管理 -->
      <el-tab-pane label="结项管理" name="closure">
        <div class="tab-toolbar">
          <el-select v-model="closureFilter.status" placeholder="状态" clearable style="width: 140px" @change="loadClosures">
            <el-option v-for="(v, k) in CLOSURE_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
          <el-button type="primary" style="margin-left: 12px" @click="showClosureDialog()">新建结项</el-button>
        </div>
        <el-table :data="closureList" stripe v-loading="closureLoading">
          <el-table-column prop="closureNo" label="结项编号" width="180" />
          <el-table-column label="项目名称" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.project?.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column label="结项日期" width="120">
            <template #default="{ row }">{{ formatDate(row.closureDate) }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag size="small" :type="closureStatusType(row.status)">{{ CLOSURE_STATUS[row.status as keyof typeof CLOSURE_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="结项原因" min-width="200" show-overflow-tooltip />
          <el-table-column label="审批人" width="100">
            <template #default="{ row }">{{ row.approvedBy?.realName || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="showClosureDialog(row)">编辑</el-button>
              <el-button v-if="row.status === 'pending'" size="small" type="success" link @click="approveClosure(row)">审批</el-button>
              <el-button v-if="row.status === 'pending' || row.status === 'rejected'" size="small" type="danger" link @click="deleteClosure(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 2: 量产移交 -->
      <el-tab-pane label="量产移交" name="handover">
        <div class="tab-toolbar">
          <el-select v-model="handoverFilter.status" placeholder="状态" clearable style="width: 140px" @change="loadHandovers">
            <el-option v-for="(v, k) in HANDOVER_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
          <el-button type="primary" style="margin-left: 12px" @click="showHandoverDialog()">新建移交</el-button>
        </div>
        <el-table :data="handoverList" stripe v-loading="handoverLoading">
          <el-table-column prop="handoverNo" label="移交编号" width="180" />
          <el-table-column label="项目名称" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.project?.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column label="移交日期" width="120">
            <template #default="{ row }">{{ formatDate(row.handoverDate) }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag size="small" :type="handoverStatusType(row.status)">{{ HANDOVER_STATUS[row.status as keyof typeof HANDOVER_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="receiver" label="接收人" width="120" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="showHandoverDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" link @click="deleteHandover(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 3: 量产追溯 -->
      <el-tab-pane label="量产追溯" name="trace">
        <div class="tab-toolbar">
          <el-select v-model="traceFilter.status" placeholder="状态" clearable style="width: 140px" @change="loadTraces">
            <el-option v-for="(v, k) in PRODUCTION_TRACE_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
          <el-button type="primary" style="margin-left: 12px" @click="showTraceDialog()">新建追溯</el-button>
        </div>
        <el-table :data="traceList" stripe v-loading="traceLoading">
          <el-table-column prop="traceNo" label="追溯编号" width="180" />
          <el-table-column label="项目名称" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.project?.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="issueDescription" label="问题描述" min-width="220" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag size="small" :type="traceStatusType(row.status)">{{ PRODUCTION_TRACE_STATUS[row.status as keyof typeof PRODUCTION_TRACE_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="responsiblePerson" label="责任人" width="100" />
          <el-table-column label="截止日期" width="120">
            <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="showTraceDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" link @click="deleteTrace(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 结项 Dialog -->
    <el-dialog v-model="closureDialogVisible" :title="closureEditing ? '编辑结项' : '新建结项'" width="650px" destroy-on-close>
      <el-form :model="closureForm" label-width="100px">
        <el-form-item label="所属项目" required>
          <el-select v-model="closureForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="结项日期" required>
          <el-date-picker v-model="closureForm.closureDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结项原因">
          <el-input v-model="closureForm.reason" type="textarea" :rows="3" placeholder="请输入结项原因" />
        </el-form-item>
        <el-form-item label="结项总结">
          <el-input v-model="closureForm.summary" type="textarea" :rows="4" placeholder="请输入结项总结" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closureDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveClosure" :loading="closureSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 移交 Dialog -->
    <el-dialog v-model="handoverDialogVisible" :title="handoverEditing ? '编辑移交' : '新建移交'" width="650px" destroy-on-close>
      <el-form :model="handoverForm" label-width="100px">
        <el-form-item label="所属项目" required>
          <el-select v-model="handoverForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="移交日期" required>
          <el-date-picker v-model="handoverForm.handoverDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="接收人" required>
          <el-input v-model="handoverForm.receiver" placeholder="请输入接收人姓名" />
        </el-form-item>
        <el-form-item label="移交内容">
          <el-input v-model="handoverForm.handoverContent" type="textarea" :rows="4" placeholder="请描述移交内容" />
        </el-form-item>
        <el-form-item label="检查清单">
          <el-input v-model="handoverForm.checklist" type="textarea" :rows="4" placeholder="请输入移交检查清单" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handoverDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveHandover" :loading="handoverSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 追溯 Dialog -->
    <el-dialog v-model="traceDialogVisible" :title="traceEditing ? '编辑追溯' : '新建追溯'" width="650px" destroy-on-close>
      <el-form :model="traceForm" label-width="100px">
        <el-form-item label="所属项目" required>
          <el-select v-model="traceForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题描述" required>
          <el-input v-model="traceForm.issueDescription" type="textarea" :rows="3" placeholder="请描述量产问题" />
        </el-form-item>
        <el-form-item label="根本原因">
          <el-input v-model="traceForm.rootCause" type="textarea" :rows="3" placeholder="请输入根本原因分析" />
        </el-form-item>
        <el-form-item label="纠正措施">
          <el-input v-model="traceForm.correctiveAction" type="textarea" :rows="3" placeholder="请输入纠正措施" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="责任人" required>
              <el-input v-model="traceForm.responsiblePerson" placeholder="责任人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期" required>
              <el-date-picker v-model="traceForm.dueDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="traceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTrace" :loading="traceSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { closureApi, projectApi } from '@/api'
import { CLOSURE_STATUS, HANDOVER_STATUS, PRODUCTION_TRACE_STATUS } from '@apqp/shared'

const activeTab = ref('closure')
const projectFilter = ref<number | undefined>()
const projects = ref<any[]>([])

// ==================== 结项管理 ====================
const closureList = ref<any[]>([])
const closureLoading = ref(false)
const closureFilter = reactive({ status: '' })
const closureDialogVisible = ref(false)
const closureEditing = ref(false)
const closureSaving = ref(false)
const closureForm = reactive<any>({
  id: null,
  projectId: null,
  closureDate: null,
  reason: '',
  summary: '',
})

// ==================== 量产移交 ====================
const handoverList = ref<any[]>([])
const handoverLoading = ref(false)
const handoverFilter = reactive({ status: '' })
const handoverDialogVisible = ref(false)
const handoverEditing = ref(false)
const handoverSaving = ref(false)
const handoverForm = reactive<any>({
  id: null,
  projectId: null,
  handoverDate: null,
  receiver: '',
  handoverContent: '',
  checklist: '',
})

// ==================== 量产追溯 ====================
const traceList = ref<any[]>([])
const traceLoading = ref(false)
const traceFilter = reactive({ status: '' })
const traceDialogVisible = ref(false)
const traceEditing = ref(false)
const traceSaving = ref(false)
const traceForm = reactive<any>({
  id: null,
  projectId: null,
  issueDescription: '',
  rootCause: '',
  correctiveAction: '',
  responsiblePerson: '',
  dueDate: null,
})

// ==================== Helpers ====================
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('zh-CN') : '-'

const closureStatusType = (s: string) =>
  ({ pending: 'warning', approved: 'success', rejected: 'danger', completed: '' } as any)[s] || ''

const handoverStatusType = (s: string) =>
  ({ pending: 'info', in_progress: 'warning', completed: 'success' } as any)[s] || ''

const traceStatusType = (s: string) =>
  ({ open: 'danger', investigating: 'warning', resolved: 'success' } as any)[s] || ''

// ==================== Data Loading ====================
async function loadProjects() {
  try {
    const res = await projectApi.list()
    projects.value = res.data?.data || res.data || []
  } catch {
    projects.value = []
  }
}

async function loadClosures() {
  closureLoading.value = true
  try {
    const params: any = {}
    if (projectFilter.value) params.projectId = projectFilter.value
    if (closureFilter.status) params.status = closureFilter.status
    const res = await closureApi.closures.list(params)
    closureList.value = res.data?.data?.items || res.data?.items || res.data?.data || []
  } catch {
    closureList.value = []
  }
  closureLoading.value = false
}

async function loadHandovers() {
  handoverLoading.value = true
  try {
    const params: any = {}
    if (projectFilter.value) params.projectId = projectFilter.value
    if (handoverFilter.status) params.status = handoverFilter.status
    const res = await closureApi.handovers.list(params)
    handoverList.value = res.data?.data?.items || res.data?.items || res.data?.data || []
  } catch {
    handoverList.value = []
  }
  handoverLoading.value = false
}

async function loadTraces() {
  traceLoading.value = true
  try {
    const params: any = {}
    if (projectFilter.value) params.projectId = projectFilter.value
    if (traceFilter.status) params.status = traceFilter.status
    const res = await closureApi.traces.list(params)
    traceList.value = res.data?.data?.items || res.data?.items || res.data?.data || []
  } catch {
    traceList.value = []
  }
  traceLoading.value = false
}

function loadAll() {
  loadClosures()
  loadHandovers()
  loadTraces()
}

// ==================== 结项 CRUD ====================
function showClosureDialog(row?: any) {
  closureEditing.value = !!row
  if (row) {
    Object.assign(closureForm, {
      id: row.id,
      projectId: row.projectId,
      closureDate: row.closureDate,
      reason: row.reason || '',
      summary: row.summary || '',
    })
  } else {
    Object.assign(closureForm, {
      id: null,
      projectId: projectFilter.value || null,
      closureDate: null,
      reason: '',
      summary: '',
    })
  }
  closureDialogVisible.value = true
}

async function saveClosure() {
  if (!closureForm.projectId || !closureForm.closureDate) {
    ElMessage.warning('请填写项目和结项日期')
    return
  }
  closureSaving.value = true
  try {
    if (closureEditing.value) {
      await closureApi.closures.update(closureForm.id, closureForm)
    } else {
      await closureApi.closures.create(closureForm)
    }
    ElMessage.success('保存成功')
    closureDialogVisible.value = false
    loadClosures()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  }
  closureSaving.value = false
}

async function approveClosure(row: any) {
  try {
    await ElMessageBox.confirm('确认批准此结项申请？', '审批确认', { type: 'warning' })
    await closureApi.closures.approve(row.id)
    ElMessage.success('已批准')
    loadClosures()
  } catch (e: any) {
    if (e !== 'cancel' && e?.toString() !== 'cancel') {
      ElMessage.error(e.response?.data?.message || '审批失败')
    }
  }
}

async function deleteClosure(row: any) {
  try {
    await ElMessageBox.confirm('确认删除此结项记录？', '删除确认', { type: 'warning' })
    await closureApi.closures.delete(row.id)
    ElMessage.success('已删除')
    loadClosures()
  } catch (e: any) {
    if (e !== 'cancel' && e?.toString() !== 'cancel') {
      ElMessage.error(e.response?.data?.message || '删除失败')
    }
  }
}

// ==================== 移交 CRUD ====================
function showHandoverDialog(row?: any) {
  handoverEditing.value = !!row
  if (row) {
    Object.assign(handoverForm, {
      id: row.id,
      projectId: row.projectId,
      handoverDate: row.handoverDate,
      receiver: row.receiver || '',
      handoverContent: row.handoverContent || '',
      checklist: row.checklist || '',
    })
  } else {
    Object.assign(handoverForm, {
      id: null,
      projectId: projectFilter.value || null,
      handoverDate: null,
      receiver: '',
      handoverContent: '',
      checklist: '',
    })
  }
  handoverDialogVisible.value = true
}

async function saveHandover() {
  if (!handoverForm.projectId || !handoverForm.handoverDate || !handoverForm.receiver) {
    ElMessage.warning('请填写项目、移交日期和接收人')
    return
  }
  handoverSaving.value = true
  try {
    if (handoverEditing.value) {
      await closureApi.handovers.update(handoverForm.id, handoverForm)
    } else {
      await closureApi.handovers.create(handoverForm)
    }
    ElMessage.success('保存成功')
    handoverDialogVisible.value = false
    loadHandovers()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  }
  handoverSaving.value = false
}

async function deleteHandover(row: any) {
  try {
    await ElMessageBox.confirm('确认删除此移交记录？', '删除确认', { type: 'warning' })
    await closureApi.handovers.delete(row.id)
    ElMessage.success('已删除')
    loadHandovers()
  } catch (e: any) {
    if (e !== 'cancel' && e?.toString() !== 'cancel') {
      ElMessage.error(e.response?.data?.message || '删除失败')
    }
  }
}

// ==================== 追溯 CRUD ====================
function showTraceDialog(row?: any) {
  traceEditing.value = !!row
  if (row) {
    Object.assign(traceForm, {
      id: row.id,
      projectId: row.projectId,
      issueDescription: row.issueDescription || '',
      rootCause: row.rootCause || '',
      correctiveAction: row.correctiveAction || '',
      responsiblePerson: row.responsiblePerson || '',
      dueDate: row.dueDate,
    })
  } else {
    Object.assign(traceForm, {
      id: null,
      projectId: projectFilter.value || null,
      issueDescription: '',
      rootCause: '',
      correctiveAction: '',
      responsiblePerson: '',
      dueDate: null,
    })
  }
  traceDialogVisible.value = true
}

async function saveTrace() {
  if (!traceForm.projectId || !traceForm.issueDescription || !traceForm.responsiblePerson || !traceForm.dueDate) {
    ElMessage.warning('请填写项目、问题描述、责任人和截止日期')
    return
  }
  traceSaving.value = true
  try {
    if (traceEditing.value) {
      await closureApi.traces.update(traceForm.id, traceForm)
    } else {
      await closureApi.traces.create(traceForm)
    }
    ElMessage.success('保存成功')
    traceDialogVisible.value = false
    loadTraces()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  }
  traceSaving.value = false
}

async function deleteTrace(row: any) {
  try {
    await ElMessageBox.confirm('确认删除此追溯记录？', '删除确认', { type: 'warning' })
    await closureApi.traces.delete(row.id)
    ElMessage.success('已删除')
    loadTraces()
  } catch (e: any) {
    if (e !== 'cancel' && e?.toString() !== 'cancel') {
      ElMessage.error(e.response?.data?.message || '删除失败')
    }
  }
}

// ==================== Init ====================
onMounted(() => {
  loadProjects()
  loadAll()
})
</script>

<style scoped>
.closure-view { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.tab-toolbar { margin-bottom: 12px; display: flex; align-items: center; }
</style>
