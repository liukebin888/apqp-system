<template>
  <div class="page-container">
    <div class="page-header">
      <h2>文档管理</h2>
      <el-button type="primary" @click="showCreateDialog">新建文档</el-button>
    </div>

    <el-form :inline="true" :model="filters" class="filter-form">
      <el-form-item label="项目">
        <el-select v-model="filters.projectId" placeholder="选择项目" clearable>
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="文档类型">
        <el-select v-model="filters.docType" placeholder="选择类型" clearable>
          <el-option label="APQP文档" value="APQP" />
          <el-option label="PPAP文档" value="PPAP" />
          <el-option label="控制计划" value="CONTROL_PLAN" />
          <el-option label="FMEA" value="FMEA" />
          <el-option label="作业指导书" value="WI" />
          <el-option label="检验规范" value="INSPECTION" />
          <el-option label="其他" value="OTHER" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" placeholder="选择状态" clearable>
          <el-option label="草稿" value="DRAFT" />
          <el-option label="审核中" value="PENDING" />
          <el-option label="已批准" value="APPROVED" />
          <el-option label="已发布" value="RELEASED" />
          <el-option label="已废弃" value="OBSOLETE" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="tableData" v-loading="loading" border stripe>
      <el-table-column prop="docCode" label="文档编号" width="140" />
      <el-table-column prop="docName" label="文档名称" min-width="200" />
      <el-table-column label="文档类型" width="120">
        <template #default="{ row }">{{ docTypeMap[row.docType] || row.docType }}</template>
      </el-table-column>
      <el-table-column label="版本" width="80">
        <template #default="{ row }">V{{ row.revision }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fileFormat" label="格式" width="80" />
      <el-table-column label="大小" width="100">
        <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" width="170">
        <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showDetail(row.id)">详情</el-button>
          <el-button type="warning" link size="small" @click="showUploadDialog(row.id)" v-if="row.status === 'DRAFT'">上传</el-button>
          <el-button type="success" link size="small" @click="approveDoc(row.id)" v-if="row.status === 'PENDING'">批准</el-button>
          <el-button type="success" link size="small" @click="releaseDoc(row.id)" v-if="row.status === 'APPROVED'">发布</el-button>
          <el-button type="info" link size="small" @click="showEditDialog(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="deleteDoc(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="loadData"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="文档编号" prop="docCode">
          <el-input v-model="formData.docCode" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="文档名称" prop="docName">
          <el-input v-model="formData.docName" />
        </el-form-item>
        <el-form-item label="文档类型" prop="docType">
          <el-select v-model="formData.docType" placeholder="选择类型">
            <el-option label="APQP文档" value="APQP" />
            <el-option label="PPAP文档" value="PPAP" />
            <el-option label="控制计划" value="CONTROL_PLAN" />
            <el-option label="FMEA" value="FMEA" />
            <el-option label="作业指导书" value="WI" />
            <el-option label="检验规范" value="INSPECTION" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属项目" prop="projectId">
          <el-select v-model="formData.projectId" placeholder="选择项目">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="500px">
      <el-upload
        ref="uploadRef"
        drag
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-exceed="handleExceed"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 PDF、Word、Excel、图片等格式</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="文档详情" width="700px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="文档编号">{{ detailData.docCode }}</el-descriptions-item>
        <el-descriptions-item label="文档名称">{{ detailData.docName }}</el-descriptions-item>
        <el-descriptions-item label="文档类型">{{ docTypeMap[detailData.docType] || detailData.docType }}</el-descriptions-item>
        <el-descriptions-item label="版本">V{{ detailData.revision }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(detailData.status)" size="small">{{ statusMap[detailData.status] || detailData.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="文件格式">{{ detailData.fileFormat || '-' }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ formatFileSize(detailData.fileSize) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(detailData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detailData.description || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>版本历史</el-divider>
      <el-timeline v-if="detailData?.versionHistory?.length">
        <el-timeline-item
          v-for="version in detailData.versionHistory"
          :key="version.id"
          :timestamp="formatDate(version.createdAt)"
          :type="version.revision === detailData.revision ? 'primary' : ''"
        >
          <strong>V{{ version.revision }}</strong> - {{ version.fileFormat }} ({{ formatFileSize(version.fileSize) }})
          <div v-if="version.changeDescription" style="color: #909399; font-size: 13px;">{{ version.changeDescription }}</div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无版本历史" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { documentApi, projectApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref<any[]>([])
const projects = ref<any[]>([])
const detailData = ref<any>(null)

const filters = reactive({
  projectId: undefined as number | undefined,
  docType: '',
  status: '',
})

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const dialogVisible = ref(false)
const dialogTitle = ref('新建文档')
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref()
const formData = reactive({
  docCode: '',
  docName: '',
  docType: '',
  projectId: undefined as number | undefined,
  description: '',
})

const formRules = {
  docCode: [{ required: true, message: '请输入文档编号', trigger: 'blur' }],
  docName: [{ required: true, message: '请输入文档名称', trigger: 'blur' }],
  docType: [{ required: true, message: '请选择文档类型', trigger: 'change' }],
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
}

const uploadDialogVisible = ref(false)
const uploadDocId = ref<number | null>(null)
const uploadFile = ref<File | null>(null)
const uploading = ref(false)
const uploadRef = ref()

const detailDialogVisible = ref(false)

const docTypeMap: Record<string, string> = {
  APQP: 'APQP文档',
  PPAP: 'PPAP文档',
  CONTROL_PLAN: '控制计划',
  FMEA: 'FMEA',
  WI: '作业指导书',
  INSPECTION: '检验规范',
  OTHER: '其他',
}

const statusMap: Record<string, string> = {
  DRAFT: '草稿',
  PENDING: '审核中',
  APPROVED: '已批准',
  RELEASED: '已发布',
  OBSOLETE: '已废弃',
}

function statusType(s: string) {
  return { DRAFT: 'info', PENDING: 'warning', APPROVED: 'success', RELEASED: 'success', OBSOLETE: 'danger' }[s] || 'info'
}

function formatDate(d: string) {
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

function formatFileSize(bytes: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

onMounted(async () => {
  await loadProjects()
  loadData()
})

async function loadProjects() {
  try {
    const res: any = await projectApi.list({ pageSize: 100 })
    projects.value = res?.list || []
  } catch (e) {}
}

async function loadData() {
  loading.value = true
  try {
    const res: any = await documentApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters,
    })
    tableData.value = res?.list || []
    pagination.total = res?.total || 0
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.projectId = undefined
  filters.docType = ''
  filters.status = ''
  loadData()
}

function showCreateDialog() {
  dialogTitle.value = '新建文档'
  editingId.value = null
  formData.docCode = ''
  formData.docName = ''
  formData.docType = ''
  formData.projectId = undefined
  formData.description = ''
  dialogVisible.value = true
}

function showEditDialog(row: any) {
  dialogTitle.value = '编辑文档'
  editingId.value = row.id
  formData.docCode = row.docCode
  formData.docName = row.docName
  formData.docType = row.docType
  formData.projectId = row.projectId
  formData.description = row.description || ''
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (editingId.value) {
      await documentApi.update(editingId.value, {
        docName: formData.docName,
        docType: formData.docType,
        projectId: formData.projectId,
        description: formData.description,
      })
      ElMessage.success('更新成功')
    } else {
      await documentApi.create(formData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function deleteDoc(id: number) {
  await ElMessageBox.confirm('确定删除该文档吗？', '提示', { type: 'warning' })
  await documentApi.delete(id)
  ElMessage.success('删除成功')
  loadData()
}

function showUploadDialog(id: number) {
  uploadDocId.value = id
  uploadFile.value = null
  uploadDialogVisible.value = true
}

function handleFileChange(file: any) {
  uploadFile.value = file.raw
}

function handleExceed() {
  ElMessage.warning('只能上传一个文件')
}

async function submitUpload() {
  if (!uploadFile.value || !uploadDocId.value) return
  uploading.value = true
  try {
    await documentApi.upload(uploadDocId.value, uploadFile.value)
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    loadData()
  } finally {
    uploading.value = false
  }
}

async function approveDoc(id: number) {
  await ElMessageBox.confirm('确定批准该文档吗？', '提示', { type: 'info' })
  await documentApi.approve(id)
  ElMessage.success('批准成功')
  loadData()
}

async function releaseDoc(id: number) {
  await ElMessageBox.confirm('确定发布该文档吗？', '提示', { type: 'info' })
  await documentApi.release(id)
  ElMessage.success('发布成功')
  loadData()
}

async function showDetail(id: number) {
  const res: any = await documentApi.get(id)
  detailData.value = res
  detailDialogVisible.value = true
}
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-form {
  margin-bottom: 20px;
}
</style>
