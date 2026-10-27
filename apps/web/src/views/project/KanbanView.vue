<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>项目看板</h2>
      <div>
        <el-select
          v-model="selectedProjectId"
          placeholder="选择项目"
          clearable
          filterable
          style="width: 240px; margin-right: 12px"
          @change="loadKanbanItems"
        >
          <el-option
            v-for="p in projects"
            :key="p.id"
            :label="p.projectName"
            :value="p.id"
          />
        </el-select>
        <el-button type="primary" @click="openCreateDialog">新建看板项</el-button>
      </div>
    </div>

    <div class="kanban-board">
      <div
        v-for="col in columns"
        :key="col.key"
        class="kanban-column"
      >
        <div class="kanban-column-header">
          <span class="kanban-column-title">{{ col.label }}</span>
          <el-tag size="small" round>{{ getColumnItems(col.key).length }}</el-tag>
        </div>
        <div class="kanban-column-body">
          <el-card
            v-for="item in getColumnItems(col.key)"
            :key="item.id"
            class="kanban-card"
            shadow="hover"
            @click="viewItem(item)"
          >
            <div class="card-title">{{ item.title }}</div>
            <div class="card-meta">
              <el-tag
                :type="priorityType(item.priority)"
                size="small"
                effect="plain"
              >
                {{ priorityLabel(item.priority) }}
              </el-tag>
              <span v-if="item.assignee" class="card-assignee">
                {{ item.assignee?.realName || item.assigneeName || '-' }}
              </span>
            </div>
            <div v-if="item.dueDate" class="card-due-date">
              <el-icon size="12"><Calendar /></el-icon>
              <span :class="{ 'overdue': isOverdue(item.dueDate, col.key) }">
                {{ formatDate(item.dueDate) }}
              </span>
            </div>
          </el-card>
          <el-empty
            v-if="!getColumnItems(col.key).length"
            description="暂无事项"
            :image-size="40"
          />
        </div>
      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <el-dialog v-model="showDialog" :title="editingItem ? '编辑看板项' : '新建看板项'" width="560px">
      <el-form :model="form" label-width="90px" :rules="formRules" ref="formRef">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="所属项目" prop="projectId">
          <el-select v-model="form.projectId" placeholder="选择项目" filterable style="width: 100%">
            <el-option
              v-for="p in projects"
              :key="p.id"
              :label="p.projectName"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" style="width: 100%">
            <el-option
              v-for="col in columns"
              :key="col.key"
              :label="col.label"
              :value="col.key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="form.priority" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="form.assigneeId" filterable clearable placeholder="选择负责人" style="width: 100%">
            <el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="form.dueDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ editingItem ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="showDetailDialog" title="看板项详情" width="600px">
      <div v-if="selectedItem">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题" :span="2">{{ selectedItem.title }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(selectedItem.status)">{{ statusLabel(selectedItem.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="priorityType(selectedItem.priority)" effect="plain">{{ priorityLabel(selectedItem.priority) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedItem.assignee?.realName || selectedItem.assigneeName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">
            <span :class="{ 'overdue': isOverdue(selectedItem.dueDate, selectedItem.status) }">
              {{ formatDate(selectedItem.dueDate) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="所属项目">{{ selectedItem.project?.projectName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedItem.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedItem.description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px; display: flex; gap: 8px;">
          <el-button type="primary" @click="editFromDetail">编辑</el-button>
          <el-button type="danger" @click="deleteItem(selectedItem.id)">删除</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { projectReportApi, projectApi, userApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Calendar } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

// ==================== Types ====================
interface KanbanColumn {
  key: string
  label: string
}

interface KanbanItem {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  assigneeId?: number | null
  assignee?: { realName: string } | null
  assigneeName?: string
  projectId?: number | null
  project?: { projectName: string } | null
  dueDate?: string | null
  createdAt?: string
}

// ==================== State ====================
const loading = ref(false)
const submitting = ref(false)
const projects = ref<any[]>([])
const users = ref<any[]>([])
const kanbanItems = ref<KanbanItem[]>([])
const selectedProjectId = ref<number | undefined>(undefined)
const showDialog = ref(false)
const showDetailDialog = ref(false)
const editingItem = ref<KanbanItem | null>(null)
const selectedItem = ref<KanbanItem | null>(null)
const formRef = ref<FormInstance>()

const columns: KanbanColumn[] = [
  { key: 'pending', label: '待处理' },
  { key: 'in_progress', label: '进行中' },
  { key: 'verification', label: '待验证' },
  { key: 'completed', label: '已完成' },
]

const defaultForm = {
  title: '',
  projectId: undefined as number | undefined,
  status: 'pending',
  priority: 'medium',
  assigneeId: null as number | null,
  dueDate: '',
  description: '',
}

const form = reactive({ ...defaultForm })

const formRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
}

// ==================== Helpers ====================
const priorityMap: Record<string, { label: string; type: string }> = {
  low: { label: '低', type: 'info' },
  medium: { label: '中', type: '' },
  high: { label: '高', type: 'warning' },
  urgent: { label: '紧急', type: 'danger' },
}

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待处理', type: 'info' },
  in_progress: { label: '进行中', type: '' },
  verification: { label: '待验证', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
}

function priorityLabel(p: string) { return priorityMap[p]?.label || p }
function priorityType(p: string) { return priorityMap[p]?.type || 'info' }
function statusLabel(s: string) { return statusMap[s]?.label || s }
function statusTagType(s: string) { return statusMap[s]?.type || 'info' }
function formatDate(d: string | null | undefined) { return d ? dayjs(d).format('YYYY-MM-DD') : '-' }

function isOverdue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || status === 'completed') return false
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

function getColumnItems(statusKey: string): KanbanItem[] {
  return kanbanItems.value.filter((item) => item.status === statusKey)
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

async function loadUsers() {
  try {
    const res: any = await userApi.list({ page: 1, pageSize: 100 })
    users.value = res.data?.data?.items || res.data?.items || res.data?.data || res || []
  } catch (e) {
    console.error('Failed to load users', e)
  }
}

async function loadKanbanItems() {
  loading.value = true
  try {
    const params: any = {}
    if (selectedProjectId.value) {
      params.projectId = selectedProjectId.value
    }
    const res: any = await projectReportApi.kanban.list(params)
    kanbanItems.value = res.data?.data?.items || res.data?.items || res.data?.data || res || []
  } catch (e) {
    console.error('Failed to load kanban items', e)
  } finally {
    loading.value = false
  }
}

// ==================== CRUD ====================
function openCreateDialog() {
  editingItem.value = null
  Object.assign(form, {
    ...defaultForm,
    projectId: selectedProjectId.value ?? undefined,
  })
  showDialog.value = true
}

function viewItem(item: KanbanItem) {
  selectedItem.value = item
  showDetailDialog.value = true
}

function editFromDetail() {
  if (!selectedItem.value) return
  editingItem.value = selectedItem.value
  Object.assign(form, {
    title: selectedItem.value.title,
    projectId: selectedItem.value.projectId ?? undefined,
    status: selectedItem.value.status,
    priority: selectedItem.value.priority,
    assigneeId: selectedItem.value.assigneeId ?? null,
    dueDate: selectedItem.value.dueDate || '',
    description: selectedItem.value.description || '',
  })
  showDetailDialog.value = false
  showDialog.value = true
}

async function submitForm() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload = { ...form }
    if (editingItem.value) {
      await projectReportApi.kanban.update(editingItem.value.id, payload)
      ElMessage.success('更新成功')
    } else {
      await projectReportApi.kanban.create(payload)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    await loadKanbanItems()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function deleteItem(id: number) {
  try {
    await ElMessageBox.confirm('确定删除此看板项？', '提示', { type: 'warning' })
    await projectReportApi.kanban.delete(id)
    ElMessage.success('删除成功')
    showDetailDialog.value = false
    await loadKanbanItems()
  } catch {
    // cancelled or error
  }
}

// ==================== Lifecycle ====================
onMounted(async () => {
  await Promise.all([loadProjects(), loadUsers()])
  await loadKanbanItems()
})
</script>

<style scoped>
.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
  min-height: calc(100vh - 200px);
}

.kanban-column {
  min-width: 280px;
  max-width: 320px;
  flex: 1;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.kanban-column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.kanban-column-title {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.kanban-column-body {
  flex: 1;
  overflow-y: auto;
}

.kanban-card {
  margin-bottom: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.kanban-card :deep(.el-card__body) {
  padding: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.4;
  word-break: break-word;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.card-assignee {
  font-size: 12px;
  color: #606266;
}

.card-due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.card-due-date .overdue {
  color: #f56c6c;
  font-weight: 500;
}

.overdue {
  color: #f56c6c;
  font-weight: 500;
}
</style>
