<template>
  <div class="security-audit-view">
    <div class="page-header">
      <h2>审计与日志</h2>
      <div class="header-actions">
        <el-select v-model="projectFilter" placeholder="选择项目" clearable style="width: 240px" @change="onProjectChange">
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- ==================== Tab 1: 安全审计 ==================== -->
      <el-tab-pane label="安全审计" name="audits">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showAuditDialog()">新建审计</el-button>
          <el-select v-model="auditFilter.auditType" placeholder="审计类型" clearable style="width: 140px; margin-left: 12px" @change="loadAudits">
            <el-option v-for="(v, k) in AUDIT_TYPE" :key="k" :label="v" :value="k" />
          </el-select>
          <el-select v-model="auditFilter.status" placeholder="状态" clearable style="width: 130px; margin-left: 8px" @change="loadAudits">
            <el-option label="计划中" value="planned" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </div>

        <el-table :data="auditList" stripe v-loading="auditLoading" style="width: 100%; margin-top: 12px">
          <el-table-column prop="auditNo" label="审计编号" width="160" />
          <el-table-column prop="auditType" label="审计类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ AUDIT_TYPE[row.auditType as keyof typeof AUDIT_TYPE] || row.auditType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="项目名称" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.project?.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="auditDate" label="审计日期" width="120">
            <template #default="{ row }">{{ formatDate(row.auditDate) }}</template>
          </el-table-column>
          <el-table-column prop="auditor" label="审计员" width="120" />
          <el-table-column prop="findings" label="发现项" min-width="200" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="auditStatusTagType(row.status)">{{ auditStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="showAuditDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click.stop="deleteAudit(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Audit Dialog -->
        <el-dialog v-model="auditDialogVisible" :title="auditForm.id ? '编辑审计' : '新建审计'" width="620px" destroy-on-close>
          <el-form :model="auditForm" label-width="110px">
            <el-form-item label="所属项目" required>
              <el-select v-model="auditForm.projectId" placeholder="选择项目" filterable style="width: 100%">
                <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="审计类型" required>
              <el-select v-model="auditForm.auditType" style="width: 100%">
                <el-option v-for="(v, k) in AUDIT_TYPE" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="审计日期" required>
              <el-date-picker v-model="auditForm.auditDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
            <el-form-item label="审计员">
              <el-input v-model="auditForm.auditor" placeholder="审计员姓名" />
            </el-form-item>
            <el-form-item label="审计范围">
              <el-input v-model="auditForm.scope" type="textarea" :rows="3" placeholder="描述审计覆盖的范围" />
            </el-form-item>
            <el-form-item label="发现项">
              <el-input v-model="auditForm.findings" type="textarea" :rows="3" placeholder="审计中发现的问题" />
            </el-form-item>
            <el-form-item label="建议措施">
              <el-input v-model="auditForm.recommendations" type="textarea" :rows="3" placeholder="改进建议与纠正措施" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="auditForm.status" style="width: 100%">
                <el-option label="计划中" value="planned" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="auditDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveAudit" :loading="saving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ==================== Tab 2: 合规报告 ==================== -->
      <el-tab-pane label="合规报告" name="reports">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showReportDialog()">新建报告</el-button>
          <el-select v-model="reportFilter.reportType" placeholder="报告类型" clearable style="width: 140px; margin-left: 12px" @change="loadReports">
            <el-option v-for="(v, k) in REPORT_TYPE" :key="k" :label="v" :value="k" />
          </el-select>
          <el-select v-model="reportFilter.status" placeholder="状态" clearable style="width: 130px; margin-left: 8px" @change="loadReports">
            <el-option v-for="(v, k) in REPORT_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
        </div>

        <el-table :data="reportList" stripe v-loading="reportLoading" style="width: 100%; margin-top: 12px">
          <el-table-column prop="reportNo" label="报告编号" width="160" />
          <el-table-column prop="reportType" label="报告类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ REPORT_TYPE[row.reportType as keyof typeof REPORT_TYPE] || row.reportType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="项目名称" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.project?.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="reportStatusTagType(row.status)">{{ REPORT_STATUS[row.status as keyof typeof REPORT_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="publishedDate" label="发布日期" width="120">
            <template #default="{ row }">{{ formatDate(row.publishedDate) }}</template>
          </el-table-column>
          <el-table-column prop="authorName" label="作者" width="100" />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="showReportDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click.stop="deleteReport(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Report Dialog -->
        <el-dialog v-model="reportDialogVisible" :title="reportForm.id ? '编辑报告' : '新建报告'" width="620px" destroy-on-close>
          <el-form :model="reportForm" label-width="110px">
            <el-form-item label="所属项目" required>
              <el-select v-model="reportForm.projectId" placeholder="选择项目" filterable style="width: 100%">
                <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="报告类型" required>
              <el-select v-model="reportForm.reportType" style="width: 100%">
                <el-option v-for="(v, k) in REPORT_TYPE" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="标题" required>
              <el-input v-model="reportForm.title" placeholder="报告标题" />
            </el-form-item>
            <el-form-item label="内容">
              <el-input v-model="reportForm.content" type="textarea" :rows="5" placeholder="报告正文内容" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="reportForm.status" style="width: 100%">
                <el-option v-for="(v, k) in REPORT_STATUS" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="发布日期">
              <el-date-picker v-model="reportForm.publishedDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="reportDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveReport" :loading="saving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { securityAuditApi, projectApi } from '@/api'
import { AUDIT_TYPE, REPORT_TYPE, REPORT_STATUS } from '@apqp/shared'

// ==================== Common ====================
const projects = ref<any[]>([])
const projectFilter = ref<number | undefined>()
const activeTab = ref('audits')
const saving = ref(false)

async function loadProjects() {
  const res = await projectApi.list({ take: 200 })
  projects.value = res.data?.items || res.data || []
}

function formatDate(d: any) {
  if (!d) return '-'
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function onProjectChange() {
  loadAudits()
  loadReports()
}

// ==================== Audit Status Helpers ====================
const AUDIT_STATUS_MAP: Record<string, string> = {
  planned: '计划中',
  in_progress: '进行中',
  completed: '已完成',
  closed: '已关闭',
}

function auditStatusLabel(status: string) {
  return AUDIT_STATUS_MAP[status] || status
}

function auditStatusTagType(status: string) {
  const map: Record<string, string> = {
    planned: 'info',
    in_progress: '',
    completed: 'success',
    closed: 'info',
  }
  return map[status] || 'info'
}

function reportStatusTagType(status: string) {
  const map: Record<string, string> = {
    draft: 'info',
    published: 'success',
    archived: '',
  }
  return map[status] || 'info'
}

// ==================== Tab 1: Security Audits ====================
const auditList = ref<any[]>([])
const auditLoading = ref(false)
const auditDialogVisible = ref(false)
const auditFilter = reactive({ auditType: '', status: '' })
const defaultAuditForm = {
  id: null as number | null,
  projectId: undefined as number | undefined,
  auditType: 'security',
  auditDate: '',
  auditor: '',
  scope: '',
  findings: '',
  recommendations: '',
  status: 'planned',
}
const auditForm = reactive({ ...defaultAuditForm })

async function loadAudits() {
  auditLoading.value = true
  try {
    const res = await securityAuditApi.audits.list({
      projectId: projectFilter.value,
      auditType: auditFilter.auditType || undefined,
      status: auditFilter.status || undefined,
    })
    auditList.value = res.data?.items || res.data || []
  } finally {
    auditLoading.value = false
  }
}

function showAuditDialog(row?: any) {
  if (row) {
    Object.assign(auditForm, {
      id: row.id,
      projectId: row.projectId,
      auditType: row.auditType,
      auditDate: row.auditDate ? formatDate(row.auditDate) : '',
      auditor: row.auditor || '',
      scope: row.scope || '',
      findings: row.findings || '',
      recommendations: row.recommendations || '',
      status: row.status || 'planned',
    })
  } else {
    Object.assign(auditForm, { ...defaultAuditForm, projectId: projectFilter.value })
  }
  auditDialogVisible.value = true
}

async function saveAudit() {
  if (!auditForm.projectId) {
    ElMessage.warning('请选择所属项目')
    return
  }
  if (!auditForm.auditDate) {
    ElMessage.warning('请选择审计日期')
    return
  }
  saving.value = true
  try {
    const payload = { ...auditForm }
    if (payload.id) {
      await securityAuditApi.audits.update(payload.id, payload)
      ElMessage.success('审计记录已更新')
    } else {
      await securityAuditApi.audits.create(payload)
      ElMessage.success('审计记录已创建')
    }
    auditDialogVisible.value = false
    await loadAudits()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteAudit(id: number) {
  try {
    await ElMessageBox.confirm('确定删除该审计记录吗？', '确认删除', { type: 'warning' })
    await securityAuditApi.audits.delete(id)
    ElMessage.success('已删除')
    await loadAudits()
  } catch {
    // cancelled or error
  }
}

// ==================== Tab 2: Compliance Reports ====================
const reportList = ref<any[]>([])
const reportLoading = ref(false)
const reportDialogVisible = ref(false)
const reportFilter = reactive({ reportType: '', status: '' })
const defaultReportForm = {
  id: null as number | null,
  projectId: undefined as number | undefined,
  reportType: 'security',
  title: '',
  content: '',
  status: 'draft',
  publishedDate: '',
}
const reportForm = reactive({ ...defaultReportForm })

async function loadReports() {
  reportLoading.value = true
  try {
    const res = await securityAuditApi.reports.list({
      projectId: projectFilter.value,
      reportType: reportFilter.reportType || undefined,
      status: reportFilter.status || undefined,
    })
    reportList.value = res.data?.items || res.data || []
  } finally {
    reportLoading.value = false
  }
}

function showReportDialog(row?: any) {
  if (row) {
    Object.assign(reportForm, {
      id: row.id,
      projectId: row.projectId,
      reportType: row.reportType,
      title: row.title || '',
      content: row.content || '',
      status: row.status || 'draft',
      publishedDate: row.publishedDate ? formatDate(row.publishedDate) : '',
    })
  } else {
    Object.assign(reportForm, { ...defaultReportForm, projectId: projectFilter.value })
  }
  reportDialogVisible.value = true
}

async function saveReport() {
  if (!reportForm.projectId) {
    ElMessage.warning('请选择所属项目')
    return
  }
  if (!reportForm.title) {
    ElMessage.warning('请输入报告标题')
    return
  }
  saving.value = true
  try {
    const payload = { ...reportForm }
    if (payload.id) {
      await securityAuditApi.reports.update(payload.id, payload)
      ElMessage.success('报告已更新')
    } else {
      await securityAuditApi.reports.create(payload)
      ElMessage.success('报告已创建')
    }
    reportDialogVisible.value = false
    await loadReports()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteReport(id: number) {
  try {
    await ElMessageBox.confirm('确定删除该合规报告吗？', '确认删除', { type: 'warning' })
    await securityAuditApi.reports.delete(id)
    ElMessage.success('已删除')
    await loadReports()
  } catch {
    // cancelled or error
  }
}

// ==================== Lifecycle ====================
onMounted(async () => {
  await loadProjects()
  await Promise.all([loadAudits(), loadReports()])
})
</script>

<style scoped>
.security-audit-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tab-toolbar {
  display: flex;
  align-items: center;
  padding: 12px 0;
}
</style>
