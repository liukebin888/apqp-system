<template>
  <div class="pre-project-view">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>预立项管理</span>
          <el-button type="primary" @click="showCreateDialog">新建 RFQ</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="客户">
          <el-select v-model="filters.customerId" placeholder="全部客户" clearable>
            <el-option v-for="c in customers" :key="c.id" :label="c.customerName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="已接收" value="received" />
            <el-option label="分析中" value="analyzing" />
            <el-option label="方案已提交" value="proposal_submitted" />
            <el-option label="报价中" value="quoting" />
            <el-option label="已定点" value="nominated" />
            <el-option label="丢失" value="lost" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="rfqList" v-loading="loading" stripe>
        <el-table-column prop="rfqCode" label="RFQ编号" width="160" />
        <el-table-column label="客户" width="150">
          <template #default="{ row }">{{ row.customer?.customerName }}</template>
        </el-table-column>
        <el-table-column prop="partNumber" label="零件号" width="140" />
        <el-table-column prop="partName" label="零件名称" width="160" />
        <el-table-column label="目标价格" width="100">
          <template #default="{ row }">{{ row.targetPrice ? `¥${row.targetPrice}` : '-' }}</template>
        </el-table-column>
        <el-table-column prop="annualVolume" label="年需求量" width="100" />
        <el-table-column label="接收日期" width="120">
          <template #default="{ row }">{{ formatDate(row.receiveDate) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" type="success" @click="showFeasibilityDialog(row)">可行性</el-button>
            <el-button size="small" type="warning" @click="showQuotationDialog(row)">报价</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="新建 RFQ" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="客户" required>
          <el-select v-model="createForm.customerId" placeholder="选择客户">
            <el-option v-for="c in customers" :key="c.id" :label="c.customerName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="零件号" required>
          <el-input v-model="createForm.partNumber" />
        </el-form-item>
        <el-form-item label="零件名称" required>
          <el-input v-model="createForm.partName" />
        </el-form-item>
        <el-form-item label="接收日期" required>
          <el-date-picker v-model="createForm.receiveDate" type="date" value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]" />
        </el-form-item>
        <el-form-item label="目标价格">
          <el-input-number v-model="createForm.targetPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="年需求量">
          <el-input-number v-model="createForm.annualVolume" :min="0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="RFQ 详情" width="800px">
      <el-descriptions v-if="currentRfq" :column="2" border>
        <el-descriptions-item label="RFQ编号">{{ currentRfq.rfqCode }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ currentRfq.customer?.customerName }}</el-descriptions-item>
        <el-descriptions-item label="零件号">{{ currentRfq.partNumber }}</el-descriptions-item>
        <el-descriptions-item label="零件名称">{{ currentRfq.partName }}</el-descriptions-item>
        <el-descriptions-item label="目标价格">{{ currentRfq.targetPrice ? `¥${currentRfq.targetPrice}` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="年需求量">{{ currentRfq.annualVolume || '-' }}</el-descriptions-item>
        <el-descriptions-item label="接收日期">{{ formatDate(currentRfq.receiveDate) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(currentRfq.status)">{{ statusLabel(currentRfq.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentRfq.description || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-if="currentRfq" style="margin-top: 20px">
        <el-tab-pane label="报价记录">
          <el-table :data="currentRfq.quotations || []" size="small">
            <el-table-column prop="version" label="版本" width="60" />
            <el-table-column label="总价" width="100">
              <template #default="{ row }">¥{{ row.totalPrice }}</template>
            </el-table-column>
            <el-table-column label="材料费" width="100">
              <template #default="{ row }">¥{{ row.materialCost || 0 }}</template>
            </el-table-column>
            <el-table-column label="人工费" width="100">
              <template #default="{ row }">¥{{ row.laborCost || 0 }}</template>
            </el-table-column>
            <el-table-column label="利润率" width="80">
              <template #default="{ row }">{{ row.profitMargin }}%</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" />
            <el-table-column label="有效期" width="120">
              <template #default="{ row }">{{ formatDate(row.validUntil) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="技术方案">
          <el-table :data="currentRfq.proposals || []" size="small">
            <el-table-column prop="version" label="版本" width="60" />
            <el-table-column prop="title" label="标题" />
            <el-table-column label="客户批准" width="100">
              <template #default="{ row }">
                <el-tag :type="row.customerApproved ? 'success' : 'info'">{{ row.customerApproved ? '已批准' : '待批准' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button v-if="!row.customerApproved" size="small" type="success" @click="approveProposal(row.id)">批准</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="可行性分析">
          <el-descriptions v-if="currentRfq.feasibility" :column="2" border>
            <el-descriptions-item label="技术评分">{{ currentRfq.feasibility.techScore }}</el-descriptions-item>
            <el-descriptions-item label="产能评分">{{ currentRfq.feasibility.capacityScore }}</el-descriptions-item>
            <el-descriptions-item label="质量评分">{{ currentRfq.feasibility.qualityScore }}</el-descriptions-item>
            <el-descriptions-item label="商务评分">{{ currentRfq.feasibility.businessScore }}</el-descriptions-item>
            <el-descriptions-item label="综合评分">
              <span style="font-weight: bold; color: #409eff">{{ currentRfq.feasibility.overallScore }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="结论">
              <el-tag :type="currentRfq.feasibility.conclusion === 'feasible' ? 'success' : 'warning'">
                {{ currentRfq.feasibility.conclusion }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无可行性分析" />
        </el-tab-pane>
        <el-tab-pane label="定点信息">
          <el-descriptions v-if="currentRfq.nomination" :column="2" border>
            <el-descriptions-item label="定点日期">{{ formatDate(currentRfq.nomination.nominationDate) }}</el-descriptions-item>
            <el-descriptions-item label="项目编号">{{ currentRfq.nomination.projectCode || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂未被定点" />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog v-model="feasibilityDialogVisible" title="可行性分析" width="600px">
      <el-form :model="feasibilityForm" label-width="100px">
        <el-form-item label="技术评分" required>
          <el-slider v-model="feasibilityForm.techScore" :max="100" show-input />
        </el-form-item>
        <el-form-item label="产能评分" required>
          <el-slider v-model="feasibilityForm.capacityScore" :max="100" show-input />
        </el-form-item>
        <el-form-item label="质量评分" required>
          <el-slider v-model="feasibilityForm.qualityScore" :max="100" show-input />
        </el-form-item>
        <el-form-item label="商务评分" required>
          <el-slider v-model="feasibilityForm.businessScore" :max="100" show-input />
        </el-form-item>
        <el-form-item label="技术评论">
          <el-input v-model="feasibilityForm.techComment" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="结论">
          <el-select v-model="feasibilityForm.conclusion">
            <el-option label="可行" value="feasible" />
            <el-option label="有条件可行" value="conditional" />
            <el-option label="不可行" value="not_feasible" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="feasibilityDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFeasibility" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="quotationDialogVisible" title="新建报价" width="600px">
      <el-form :model="quotationForm" label-width="100px">
        <el-form-item label="总价格" required>
          <el-input-number v-model="quotationForm.totalPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="材料费">
          <el-input-number v-model="quotationForm.materialCost" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="人工费">
          <el-input-number v-model="quotationForm.laborCost" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="间接费用">
          <el-input-number v-model="quotationForm.overheadCost" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="利润率(%)">
          <el-input-number v-model="quotationForm.profitMargin" :min="0" :max="100" :precision="2" />
        </el-form-item>
        <el-form-item label="有效期至">
          <el-date-picker v-model="quotationForm.validUntil" type="date" value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="quotationForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quotationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleQuotation" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { preProjectApi, masterDataApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const rfqList = ref<any[]>([])
const customers = ref<any[]>([])
const currentRfq = ref<any>(null)

const filters = ref({ customerId: undefined as number | undefined, status: undefined as string | undefined })

const createDialogVisible = ref(false)
const createForm = ref({
  customerId: undefined as number | undefined,
  partNumber: '',
  partName: '',
  receiveDate: '',
  targetPrice: undefined as number | undefined,
  annualVolume: undefined as number | undefined,
  description: '',
})

const detailDialogVisible = ref(false)
const feasibilityDialogVisible = ref(false)
const feasibilityForm = ref({
  techScore: 70,
  capacityScore: 70,
  qualityScore: 70,
  businessScore: 70,
  techComment: '',
  conclusion: 'feasible',
})

const quotationDialogVisible = ref(false)
const quotationForm = ref({
  totalPrice: 0,
  materialCost: 0,
  laborCost: 0,
  overheadCost: 0,
  profitMargin: 15,
  validUntil: '',
  notes: '',
})

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    received: '已接收', analyzing: '分析中', proposal_submitted: '方案已提交',
    quoting: '报价中', nominated: '已定点', lost: '丢失',
  }
  return map[status] || status
}

const statusTagType = (status: string) => {
  const map: Record<string, string> = {
    received: 'info', analyzing: 'warning', proposal_submitted: '',
    quoting: 'warning', nominated: 'success', lost: 'danger',
  }
  return map[status] || 'info'
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await preProjectApi.rfqs.list(filters.value)
    rfqList.value = res.data.data || res.data
  } finally {
    loading.value = false
  }
}

const loadCustomers = async () => {
  const res = await masterDataApi.customers.list({ pageSize: 100 })
  customers.value = res.data.list || []
}

const showCreateDialog = () => {
  createForm.value = { customerId: undefined, partNumber: '', partName: '', receiveDate: '', targetPrice: undefined, annualVolume: undefined, description: '' }
  createDialogVisible.value = true
}

const handleCreate = async () => {
  if (!createForm.value.customerId || !createForm.value.partNumber || !createForm.value.partName || !createForm.value.receiveDate) {
    ElMessage.warning('请填写必填项')
    return
  }
  submitting.value = true
  try {
    await preProjectApi.rfqs.create(createForm.value)
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

const viewDetail = async (row: any) => {
  const res = await preProjectApi.rfqs.get(row.id)
  currentRfq.value = res.data.data || res.data
  detailDialogVisible.value = true
}

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm('确认删除该RFQ？', '提示', { type: 'warning' })
  await preProjectApi.rfqs.delete(row.id)
  ElMessage.success('删除成功')
  loadData()
}

const showFeasibilityDialog = (row: any) => {
  currentRfq.value = row
  feasibilityForm.value = { techScore: 70, capacityScore: 70, qualityScore: 70, businessScore: 70, techComment: '', conclusion: 'feasible' }
  feasibilityDialogVisible.value = true
}

const handleFeasibility = async () => {
  submitting.value = true
  try {
    await preProjectApi.feasibility.createOrUpdate(currentRfq.value.id, feasibilityForm.value)
    ElMessage.success('可行性分析已提交')
    feasibilityDialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

const showQuotationDialog = (row: any) => {
  currentRfq.value = row
  quotationForm.value = { totalPrice: 0, materialCost: 0, laborCost: 0, overheadCost: 0, profitMargin: 15, validUntil: '', notes: '' }
  quotationDialogVisible.value = true
}

const handleQuotation = async () => {
  submitting.value = true
  try {
    await preProjectApi.quotations.create(currentRfq.value.id, quotationForm.value)
    ElMessage.success('报价已提交')
    quotationDialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

const approveProposal = async (proposalId: number) => {
  await preProjectApi.proposals.approve(proposalId)
  ElMessage.success('方案已批准')
  if (currentRfq.value) viewDetail(currentRfq.value)
}

onMounted(() => {
  loadData()
  loadCustomers()
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
