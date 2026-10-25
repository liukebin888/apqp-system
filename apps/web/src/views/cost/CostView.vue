<template>
  <div class="cost-view">
    <div class="page-header">
      <h2>成本管理</h2>
      <div class="header-actions">
        <el-select v-model="filterProjectId" placeholder="选择项目" clearable style="width: 240px" @change="loadAllData">
          <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-button type="primary" @click="showCreateEstimate = true">新建估算</el-button>
        <el-button @click="checkAlerts" :disabled="!filterProjectId">预警检查</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: Cost Estimation -->
      <el-tab-pane label="成本估算" name="estimate">
        <el-table :data="estimates" v-loading="loading" border stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="version" label="版本" width="80" />
          <el-table-column prop="versionLabel" label="版本说明" width="120" />
          <el-table-column label="项目" min-width="200">
            <template #default="{ row }">{{ row.project?.name }}</template>
          </el-table-column>
          <el-table-column label="总金额" width="140" align="right">
            <template #default="{ row }">¥{{ formatMoney(row.totalAmount) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="estimateStatusType(row.status)">{{ estimateStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建人" width="100">
            <template #default="{ row }">{{ row.createdBy?.realName }}</template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewEstimate(row)">详情</el-button>
              <el-button size="small" type="primary" @click="editEstimate(row)" v-if="row.status === 'draft'">编辑</el-button>
              <el-button size="small" type="success" @click="submitEstimate(row)" v-if="row.status === 'draft'">提交</el-button>
              <el-button size="small" type="warning" @click="approveEstimate(row)" v-if="row.status === 'pending_approval'">批准</el-button>
              <el-button size="small" type="danger" @click="publishEstimate(row)" v-if="row.status === 'approved'">发布</el-button>
              <el-button size="small" type="danger" @click="deleteEstimate(row)" v-if="row.status === 'draft'">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 2: Budget Management -->
      <el-tab-pane label="预算管理" name="budget">
        <el-table :data="budgets" v-loading="loading" border stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column label="项目" min-width="200">
            <template #default="{ row }">{{ row.project?.name }}</template>
          </el-table-column>
          <el-table-column label="成本类别" width="120">
            <template #default="{ row }">{{ categoryLabel(row.budgetCategory) }}</template>
          </el-table-column>
          <el-table-column label="预算金额" width="140" align="right">
            <template #default="{ row }">¥{{ formatMoney(row.budgetAmount) }}</template>
          </el-table-column>
          <el-table-column label="实际金额" width="140" align="right">
            <template #default="{ row }">¥{{ formatMoney(row.actualAmount) }}</template>
          </el-table-column>
          <el-table-column label="预测金额" width="140" align="right">
            <template #default="{ row }">¥{{ formatMoney(row.forecastAmount) }}</template>
          </el-table-column>
          <el-table-column label="执行率" width="140">
            <template #default="{ row }">
              <el-progress :percentage="budgetPercent(row)" :color="budgetColor(row)" :stroke-width="16" :text-inside="true" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="budgetStatusType(row.status)">{{ budgetStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewBudget(row)">详情</el-button>
              <el-button size="small" type="primary" @click="showAdjustment(row)">调整</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 3: Cost Tracking -->
      <el-tab-pane label="成本跟踪" name="tracking">
        <div v-if="!filterProjectId" class="empty-tip">请先选择项目</div>
        <template v-else>
          <el-row :gutter="20" class="kpi-row">
            <el-col :span="6">
              <el-card shadow="hover">
                <div class="kpi-label">总预算</div>
                <div class="kpi-value">¥{{ formatMoney(varianceData?.summary?.totalBudget || 0) }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover">
                <div class="kpi-label">总实际</div>
                <div class="kpi-value">¥{{ formatMoney(varianceData?.summary?.totalActual || 0) }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover">
                <div class="kpi-label">偏差</div>
                <div class="kpi-value" :class="varianceClass">{{ formatMoney(varianceData?.summary?.totalVariance || 0) }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover">
                <div class="kpi-label">CPI</div>
                <div class="kpi-value" :class="cpiClass">{{ (varianceData?.summary?.totalCPI || 0).toFixed(2) }}</div>
              </el-card>
            </el-col>
          </el-row>
          <el-table :data="varianceData?.byCategory || []" border stripe style="margin-top: 16px">
            <el-table-column prop="category" label="成本类别">
              <template #default="{ row }">{{ categoryLabel(row.category) }}</template>
            </el-table-column>
            <el-table-column label="预算" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.budgetAmount) }}</template>
            </el-table-column>
            <el-table-column label="实际" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.actualAmount) }}</template>
            </el-table-column>
            <el-table-column label="偏差" align="right">
              <template #default="{ row }">
                <span :class="row.variance >= 0 ? 'text-success' : 'text-danger'">¥{{ formatMoney(row.variance) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="偏差率" align="right">
              <template #default="{ row }">
                <span :class="row.varianceRate >= 0 ? 'text-success' : 'text-danger'">{{ (row.varianceRate * 100).toFixed(1) }}%</span>
              </template>
            </el-table-column>
            <el-table-column label="CPI" align="center">
              <template #default="{ row }">
                <span :class="row.cpi >= 1 ? 'text-success' : 'text-danger'">{{ row.cpi.toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-tab-pane>

      <!-- Tab 4: Cost Analysis -->
      <el-tab-pane label="成本分析" name="analysis">
        <div v-if="!filterProjectId" class="empty-tip">请先选择项目</div>
        <template v-else>
          <el-row :gutter="20" class="kpi-row">
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="kpi-label">项目总预算</div>
                <div class="kpi-value">¥{{ formatMoney(analysisData?.summary?.totalBudget || 0) }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="kpi-label">项目总实际</div>
                <div class="kpi-value">¥{{ formatMoney(analysisData?.summary?.totalActual || 0) }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="kpi-label">预算偏差率</div>
                <div class="kpi-value" :class="(analysisData?.summary?.varianceRate || 0) >= 0 ? 'text-success' : 'text-danger'">
                  {{ ((analysisData?.summary?.varianceRate || 0) * 100).toFixed(1) }}%
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-table :data="analysisData?.byCategory || []" border stripe style="margin-top: 16px">
            <el-table-column prop="category" label="成本类别">
              <template #default="{ row }">{{ categoryLabel(row.category) }}</template>
            </el-table-column>
            <el-table-column label="预算" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.budget) }}</template>
            </el-table-column>
            <el-table-column label="实际" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.actual) }}</template>
            </el-table-column>
            <el-table-column label="预测" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.forecast) }}</template>
            </el-table-column>
          </el-table>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- Alerts Drawer -->
    <el-drawer v-model="showAlerts" title="成本预警" direction="rtl" size="400px">
      <div v-if="alerts.length === 0" class="empty-tip">暂无预警</div>
      <div v-for="alert in alerts" :key="alert.id" class="alert-item">
        <el-tag :type="alertLevelType(alert.alertLevel)" effect="dark">{{ alertLevelLabel(alert.alertLevel) }}</el-tag>
        <span class="alert-message">{{ alert.message }}</span>
        <el-button size="small" @click="resolveAlert(alert.id)" v-if="!alert.isResolved">解决</el-button>
        <el-tag v-else type="info" size="small">已解决</el-tag>
      </div>
    </el-drawer>

    <!-- Create Estimate Dialog -->
    <el-dialog v-model="showCreateEstimate" title="新建成本估算" width="600px">
      <el-form :model="estimateForm" label-width="100px">
        <el-form-item label="项目">
          <el-select v-model="estimateForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本">
          <el-select v-model="estimateForm.version" style="width: 100%">
            <el-option label="V1.0 - 立项估算" value="V1.0" />
            <el-option label="V2.0 - 设计估算" value="V2.0" />
            <el-option label="V3.0 - 开发估算" value="V3.0" />
            <el-option label="V4.0 - 决算" value="V4.0" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="estimateForm.remarks" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateEstimate = false">取消</el-button>
        <el-button type="primary" @click="createEstimate">创建</el-button>
      </template>
    </el-dialog>

    <!-- Estimate Detail Dialog -->
    <el-dialog v-model="showEstimateDetail" title="估算详情" width="900px">
      <div v-if="currentEstimate">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="版本">{{ currentEstimate.version }}</el-descriptions-item>
          <el-descriptions-item label="说明">{{ currentEstimate.versionLabel }}</el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ formatMoney(currentEstimate.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="estimateStatusType(currentEstimate.status)">{{ estimateStatusLabel(currentEstimate.status) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <h4 style="margin: 16px 0 8px">估算明细</h4>
        <el-table :data="currentEstimate.items || []" border stripe size="small">
          <el-table-column prop="category" label="类别" width="100">
            <template #default="{ row }">{{ categoryLabel(row.category) }}</template>
          </el-table-column>
          <el-table-column prop="itemName" label="名称" min-width="200" />
          <el-table-column label="数量" width="100" align="right">
            <template #default="{ row }">{{ row.quantity }}</template>
          </el-table-column>
          <el-table-column label="单价" width="120" align="right">
            <template #default="{ row }">¥{{ formatMoney(row.unitPrice) }}</template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="60" />
          <el-table-column prop="basisRef" label="依据" width="120" />
        </el-table>
        <div style="margin-top: 16px">
          <el-button type="primary" @click="showAddItem = true" v-if="currentEstimate.status === 'draft'">添加明细</el-button>
          <el-button @click="calculateEstimate(currentEstimate.id)" v-if="currentEstimate.status === 'draft'">重新计算</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- Add Estimate Item Dialog -->
    <el-dialog v-model="showAddItem" title="添加估算明细" width="500px">
      <el-form :model="itemForm" label-width="80px">
        <el-form-item label="类别">
          <el-select v-model="itemForm.category" style="width: 100%">
            <el-option v-for="(label, key) in categoryLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="itemForm.itemName" />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="itemForm.quantity" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number v-model="itemForm.unitPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="itemForm.unit" placeholder="小时/件/次/月" />
        </el-form-item>
        <el-form-item label="依据">
          <el-input v-model="itemForm.basisRef" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddItem = false">取消</el-button>
        <el-button type="primary" @click="addEstimateItem">添加</el-button>
      </template>
    </el-dialog>

    <!-- Budget Adjustment Dialog -->
    <el-dialog v-model="showAdjustmentDialog" title="预算调整" width="500px">
      <el-form :model="adjustmentForm" label-width="100px">
        <el-form-item label="调整类型">
          <el-select v-model="adjustmentForm.adjustmentType" style="width: 100%">
            <el-option label="预算内调整" value="transfer" />
            <el-option label="预算追加" value="addition" />
            <el-option label="预算削减" value="reduction" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整后金额">
          <el-input-number v-model="adjustmentForm.adjustedAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="adjustmentForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdjustmentDialog = false">取消</el-button>
        <el-button type="primary" @click="createAdjustment">提交</el-button>
      </template>
    </el-dialog>

    <!-- Budget Detail Dialog -->
    <el-dialog v-model="showBudgetDetail" title="预算详情" width="800px">
      <div v-if="currentBudget">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="成本类别">{{ categoryLabel(currentBudget.budgetCategory) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="budgetStatusType(currentBudget.status)">{{ budgetStatusLabel(currentBudget.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预算金额">¥{{ formatMoney(currentBudget.budgetAmount) }}</el-descriptions-item>
          <el-descriptions-item label="实际金额">¥{{ formatMoney(currentBudget.actualAmount) }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin: 16px 0 8px">成本条目</h4>
        <el-table :data="currentBudget.entries || []" border stripe size="small">
          <el-table-column label="日期" width="120">
            <template #default="{ row }">{{ formatDate(row.entryDate) }}</template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="200" />
          <el-table-column prop="sourceType" label="来源" width="100" />
        </el-table>
        <div style="margin-top: 16px">
          <el-button type="primary" @click="showAddEntry = true">添加成本条目</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- Add Entry Dialog -->
    <el-dialog v-model="showAddEntry" title="添加成本条目" width="500px">
      <el-form :model="entryForm" label-width="80px">
        <el-form-item label="日期">
          <el-date-picker v-model="entryForm.entryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="entryForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="entryForm.description" />
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="entryForm.sourceType" style="width: 100%">
            <el-option label="采购订单" value="po" />
            <el-option label="发票" value="invoice" />
            <el-option label="工时" value="timesheet" />
            <el-option label="手动录入" value="manual" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddEntry = false">取消</el-button>
        <el-button type="primary" @click="addEntry">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { costApi } from '@/api'
import { projectApi } from '@/api'

const route = useRoute()
const loading = ref(false)
const activeTab = ref('estimate')

const projects = ref<any[]>([])
const filterProjectId = ref<number | undefined>(undefined)

const estimates = ref<any[]>([])
const budgets = ref<any[]>([])
const varianceData = ref<any>(null)
const analysisData = ref<any>(null)
const alerts = ref<any[]>([])

const showAlerts = ref(false)
const showCreateEstimate = ref(false)
const showEstimateDetail = ref(false)
const showAddItem = ref(false)
const showAdjustmentDialog = ref(false)
const showBudgetDetail = ref(false)
const showAddEntry = ref(false)

const currentEstimate = ref<any>(null)
const currentBudget = ref<any>(null)

const estimateForm = ref({ projectId: undefined as number | undefined, version: 'V1.0', remarks: '' })
const itemForm = ref({ category: 'labor', itemName: '', quantity: 1, unitPrice: 0, unit: '', basisRef: '' })
const adjustmentForm = ref({ costId: 0, adjustmentType: 'transfer', adjustedAmount: 0, reason: '' })
const entryForm = ref({ entryDate: '', amount: 0, description: '', sourceType: 'manual' })

const categoryLabels: Record<string, string> = {
  labor: '人工成本', material: '材料成本', outsourcing: '外协成本',
  travel: '差旅成本', equipment: '设备成本', other: '其他成本',
}

function categoryLabel(key: string) { return categoryLabels[key] || key }

function estimateStatusLabel(s: string) {
  const map: Record<string, string> = { draft: '草稿', pending_approval: '待审批', approved: '已批准', published: '已发布', rejected: '已驳回', calculating: '计算中' }
  return map[s] || s
}
function estimateStatusType(s: string) {
  const map: Record<string, string> = { draft: 'info', pending_approval: 'warning', approved: 'success', published: '', rejected: 'danger' }
  return (map[s] || 'info') as any
}
function budgetStatusLabel(s: string) {
  const map: Record<string, string> = { draft: '草稿', pending: '待审批', approved: '已批准', published: '已发布', rejected: '已驳回' }
  return map[s] || s
}
function budgetStatusType(s: string) {
  const map: Record<string, string> = { draft: 'info', pending: 'warning', approved: 'success', published: '' }
  return (map[s] || 'info') as any
}
function alertLevelLabel(l: string) {
  return { yellow: '黄色预警', orange: '橙色预警', red: '红色预警' }[l] || l
}
function alertLevelType(l: string) {
  return { yellow: 'warning', orange: 'danger', red: 'danger' }[l] as any || 'info'
}

function formatMoney(v: any) {
  const num = Number(v) || 0
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatDate(d: any) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

function budgetPercent(row: any) {
  if (!row.budgetAmount || Number(row.budgetAmount) === 0) return 0
  return Math.min(100, Math.round((Number(row.actualAmount) / Number(row.budgetAmount)) * 100))
}
function budgetColor(row: any) {
  const pct = row.budgetAmount ? Number(row.actualAmount) / Number(row.budgetAmount) : 0
  if (pct > 1) return '#F56C6C'
  if (pct > 0.9) return '#E6A23C'
  if (pct > 0.8) return '#E6A23C'
  return '#67C23A'
}

const varianceClass = computed(() => {
  const v = varianceData.value?.summary?.totalVariance || 0
  return v >= 0 ? 'text-success' : 'text-danger'
})
const cpiClass = computed(() => {
  const c = varianceData.value?.summary?.totalCPI || 0
  return c >= 1 ? 'text-success' : 'text-danger'
})

onMounted(async () => {
  await loadProjects()
  const qProjectId = route.query.projectId
  if (qProjectId) {
    filterProjectId.value = Number(qProjectId)
  }
  await loadAllData()
})

watch(activeTab, () => { loadAllData() })
watch(filterProjectId, () => { loadAllData() })

async function loadProjects() {
  try {
    const res: any = await projectApi.list({ pageSize: 200 })
    projects.value = res.data?.data?.items || res.data?.items || res.data || []
  } catch { projects.value = [] }
}

async function loadAllData() {
  loading.value = true
  try {
    const params: any = {}
    if (filterProjectId.value) params.projectId = filterProjectId.value

    const [estRes, budRes, alertRes]: any[] = await Promise.all([
      costApi.estimates.list(params),
      costApi.budgets.list(params),
      costApi.alerts.list({ ...params, isResolved: false }),
    ])
    estimates.value = estRes.data?.data || estRes.data || []
    budgets.value = budRes.data?.data || budRes.data || []
    alerts.value = alertRes.data?.data || alertRes.data || []

    if (filterProjectId.value) {
      const [varRes, anaRes]: any[] = await Promise.all([
        costApi.variance(filterProjectId.value),
        costApi.analysis.project(filterProjectId.value),
      ])
      varianceData.value = varRes.data?.data || varRes.data || null
      analysisData.value = anaRes.data?.data || anaRes.data || null
    }
  } catch (e: any) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function createEstimate() {
  if (!estimateForm.value.projectId) {
    ElMessage.warning('请选择项目')
    return
  }
  const versionLabels: Record<string, string> = { 'V1.0': '立项估算', 'V2.0': '设计估算', 'V3.0': '开发估算', 'V4.0': '决算' }
  try {
    await costApi.estimates.create({
      projectId: estimateForm.value.projectId,
      version: estimateForm.value.version,
      versionLabel: versionLabels[estimateForm.value.version] || '',
      remarks: estimateForm.value.remarks,
    })
    ElMessage.success('创建成功')
    showCreateEstimate.value = false
    estimateForm.value = { projectId: undefined, version: 'V1.0', remarks: '' }
    await loadAllData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '创建失败')
  }
}

async function viewEstimate(row: any) {
  try {
    const res: any = await costApi.estimates.get(row.id)
    currentEstimate.value = res.data?.data || res.data
    showEstimateDetail.value = true
  } catch (e: any) {
    ElMessage.error('获取详情失败')
  }
}

function editEstimate(row: any) {
  viewEstimate(row)
}

async function submitEstimate(row: any) {
  try {
    await costApi.estimates.submit(row.id)
    ElMessage.success('已提交审批')
    await loadAllData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  }
}

async function approveEstimate(row: any) {
  try {
    await costApi.estimates.approve(row.id)
    ElMessage.success('已批准')
    await loadAllData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '批准失败')
  }
}

async function publishEstimate(row: any) {
  try {
    await ElMessageBox.confirm('发布后将生成预算记录，确定发布？', '确认发布')
    await costApi.estimates.publish(row.id)
    ElMessage.success('已发布')
    await loadAllData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.message || '发布失败')
  }
}

async function deleteEstimate(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该估算？', '确认删除')
    await costApi.estimates.delete(row.id)
    ElMessage.success('已删除')
    await loadAllData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

async function calculateEstimate(id: number) {
  try {
    await costApi.estimates.calculate(id)
    ElMessage.success('计算完成')
    const res: any = await costApi.estimates.get(id)
    currentEstimate.value = res.data?.data || res.data
    await loadAllData()
  } catch (e: any) {
    ElMessage.error('计算失败')
  }
}

async function addEstimateItem() {
  if (!currentEstimate.value) return
  try {
    await costApi.estimateItems.create(currentEstimate.value.id, itemForm.value)
    ElMessage.success('添加成功')
    showAddItem.value = false
    itemForm.value = { category: 'labor', itemName: '', quantity: 1, unitPrice: 0, unit: '', basisRef: '' }
    const res: any = await costApi.estimates.get(currentEstimate.value.id)
    currentEstimate.value = res.data?.data || res.data
    await loadAllData()
  } catch (e: any) {
    ElMessage.error('添加失败')
  }
}

async function viewBudget(row: any) {
  try {
    const res: any = await costApi.budgets.get(row.id)
    currentBudget.value = res.data?.data || res.data
    showBudgetDetail.value = true
  } catch (e: any) {
    ElMessage.error('获取详情失败')
  }
}

function showAdjustment(row: any) {
  adjustmentForm.value = { costId: row.id, adjustmentType: 'transfer', adjustedAmount: Number(row.budgetAmount), reason: '' }
  showAdjustmentDialog.value = true
}

async function createAdjustment() {
  try {
    await costApi.adjustments.create(adjustmentForm.value)
    ElMessage.success('调整申请已提交')
    showAdjustmentDialog.value = false
    await loadAllData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  }
}

async function addEntry() {
  if (!currentBudget.value) return
  try {
    await costApi.entries.create({ costId: currentBudget.value.id, ...entryForm.value })
    ElMessage.success('添加成功')
    showAddEntry.value = false
    entryForm.value = { entryDate: '', amount: 0, description: '', sourceType: 'manual' }
    const res: any = await costApi.budgets.get(currentBudget.value.id)
    currentBudget.value = res.data?.data || res.data
    await loadAllData()
  } catch (e: any) {
    ElMessage.error('添加失败')
  }
}

async function checkAlerts() {
  if (!filterProjectId.value) return
  try {
    const res: any = await costApi.alerts.check(filterProjectId.value)
    const data = res.data?.data || res.data
    ElMessage.success(`检查完成，新增 ${data.alertsCreated} 条预警`)
    showAlerts.value = true
    await loadAllData()
  } catch (e: any) {
    ElMessage.error('预警检查失败')
  }
}

async function resolveAlert(id: number) {
  try {
    await costApi.alerts.resolve(id)
    ElMessage.success('已解决')
    await loadAllData()
  } catch (e: any) {
    ElMessage.error('操作失败')
  }
}
</script>

<style scoped lang="scss">
.cost-view {
  padding: 0;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  h2 { margin: 0; font-size: 20px; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
}
.kpi-row { margin-bottom: 16px; }
.kpi-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.kpi-value { font-size: 24px; font-weight: bold; color: #303133; }
.text-success { color: #67C23A; }
.text-danger { color: #F56C6C; }
.empty-tip { text-align: center; padding: 40px; color: #909399; }
.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  .alert-message { flex: 1; font-size: 14px; }
}
</style>
