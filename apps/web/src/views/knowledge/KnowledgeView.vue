<template>
  <div class="knowledge-view">
    <div class="page-header">
      <h2>知识库</h2>
      <div class="header-actions">
        <el-select v-model="filterProjectId" placeholder="选择项目" clearable style="width: 240px" @change="loadAllData">
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card" @tab-change="onTabChange">
      <!-- ==================== FMEA对策库 ==================== -->
      <el-tab-pane label="FMEA对策库" name="fmea">
        <div class="tab-toolbar">
          <el-input v-model="fmeaFilter.keyword" placeholder="搜索标题/编号" clearable style="width: 220px" @clear="loadLessons" @keyup.enter="loadLessons" />
          <el-select v-model="fmeaFilter.category" placeholder="分类" clearable @change="loadLessons">
            <el-option v-for="(label, key) in KB_CATEGORY" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="fmeaFilter.applicablePhase" placeholder="适用阶段" clearable @change="loadLessons">
            <el-option v-for="(label, key) in APPLICABLE_PHASE" :key="key" :label="label" :value="key" />
          </el-select>
          <el-button type="primary" :icon="Plus" @click="openLessonDialog()">新增对策</el-button>
        </div>
        <el-table :data="lessons" stripe v-loading="loading">
          <el-table-column prop="lessonNo" label="编号" width="150" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="分类" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ KB_CATEGORY[row.category] || row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="适用阶段" width="160">
            <template #default="{ row }">{{ APPLICABLE_PHASE[row.applicablePhase] || row.applicablePhase || '-' }}</template>
          </el-table-column>
          <el-table-column label="所属项目" width="160">
            <template #default="{ row }">{{ row.project?.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column label="作者" width="100">
            <template #default="{ row }">{{ row.author?.realName || '-' }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="170">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openLessonDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="deleteLesson(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== 经验教训 ==================== -->
      <el-tab-pane label="经验教训" name="lessons">
        <div class="tab-toolbar">
          <el-input v-model="lessonFilter.keyword" placeholder="搜索标题/编号" clearable style="width: 220px" @clear="loadLessonsLearned" @keyup.enter="loadLessonsLearned" />
          <el-select v-model="lessonFilter.type" placeholder="类型" clearable @change="loadLessonsLearned">
            <el-option v-for="(label, key) in LESSON_TYPE" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="lessonFilter.category" placeholder="分类" clearable @change="loadLessonsLearned">
            <el-option v-for="(label, key) in LESSON_CATEGORY" :key="key" :label="label" :value="key" />
          </el-select>
          <el-button type="primary" :icon="Plus" @click="openLessonLearnedDialog()">新增经验教训</el-button>
        </div>
        <el-table :data="lessonsLearned" stripe v-loading="loading">
          <el-table-column prop="lessonNo" label="编号" width="150" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="类型" width="110">
            <template #default="{ row }">
              <el-tag :type="lessonTypeTag(row.type)" size="small">{{ LESSON_TYPE[row.type] || row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="分类" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ LESSON_CATEGORY[row.category] || row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="所属项目" width="160">
            <template #default="{ row }">{{ row.project?.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column label="内容" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ truncate(row.content, 60) }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="170">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openLessonLearnedDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="deleteLessonLearned(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== 模板库 ==================== -->
      <el-tab-pane label="模板库" name="templates">
        <div class="tab-toolbar">
          <el-input v-model="templateFilter.keyword" placeholder="搜索模板名称/编号" clearable style="width: 220px" @clear="loadTemplates" @keyup.enter="loadTemplates" />
          <el-select v-model="templateFilter.category" placeholder="分类" clearable @change="loadTemplates">
            <el-option v-for="(label, key) in TEMPLATE_CATEGORY" :key="key" :label="label" :value="key" />
          </el-select>
          <el-button type="primary" :icon="Plus" @click="openTemplateDialog()">新增模板</el-button>
        </div>
        <el-table :data="templates" stripe v-loading="loading">
          <el-table-column prop="templateNo" label="编号" width="150" />
          <el-table-column prop="templateName" label="模板名称" min-width="200" show-overflow-tooltip />
          <el-table-column label="分类" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ TEMPLATE_CATEGORY[row.category] || row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="version" label="版本" width="80" align="center" />
          <el-table-column label="所属项目" width="160">
            <template #default="{ row }">{{ row.project?.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="更新时间" width="170">
            <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openTemplateDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="deleteTemplate(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== Checklist库 ==================== -->
      <el-tab-pane label="Checklist库" name="checklists">
        <div class="tab-toolbar">
          <el-input v-model="checklistFilter.keyword" placeholder="搜索名称/编号" clearable style="width: 220px" @clear="loadChecklists" @keyup.enter="loadChecklists" />
          <el-select v-model="checklistFilter.category" placeholder="分类" clearable @change="loadChecklists">
            <el-option v-for="(label, key) in CHECKLIST_CATEGORY" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="checklistFilter.applicablePhase" placeholder="适用阶段" clearable @change="loadChecklists">
            <el-option v-for="(label, key) in APPLICABLE_PHASE" :key="key" :label="label" :value="key" />
          </el-select>
          <el-button type="primary" :icon="Plus" @click="openChecklistDialog()">新增Checklist</el-button>
        </div>
        <el-table :data="checklists" stripe v-loading="loading">
          <el-table-column prop="checklistNo" label="编号" width="150" />
          <el-table-column prop="checklistName" label="名称" min-width="200" show-overflow-tooltip />
          <el-table-column label="分类" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ CHECKLIST_CATEGORY[row.category] || row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="适用阶段" width="160">
            <template #default="{ row }">{{ APPLICABLE_PHASE[row.applicablePhase] || row.applicablePhase || '-' }}</template>
          </el-table-column>
          <el-table-column label="所属项目" width="160">
            <template #default="{ row }">{{ row.project?.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="itemCount" label="检查项数" width="90" align="center" />
          <el-table-column label="更新时间" width="170">
            <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openChecklistDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="deleteChecklist(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== FMEA对策 / 经验教训 Dialog ==================== -->
    <el-dialog v-model="showLessonDialog" :title="lessonForm.id ? '编辑' : (isLessonLearnedMode ? '新增经验教训' : '新增FMEA对策')" width="700px" top="5vh" destroy-on-close>
      <el-form :model="lessonForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="lessonForm.title" />
        </el-form-item>
        <el-form-item label="所属项目" required>
          <el-select v-model="lessonForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16" v-if="isLessonLearnedMode">
          <el-col :span="12">
            <el-form-item label="类型">
              <el-select v-model="lessonForm.type" style="width: 100%">
                <el-option v-for="(label, key) in LESSON_TYPE" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="lessonForm.category" style="width: 100%">
                <el-option v-for="(label, key) in LESSON_CATEGORY" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" v-if="!isLessonLearnedMode">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="lessonForm.category" style="width: 100%">
                <el-option v-for="(label, key) in KB_CATEGORY" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用阶段">
              <el-select v-model="lessonForm.applicablePhase" style="width: 100%">
                <el-option v-for="(label, key) in APPLICABLE_PHASE" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="内容">
          <el-input v-model="lessonForm.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="根因分析">
          <el-input v-model="lessonForm.rootCause" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="建议措施">
          <el-input v-model="lessonForm.recommendation" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLessonDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveLesson">保存</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 模板 Dialog ==================== -->
    <el-dialog v-model="showTemplateDialog" :title="templateForm.id ? '编辑模板' : '新增模板'" width="640px" destroy-on-close>
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="templateForm.templateName" />
        </el-form-item>
        <el-form-item label="所属项目" required>
          <el-select v-model="templateForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="templateForm.category" style="width: 100%">
                <el-option v-for="(label, key) in TEMPLATE_CATEGORY" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版本">
              <el-input v-model="templateForm.version" placeholder="如 1.0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="templateForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="文件URL">
          <el-input v-model="templateForm.fileUrl" placeholder="https://..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTemplateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <!-- ==================== Checklist Dialog ==================== -->
    <el-dialog v-model="showChecklistDialog" :title="checklistForm.id ? '编辑Checklist' : '新增Checklist'" width="700px" top="5vh" destroy-on-close>
      <el-form :model="checklistForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="checklistForm.checklistName" />
        </el-form-item>
        <el-form-item label="所属项目" required>
          <el-select v-model="checklistForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="checklistForm.category" style="width: 100%">
                <el-option v-for="(label, key) in CHECKLIST_CATEGORY" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用阶段">
              <el-select v-model="checklistForm.applicablePhase" style="width: 100%">
                <el-option v-for="(label, key) in APPLICABLE_PHASE" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="checklistForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="检查项">
          <el-input v-model="checklistForm.itemsRaw" type="textarea" :rows="6" placeholder="每行一个检查项，或使用JSON数组格式" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChecklistDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveChecklist">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { knowledgeApi, projectApi } from '@/api'
import {
  KB_CATEGORY,
  TEMPLATE_CATEGORY,
  CHECKLIST_CATEGORY,
  APPLICABLE_PHASE,
  LESSON_TYPE,
  LESSON_CATEGORY,
} from '@apqp/shared'

// ==================== Common State ====================
const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('fmea')
const filterProjectId = ref<number | undefined>()
const projects = ref<any[]>([])

// ==================== FMEA对策库 ====================
const lessons = ref<any[]>([])
const fmeaFilter = reactive({ keyword: '', category: '', applicablePhase: '' })

// ==================== 经验教训 ====================
const lessonsLearned = ref<any[]>([])
const lessonFilter = reactive({ keyword: '', type: '', category: '' })

// ==================== 模板库 ====================
const templates = ref<any[]>([])
const templateFilter = reactive({ keyword: '', category: '' })

// ==================== Checklist库 ====================
const checklists = ref<any[]>([])
const checklistFilter = reactive({ keyword: '', category: '', applicablePhase: '' })

// ==================== Lesson / FMEA Dialog ====================
const showLessonDialog = ref(false)
const isLessonLearnedMode = ref(false)
const lessonForm = reactive<any>({
  id: null,
  title: '',
  projectId: null,
  category: '',
  applicablePhase: '',
  type: '',
  content: '',
  rootCause: '',
  recommendation: '',
})

// ==================== Template Dialog ====================
const showTemplateDialog = ref(false)
const templateForm = reactive<any>({
  id: null,
  templateName: '',
  projectId: null,
  category: '',
  version: '',
  description: '',
  fileUrl: '',
})

// ==================== Checklist Dialog ====================
const showChecklistDialog = ref(false)
const checklistForm = reactive<any>({
  id: null,
  checklistName: '',
  projectId: null,
  category: '',
  applicablePhase: '',
  description: '',
  itemsRaw: '',
})

// ==================== Lifecycle ====================
onMounted(async () => {
  await loadProjects()
  loadAllData()
})

function onTabChange(tab: string) {
  if (tab === 'fmea') loadLessons()
  else if (tab === 'lessons') loadLessonsLearned()
  else if (tab === 'templates') loadTemplates()
  else if (tab === 'checklists') loadChecklists()
}

// ==================== Data Loading ====================
async function loadProjects() {
  try {
    const res = await projectApi.list({ pageSize: 999 })
    projects.value = res.data?.items || res.data || []
  } catch {
    projects.value = []
  }
}

function loadAllData() {
  if (activeTab.value === 'fmea') loadLessons()
  else if (activeTab.value === 'lessons') loadLessonsLearned()
  else if (activeTab.value === 'templates') loadTemplates()
  else if (activeTab.value === 'checklists') loadChecklists()
}

async function loadLessons() {
  loading.value = true
  try {
    const params: any = { pageSize: 999 }
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (fmeaFilter.keyword) params.keyword = fmeaFilter.keyword
    if (fmeaFilter.category) params.category = fmeaFilter.category
    if (fmeaFilter.applicablePhase) params.applicablePhase = fmeaFilter.applicablePhase
    // FMEA对策库 uses scope=fmea to differentiate from lessons learned
    params.scope = 'fmea'
    const res = await knowledgeApi.lessons.list(params)
    lessons.value = res.data?.items || res.data || []
  } catch {
    lessons.value = []
  } finally {
    loading.value = false
  }
}

async function loadLessonsLearned() {
  loading.value = true
  try {
    const params: any = { pageSize: 999 }
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (lessonFilter.keyword) params.keyword = lessonFilter.keyword
    if (lessonFilter.type) params.type = lessonFilter.type
    if (lessonFilter.category) params.category = lessonFilter.category
    // Lessons learned uses scope=lessons to differentiate from FMEA countermeasures
    params.scope = 'lessons'
    const res = await knowledgeApi.lessons.list(params)
    lessonsLearned.value = res.data?.items || res.data || []
  } catch {
    lessonsLearned.value = []
  } finally {
    loading.value = false
  }
}

async function loadTemplates() {
  loading.value = true
  try {
    const params: any = { pageSize: 999 }
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (templateFilter.keyword) params.keyword = templateFilter.keyword
    if (templateFilter.category) params.category = templateFilter.category
    const res = await knowledgeApi.templates.list(params)
    templates.value = res.data?.items || res.data || []
  } catch {
    templates.value = []
  } finally {
    loading.value = false
  }
}

async function loadChecklists() {
  loading.value = true
  try {
    const params: any = { pageSize: 999 }
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (checklistFilter.keyword) params.keyword = checklistFilter.keyword
    if (checklistFilter.category) params.category = checklistFilter.category
    if (checklistFilter.applicablePhase) params.applicablePhase = checklistFilter.applicablePhase
    const res = await knowledgeApi.checklists.list(params)
    checklists.value = res.data?.items || res.data || []
  } catch {
    checklists.value = []
  } finally {
    loading.value = false
  }
}

// ==================== Lesson CRUD (FMEA + Lessons Learned share same API) ====================
function resetLessonForm() {
  lessonForm.id = null
  lessonForm.title = ''
  lessonForm.projectId = filterProjectId.value || null
  lessonForm.category = ''
  lessonForm.applicablePhase = ''
  lessonForm.type = ''
  lessonForm.content = ''
  lessonForm.rootCause = ''
  lessonForm.recommendation = ''
}

function openLessonDialog(row?: any) {
  resetLessonForm()
  isLessonLearnedMode.value = false
  if (row) {
    Object.assign(lessonForm, {
      id: row.id,
      title: row.title,
      projectId: row.projectId,
      category: row.category || '',
      applicablePhase: row.applicablePhase || '',
      type: row.type || '',
      content: row.content || '',
      rootCause: row.rootCause || '',
      recommendation: row.recommendation || '',
    })
  }
  showLessonDialog.value = true
}

function openLessonLearnedDialog(row?: any) {
  resetLessonForm()
  isLessonLearnedMode.value = true
  if (row) {
    Object.assign(lessonForm, {
      id: row.id,
      title: row.title,
      projectId: row.projectId,
      category: row.category || '',
      applicablePhase: row.applicablePhase || '',
      type: row.type || '',
      content: row.content || '',
      rootCause: row.rootCause || '',
      recommendation: row.recommendation || '',
    })
  }
  showLessonDialog.value = true
}

async function saveLesson() {
  if (!lessonForm.title) return ElMessage.warning('请输入标题')
  if (!lessonForm.projectId) return ElMessage.warning('请选择项目')
  submitting.value = true
  try {
    const data: any = {
      title: lessonForm.title,
      projectId: lessonForm.projectId,
      category: lessonForm.category || undefined,
      applicablePhase: lessonForm.applicablePhase || undefined,
      type: lessonForm.type || undefined,
      content: lessonForm.content || undefined,
      rootCause: lessonForm.rootCause || undefined,
      recommendation: lessonForm.recommendation || undefined,
    }
    if (lessonForm.id) {
      await knowledgeApi.lessons.update(lessonForm.id, data)
      ElMessage.success('更新成功')
    } else {
      await knowledgeApi.lessons.create(data)
      ElMessage.success('创建成功')
    }
    showLessonDialog.value = false
    if (isLessonLearnedMode.value) loadLessonsLearned()
    else loadLessons()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function deleteLesson(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除对策「${row.title}」？`, '提示', { type: 'warning' })
    await knowledgeApi.lessons.delete(row.id)
    ElMessage.success('删除成功')
    loadLessons()
  } catch { /* cancelled */ }
}

async function deleteLessonLearned(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除经验教训「${row.title}」？`, '提示', { type: 'warning' })
    await knowledgeApi.lessons.delete(row.id)
    ElMessage.success('删除成功')
    loadLessonsLearned()
  } catch { /* cancelled */ }
}

// ==================== Template CRUD ====================
function resetTemplateForm() {
  templateForm.id = null
  templateForm.templateName = ''
  templateForm.projectId = filterProjectId.value || null
  templateForm.category = ''
  templateForm.version = ''
  templateForm.description = ''
  templateForm.fileUrl = ''
}

function openTemplateDialog(row?: any) {
  resetTemplateForm()
  if (row) {
    Object.assign(templateForm, {
      id: row.id,
      templateName: row.templateName,
      projectId: row.projectId,
      category: row.category || '',
      version: row.version || '',
      description: row.description || '',
      fileUrl: row.fileUrl || '',
    })
  }
  showTemplateDialog.value = true
}

async function saveTemplate() {
  if (!templateForm.templateName) return ElMessage.warning('请输入模板名称')
  if (!templateForm.projectId) return ElMessage.warning('请选择项目')
  submitting.value = true
  try {
    const data: any = {
      templateName: templateForm.templateName,
      projectId: templateForm.projectId,
      category: templateForm.category || undefined,
      version: templateForm.version || undefined,
      description: templateForm.description || undefined,
      fileUrl: templateForm.fileUrl || undefined,
    }
    if (templateForm.id) {
      await knowledgeApi.templates.update(templateForm.id, data)
      ElMessage.success('更新成功')
    } else {
      await knowledgeApi.templates.create(data)
      ElMessage.success('创建成功')
    }
    showTemplateDialog.value = false
    loadTemplates()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function deleteTemplate(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除模板「${row.templateName}」？`, '提示', { type: 'warning' })
    await knowledgeApi.templates.delete(row.id)
    ElMessage.success('删除成功')
    loadTemplates()
  } catch { /* cancelled */ }
}

// ==================== Checklist CRUD ====================
function resetChecklistForm() {
  checklistForm.id = null
  checklistForm.checklistName = ''
  checklistForm.projectId = filterProjectId.value || null
  checklistForm.category = ''
  checklistForm.applicablePhase = ''
  checklistForm.description = ''
  checklistForm.itemsRaw = ''
}

function openChecklistDialog(row?: any) {
  resetChecklistForm()
  if (row) {
    let itemsRaw = ''
    if (Array.isArray(row.items)) {
      itemsRaw = row.items.map((item: any) => item.name || item.title || item).join('\n')
    } else if (typeof row.items === 'string') {
      itemsRaw = row.items
    }
    Object.assign(checklistForm, {
      id: row.id,
      checklistName: row.checklistName,
      projectId: row.projectId,
      category: row.category || '',
      applicablePhase: row.applicablePhase || '',
      description: row.description || '',
      itemsRaw,
    })
  }
  showChecklistDialog.value = true
}

function parseItems(raw: string): any[] {
  if (!raw.trim()) return []
  // Try JSON first
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch { /* not JSON */ }
  // Fall back to line-separated
  return raw.split('\n').map(line => line.trim()).filter(Boolean).map(name => ({ name }))
}

async function saveChecklist() {
  if (!checklistForm.checklistName) return ElMessage.warning('请输入Checklist名称')
  if (!checklistForm.projectId) return ElMessage.warning('请选择项目')
  submitting.value = true
  try {
    const data: any = {
      checklistName: checklistForm.checklistName,
      projectId: checklistForm.projectId,
      category: checklistForm.category || undefined,
      applicablePhase: checklistForm.applicablePhase || undefined,
      description: checklistForm.description || undefined,
      items: parseItems(checklistForm.itemsRaw),
    }
    if (checklistForm.id) {
      await knowledgeApi.checklists.update(checklistForm.id, data)
      ElMessage.success('更新成功')
    } else {
      await knowledgeApi.checklists.create(data)
      ElMessage.success('创建成功')
    }
    showChecklistDialog.value = false
    loadChecklists()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function deleteChecklist(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除Checklist「${row.checklistName}」？`, '提示', { type: 'warning' })
    await knowledgeApi.checklists.delete(row.id)
    ElMessage.success('删除成功')
    loadChecklists()
  } catch { /* cancelled */ }
}

// ==================== Helpers ====================
function formatDate(val: string | Date | null) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d.getTime())) return String(val)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function truncate(str: string | null, maxLen: number) {
  if (!str) return '-'
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str
}

function lessonTypeTag(type: string) {
  const map: Record<string, string> = { lesson_learned: '', best_practice: 'success', pitfall: 'danger' }
  return (map[type] || '') as any
}
</script>

<style scoped>
.knowledge-view {
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
}
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.tab-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}
</style>
