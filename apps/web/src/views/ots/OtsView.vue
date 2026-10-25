<template>
  <div class="ots-view">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>OTS 样件管理</span>
          <el-button type="primary" @click="showCreateDialog">新建样件</el-button>
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
        <el-form-item label="样件类型">
          <el-select v-model="filters.sampleType" placeholder="全部" clearable>
            <el-option label="OTS" value="ots" />
            <el-option label="PVS" value="pvs" />
            <el-option label="SOP" value="sop" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable>
            <el-option label="已计划" value="planned" />
            <el-option label="生产中" value="in_production" />
            <el-option label="已提交" value="submitted" />
            <el-option label="测试中" value="testing" />
            <el-option label="已认可" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchSamples">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="samples" v-loading="loading" border stripe>
        <el-table-column prop="sampleCode" label="样件编号" width="160" />
        <el-table-column prop="partNumber" label="零件号" width="140" />
        <el-table-column prop="partName" label="零件名称" min-width="180" />
        <el-table-column prop="sampleType" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.sampleType === 'ots' ? '' : row.sampleType === 'pvs' ? 'warning' : 'success'" size="small">
              {{ row.sampleType.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="70" align="center" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报告/测试/认可" width="130" align="center">
          <template #default="{ row }">
            {{ row._count?.reports || 0 }} / {{ row._count?.testRecords || 0 }} / {{ row._count?.approvals || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="customer" label="客户" width="120">
          <template #default="{ row }">{{ row.customer?.customerName }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="120">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="showCreateDialog(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="deleteSample(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createDialogVisible" :title="editingSample ? '编辑样件' : '新建样件'" width="600px">
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
        <el-form-item label="样件类型" required>
          <el-select v-model="createForm.sampleType">
            <el-option label="OTS" value="ots" />
            <el-option label="PVS" value="pvs" />
            <el-option label="SOP" value="sop" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="createForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="客户" required>
          <el-select v-model="createForm.customerId" placeholder="选择客户">
            <el-option v-for="c in customers" :key="c.id" :label="c.customerName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="制造日期">
          <el-date-picker v-model="createForm.manufactureDate" type="date" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remarks" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSample" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="样件详情" width="900px" top="5vh">
      <template v-if="currentSample">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="样件编号">{{ currentSample.sampleCode }}</el-descriptions-item>
          <el-descriptions-item label="零件号">{{ currentSample.partNumber }}</el-descriptions-item>
          <el-descriptions-item label="零件名称">{{ currentSample.partName }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag size="small">{{ currentSample.sampleType.toUpperCase() }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentSample.status)" size="small">{{ statusLabel(currentSample.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数量">{{ currentSample.quantity }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentSample.customer?.customerName }}</el-descriptions-item>
          <el-descriptions-item label="项目">{{ currentSample.project?.projectName }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentSample.createdBy?.realName }}</el-descriptions-item>
        </el-descriptions>

        <el-tabs v-model="activeTab" style="margin-top: 20px">
          <el-tab-pane label="检测报告" name="reports">
            <el-button type="primary" size="small" @click="showReportDialog" style="margin-bottom: 10px">添加报告</el-button>
            <el-table :data="currentSample.reports || []" border size="small">
              <el-table-column prop="reportCode" label="报告编号" width="150" />
              <el-table-column prop="reportType" label="类型" width="100" />
              <el-table-column prop="result" label="结果" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.result === 'pass' ? 'success' : row.result === 'fail' ? 'danger' : 'warning'" size="small">
                    {{ row.result === 'pass' ? '合格' : row.result === 'fail' ? '不合格' : '有条件' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="conclusion" label="结论" />
              <el-table-column prop="reportDate" label="日期" width="120">
                <template #default="{ row }">{{ formatDate(row.reportDate) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="测试记录" name="testRecords">
            <el-button type="primary" size="small" @click="showTestRecordDialog" style="margin-bottom: 10px">添加测试</el-button>
            <el-table :data="currentSample.testRecords || []" border size="small">
              <el-table-column prop="testName" label="测试项目" width="180" />
              <el-table-column prop="testStandard" label="测试标准" width="150" />
              <el-table-column prop="expectedResult" label="预期结果" />
              <el-table-column prop="actualResult" label="实际结果" />
              <el-table-column prop="result" label="结论" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.result === 'pass' ? 'success' : 'danger'" size="small">
                    {{ row.result === 'pass' ? '合格' : '不合格' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="tester" label="测试人" width="100">
                <template #default="{ row }">{{ row.tester?.realName }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="客户认可" name="approvals">
            <el-button type="primary" size="small" @click="showApprovalDialog" style="margin-bottom: 10px">添加认可记录</el-button>
            <el-table :data="currentSample.approvals || []" border size="small">
              <el-table-column prop="approvalType" label="类型" width="100">
                <template #default="{ row }">{{ row.approvalType === 'customer' ? '客户' : '内部' }}</template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'info'" size="small">
                    {{ row.status === 'approved' ? '已认可' : row.status === 'rejected' ? '已拒绝' : '待审批' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="approver" label="审批人" width="100">
                <template #default="{ row }">{{ row.approver?.realName }}</template>
              </el-table-column>
              <el-table-column prop="comments" label="意见" />
              <el-table-column prop="nextAction" label="后续行动" />
              <el-table-column prop="approvalDate" label="日期" width="120">
                <template #default="{ row }">{{ formatDate(row.approvalDate) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>

        <div style="margin-top: 15px; text-align: right">
          <el-dropdown @command="handleStatusChange">
            <el-button type="warning" size="small">变更状态</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="planned">已计划</el-dropdown-item>
                <el-dropdown-item command="in_production">生产中</el-dropdown-item>
                <el-dropdown-item command="submitted">已提交</el-dropdown-item>
                <el-dropdown-item command="testing">测试中</el-dropdown-item>
                <el-dropdown-item command="approved">已认可</el-dropdown-item>
                <el-dropdown-item command="rejected">已拒绝</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="reportDialogVisible" title="添加检测报告" width="500px">
      <el-form :model="reportForm" label-width="80px">
        <el-form-item label="报告类型">
          <el-select v-model="reportForm.reportType">
            <el-option label="尺寸" value="dimension" />
            <el-option label="材料" value="material" />
            <el-option label="外观" value="appearance" />
            <el-option label="功能" value="function" />
          </el-select>
        </el-form-item>
        <el-form-item label="结果">
          <el-select v-model="reportForm.result">
            <el-option label="合格" value="pass" />
            <el-option label="不合格" value="fail" />
            <el-option label="有条件通过" value="conditional" />
          </el-select>
        </el-form-item>
        <el-form-item label="结论">
          <el-input v-model="reportForm.conclusion" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveReport">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testRecordDialogVisible" title="添加测试记录" width="500px">
      <el-form :model="testRecordForm" label-width="80px">
        <el-form-item label="测试项目">
          <el-input v-model="testRecordForm.testName" />
        </el-form-item>
        <el-form-item label="测试标准">
          <el-input v-model="testRecordForm.testStandard" />
        </el-form-item>
        <el-form-item label="预期结果">
          <el-input v-model="testRecordForm.expectedResult" />
        </el-form-item>
        <el-form-item label="实际结果">
          <el-input v-model="testRecordForm.actualResult" />
        </el-form-item>
        <el-form-item label="结论">
          <el-select v-model="testRecordForm.result">
            <el-option label="合格" value="pass" />
            <el-option label="不合格" value="fail" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testRecordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTestRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approvalDialogVisible" title="添加认可记录" width="500px">
      <el-form :model="approvalForm" label-width="80px">
        <el-form-item label="认可类型">
          <el-select v-model="approvalForm.approvalType">
            <el-option label="客户认可" value="customer" />
            <el-option label="内部认可" value="internal" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="approvalForm.status">
            <el-option label="待审批" value="pending" />
            <el-option label="已认可" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="有条件通过" value="conditional" />
          </el-select>
        </el-form-item>
        <el-form-item label="意见">
          <el-input v-model="approvalForm.comments" type="textarea" />
        </el-form-item>
        <el-form-item label="后续行动">
          <el-input v-model="approvalForm.nextAction" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveApproval">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { otsApi } from '@/api'

const loading = ref(false)
const saving = ref(false)
const samples = ref<any[]>([])
const projects = ref<any[]>([])
const customers = ref<any[]>([])
const filters = ref({ projectId: undefined as number | undefined, customerId: undefined as number | undefined, status: '', sampleType: '' })

const createDialogVisible = ref(false)
const editingSample = ref<any>(null)
const createForm = ref({ projectId: undefined as number | undefined, partNumber: '', partName: '', sampleType: 'ots', quantity: 1, customerId: undefined as number | undefined, manufactureDate: '', remarks: '' })

const detailDialogVisible = ref(false)
const currentSample = ref<any>(null)
const activeTab = ref('reports')

const reportDialogVisible = ref(false)
const reportForm = ref({ reportType: 'dimension', result: 'pass', conclusion: '' })

const testRecordDialogVisible = ref(false)
const testRecordForm = ref({ testName: '', testStandard: '', expectedResult: '', actualResult: '', result: 'pass' })

const approvalDialogVisible = ref(false)
const approvalForm = ref({ approvalType: 'customer', status: 'pending', comments: '', nextAction: '' })

onMounted(() => {
  fetchSamples()
  fetchProjects()
  fetchCustomers()
})

async function fetchSamples() {
  loading.value = true
  try {
    const res = await otsApi.samples.list(filters.value)
    samples.value = res.data?.data || res.data || []
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

function showCreateDialog(sample?: any) {
  editingSample.value = sample || null
  if (sample) {
    createForm.value = { ...sample }
  } else {
    createForm.value = { projectId: undefined, partNumber: '', partName: '', sampleType: 'ots', quantity: 1, customerId: undefined, manufactureDate: '', remarks: '' }
  }
  createDialogVisible.value = true
}

async function saveSample() {
  saving.value = true
  try {
    if (editingSample.value) {
      await otsApi.samples.update(editingSample.value.id, createForm.value)
      ElMessage.success('更新成功')
    } else {
      await otsApi.samples.create(createForm.value)
      ElMessage.success('创建成功')
    }
    createDialogVisible.value = false
    fetchSamples()
  } finally { saving.value = false }
}

async function deleteSample(row: any) {
  await ElMessageBox.confirm('确认删除该样件？', '提示', { type: 'warning' })
  await otsApi.samples.delete(row.id)
  ElMessage.success('删除成功')
  fetchSamples()
}

async function showDetail(row: any) {
  const res = await otsApi.samples.get(row.id)
  currentSample.value = res.data?.data || res.data
  activeTab.value = 'reports'
  detailDialogVisible.value = true
}

async function handleStatusChange(status: string) {
  if (!currentSample.value) return
  await otsApi.samples.updateStatus(currentSample.value.id, status)
  ElMessage.success('状态已更新')
  const res = await otsApi.samples.get(currentSample.value.id)
  currentSample.value = res.data?.data || res.data
  fetchSamples()
}

function showReportDialog() {
  reportForm.value = { reportType: 'dimension', result: 'pass', conclusion: '' }
  reportDialogVisible.value = true
}

async function saveReport() {
  if (!currentSample.value) return
  await otsApi.reports.create(currentSample.value.id, reportForm.value)
  ElMessage.success('报告已添加')
  reportDialogVisible.value = false
  const res = await otsApi.samples.get(currentSample.value.id)
  currentSample.value = res.data?.data || res.data
}

function showTestRecordDialog() {
  testRecordForm.value = { testName: '', testStandard: '', expectedResult: '', actualResult: '', result: 'pass' }
  testRecordDialogVisible.value = true
}

async function saveTestRecord() {
  if (!currentSample.value) return
  await otsApi.testRecords.create(currentSample.value.id, testRecordForm.value)
  ElMessage.success('测试记录已添加')
  testRecordDialogVisible.value = false
  const res = await otsApi.samples.get(currentSample.value.id)
  currentSample.value = res.data?.data || res.data
}

function showApprovalDialog() {
  approvalForm.value = { approvalType: 'customer', status: 'pending', comments: '', nextAction: '' }
  approvalDialogVisible.value = true
}

async function saveApproval() {
  if (!currentSample.value) return
  await otsApi.approvals.create(currentSample.value.id, approvalForm.value)
  ElMessage.success('认可记录已添加')
  approvalDialogVisible.value = false
  const res = await otsApi.samples.get(currentSample.value.id)
  currentSample.value = res.data?.data || res.data
}

function statusLabel(status: string) {
  const map: Record<string, string> = { planned: '已计划', in_production: '生产中', submitted: '已提交', testing: '测试中', approved: '已认可', rejected: '已拒绝' }
  return map[status] || status
}

function statusTagType(status: string) {
  const map: Record<string, string> = { planned: 'info', in_production: 'warning', submitted: '', testing: '', approved: 'success', rejected: 'danger' }
  return (map[status] || 'info') as any
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped lang="scss">
.ots-view { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.filter-form { margin-bottom: 16px; }
</style>
