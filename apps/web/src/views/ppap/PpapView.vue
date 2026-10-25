<template>
  <div class="ppap-view">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>PPAP 提报管理</span>
          <el-button type="primary" @click="showCreateDialog">新建PPAP包</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="项目">
          <el-select v-model="filters.projectId" placeholder="全部项目" clearable>
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户">
          <el-select v-model="filters.customerId" placeholder="全部客户" clearable>
            <el-option v-for="c in customers" :key="c.id" :label="c.customerName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="审核中" value="in_review" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已批准" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchPackages">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="packages" v-loading="loading" border stripe>
        <el-table-column prop="packageCode" label="PPAP编号" width="160" />
        <el-table-column prop="partNumber" label="零件号" width="140" />
        <el-table-column prop="partName" label="零件名称" min-width="160" />
        <el-table-column prop="ppapLevel" label="等级" width="70" align="center" />
        <el-table-column prop="submissionType" label="提交类型" width="100">
          <template #default="{ row }">
            {{ { full: '完整提交', disclosure: '公开', sample: '样件' }[row.submissionType] || row.submissionType }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文件进度" width="120" align="center">
          <template #default="{ row }">
            {{ row._count?.items || 0 }} 项
          </template>
        </el-table-column>
        <el-table-column prop="customer" label="客户" width="120">
          <template #default="{ row }">{{ row.customer?.customerName }}</template>
        </el-table-column>
        <el-table-column prop="dueDate" label="截止日期" width="120">
          <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="initItems(row)" v-if="row.status === 'draft'">初始化文件</el-button>
            <el-button link type="danger" size="small" @click="deletePackage(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createDialogVisible" :title="editingPackage ? '编辑PPAP包' : '新建PPAP包'" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="所属项目" required>
          <el-select v-model="createForm.projectId" placeholder="选择项目">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="零件号" required>
          <el-input v-model="createForm.partNumber" />
        </el-form-item>
        <el-form-item label="零件名称" required>
          <el-input v-model="createForm.partName" />
        </el-form-item>
        <el-form-item label="PPAP等级" required>
          <el-select v-model="createForm.ppapLevel">
            <el-option v-for="i in 5" :key="i" :label="`Level ${i}`" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="提交类型" required>
          <el-select v-model="createForm.submissionType">
            <el-option label="完整提交" value="full" />
            <el-option label="公开" value="disclosure" />
            <el-option label="样件" value="sample" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户" required>
          <el-select v-model="createForm.customerId" placeholder="选择客户">
            <el-option v-for="c in customers" :key="c.id" :label="c.customerName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="createForm.dueDate" type="date" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remarks" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePackage" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="PPAP包详情" width="1000px" top="5vh">
      <template v-if="currentPackage">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="PPAP编号">{{ currentPackage.packageCode }}</el-descriptions-item>
          <el-descriptions-item label="零件号">{{ currentPackage.partNumber }}</el-descriptions-item>
          <el-descriptions-item label="零件名称">{{ currentPackage.partName }}</el-descriptions-item>
          <el-descriptions-item label="PPAP等级">Level {{ currentPackage.ppapLevel }}</el-descriptions-item>
          <el-descriptions-item label="提交类型">
            {{ { full: '完整提交', disclosure: '公开', sample: '样件' }[currentPackage.submissionType] || currentPackage.submissionType }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentPackage.status)" size="small">{{ statusLabel(currentPackage.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentPackage.customer?.customerName }}</el-descriptions-item>
          <el-descriptions-item label="项目">{{ currentPackage.project?.projectName }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ formatDate(currentPackage.dueDate) }}</el-descriptions-item>
        </el-descriptions>

        <el-tabs v-model="activeTab" style="margin-top: 20px">
          <el-tab-pane :label="`PPAP文件清单 (${(currentPackage.items || []).length})`" name="items">
            <el-table :data="currentPackage.items || []" border size="small">
              <el-table-column prop="itemNumber" label="序号" width="60" align="center" />
              <el-table-column prop="itemName" label="文件名称" width="180" />
              <el-table-column prop="required" label="必须" width="60" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.required" type="danger" size="small">必</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="itemStatusType(row.status)" size="small">{{ itemStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="completedBy" label="完成人" width="100">
                <template #default="{ row }">{{ row.completedBy?.realName || '-' }}</template>
              </el-table-column>
              <el-table-column prop="completedAt" label="完成时间" width="120">
                <template #default="{ row }">{{ formatDate(row.completedAt) }}</template>
              </el-table-column>
              <el-table-column prop="remarks" label="备注" />
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="updateItemStatus(row, 'complete')" v-if="row.status !== 'complete'">完成</el-button>
                  <el-button link type="primary" size="small" @click="updateItemStatus(row, 'in_progress')" v-if="row.status === 'pending'">开始</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane :label="`提报记录 (${(currentPackage.submissions || []).length})`" name="submissions">
            <el-button type="primary" size="small" @click="showSubmissionDialog" style="margin-bottom: 10px">新建提报</el-button>
            <el-table :data="currentPackage.submissions || []" border size="small">
              <el-table-column prop="submissionType" label="类型" width="100">
                <template #default="{ row }">
                  {{ { initial: '初始', resubmission: '重新提交', supplement: '补充' }[row.submissionType] || row.submissionType }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="submissionStatusType(row.status)" size="small">{{ submissionStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="pswStatus" label="PSW" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.pswStatus === 'signed' ? 'success' : 'info'" size="small">
                    {{ row.pswStatus === 'signed' ? '已签署' : row.pswStatus === 'pending' ? '待签署' : '不需要' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="reviewer" label="审核人" width="100">
                <template #default="{ row }">{{ row.reviewer?.realName || '-' }}</template>
              </el-table-column>
              <el-table-column prop="reviewComments" label="审核意见" />
              <el-table-column prop="submissionDate" label="提报日期" width="120">
                <template #default="{ row }">{{ formatDate(row.submissionDate) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="showReviewDialog(row)" v-if="row.status === 'submitted' || row.status === 'under_review'">审核</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>

        <div style="margin-top: 15px; text-align: right">
          <el-dropdown @command="handleStatusChange" style="margin-right: 10px">
            <el-button type="warning" size="small">变更状态</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="draft">草稿</el-dropdown-item>
                <el-dropdown-item command="in_review">审核中</el-dropdown-item>
                <el-dropdown-item command="submitted">已提交</el-dropdown-item>
                <el-dropdown-item command="approved">已批准</el-dropdown-item>
                <el-dropdown-item command="rejected">已拒绝</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="submissionDialogVisible" title="新建提报" width="500px">
      <el-form :model="submissionForm" label-width="80px">
        <el-form-item label="提交类型">
          <el-select v-model="submissionForm.submissionType">
            <el-option label="初始提交" value="initial" />
            <el-option label="重新提交" value="resubmission" />
            <el-option label="补充提交" value="supplement" />
          </el-select>
        </el-form-item>
        <el-form-item label="PSW状态">
          <el-select v-model="submissionForm.pswStatus">
            <el-option label="不需要" value="not_required" />
            <el-option label="待签署" value="pending" />
            <el-option label="已签署" value="signed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSubmission">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewDialogVisible" title="审核提报" width="500px">
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-select v-model="reviewForm.status">
            <el-option label="批准" value="approved" />
            <el-option label="拒绝" value="rejected" />
            <el-option label="有条件批准" value="conditional" />
          </el-select>
        </el-form-item>
        <el-form-item label="PSW签署">
          <el-select v-model="reviewForm.pswStatus">
            <el-option label="不签署" value="not_required" />
            <el-option label="签署" value="signed" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="reviewForm.reviewComments" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveReview">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ppapApi } from '@/api'

const loading = ref(false)
const saving = ref(false)
const packages = ref<any[]>([])
const projects = ref<any[]>([])
const customers = ref<any[]>([])
const filters = ref({ projectId: undefined as number | undefined, customerId: undefined as number | undefined, status: '' })

const createDialogVisible = ref(false)
const editingPackage = ref<any>(null)
const createForm = ref({ projectId: undefined as number | undefined, partNumber: '', partName: '', ppapLevel: 3, submissionType: 'full', customerId: undefined as number | undefined, dueDate: '', remarks: '' })

const detailDialogVisible = ref(false)
const currentPackage = ref<any>(null)
const activeTab = ref('items')

const submissionDialogVisible = ref(false)
const submissionForm = ref({ submissionType: 'initial', pswStatus: 'pending' })

const reviewDialogVisible = ref(false)
const reviewForm = ref({ id: 0, status: 'approved', pswStatus: 'not_required', reviewComments: '' })

onMounted(() => {
  fetchPackages()
  fetchProjects()
  fetchCustomers()
})

async function fetchPackages() {
  loading.value = true
  try {
    const res = await ppapApi.packages.list(filters.value)
    packages.value = res.data?.data || res.data || []
  } finally { loading.value = false }
}

async function fetchProjects() {
  try {
    const { default: request } = await import('@/api/request')
    const res = await request.get('/projects')
    projects.value = res.data?.data || res.data || []
  } catch {}
}

async function fetchCustomers() {
  try {
    const { default: request } = await import('@/api/request')
    const res = await request.get('/master-data/customers')
    customers.value = res.data?.data || res.data || []
  } catch {}
}

function showCreateDialog(pkg?: any) {
  editingPackage.value = pkg || null
  if (pkg) {
    createForm.value = { ...pkg }
  } else {
    createForm.value = { projectId: undefined, partNumber: '', partName: '', ppapLevel: 3, submissionType: 'full', customerId: undefined, dueDate: '', remarks: '' }
  }
  createDialogVisible.value = true
}

async function savePackage() {
  saving.value = true
  try {
    if (editingPackage.value) {
      await ppapApi.packages.update(editingPackage.value.id, createForm.value)
      ElMessage.success('更新成功')
    } else {
      await ppapApi.packages.create(createForm.value)
      ElMessage.success('创建成功')
    }
    createDialogVisible.value = false
    fetchPackages()
  } finally { saving.value = false }
}

async function deletePackage(row: any) {
  await ElMessageBox.confirm('确认删除该PPAP包？', '提示', { type: 'warning' })
  await ppapApi.packages.delete(row.id)
  ElMessage.success('删除成功')
  fetchPackages()
}

async function showDetail(row: any) {
  const res = await ppapApi.packages.get(row.id)
  currentPackage.value = res.data?.data || res.data
  activeTab.value = 'items'
  detailDialogVisible.value = true
}

async function initItems(row: any) {
  await ppapApi.items.initDefault(row.id)
  ElMessage.success('已初始化17项PPAP文件清单')
  fetchPackages()
}

async function handleStatusChange(status: string) {
  if (!currentPackage.value) return
  await ppapApi.packages.updateStatus(currentPackage.value.id, status)
  ElMessage.success('状态已更新')
  const res = await ppapApi.packages.get(currentPackage.value.id)
  currentPackage.value = res.data?.data || res.data
  fetchPackages()
}

async function updateItemStatus(item: any, status: string) {
  await ppapApi.items.update(item.id, { status })
  ElMessage.success('状态已更新')
  const res = await ppapApi.packages.get(currentPackage.value.id)
  currentPackage.value = res.data?.data || res.data
}

function showSubmissionDialog() {
  submissionForm.value = { submissionType: 'initial', pswStatus: 'pending' }
  submissionDialogVisible.value = true
}

async function saveSubmission() {
  if (!currentPackage.value) return
  await ppapApi.submissions.create(currentPackage.value.id, submissionForm.value)
  ElMessage.success('提报成功')
  submissionDialogVisible.value = false
  const res = await ppapApi.packages.get(currentPackage.value.id)
  currentPackage.value = res.data?.data || res.data
  fetchPackages()
}

function showReviewDialog(submission: any) {
  reviewForm.value = { id: submission.id, status: 'approved', pswStatus: 'not_required', reviewComments: '' }
  reviewDialogVisible.value = true
}

async function saveReview() {
  await ppapApi.submissions.review(reviewForm.value.id, reviewForm.value)
  ElMessage.success('审核完成')
  reviewDialogVisible.value = false
  const res = await ppapApi.packages.get(currentPackage.value.id)
  currentPackage.value = res.data?.data || res.data
  fetchPackages()
}

function statusLabel(status: string) {
  const map: Record<string, string> = { draft: '草稿', in_review: '审核中', submitted: '已提交', approved: '已批准', rejected: '已拒绝' }
  return map[status] || status
}

function statusTagType(status: string) {
  const map: Record<string, string> = { draft: 'info', in_review: 'warning', submitted: '', approved: 'success', rejected: 'danger' }
  return (map[status] || 'info') as any
}

function itemStatusLabel(status: string) {
  const map: Record<string, string> = { pending: '待处理', in_progress: '进行中', complete: '已完成', na: '不适用' }
  return map[status] || status
}

function itemStatusType(status: string) {
  const map: Record<string, string> = { pending: 'info', in_progress: 'warning', complete: 'success', na: '' }
  return (map[status] || 'info') as any
}

function submissionStatusLabel(status: string) {
  const map: Record<string, string> = { submitted: '已提交', under_review: '审核中', approved: '已批准', rejected: '已拒绝', conditional: '有条件' }
  return map[status] || status
}

function submissionStatusType(status: string) {
  const map: Record<string, string> = { submitted: '', under_review: 'warning', approved: 'success', rejected: 'danger', conditional: 'info' }
  return (map[status] || 'info') as any
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped lang="scss">
.ppap-view { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.filter-form { margin-bottom: 16px; }
</style>
