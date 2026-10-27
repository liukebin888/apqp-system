<template>
  <div class="issue-view">
    <div class="page-header">
      <h2>问题管理</h2>
      <div class="header-actions">
        <el-select v-model="filterProjectId" placeholder="选择项目" clearable style="width: 240px" @change="handleProjectChange">
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <!-- ==================== 问题清单 ==================== -->
      <el-tab-pane label="问题清单" name="issues">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="openIssueDialog()">新建问题</el-button>
          <el-select v-model="issueFilter.status" placeholder="状态" clearable @change="loadIssues">
            <el-option v-for="(label, key) in ISSUE_STATUS" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="issueFilter.type" placeholder="类型" clearable @change="loadIssues">
            <el-option v-for="(label, key) in ISSUE_TYPE" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="issueFilter.severity" placeholder="严重度" clearable @change="loadIssues">
            <el-option v-for="(label, key) in ISSUE_SEVERITY" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="issueFilter.priority" placeholder="优先级" clearable @change="loadIssues">
            <el-option v-for="(label, key) in ISSUE_PRIORITY" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="issues" stripe v-loading="issueLoading">
          <el-table-column prop="issueNo" label="问题编号" width="150" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="类型" width="110">
            <template #default="{ row }">
              <el-tag size="small">{{ ISSUE_TYPE[row.type] || row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="严重度" width="90">
            <template #default="{ row }">
              <el-tag :type="severityTagType(row.severity)" size="small">{{ ISSUE_SEVERITY[row.severity] || row.severity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="80">
            <template #default="{ row }">{{ ISSUE_PRIORITY[row.priority] || row.priority }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ ISSUE_STATUS[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="所属项目" width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ row.project?.projectName || row.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column label="负责人" width="90">
            <template #default="{ row }">{{ row.assignee?.realName || row.assigneeName || '-' }}</template>
          </el-table-column>
          <el-table-column label="截止日期" width="120">
            <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openIssueDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="deleteIssue(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== 8D管理 ==================== -->
      <el-tab-pane label="8D管理" name="eightD">
        <div class="tab-toolbar">
          <el-select v-model="eightDFilter.status" placeholder="状态" clearable @change="loadEightDIssues">
            <el-option v-for="(label, key) in ISSUE_STATUS" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="eightDIssues" stripe v-loading="eightDLoading">
          <el-table-column prop="issueNo" label="问题编号" width="150" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="当前步骤" width="160">
            <template #default="{ row }">
              <el-tag v-if="row.currentStep" type="warning" size="small">{{ EIGHT_D_STEPS[row.currentStep] || row.currentStep }}</el-tag>
              <span v-else style="color: #909399">未启动</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ ISSUE_STATUS[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="负责人" width="90">
            <template #default="{ row }">{{ row.assignee?.realName || row.assigneeName || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openEightDDialog(row)">编辑8D</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== 问题升级 ==================== -->
      <el-tab-pane label="问题升级" name="escalation">
        <div class="tab-toolbar">
          <el-select v-model="escalationFilter.severity" placeholder="严重度" clearable @change="loadEscalatedIssues">
            <el-option v-for="(label, key) in ISSUE_SEVERITY" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="escalatedIssues" stripe v-loading="escalationLoading">
          <el-table-column prop="issueNo" label="问题编号" width="150" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="严重度" width="90">
            <template #default="{ row }">
              <el-tag :type="severityTagType(row.severity)" size="small">{{ ISSUE_SEVERITY[row.severity] || row.severity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ ISSUE_STATUS[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="升级级别" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.escalationLevel" type="danger" size="small">{{ row.escalationLevel }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="升级原因" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.escalationReason || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openIssueDialog(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== 经验教训 ==================== -->
      <el-tab-pane label="经验教训" name="lessons">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="openLessonDialog()">新建经验教训</el-button>
          <el-select v-model="lessonFilter.category" placeholder="分类" clearable @change="loadLessons">
            <el-option v-for="(label, key) in LESSON_CATEGORY" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="lessonFilter.type" placeholder="类型" clearable @change="loadLessons">
            <el-option v-for="(label, key) in LESSON_TYPE" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="lessons" stripe v-loading="lessonLoading">
          <el-table-column prop="lessonNo" label="编号" width="150" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="分类" width="90">
            <template #default="{ row }">
              <el-tag size="small">{{ LESSON_CATEGORY[row.category] || row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="110">
            <template #default="{ row }">
              <el-tag :type="lessonTypeTag(row.type)" size="small">{{ LESSON_TYPE[row.type] || row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="所属项目" width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ row.project?.projectName || row.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column label="作者" width="90">
            <template #default="{ row }">{{ row.author?.realName || row.authorName || '-' }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="120">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openLessonDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="deleteLesson(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== 问题 Dialog ==================== -->
    <el-dialog v-model="showIssueDialog" :title="editingIssue ? '编辑问题' : '新建问题'" width="640px">
      <el-form :model="issueForm" label-width="120px">
        <el-form-item label="标题" required>
          <el-input v-model="issueForm.title" />
        </el-form-item>
        <el-form-item label="所属项目" required>
          <el-select v-model="issueForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="类型">
              <el-select v-model="issueForm.type" style="width: 100%">
                <el-option v-for="(label, key) in ISSUE_TYPE" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="严重度">
              <el-select v-model="issueForm.severity" style="width: 100%">
                <el-option v-for="(label, key) in ISSUE_SEVERITY" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="issueForm.priority" style="width: 100%">
                <el-option v-for="(label, key) in ISSUE_PRIORITY" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源">
              <el-select v-model="issueForm.source" style="width: 100%">
                <el-option v-for="(label, key) in ISSUE_SOURCE" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="issueForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-input v-model="issueForm.assigneeName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期">
              <el-date-picker v-model="issueForm.dueDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showIssueDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveIssue">{{ editingIssue ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 8D Dialog ==================== -->
    <el-dialog v-model="showEightDDialog" title="8D报告" width="800px" top="5vh">
      <div v-if="currentEightDIssue">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 16px">
          <el-descriptions-item label="问题编号">{{ currentEightDIssue.issueNo }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ currentEightDIssue.title }}</el-descriptions-item>
        </el-descriptions>
        <el-tabs v-model="currentEightDStep" type="card">
          <el-tab-pane label="D1 团队" name="d1">
            <el-form label-width="120px">
              <el-form-item label="团队成员">
                <el-input v-model="eightDForm.d1Team" type="textarea" :rows="3" placeholder="列出团队成员及其职责" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D2 问题描述" name="d2">
            <el-form label-width="120px">
              <el-form-item label="问题描述">
                <el-input v-model="eightDForm.d2Description" type="textarea" :rows="4" placeholder="使用5W2H方法详细描述问题" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D3 遏制措施" name="d3">
            <el-form label-width="120px">
              <el-form-item label="临时遏制措施">
                <el-input v-model="eightDForm.d3Containment" type="textarea" :rows="4" placeholder="描述临时遏制措施及实施情况" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D4 根因分析" name="d4">
            <el-form label-width="120px">
              <el-form-item label="根本原因">
                <el-input v-model="eightDForm.d4RootCause" type="textarea" :rows="4" placeholder="使用鱼骨图/5Why等方法分析根本原因" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D5 纠正措施" name="d5">
            <el-form label-width="120px">
              <el-form-item label="永久纠正措施">
                <el-input v-model="eightDForm.d5CorrectiveAction" type="textarea" :rows="4" placeholder="描述针对根本原因的永久纠正措施" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D6 验证" name="d6">
            <el-form label-width="120px">
              <el-form-item label="实施与验证">
                <el-input v-model="eightDForm.d6Verification" type="textarea" :rows="4" placeholder="描述纠正措施的实施及效果验证结果" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D7 预防" name="d7">
            <el-form label-width="120px">
              <el-form-item label="预防措施">
                <el-input v-model="eightDForm.d7Prevention" type="textarea" :rows="4" placeholder="描述防止问题再次发生的系统性预防措施" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D8 表彰" name="d8">
            <el-form label-width="120px">
              <el-form-item label="团队表彰">
                <el-input v-model="eightDForm.d8Congratulate" type="textarea" :rows="3" placeholder="记录对团队的认可和表彰" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="showEightDDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveEightD">保存</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 经验教训 Dialog ==================== -->
    <el-dialog v-model="showLessonDialog" :title="editingLesson ? '编辑经验教训' : '新建经验教训'" width="640px">
      <el-form :model="lessonForm" label-width="120px">
        <el-form-item label="标题" required>
          <el-input v-model="lessonForm.title" />
        </el-form-item>
        <el-form-item label="所属项目">
          <el-select v-model="lessonForm.projectId" placeholder="选择项目" clearable style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="lessonForm.category" style="width: 100%">
                <el-option v-for="(label, key) in LESSON_CATEGORY" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型">
              <el-select v-model="lessonForm.type" style="width: 100%">
                <el-option v-for="(label, key) in LESSON_TYPE" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="内容">
          <el-input v-model="lessonForm.content" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="根本原因">
          <el-input v-model="lessonForm.rootCause" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="改进建议">
          <el-input v-model="lessonForm.recommendation" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLessonDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveLesson">{{ editingLesson ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { issueApi, projectApi } from '@/api'
import {
  ISSUE_TYPE,
  ISSUE_SEVERITY,
  ISSUE_PRIORITY,
  ISSUE_STATUS,
  ISSUE_SOURCE,
  EIGHT_D_STEPS,
  LESSON_TYPE,
  LESSON_CATEGORY,
} from '@apqp/shared'

// ==================== Common State ====================
const activeTab = ref('issues')
const filterProjectId = ref<number | undefined>()
const projects = ref<any[]>([])
const submitting = ref(false)

// ==================== Tab 1: Issue List ====================
const issues = ref<any[]>([])
const issueLoading = ref(false)
const issueFilter = reactive({ status: '', type: '', severity: '', priority: '' })
const showIssueDialog = ref(false)
const editingIssue = ref<any>(null)
const issueForm = reactive<any>({
  title: '',
  projectId: null,
  type: 'other',
  severity: 'minor',
  priority: 'medium',
  source: 'internal',
  description: '',
  assigneeName: '',
  dueDate: '',
})

// ==================== Tab 2: 8D Management ====================
const eightDIssues = ref<any[]>([])
const eightDLoading = ref(false)
const eightDFilter = reactive({ status: '' })
const showEightDDialog = ref(false)
const currentEightDIssue = ref<any>(null)
const currentEightDStep = ref('d1')
const eightDForm = reactive<any>({
  d1Team: '',
  d2Description: '',
  d3Containment: '',
  d4RootCause: '',
  d5CorrectiveAction: '',
  d6Verification: '',
  d7Prevention: '',
  d8Congratulate: '',
})

// ==================== Tab 3: Escalation ====================
const escalatedIssues = ref<any[]>([])
const escalationLoading = ref(false)
const escalationFilter = reactive({ severity: '' })

// ==================== Tab 4: Lessons Learned ====================
const lessons = ref<any[]>([])
const lessonLoading = ref(false)
const lessonFilter = reactive({ category: '', type: '' })
const showLessonDialog = ref(false)
const editingLesson = ref<any>(null)
const lessonForm = reactive<any>({
  title: '',
  projectId: null,
  category: 'quality',
  type: 'lesson_learned',
  content: '',
  rootCause: '',
  recommendation: '',
})

// ==================== Helpers ====================
function formatDate(d: string | Date | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('zh-CN')
}

function severityTagType(severity: string) {
  const map: Record<string, string> = { critical: 'danger', major: 'warning', minor: 'info' }
  return (map[severity] || 'info') as any
}

function statusTagType(status: string) {
  const map: Record<string, string> = {
    open: 'info',
    investigating: 'warning',
    '8d_in_progress': '',
    resolved: 'success',
    closed: 'info',
  }
  return (map[status] || 'info') as any
}

function lessonTypeTag(type: string) {
  const map: Record<string, string> = {
    lesson_learned: '',
    best_practice: 'success',
    pitfall: 'danger',
  }
  return (map[type] || 'info') as any
}

// ==================== Data Loading ====================
async function loadProjects() {
  try {
    const res = await projectApi.list({})
    projects.value = res.data?.data?.items || res.data?.items || res.data?.data || []
  } catch {
    /* ignore */
  }
}

async function loadIssues() {
  issueLoading.value = true
  try {
    const params: any = {}
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (issueFilter.status) params.status = issueFilter.status
    if (issueFilter.type) params.type = issueFilter.type
    if (issueFilter.severity) params.severity = issueFilter.severity
    if (issueFilter.priority) params.priority = issueFilter.priority
    const res = await issueApi.issues.list(params)
    issues.value = res.data?.data?.items || res.data?.items || res.data?.data || []
  } finally {
    issueLoading.value = false
  }
}

async function loadEightDIssues() {
  eightDLoading.value = true
  try {
    const params: any = {}
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (eightDFilter.status) params.status = eightDFilter.status
    const res = await issueApi.issues.list(params)
    eightDIssues.value = res.data?.data?.items || res.data?.items || res.data?.data || []
  } finally {
    eightDLoading.value = false
  }
}

async function loadEscalatedIssues() {
  escalationLoading.value = true
  try {
    const params: any = { escalated: true }
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (escalationFilter.severity) params.severity = escalationFilter.severity
    const res = await issueApi.issues.list(params)
    escalatedIssues.value = res.data?.data?.items || res.data?.items || res.data?.data || []
  } finally {
    escalationLoading.value = false
  }
}

async function loadLessons() {
  lessonLoading.value = true
  try {
    const params: any = {}
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (lessonFilter.category) params.category = lessonFilter.category
    if (lessonFilter.type) params.type = lessonFilter.type
    const res = await issueApi.lessons.list(params)
    lessons.value = res.data?.data?.items || res.data?.items || res.data?.data || []
  } finally {
    lessonLoading.value = false
  }
}

function handleProjectChange() {
  loadCurrentTabData()
}

function handleTabChange(tab: string | number) {
  loadCurrentTabData()
}

function loadCurrentTabData() {
  switch (activeTab.value) {
    case 'issues':
      loadIssues()
      break
    case 'eightD':
      loadEightDIssues()
      break
    case 'escalation':
      loadEscalatedIssues()
      break
    case 'lessons':
      loadLessons()
      break
  }
}

// ==================== Issue CRUD ====================
function openIssueDialog(row?: any) {
  if (row) {
    editingIssue.value = row
    Object.assign(issueForm, {
      title: row.title || '',
      projectId: row.projectId || row.project?.id || null,
      type: row.type || 'other',
      severity: row.severity || 'minor',
      priority: row.priority || 'medium',
      source: row.source || 'internal',
      description: row.description || '',
      assigneeName: row.assignee?.realName || row.assigneeName || '',
      dueDate: row.dueDate || '',
    })
  } else {
    editingIssue.value = null
    Object.assign(issueForm, {
      title: '',
      projectId: filterProjectId.value || null,
      type: 'other',
      severity: 'minor',
      priority: 'medium',
      source: 'internal',
      description: '',
      assigneeName: '',
      dueDate: '',
    })
  }
  showIssueDialog.value = true
}

async function saveIssue() {
  if (!issueForm.title || !issueForm.projectId) {
    ElMessage.warning('请填写标题和所属项目')
    return
  }
  submitting.value = true
  try {
    if (editingIssue.value) {
      await issueApi.issues.update(editingIssue.value.id, issueForm)
      ElMessage.success('问题更新成功')
    } else {
      await issueApi.issues.create(issueForm)
      ElMessage.success('问题创建成功')
    }
    showIssueDialog.value = false
    await loadIssues()
  } finally {
    submitting.value = false
  }
}

async function deleteIssue(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除问题「${row.title}」？`, '确认删除', { type: 'warning' })
    await issueApi.issues.delete(row.id)
    ElMessage.success('已删除')
    await loadIssues()
  } catch {
    /* cancelled or error */
  }
}

// ==================== 8D Actions ====================
async function openEightDDialog(row: any) {
  currentEightDIssue.value = row
  try {
    const res = await issueApi.issues.get(row.id)
    const detail = res.data?.data || res.data || {}
    Object.assign(eightDForm, {
      d1Team: detail.d1Team || '',
      d2Description: detail.d2Description || '',
      d3Containment: detail.d3Containment || '',
      d4RootCause: detail.d4RootCause || '',
      d5CorrectiveAction: detail.d5CorrectiveAction || '',
      d6Verification: detail.d6Verification || '',
      d7Prevention: detail.d7Prevention || '',
      d8Congratulate: detail.d8Congratulate || '',
    })
  } catch {
    Object.assign(eightDForm, {
      d1Team: '', d2Description: '', d3Containment: '', d4RootCause: '',
      d5CorrectiveAction: '', d6Verification: '', d7Prevention: '', d8Congratulate: '',
    })
  }
  currentEightDStep.value = row.currentStep || 'd1'
  showEightDDialog.value = true
}

async function saveEightD() {
  if (!currentEightDIssue.value) return
  submitting.value = true
  try {
    await issueApi.issues.update(currentEightDIssue.value.id, {
      ...eightDForm,
      currentStep: currentEightDStep.value,
    })
    ElMessage.success('8D信息保存成功')
    showEightDDialog.value = false
    await loadEightDIssues()
  } finally {
    submitting.value = false
  }
}

// ==================== Lesson CRUD ====================
function openLessonDialog(row?: any) {
  if (row) {
    editingLesson.value = row
    Object.assign(lessonForm, {
      title: row.title || '',
      projectId: row.projectId || row.project?.id || null,
      category: row.category || 'quality',
      type: row.type || 'lesson_learned',
      content: row.content || '',
      rootCause: row.rootCause || '',
      recommendation: row.recommendation || '',
    })
  } else {
    editingLesson.value = null
    Object.assign(lessonForm, {
      title: '',
      projectId: filterProjectId.value || null,
      category: 'quality',
      type: 'lesson_learned',
      content: '',
      rootCause: '',
      recommendation: '',
    })
  }
  showLessonDialog.value = true
}

async function saveLesson() {
  if (!lessonForm.title) {
    ElMessage.warning('请填写标题')
    return
  }
  submitting.value = true
  try {
    if (editingLesson.value) {
      await issueApi.lessons.update(editingLesson.value.id, lessonForm)
      ElMessage.success('经验教训更新成功')
    } else {
      await issueApi.lessons.create(lessonForm)
      ElMessage.success('经验教训创建成功')
    }
    showLessonDialog.value = false
    await loadLessons()
  } finally {
    submitting.value = false
  }
}

async function deleteLesson(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除经验教训「${row.title}」？`, '确认删除', { type: 'warning' })
    await issueApi.lessons.delete(row.id)
    ElMessage.success('已删除')
    await loadLessons()
  } catch {
    /* cancelled or error */
  }
}

// ==================== Lifecycle ====================
onMounted(() => {
  loadProjects()
  loadIssues()
})
</script>

<style scoped>
.issue-view { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.header-actions { display: flex; gap: 8px; }
.tab-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
</style>
