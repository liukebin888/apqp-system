<template>
  <div class="gate-review-view">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>Gate 评审管理</span>
          <el-button type="primary" @click="showCreateDialog">新建评审</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="Gate类型">
          <el-select v-model="filters.gateType" placeholder="全部" clearable>
            <el-option v-for="g in gateTypes" :key="g.value" :label="g.label" :value="g.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable>
            <el-option label="已计划" value="planned" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="通过" value="passed" />
            <el-option label="未通过" value="failed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="reviewList" v-loading="loading" stripe>
        <el-table-column prop="gateType" label="Gate" width="80" />
        <el-table-column prop="gateName" label="评审名称" width="150" />
        <el-table-column label="项目" width="180">
          <template #default="{ row }">{{ row.project?.projectName }}</template>
        </el-table-column>
        <el-table-column label="计划日期" width="120">
          <template #default="{ row }">{{ formatDate(row.plannedDate) }}</template>
        </el-table-column>
        <el-table-column label="实际日期" width="120">
          <template #default="{ row }">{{ formatDate(row.actualDate) }}</template>
        </el-table-column>
        <el-table-column label="主持人" width="100">
          <template #default="{ row }">{{ row.chairperson?.realName || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评审项" width="80">
          <template #default="{ row }">{{ (row.items || []).length }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="240">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" type="success" @click="showCompleteDialog(row)" v-if="row.status === 'in_progress'">完成</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="新建 Gate 评审" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="项目" required>
          <el-select v-model="createForm.projectId" placeholder="选择项目">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Gate类型" required>
          <el-select v-model="createForm.gateType" placeholder="选择Gate类型">
            <el-option v-for="g in gateTypes" :key="g.value" :label="g.label" :value="g.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划日期" required>
          <el-date-picker v-model="createForm.plannedDate" type="date" value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]" />
        </el-form-item>
        <el-form-item label="主持人">
          <el-select v-model="createForm.chairpersonId" placeholder="选择主持人" clearable>
            <el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="Gate 评审详情" width="900px">
      <el-descriptions v-if="currentReview" :column="2" border>
        <el-descriptions-item label="Gate">{{ currentReview.gateType }}</el-descriptions-item>
        <el-descriptions-item label="评审名称">{{ currentReview.gateName }}</el-descriptions-item>
        <el-descriptions-item label="项目">{{ currentReview.project?.projectName }}</el-descriptions-item>
        <el-descriptions-item label="主持人">{{ currentReview.chairperson?.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计划日期">{{ formatDate(currentReview.plannedDate) }}</el-descriptions-item>
        <el-descriptions-item label="实际日期">{{ formatDate(currentReview.actualDate) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(currentReview.status)">{{ statusLabel(currentReview.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="结论">{{ currentReview.conclusion || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-if="currentReview" style="margin-top: 20px">
        <el-tab-pane :label="`评审项 (${(currentReview.items || []).length})`">
          <el-button size="small" type="primary" @click="showAddItemDialog" style="margin-bottom: 10px">添加评审项</el-button>
          <el-table :data="currentReview.items || []" size="small">
            <el-table-column prop="sortOrder" label="序号" width="60" />
            <el-table-column prop="category" label="类别" width="100">
              <template #default="{ row }">{{ categoryLabel(row.category) }}</template>
            </el-table-column>
            <el-table-column prop="itemName" label="评审项" />
            <el-table-column prop="requirement" label="要求" />
            <el-table-column label="结果" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.result" :type="row.result === 'pass' ? 'success' : 'danger'" size="small">
                  {{ row.result === 'pass' ? '通过' : '不通过' }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="`参与人员 (${(currentReview.participants || []).length})`">
          <el-button size="small" type="primary" @click="showAddParticipantDialog" style="margin-bottom: 10px">添加参与人</el-button>
          <el-table :data="currentReview.participants || []" size="small">
            <el-table-column label="姓名" width="120">
              <template #default="{ row }">{{ row.user?.realName }}</template>
            </el-table-column>
            <el-table-column prop="role" label="角色" width="120" />
            <el-table-column label="出席" width="80">
              <template #default="{ row }">
                <el-tag :type="row.attended ? 'success' : 'info'" size="small">{{ row.attended ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="签名" width="80">
              <template #default="{ row }">
                <el-tag :type="row.signed ? 'success' : 'info'" size="small">{{ row.signed ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog v-model="addItemDialogVisible" title="添加评审项" width="500px">
      <el-form :model="itemForm" label-width="80px">
        <el-form-item label="类别">
          <el-select v-model="itemForm.category">
            <el-option label="文档" value="document" />
            <el-option label="交付物" value="deliverable" />
            <el-option label="过程" value="process" />
            <el-option label="资源" value="resource" />
          </el-select>
        </el-form-item>
        <el-form-item label="评审项">
          <el-input v-model="itemForm.itemName" />
        </el-form-item>
        <el-form-item label="要求">
          <el-input v-model="itemForm.requirement" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addItemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddItem">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="addParticipantDialogVisible" title="添加参与人" width="500px">
      <el-form :model="participantForm" label-width="80px">
        <el-form-item label="人员">
          <el-select v-model="participantForm.userId">
            <el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-input v-model="participantForm.role" placeholder="如：项目经理、质量工程师" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addParticipantDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddParticipant">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="完成评审" width="500px">
      <el-form :model="completeForm" label-width="80px">
        <el-form-item label="结果">
          <el-radio-group v-model="completeForm.status">
            <el-radio value="passed">通过</el-radio>
            <el-radio value="failed">未通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="结论">
          <el-input v-model="completeForm.conclusion" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="后续行动">
          <el-input v-model="completeForm.followUpActions" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleComplete" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { gateReviewApi, projectApi, userApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const reviewList = ref<any[]>([])
const projects = ref<any[]>([])
const users = ref<any[]>([])
const currentReview = ref<any>(null)

const filters = ref({ gateType: undefined as string | undefined, status: undefined as string | undefined })

const gateTypes = [
  { value: 'G0', label: 'G0 - 立项评审' },
  { value: 'G1', label: 'G1 - P1→P2 评审' },
  { value: 'G2', label: 'G2 - P2→P3 评审' },
  { value: 'G3', label: 'G3 - P3→P4 评审' },
  { value: 'G4', label: 'G4 - P4→P5 评审' },
  { value: 'G5', label: 'G5 - 结项评审' },
]

const createDialogVisible = ref(false)
const createForm = ref({
  projectId: undefined as number | undefined,
  gateType: '',
  plannedDate: '',
  chairpersonId: undefined as number | undefined,
})

const detailDialogVisible = ref(false)
const addItemDialogVisible = ref(false)
const itemForm = ref({ category: 'document', itemName: '', requirement: '' })

const addParticipantDialogVisible = ref(false)
const participantForm = ref({ userId: undefined as number | undefined, role: '' })

const completeDialogVisible = ref(false)
const completeForm = ref({ status: 'passed', conclusion: '', followUpActions: '' })

const statusLabel = (status: string) => {
  const map: Record<string, string> = { planned: '已计划', in_progress: '进行中', passed: '通过', failed: '未通过', cancelled: '已取消' }
  return map[status] || status
}

const statusTagType = (status: string) => {
  const map: Record<string, string> = { planned: 'info', in_progress: 'warning', passed: 'success', failed: 'danger', cancelled: 'info' }
  return map[status] || 'info'
}

const categoryLabel = (cat: string) => {
  const map: Record<string, string> = { document: '文档', deliverable: '交付物', process: '过程', resource: '资源' }
  return map[cat] || cat
}

const formatDate = (date: string) => date ? new Date(date).toLocaleDateString('zh-CN') : '-'

const loadData = async () => {
  loading.value = true
  try {
    const res = await gateReviewApi.list(filters.value)
    reviewList.value = res.data.data || res.data
  } finally {
    loading.value = false
  }
}

const loadProjects = async () => {
  const res = await projectApi.list({ pageSize: 100 })
  projects.value = res.data.list || []
}

const loadUsers = async () => {
  const res = await userApi.list({ pageSize: 100 })
  users.value = res.data.list || res.data.data || []
}

const showCreateDialog = async () => {
  createForm.value = { projectId: undefined, gateType: '', plannedDate: '', chairpersonId: undefined }
  await Promise.all([loadProjects(), loadUsers()])
  createDialogVisible.value = true
}

const handleCreate = async () => {
  if (!createForm.value.projectId || !createForm.value.gateType || !createForm.value.plannedDate) {
    ElMessage.warning('请填写必填项')
    return
  }
  submitting.value = true
  try {
    await gateReviewApi.create(createForm.value)
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

const viewDetail = async (row: any) => {
  const res = await gateReviewApi.get(row.id)
  currentReview.value = res.data.data || res.data
  detailDialogVisible.value = true
}

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm('确认删除该评审？', '提示', { type: 'warning' })
  await gateReviewApi.delete(row.id)
  ElMessage.success('删除成功')
  loadData()
}

const showAddItemDialog = () => {
  itemForm.value = { category: 'document', itemName: '', requirement: '' }
  addItemDialogVisible.value = true
}

const handleAddItem = async () => {
  await gateReviewApi.addItem(currentReview.value.id, itemForm.value)
  ElMessage.success('添加成功')
  addItemDialogVisible.value = false
  viewDetail(currentReview.value)
}

const showAddParticipantDialog = async () => {
  await loadUsers()
  participantForm.value = { userId: undefined, role: '' }
  addParticipantDialogVisible.value = true
}

const handleAddParticipant = async () => {
  if (!participantForm.value.userId) {
    ElMessage.warning('请选择人员')
    return
  }
  await gateReviewApi.addParticipant(currentReview.value.id, participantForm.value)
  ElMessage.success('添加成功')
  addParticipantDialogVisible.value = false
  viewDetail(currentReview.value)
}

const showCompleteDialog = (row: any) => {
  currentReview.value = row
  completeForm.value = { status: 'passed', conclusion: '', followUpActions: '' }
  completeDialogVisible.value = true
}

const handleComplete = async () => {
  submitting.value = true
  try {
    await gateReviewApi.complete(currentReview.value.id, completeForm.value)
    ElMessage.success('评审已完成')
    completeDialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-form {
  margin-bottom: 16px;
}
</style>
