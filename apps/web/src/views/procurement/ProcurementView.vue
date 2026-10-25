<template>
  <div class="procurement-view">
    <div class="page-header">
      <h2>采购管理</h2>
      <div class="header-actions">
        <el-select v-model="filterProjectId" placeholder="选择项目" clearable style="width: 240px" @change="loadAllData">
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="showCreateRequest = true">新建采购申请</el-button>
        <el-button :icon="Bell" @click="showAlerts = true">预警</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="kpi-row">
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value">{{ stats.totalRequests }}</div>
          <div class="kpi-label">采购申请</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value">{{ stats.totalOrders }}</div>
          <div class="kpi-label">采购订单</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value">{{ stats.totalSuppliers }}</div>
          <div class="kpi-label">供应商总数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value">{{ formatMoney(stats.totalOrderAmount) }}</div>
          <div class="kpi-label">采购总金额</div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="采购申请" name="requests">
        <div class="tab-toolbar">
          <el-select v-model="requestFilter.status" placeholder="状态" clearable @change="loadRequests">
            <el-option v-for="(label, key) in REQUEST_STATUS" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="requestFilter.category" placeholder="类别" clearable @change="loadRequests">
            <el-option v-for="(label, key) in PURCHASE_CATEGORIES" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="requests" stripe v-loading="loading">
          <el-table-column prop="requestNo" label="申请编号" width="160" />
          <el-table-column label="项目" min-width="180">
            <template #default="{ row }">{{ row.project?.projectName }}</template>
          </el-table-column>
          <el-table-column label="申请人" width="100">
            <template #default="{ row }">{{ row.applicant?.realName }}</template>
          </el-table-column>
          <el-table-column label="类别" width="100">
            <template #default="{ row }">{{ PURCHASE_CATEGORIES[row.category] || row.category }}</template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">{{ formatMoney(row.totalAmount) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="requestStatusType(row.status)" size="small">{{ REQUEST_STATUS[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewRequest(row)">详情</el-button>
              <el-button v-if="row.status === 'draft'" link type="primary" size="small" @click="submitRequest(row.id)">提交</el-button>
              <el-button v-if="row.status === 'pending'" link type="success" size="small" @click="approveRequest(row.id)">批准</el-button>
              <el-button v-if="row.status === 'approved'" link type="warning" size="small" @click="showCreateOrderFromRequest = true; selectedRequest = row">生成订单</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="采购订单" name="orders">
        <div class="tab-toolbar">
          <el-select v-model="orderFilter.status" placeholder="状态" clearable @change="loadOrders">
            <el-option v-for="(label, key) in ORDER_STATUS" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="orders" stripe v-loading="loading">
          <el-table-column prop="orderNo" label="订单编号" width="160" />
          <el-table-column label="供应商" min-width="160">
            <template #default="{ row }">{{ row.supplier?.supplierName }}</template>
          </el-table-column>
          <el-table-column label="项目" min-width="160">
            <template #default="{ row }">{{ row.request?.project?.projectName || '-' }}</template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">{{ formatMoney(row.totalAmount) }}</template>
          </el-table-column>
          <el-table-column label="交货日期" width="120">
            <template #default="{ row }">{{ row.deliveryDate ? formatDate(row.deliveryDate) : '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="orderStatusType(row.status)" size="small">{{ ORDER_STATUS[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewOrder(row)">详情</el-button>
              <el-button v-if="row.status === 'confirmed'" link type="success" size="small" @click="receiveOrder(row.id)">收货</el-button>
              <el-button v-if="row.status === 'received'" link type="info" size="small" @click="closeOrder(row.id)">关闭</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="供应商管理" name="suppliers">
        <div class="tab-toolbar">
          <el-input v-model="supplierFilter.keyword" placeholder="搜索供应商" clearable @change="loadSuppliers" style="width: 240px" />
          <el-select v-model="supplierFilter.level" placeholder="等级" clearable @change="loadSuppliers">
            <el-option v-for="(label, key) in SUPPLIER_LEVELS" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="suppliers" stripe v-loading="loading">
          <el-table-column prop="supplierCode" label="编码" width="120" />
          <el-table-column prop="supplierName" label="名称" min-width="180" />
          <el-table-column label="类别" width="100">
            <template #default="{ row }">{{ PURCHASE_CATEGORIES[row.category] || '-' }}</template>
          </el-table-column>
          <el-table-column label="等级" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.level" :type="supplierLevelType(row.level)" size="small">{{ SUPPLIER_LEVELS[row.level] || row.level }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="资质状态" width="100">
            <template #default="{ row }">
              <el-tag :type="qualificationStatusType(row.qualificationStatus)" size="small">{{ QUALIFICATION_STATUS[row.qualificationStatus] || row.qualificationStatus || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="评分" width="80" align="center">
            <template #default="{ row }">{{ row.rating || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewSupplier(row)">详情</el-button>
              <el-button v-if="row.qualificationStatus !== 'qualified'" link type="success" size="small" @click="admitSupplier(row)">准入</el-button>
              <el-button v-if="row.qualificationStatus === 'qualified'" link type="danger" size="small" @click="blacklistSupplier(row.id)">拉黑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="供应商评价" name="evaluations">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreateEvaluation = true">新建评价</el-button>
        </div>
        <el-table :data="evaluations" stripe v-loading="loading">
          <el-table-column label="供应商" min-width="180">
            <template #default="{ row }">{{ row.supplier?.supplierName }}</template>
          </el-table-column>
          <el-table-column label="评价日期" width="120">
            <template #default="{ row }">{{ formatDate(row.evaluationDate) }}</template>
          </el-table-column>
          <el-table-column label="质量" width="80" align="center" prop="qualityScore" />
          <el-table-column label="交付" width="80" align="center" prop="deliveryScore" />
          <el-table-column label="成本" width="80" align="center" prop="costScore" />
          <el-table-column label="服务" width="80" align="center" prop="serviceScore" />
          <el-table-column label="总分" width="80" align="center">
            <template #default="{ row }">{{ Number(row.totalScore).toFixed(1) }}</template>
          </el-table-column>
          <el-table-column label="等级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="evaluationLevelType(row.level)" size="small">{{ row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="评价人" width="100">
            <template #default="{ row }">{{ row.evaluator?.realName }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="统计分析" name="stats">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card header="采购概览">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="待审批申请">{{ stats.pendingRequests }}</el-descriptions-item>
                <el-descriptions-item label="进行中订单">{{ stats.activeOrders }}</el-descriptions-item>
                <el-descriptions-item label="合格供应商">{{ stats.qualifiedSuppliers }}</el-descriptions-item>
                <el-descriptions-item label="采购总金额">{{ formatMoney(stats.totalOrderAmount) }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card header="供应商绩效">
              <el-table :data="supplierPerformance" stripe size="small" max-height="300">
                <el-table-column prop="supplierName" label="供应商" />
                <el-table-column prop="level" label="等级" width="80" />
                <el-table-column prop="rating" label="评分" width="80" />
                <el-table-column prop="latestScore" label="最新得分" width="100">
                  <template #default="{ row }">{{ row.latestScore ? Number(row.latestScore).toFixed(1) : '-' }}</template>
                </el-table-column>
                <el-table-column prop="totalOrders" label="订单数" width="80" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- Create Request Dialog -->
    <el-dialog v-model="showCreateRequest" title="新建采购申请" width="700px">
      <el-form :model="requestForm" label-width="100px">
        <el-form-item label="所属项目" required>
          <el-select v-model="requestForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购类别" required>
          <el-select v-model="requestForm.category" style="width: 100%">
            <el-option v-for="(label, key) in PURCHASE_CATEGORIES" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="期望交付日期">
          <el-date-picker v-model="requestForm.expectedDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="采购原因">
          <el-input v-model="requestForm.reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="采购明细">
          <el-table :data="requestForm.items" border size="small">
            <el-table-column label="物料名称" min-width="150">
              <template #default="{ row }"><el-input v-model="row.materialName" size="small" /></template>
            </el-table-column>
            <el-table-column label="规格" width="120">
              <template #default="{ row }"><el-input v-model="row.specification" size="small" /></template>
            </el-table-column>
            <el-table-column label="数量" width="100">
              <template #default="{ row }"><el-input-number v-model="row.quantity" size="small" :min="0" /></template>
            </el-table-column>
            <el-table-column label="单价" width="100">
              <template #default="{ row }"><el-input-number v-model="row.expectedPrice" size="small" :min="0" /></template>
            </el-table-column>
            <el-table-column label="金额" width="100">
              <template #default="{ row }">{{ (row.quantity * row.expectedPrice).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="" width="50">
              <template #default="{ $index }"><el-button link type="danger" @click="requestForm.items.splice($index, 1)">删</el-button></template>
            </el-table-column>
          </el-table>
          <el-button type="primary" link @click="requestForm.items.push({ materialName: '', specification: '', quantity: 0, expectedPrice: 0, unit: '个' })" style="margin-top: 8px">+ 添加行</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateRequest = false">取消</el-button>
        <el-button type="primary" @click="createRequest">创建</el-button>
      </template>
    </el-dialog>

    <!-- Create Order From Request Dialog -->
    <el-dialog v-model="showCreateOrderFromRequest" title="从申请生成订单" width="500px">
      <el-form :model="orderForm" label-width="100px">
        <el-form-item label="供应商" required>
          <el-select v-model="orderForm.supplierId" filterable style="width: 100%">
            <el-option v-for="s in suppliers" :key="s.id" :label="s.supplierName" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="交货日期">
          <el-date-picker v-model="orderForm.deliveryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="付款条款">
          <el-input v-model="orderForm.paymentTerms" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateOrderFromRequest = false">取消</el-button>
        <el-button type="primary" @click="createOrderFromRequest">生成订单</el-button>
      </template>
    </el-dialog>

    <!-- Create Evaluation Dialog -->
    <el-dialog v-model="showCreateEvaluation" title="新建供应商评价" width="500px">
      <el-form :model="evaluationForm" label-width="100px">
        <el-form-item label="供应商" required>
          <el-select v-model="evaluationForm.supplierId" filterable style="width: 100%">
            <el-option v-for="s in suppliers" :key="s.id" :label="s.supplierName" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="质量得分 (40%)" required>
          <el-slider v-model="evaluationForm.qualityScore" :max="100" show-input />
        </el-form-item>
        <el-form-item label="交付得分 (30%)" required>
          <el-slider v-model="evaluationForm.deliveryScore" :max="100" show-input />
        </el-form-item>
        <el-form-item label="成本得分 (20%)" required>
          <el-slider v-model="evaluationForm.costScore" :max="100" show-input />
        </el-form-item>
        <el-form-item label="服务得分 (10%)" required>
          <el-slider v-model="evaluationForm.serviceScore" :max="100" show-input />
        </el-form-item>
        <el-form-item label="评价周期">
          <el-input v-model="evaluationForm.period" placeholder="如 2026-Q4" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="evaluationForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateEvaluation = false">取消</el-button>
        <el-button type="primary" @click="createEvaluation">提交评价</el-button>
      </template>
    </el-dialog>

    <!-- Request Detail Drawer -->
    <el-drawer v-model="showRequestDetail" title="采购申请详情" size="600px">
      <template v-if="currentRequest">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请编号">{{ currentRequest.requestNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="requestStatusType(currentRequest.status)">{{ REQUEST_STATUS[currentRequest.status] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="项目">{{ currentRequest.project?.projectName }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentRequest.applicant?.realName }}</el-descriptions-item>
          <el-descriptions-item label="类别">{{ PURCHASE_CATEGORIES[currentRequest.category] }}</el-descriptions-item>
          <el-descriptions-item label="总金额">{{ formatMoney(currentRequest.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="期望交付日期">{{ currentRequest.expectedDate ? formatDate(currentRequest.expectedDate) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentRequest.createdAt) }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin: 16px 0 8px">采购明细</h4>
        <el-table :data="currentRequest.items" border size="small">
          <el-table-column prop="materialName" label="物料名称" />
          <el-table-column prop="specification" label="规格" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="expectedPrice" label="单价" width="100" />
          <el-table-column label="金额" width="100">
            <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>

    <!-- Order Detail Drawer -->
    <el-drawer v-model="showOrderDetail" title="采购订单详情" size="600px">
      <template v-if="currentOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单编号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="orderStatusType(currentOrder.status)">{{ ORDER_STATUS[currentOrder.status] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentOrder.supplier?.supplierName }}</el-descriptions-item>
          <el-descriptions-item label="总金额">{{ formatMoney(currentOrder.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="下单日期">{{ formatDate(currentOrder.orderDate) }}</el-descriptions-item>
          <el-descriptions-item label="交货日期">{{ currentOrder.deliveryDate ? formatDate(currentOrder.deliveryDate) : '-' }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin: 16px 0 8px">订单明细</h4>
        <el-table :data="currentOrder.items" border size="small">
          <el-table-column prop="materialName" label="物料名称" />
          <el-table-column prop="specification" label="规格" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="unitPrice" label="单价" width="100" />
          <el-table-column label="金额" width="100">
            <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="receivedQty" label="已收货" width="80" />
        </el-table>
      </template>
    </el-drawer>

    <!-- Supplier Detail Drawer -->
    <el-drawer v-model="showSupplierDetail" title="供应商详情" size="600px">
      <template v-if="currentSupplier">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="编码">{{ currentSupplier.supplierCode }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ currentSupplier.supplierName }}</el-descriptions-item>
          <el-descriptions-item label="类别">{{ PURCHASE_CATEGORIES[currentSupplier.category] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="等级">{{ SUPPLIER_LEVELS[currentSupplier.level] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="资质状态">{{ QUALIFICATION_STATUS[currentSupplier.qualificationStatus] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="评分">{{ currentSupplier.rating || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentSupplier.contactName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ currentSupplier.contactPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="准入日期">{{ currentSupplier.admissionDate ? formatDate(currentSupplier.admissionDate) : '-' }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin: 16px 0 8px">最近评价</h4>
        <el-table :data="currentSupplier.evaluations" border size="small" max-height="200">
          <el-table-column label="日期" width="120">
            <template #default="{ row }">{{ formatDate(row.evaluationDate) }}</template>
          </el-table-column>
          <el-table-column prop="totalScore" label="总分" width="80" />
          <el-table-column prop="level" label="等级" width="80" />
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Bell } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { procurementApi, projectApi } from '@/api'
import {
  PURCHASE_CATEGORIES, SUPPLIER_LEVELS, REQUEST_STATUS, ORDER_STATUS,
  QUALIFICATION_STATUS, EVALUATION_LEVELS,
} from '@apqp/shared/constants/procurement.constants'

const activeTab = ref('requests')
const loading = ref(false)
const filterProjectId = ref<number | undefined>()
const projects = ref<any[]>([])
const requests = ref<any[]>([])
const orders = ref<any[]>([])
const suppliers = ref<any[]>([])
const evaluations = ref<any[]>([])
const stats = ref<any>({})
const supplierPerformance = ref<any[]>([])

const requestFilter = ref({ status: '', category: '' })
const orderFilter = ref({ status: '' })
const supplierFilter = ref({ keyword: '', level: '' })

const showCreateRequest = ref(false)
const showCreateOrderFromRequest = ref(false)
const showCreateEvaluation = ref(false)
const showRequestDetail = ref(false)
const showOrderDetail = ref(false)
const showSupplierDetail = ref(false)
const showAlerts = ref(false)

const selectedRequest = ref<any>(null)
const currentRequest = ref<any>(null)
const currentOrder = ref<any>(null)
const currentSupplier = ref<any>(null)

const requestForm = ref({
  projectId: undefined as number | undefined,
  category: 'raw_material',
  expectedDate: '',
  reason: '',
  items: [] as any[],
})

const orderForm = ref({
  supplierId: undefined as number | undefined,
  deliveryDate: '',
  paymentTerms: '',
})

const evaluationForm = ref({
  supplierId: undefined as number | undefined,
  qualityScore: 80,
  deliveryScore: 80,
  costScore: 80,
  serviceScore: 80,
  period: '',
  remarks: '',
})

function formatMoney(val: any) {
  return Number(val || 0).toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

function formatDate(val: any) {
  if (!val) return '-'
  return new Date(val).toLocaleDateString('zh-CN')
}

function requestStatusType(status: string) {
  const map: Record<string, string> = { draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'info', completed: '' }
  return map[status] || 'info'
}

function orderStatusType(status: string) {
  const map: Record<string, string> = { draft: 'info', pending_approval: 'warning', approved: 'success', confirmed: '', in_transit: 'warning', received: 'success', closed: 'info', cancelled: 'danger' }
  return map[status] || 'info'
}

function supplierLevelType(level: string) {
  const map: Record<string, string> = { strategic: 'danger', important: 'warning', general: '', temporary: 'info' }
  return map[level] || 'info'
}

function qualificationStatusType(status: string) {
  const map: Record<string, string> = { pending: 'info', qualified: 'success', probation: 'warning', blacklisted: 'danger' }
  return map[status] || 'info'
}

function evaluationLevelType(level: string) {
  const map: Record<string, string> = { A: 'success', B: '', C: 'warning', D: 'danger' }
  return map[level] || 'info'
}

async function loadAllData() {
  loading.value = true
  try {
    await Promise.all([
      loadProjects(),
      loadRequests(),
      loadOrders(),
      loadSuppliers(),
      loadEvaluations(),
      loadStats(),
      loadSupplierPerformance(),
    ])
  } finally {
    loading.value = false
  }
}

async function loadProjects() {
  const res = await projectApi.list()
  projects.value = res.data || []
}

async function loadRequests() {
  const res = await procurementApi.requests.list({
    projectId: filterProjectId.value,
    status: requestFilter.value.status || undefined,
    category: requestFilter.value.category || undefined,
  })
  requests.value = res.data || []
}

async function loadOrders() {
  const res = await procurementApi.orders.list({
    projectId: filterProjectId.value,
    status: orderFilter.value.status || undefined,
  })
  orders.value = res.data || []
}

async function loadSuppliers() {
  const res = await procurementApi.suppliers.list({
    keyword: supplierFilter.value.keyword || undefined,
    level: supplierFilter.value.level || undefined,
  })
  suppliers.value = res.data || []
}

async function loadEvaluations() {
  const res = await procurementApi.evaluations.list()
  evaluations.value = res.data || []
}

async function loadStats() {
  const res = await procurementApi.stats.overview()
  stats.value = res.data || {}
}

async function loadSupplierPerformance() {
  const res = await procurementApi.stats.supplierPerformance()
  supplierPerformance.value = res.data || []
}

async function createRequest() {
  if (!requestForm.value.projectId) {
    ElMessage.warning('请选择项目')
    return
  }
  const items = requestForm.value.items.map((item) => ({
    ...item,
    amount: item.quantity * item.expectedPrice,
  }))
  await procurementApi.requests.create({ ...requestForm.value, items })
  ElMessage.success('采购申请已创建')
  showCreateRequest.value = false
  requestForm.value = { projectId: undefined, category: 'raw_material', expectedDate: '', reason: '', items: [] }
  await loadRequests()
  await loadStats()
}

async function submitRequest(id: number) {
  await procurementApi.requests.submit(id)
  ElMessage.success('已提交')
  await loadRequests()
}

async function approveRequest(id: number) {
  await procurementApi.requests.approve(id)
  ElMessage.success('已批准')
  await loadRequests()
}

async function viewRequest(row: any) {
  const res = await procurementApi.requests.get(row.id)
  currentRequest.value = res.data
  showRequestDetail.value = true
}

async function createOrderFromRequest() {
  if (!orderForm.value.supplierId) {
    ElMessage.warning('请选择供应商')
    return
  }
  await procurementApi.orders.createFromRequest(selectedRequest.value.id, orderForm.value)
  ElMessage.success('订单已生成')
  showCreateOrderFromRequest.value = false
  orderForm.value = { supplierId: undefined, deliveryDate: '', paymentTerms: '' }
  await loadOrders()
  await loadRequests()
  await loadStats()
}

async function viewOrder(row: any) {
  const res = await procurementApi.orders.get(row.id)
  currentOrder.value = res.data
  showOrderDetail.value = true
}

async function receiveOrder(id: number) {
  const order = await procurementApi.orders.get(id)
  const items = order.data.items.map((item: any) => ({
    itemId: item.id,
    receivedQty: item.quantity,
  }))
  await procurementApi.orders.receive(id, items)
  ElMessage.success('已确认收货')
  await loadOrders()
}

async function closeOrder(id: number) {
  await ElMessageBox.confirm('确认关闭此订单？', '提示')
  await procurementApi.orders.close(id)
  ElMessage.success('订单已关闭')
  await loadOrders()
  await loadStats()
}

async function viewSupplier(row: any) {
  const res = await procurementApi.suppliers.get(row.id)
  currentSupplier.value = res.data
  showSupplierDetail.value = true
}

async function admitSupplier(row: any) {
  await procurementApi.suppliers.admit(row.id, { level: 'general', category: row.category || 'raw_material' })
  ElMessage.success('供应商已准入')
  await loadSuppliers()
}

async function blacklistSupplier(id: number) {
  await ElMessageBox.confirm('确认将此供应商加入黑名单？', '警告', { type: 'warning' })
  await procurementApi.suppliers.blacklist(id)
  ElMessage.success('已加入黑名单')
  await loadSuppliers()
}

async function createEvaluation() {
  if (!evaluationForm.value.supplierId) {
    ElMessage.warning('请选择供应商')
    return
  }
  await procurementApi.evaluations.create(evaluationForm.value)
  ElMessage.success('评价已提交')
  showCreateEvaluation.value = false
  evaluationForm.value = { supplierId: undefined, qualityScore: 80, deliveryScore: 80, costScore: 80, serviceScore: 80, period: '', remarks: '' }
  await loadEvaluations()
  await loadSuppliers()
}

onMounted(() => {
  loadAllData()
})
</script>

<style scoped lang="scss">
.procurement-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 20px;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.kpi-row {
  margin-bottom: 20px;
}

.kpi-card {
  text-align: center;

  .kpi-value {
    font-size: 24px;
    font-weight: bold;
    color: #409eff;
  }

  .kpi-label {
    font-size: 14px;
    color: #909399;
    margin-top: 8px;
  }
}

.tab-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
