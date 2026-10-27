<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>进度报告</h2>
      <div class="header-actions">
        <el-select
          v-model="filter.projectId"
          placeholder="选择项目"
          clearable
          filterable
          style="width: 240px; margin-right: 12px"
          @change="loadReports"
        >
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
        <el-select
          v-model="filter.reportType"
          placeholder="报告类型"
          clearable
          style="width: 140px; margin-right: 12px"
          @change="loadReports"
        >
          <el-option label="日报" value="daily" />
          <el-option label="周报" value="weekly" />
          <el-option label="月报" value="monthly" />
        </el-select>
        <el-button type="primary" @click="openCreateDialog">新建报告</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="reports" border stripe>
        <el-table-column prop="reportNo" label="报告编号" width="150" />
        <el-table-column label="项目名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.project?.projectName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="reportType" label="报告类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="reportTypeTag(row.reportType)" size="small">
              {{ REPORT_TYPE[row.reportType] || row.reportType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="period" label="报告周期" width="130">
          <template #default="{ row }">{{ formatDate(row.period) }}</template>
        </el-table-column>
        <el-table-column label="完成率" width="160">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progressRate ?? 0"
              :stroke-width="14"
              :text-inside="true"
              :color="progressColor(row.progressRate)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="issues" label="问题" min-width="160" show-overflow-tooltip />
        <el-table-column prop="risks" label="风险" min-width="160" show-overflow-tooltip />
        <el-table-column prop="nextPlan" label="下步计划" min-width="160" show-overflow-tooltip />
        <el-table-column label="填报人" width="100">
          <template #default="{ row }">{{ row.reporterName || row.createdBy?.realName || '-' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteReport(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="loadReports"
        />
      </div>

      <el-empty v-if="!reports.length && !loading" description="暂无进度报告" :image-size="100" />
    </el-card>

    <!-- Create / Edit Dialog -->
    <el-dialog
      v-model="showDialog"
      :title="editingReport ? '编辑报告' : '新建报告'"
      width="700px"
      destroy-on-close
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="所属项目" required>
          <el-select
            v-model="formData.projectId"
            placeholder="选择项目"
            filterable
            style="width: 100%"
          >
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="报告类型" required>
          <el-select v-model="formData.reportType" style="width: 100%">
            <el-option label="日报" value="daily" />
            <el-option label="周报" value="weekly" />
            <el-option label="月报" value="monthly" />
          </el-select>
        </el-form-item>
        <el-form-item label="报告周期" required>
          <el-date-picker
            v-model="formData.period"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="完成率">
          <el-slider v-model="formData.progressRate" :min="0" :max="100" show-input :step="5" />
        </el-form-item>
        <el-form-item label="已完成工作">
          <el-input v-model="formData.completedWork" type="textarea" :rows="3" placeholder="请描述本期已完成的工作内容" />
        </el-form-item>
        <el-form-item label="存在问题">
          <el-input v-model="formData.issues" type="textarea" :rows="3" placeholder="请描述当前存在的问题" />
        </el-form-item>
        <el-form-item label="风险项">
          <el-input v-model="formData.risks" type="textarea" :rows="3" placeholder="请描述潜在风险" />
        </el-form-item>
        <el-form-item label="下步计划">
          <el-input v-model="formData.nextPlan" type="textarea" :rows="3" placeholder="请描述下一步工作计划" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveReport">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { projectReportApi, projectApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

// ==================== Constants ====================

const REPORT_TYPE = { daily: '日报', weekly: '周报', monthly: '月报' } as const

// ==================== State ====================

const loading = ref(false)
const submitting = ref(false)
const projects = ref<any[]>([])
const reports = ref<any[]>([])
const showDialog = ref(false)
const editingReport = ref<any>(null)

const filter = reactive({
  projectId: undefined as number | undefined,
  reportType: '' as string,
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const formData = reactive({
  projectId: undefined as number | undefined,
  reportType: '' as string,
  period: '',
  progressRate: 0,
  completedWork: '',
  issues: '',
  risks: '',
  nextPlan: '',
})

// ==================== Helpers ====================

function reportTypeTag(type: string): string {
  if (type === 'daily') return ''
  if (type === 'weekly') return 'success'
  if (type === 'monthly') return 'warning'
  return 'info'
}

function progressColor(rate: number): string {
  if (rate >= 80) return '#67c23a'
  if (rate >= 50) return '#409eff'
  if (rate >= 30) return '#e6a23c'
  return '#f56c6c'
}

function formatDate(d: string | null | undefined): string {
  return d ? dayjs(d).format('YYYY-MM-DD') : '-'
}

function formatDateTime(d: string | null | undefined): string {
  return d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'
}

// ==================== Data Loading ====================

async function loadProjects() {
  try {
    const res: any = await projectApi.list({ page: 1, pageSize: 200 })
    projects.value = res.data?.data?.items || res.data?.items || res.data?.data || res || []
  } catch (e) {
    console.error('Failed to load projects', e)
  }
}

async function loadReports() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (filter.projectId) params.projectId = filter.projectId
    if (filter.reportType) params.reportType = filter.reportType

    const res: any = await projectReportApi.reports.list(params)
    reports.value = res.data?.data?.items || res.data?.items || res.data?.data || res || []
    pagination.total = res.data?.data?.total ?? res.data?.total ?? reports.value.length
  } catch (e) {
    console.error('Failed to load reports', e)
  } finally {
    loading.value = false
  }
}

// ==================== CRUD ====================

function resetForm() {
  Object.assign(formData, {
    projectId: undefined,
    reportType: '',
    period: '',
    progressRate: 0,
    completedWork: '',
    issues: '',
    risks: '',
    nextPlan: '',
  })
}

function openCreateDialog() {
  editingReport.value = null
  resetForm()
  // Pre-fill project from filter if set
  if (filter.projectId) {
    formData.projectId = filter.projectId
  }
  showDialog.value = true
}

function openEditDialog(report: any) {
  editingReport.value = report
  Object.assign(formData, {
    projectId: report.projectId ?? report.project?.id,
    reportType: report.reportType,
    period: report.period ? dayjs(report.period).format('YYYY-MM-DD') : '',
    progressRate: report.progressRate ?? 0,
    completedWork: report.completedWork || '',
    issues: report.issues || '',
    risks: report.risks || '',
    nextPlan: report.nextPlan || '',
  })
  showDialog.value = true
}

async function saveReport() {
  if (!formData.projectId) {
    ElMessage.warning('请选择所属项目')
    return
  }
  if (!formData.reportType) {
    ElMessage.warning('请选择报告类型')
    return
  }
  if (!formData.period) {
    ElMessage.warning('请选择报告周期')
    return
  }

  submitting.value = true
  try {
    const payload = { ...formData }
    if (editingReport.value) {
      await projectReportApi.reports.update(editingReport.value.id, payload)
      ElMessage.success('更新成功')
    } else {
      await projectReportApi.reports.create(payload)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    await loadReports()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function deleteReport(id: number) {
  try {
    await ElMessageBox.confirm('确定删除此进度报告？', '提示', { type: 'warning' })
    await projectReportApi.reports.delete(id)
    ElMessage.success('删除成功')
    await loadReports()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

// ==================== Lifecycle ====================

onMounted(async () => {
  await loadProjects()
  await loadReports()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
