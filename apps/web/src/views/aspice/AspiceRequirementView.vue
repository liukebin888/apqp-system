<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>A-SPICE 需求管理</h2>
      <div>
        <el-select
          v-model="selectedProjectId"
          placeholder="选择项目"
          filterable
          style="width: 240px; margin-right: 12px"
          @change="handleProjectChange"
        >
          <el-option
            v-for="p in projectList"
            :key="p.id"
            :label="p.projectName"
            :value="p.id"
          />
        </el-select>
        <el-button type="primary" @click="openCreateReqDialog" :disabled="!selectedProjectId">新建需求</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabChange">
      <!-- ==================== Tab 1: 需求列表 ==================== -->
      <el-tab-pane label="需求列表" name="list">
        <el-card shadow="never">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>需求清单</span>
              <div>
                <el-input
                  v-model="reqFilter.keyword"
                  placeholder="搜索编号/标题"
                  clearable
                  size="small"
                  style="width: 200px; margin-right: 8px"
                  @clear="loadRequirements"
                  @keyup.enter="loadRequirements"
                />
                <el-select v-model="reqFilter.type" placeholder="类型" clearable size="small" style="width: 130px; margin-right: 8px" @change="loadRequirements">
                  <el-option v-for="(label, key) in REQ_TYPE" :key="key" :label="label" :value="key" />
                </el-select>
                <el-select v-model="reqFilter.status" placeholder="状态" clearable size="small" style="width: 120px" @change="loadRequirements">
                  <el-option v-for="(label, key) in REQ_STATUS" :key="key" :label="label" :value="key" />
                </el-select>
              </div>
            </div>
          </template>

          <el-table :data="requirements" border stripe>
            <el-table-column prop="reqNo" label="需求编号" width="160" />
            <el-table-column prop="title" label="需求标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ REQ_TYPE[row.type as keyof typeof REQ_TYPE] || row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="asilLevel" label="ASIL" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.asilLevel" :type="asilTagType(row.asilLevel)" size="small" effect="dark">{{ row.asilLevel }}</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">{{ REQ_STATUS[row.status as keyof typeof REQ_STATUS] || row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="projectName" label="所属项目" width="160" show-overflow-tooltip />
            <el-table-column prop="version" label="版本" width="80" align="center" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewRequirement(row)">详情</el-button>
                <el-button type="warning" link size="small" @click="openEditReqDialog(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="deleteRequirement(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-pagination">
            <el-pagination
              v-model:current-page="reqPagination.page"
              :total="reqPagination.total"
              :page-size="reqPagination.pageSize"
              layout="total, prev, pager, next"
              @current-change="loadRequirements"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ==================== Tab 2: 追溯矩阵 ==================== -->
      <el-tab-pane label="追溯矩阵" name="trace">
        <el-card shadow="never">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>需求追溯矩阵 (Traceability Matrix)</span>
              <el-button type="primary" size="small" @click="loadTraceMatrix" :disabled="!selectedProjectId">刷新</el-button>
            </div>
          </template>

          <el-table :data="traceMatrixData" border stripe>
            <el-table-column prop="reqNo" label="需求编号" width="160" fixed />
            <el-table-column prop="title" label="需求标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="designDoc" label="设计文档" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.designDoc">{{ row.designDoc }}</span>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="testSpec" label="测试规格" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.testSpec">{{ row.testSpec }}</span>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="coverageStatus" label="覆盖状态" width="120">
              <template #default="{ row }">
                <el-tag :type="traceStatusTagType(row.coverageStatus)" size="small">
                  {{ TRACE_STATUS[row.coverageStatus as keyof typeof TRACE_STATUS] || row.coverageStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewRequirement(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ==================== Tab 3: 基线管理 ==================== -->
      <el-tab-pane label="基线管理" name="baseline">
        <el-card shadow="never">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>需求基线 (Requirement Baselines)</span>
              <el-button type="primary" size="small" @click="openBaselineDialog" :disabled="!selectedProjectId">创建基线</el-button>
            </div>
          </template>

          <el-table :data="baselines" border stripe>
            <el-table-column prop="baselineName" label="基线名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="projectName" label="所属项目" width="160" show-overflow-tooltip />
            <el-table-column prop="reqCount" label="需求数量" width="100" align="center" />
            <el-table-column prop="createdAt" label="创建时间" width="120">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="baselineStatusTagType(row.status)" size="small">{{ baselineStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdBy" label="创建人" width="100" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="freezeBaseline(row)">冻结</el-button>
                <el-button type="primary" link size="small" @click="viewBaseline(row)">查看</el-button>
                <el-button v-if="row.status === 'draft'" type="danger" link size="small" @click="deleteBaseline(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ==================== Tab 4: 变更请求 ==================== -->
      <el-tab-pane label="变更请求" name="change">
        <el-card shadow="never">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>需求变更请求 (Change Requests)</span>
              <el-button type="primary" size="small" @click="openChangeRequestDialog" :disabled="!selectedProjectId">发起变更</el-button>
            </div>
          </template>

          <el-table :data="changeRequests" border stripe>
            <el-table-column prop="crNo" label="变更编号" width="160" />
            <el-table-column prop="title" label="变更标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="impactAnalysis" label="影响分析" min-width="180" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="crStatusTagType(row.status)" size="small">{{ crStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="90">
              <template #default="{ row }">
                <el-tag :type="priorityTagType(row.priority)" size="small">{{ priorityLabel(row.priority) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="requestedBy" label="发起人" width="100" />
            <el-table-column prop="createdAt" label="创建时间" width="120">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 'draft'" type="primary" link size="small" @click="submitCR(row)">提交</el-button>
                <el-button v-if="row.status === 'under_review'" type="success" link size="small" @click="approveCR(row)">批准</el-button>
                <el-button v-if="row.status === 'under_review'" type="danger" link size="small" @click="rejectCR(row)">驳回</el-button>
                <el-button type="primary" link size="small" @click="viewChangeRequest(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ==================== Tab 5: 覆盖率分析 ==================== -->
      <el-tab-pane label="覆盖率分析" name="coverage">
        <el-card shadow="never">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>需求覆盖率分析 (Coverage Analysis)</span>
              <el-button type="primary" size="small" @click="loadCoverage" :loading="coverageLoading" :disabled="!selectedProjectId">执行分析</el-button>
            </div>
          </template>

          <div v-if="coverageData">
            <el-row :gutter="20" style="margin-bottom: 20px">
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="总需求数" :value="coverageData.totalCount" />
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="已覆盖" :value="coverageData.coveredCount" value-style="color: #67c23a" />
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="整体覆盖率" :value="coverageData.overallRate" suffix="%" :precision="1" value-style="color: #409eff" />
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="未覆盖" :value="coverageData.uncoveredCount" value-style="color: #f56c6c" />
                </el-card>
              </el-col>
            </el-row>

            <h4 style="margin-bottom: 12px">按需求类型覆盖率明细</h4>
            <el-table :data="coverageData.breakdown || []" border stripe>
              <el-table-column prop="requirementType" label="需求类型" width="160">
                <template #default="{ row }">
                  {{ REQ_TYPE[row.requirementType as keyof typeof REQ_TYPE] || row.requirementType }}
                </template>
              </el-table-column>
              <el-table-column prop="totalCount" label="总数" width="120" align="center" />
              <el-table-column prop="coveredCount" label="已覆盖" width="120" align="center" />
              <el-table-column label="覆盖率 (%)" min-width="200">
                <template #default="{ row }">
                  <div style="display: flex; align-items: center; gap: 8px">
                    <el-progress
                      :percentage="row.coverageRate"
                      :color="coverageColor(row.coverageRate)"
                      :stroke-width="16"
                      :text-inside="true"
                      style="flex: 1"
                    />
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="请选择项目并点击「执行分析」查看覆盖率" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== 新建/编辑需求对话框 ==================== -->
    <el-dialog v-model="showReqDialog" :title="editingReqId ? '编辑需求' : '新建需求'" width="700px" destroy-on-close>
      <el-form :model="reqForm" label-width="120px">
        <el-form-item label="需求标题" required>
          <el-input v-model="reqForm.title" placeholder="输入需求标题" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属项目" required>
              <el-select v-model="reqForm.projectId" placeholder="选择项目" filterable style="width: 100%">
                <el-option v-for="p in projectList" :key="p.id" :label="p.projectName" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="需求类型" required>
              <el-select v-model="reqForm.type" style="width: 100%">
                <el-option v-for="(label, key) in REQ_TYPE" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="需求描述">
          <el-input v-model="reqForm.description" type="textarea" :rows="4" placeholder="详细描述需求内容" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="ASIL 等级">
              <el-select v-model="reqForm.asilLevel" clearable style="width: 100%">
                <el-option label="QM" value="QM" />
                <el-option label="ASIL A" value="A" />
                <el-option label="ASIL B" value="B" />
                <el-option label="ASIL C" value="C" />
                <el-option label="ASIL D" value="D" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="A-SPICE 等级">
              <el-select v-model="reqForm.aspiceLevel" clearable style="width: 100%">
                <el-option v-for="(label, key) in ASPICE_LEVEL" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="需求理由">
          <el-input v-model="reqForm.rationale" type="textarea" :rows="2" placeholder="说明需求的背景和理由" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReqDialog = false">取消</el-button>
        <el-button type="primary" :loading="reqSubmitting" @click="submitRequirement">
          {{ editingReqId ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 需求详情对话框 ==================== -->
    <el-dialog v-model="showDetailDialog" title="需求详情" width="800px">
      <div v-if="selectedReq">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="需求编号">{{ selectedReq.reqNo }}</el-descriptions-item>
          <el-descriptions-item label="版本">V{{ selectedReq.version }}</el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ selectedReq.title }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag size="small">{{ REQ_TYPE[selectedReq.type as keyof typeof REQ_TYPE] || selectedReq.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(selectedReq.status)" size="small">
              {{ REQ_STATUS[selectedReq.status as keyof typeof REQ_STATUS] || selectedReq.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="ASIL 等级">
            <el-tag v-if="selectedReq.asilLevel" :type="asilTagType(selectedReq.asilLevel)" size="small" effect="dark">{{ selectedReq.asilLevel }}</el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="A-SPICE 等级">
            {{ ASPICE_LEVEL[selectedReq.aspiceLevel as keyof typeof ASPICE_LEVEL] || selectedReq.aspiceLevel || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedReq.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="需求理由" :span="2">{{ selectedReq.rationale || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所属项目">{{ selectedReq.projectName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedReq.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- ==================== 创建基线对话框 ==================== -->
    <el-dialog v-model="showBaselineDialog" title="创建基线" width="600px" destroy-on-close>
      <el-form :model="baselineForm" label-width="120px">
        <el-form-item label="基线名称" required>
          <el-input v-model="baselineForm.name" placeholder="输入基线名称" />
        </el-form-item>
        <el-form-item label="所属项目" required>
          <el-select v-model="baselineForm.projectId" placeholder="选择项目" filterable style="width: 100%">
            <el-option v-for="p in projectList" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="baselineForm.description" type="textarea" :rows="3" placeholder="基线描述" />
        </el-form-item>
        <el-form-item label="基线日期" required>
          <el-date-picker v-model="baselineForm.baselineDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBaselineDialog = false">取消</el-button>
        <el-button type="primary" :loading="baselineSubmitting" @click="submitBaseline">创建</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 变更请求对话框 ==================== -->
    <el-dialog v-model="showCRDialog" title="发起变更请求" width="650px" destroy-on-close>
      <el-form :model="crForm" label-width="120px">
        <el-form-item label="变更标题" required>
          <el-input v-model="crForm.title" placeholder="输入变更标题" />
        </el-form-item>
        <el-form-item label="所属项目" required>
          <el-select v-model="crForm.projectId" placeholder="选择项目" filterable style="width: 100%">
            <el-option v-for="p in projectList" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更描述">
          <el-input v-model="crForm.description" type="textarea" :rows="3" placeholder="详细描述变更内容" />
        </el-form-item>
        <el-form-item label="影响分析">
          <el-input v-model="crForm.impactAnalysis" type="textarea" :rows="3" placeholder="分析变更对项目的影响" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级" required>
              <el-select v-model="crForm.priority" style="width: 100%">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="变更原因">
              <el-input v-model="crForm.reason" placeholder="变更原因" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showCRDialog = false">取消</el-button>
        <el-button type="primary" :loading="crSubmitting" @click="submitChangeRequest">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { requirementApi, projectApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

// ==================== A-SPICE V4.0 Constants ====================

const REQ_TYPE = {
  functional: '功能需求',
  non_functional: '非功能需求',
  interface: '接口需求',
  safety: '安全需求',
  security: '安全需求',
} as const

const REQ_STATUS = {
  draft: '草稿',
  reviewed: '已评审',
  approved: '已批准',
  implemented: '已实现',
  verified: '已验证',
} as const

const ASPICE_LEVEL = {
  '0': 'Level 0',
  '1': 'Level 1',
  '2': 'Level 2',
  '3': 'Level 3',
} as const

const TRACE_STATUS = {
  linked: '已关联',
  unlinked: '未关联',
  partial: '部分关联',
} as const

// ==================== State ====================

const loading = ref(false)
const activeTab = ref('list')
const selectedProjectId = ref<number | ''>('')
const projectList = ref<any[]>([])

// Requirements list state
const requirements = ref<any[]>([])
const reqFilter = reactive({ keyword: '', type: '', status: '' })
const reqPagination = reactive({ page: 1, pageSize: 20, total: 0 })

// Trace matrix state
const traceMatrixData = ref<any[]>([])

// Baseline state
const baselines = ref<any[]>([])

// Change request state
const changeRequests = ref<any[]>([])

// Coverage state
const coverageData = ref<any>(null)
const coverageLoading = ref(false)

// Dialogs
const showReqDialog = ref(false)
const showDetailDialog = ref(false)
const showBaselineDialog = ref(false)
const showCRDialog = ref(false)
const editingReqId = ref<number | null>(null)
const selectedReq = ref<any>(null)
const reqSubmitting = ref(false)
const baselineSubmitting = ref(false)
const crSubmitting = ref(false)

// Forms
const reqForm = reactive({
  title: '',
  projectId: null as number | null,
  type: 'functional',
  description: '',
  asilLevel: '',
  aspiceLevel: '',
  rationale: '',
})

const baselineForm = reactive({
  name: '',
  projectId: null as number | null,
  description: '',
  baselineDate: '',
})

const crForm = reactive({
  title: '',
  projectId: null as number | null,
  description: '',
  impactAnalysis: '',
  priority: 'medium',
  reason: '',
})

// ==================== Helper Functions ====================

function formatDate(d: string | null | undefined) {
  return d ? dayjs(d).format('YYYY-MM-DD') : '-'
}

function asilTagType(level: string) {
  if (level === 'D') return 'danger'
  if (level === 'C') return 'warning'
  if (level === 'B') return ''
  return 'info'
}

function statusTagType(status: string) {
  const map: Record<string, string> = {
    draft: 'info',
    reviewed: '',
    approved: 'success',
    implemented: 'success',
    verified: 'success',
  }
  return map[status] || 'info'
}

function traceStatusTagType(status: string) {
  const map: Record<string, string> = {
    linked: 'success',
    unlinked: 'danger',
    partial: 'warning',
  }
  return map[status] || 'info'
}

function baselineStatusTagType(status: string) {
  const map: Record<string, string> = {
    draft: 'info',
    frozen: 'success',
    released: 'success',
    changed: 'warning',
  }
  return map[status] || 'info'
}

function baselineStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: '草稿',
    frozen: '已冻结',
    released: '已发布',
    changed: '已变更',
  }
  return map[status] || status
}

function crStatusTagType(status: string) {
  const map: Record<string, string> = {
    draft: 'info',
    submitted: '',
    under_review: 'warning',
    approved: 'success',
    rejected: 'danger',
    implemented: 'success',
  }
  return map[status] || 'info'
}

function crStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    under_review: '评审中',
    approved: '已批准',
    rejected: '已驳回',
    implemented: '已实施',
  }
  return map[status] || status
}

function priorityTagType(priority: string) {
  const map: Record<string, string> = { high: 'danger', medium: 'warning', low: 'info' }
  return map[priority] || 'info'
}

function priorityLabel(priority: string) {
  const map: Record<string, string> = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

function coverageColor(rate: number) {
  if (rate >= 80) return '#67c23a'
  if (rate >= 50) return '#e6a23c'
  return '#f56c6c'
}

// ==================== Data Loading ====================

async function loadProjects() {
  try {
    const res: any = await projectApi.list({ page: 1, pageSize: 200 })
    projectList.value = res.data?.data?.items || res.data?.items || res.data?.data || res || []
    if (projectList.value.length > 0 && !selectedProjectId.value) {
      selectedProjectId.value = projectList.value[0].id
      handleProjectChange(selectedProjectId.value)
    }
  } catch (e) {
    console.error('Failed to load projects', e)
  }
}

function handleProjectChange(projectId: number) {
  selectedProjectId.value = projectId
  // Reload data for the active tab
  loadRequirements()
  if (activeTab.value === 'trace') loadTraceMatrix()
  if (activeTab.value === 'baseline') loadBaselines()
  if (activeTab.value === 'change') loadChangeRequests()
  if (activeTab.value === 'coverage' && coverageData.value) loadCoverage()
}

async function loadRequirements() {
  if (!selectedProjectId.value) return
  loading.value = true
  try {
    const params: any = { page: reqPagination.page, pageSize: reqPagination.pageSize }
    if (reqFilter.keyword) params.keyword = reqFilter.keyword
    if (reqFilter.type) params.reqType = reqFilter.type
    if (reqFilter.status) params.status = reqFilter.status
    const res: any = await requirementApi.list(selectedProjectId.value as number, params)
    requirements.value = res.data?.data?.items || res.data?.items || res.data?.data || []
    reqPagination.total = res.data?.data?.total || res.data?.total || requirements.value.length
  } catch (e) {
    console.error('Failed to load requirements', e)
  } finally {
    loading.value = false
  }
}

async function loadTraceMatrix() {
  if (!selectedProjectId.value) return
  try {
    const res: any = await requirementApi.traceMatrix(selectedProjectId.value as number)
    traceMatrixData.value = res.data?.data?.items || res.data?.data || res.data?.items || (Array.isArray(res) ? res : [])
  } catch (e) {
    console.error('Failed to load trace matrix', e)
  }
}

async function loadBaselines() {
  if (!selectedProjectId.value) return
  try {
    const res: any = await requirementApi.baselines(selectedProjectId.value as number)
    baselines.value = res.data?.data?.items || res.data?.data || res.data?.items || (Array.isArray(res) ? res : [])
  } catch (e) {
    console.error('Failed to load baselines', e)
  }
}

async function loadChangeRequests() {
  if (!selectedProjectId.value) return
  try {
    const res: any = await requirementApi.changeRequests(selectedProjectId.value as number, { page: 1, pageSize: 100 })
    changeRequests.value = res.data?.data?.items || res.data?.items || res.data?.data || []
  } catch (e) {
    console.error('Failed to load change requests', e)
  }
}

async function loadCoverage() {
  if (!selectedProjectId.value) return
  coverageLoading.value = true
  try {
    const res: any = await requirementApi.coverage(selectedProjectId.value as number)
    coverageData.value = res
  } catch (e) {
    console.error('Failed to load coverage', e)
  } finally {
    coverageLoading.value = false
  }
}

function handleTabChange(tab: any) {
  const name = tab.paneName
  if (name === 'list') loadRequirements()
  if (name === 'trace') loadTraceMatrix()
  if (name === 'baseline') loadBaselines()
  if (name === 'change') loadChangeRequests()
  if (name === 'coverage') loadCoverage()
}

// ==================== Requirement CRUD ====================

function openCreateReqDialog() {
  editingReqId.value = null
  Object.assign(reqForm, {
    title: '',
    projectId: selectedProjectId.value || null,
    type: 'functional',
    description: '',
    asilLevel: '',
    aspiceLevel: '',
    rationale: '',
  })
  showReqDialog.value = true
}

function openEditReqDialog(row: any) {
  editingReqId.value = row.id
  Object.assign(reqForm, {
    title: row.title || '',
    projectId: row.projectId || selectedProjectId.value || null,
    type: row.type || 'functional',
    description: row.description || '',
    asilLevel: row.asilLevel || '',
    aspiceLevel: row.aspiceLevel || '',
    rationale: row.rationale || '',
  })
  showReqDialog.value = true
}

async function submitRequirement() {
  if (!reqForm.title) {
    ElMessage.warning('请填写需求标题')
    return
  }
  if (!reqForm.projectId) {
    ElMessage.warning('请选择所属项目')
    return
  }
  reqSubmitting.value = true
  try {
    const pid = reqForm.projectId as number
    if (editingReqId.value) {
      await requirementApi.update(pid, editingReqId.value, { ...reqForm })
      ElMessage.success('需求更新成功')
    } else {
      await requirementApi.create(pid, { ...reqForm })
      ElMessage.success('需求创建成功')
    }
    showReqDialog.value = false
    await loadRequirements()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    reqSubmitting.value = false
  }
}

async function viewRequirement(row: any) {
  try {
    const pid = (row.projectId || selectedProjectId.value) as number
    const res: any = await requirementApi.get(pid, row.id)
    selectedReq.value = res
    showDetailDialog.value = true
  } catch (e: any) {
    ElMessage.error(e.message || '获取详情失败')
  }
}

async function deleteRequirement(id: number) {
  try {
    await ElMessageBox.confirm('确定删除此需求？', '提示', { type: 'warning' })
    await requirementApi.delete(selectedProjectId.value as number, id)
    ElMessage.success('删除成功')
    await loadRequirements()
  } catch {
    // cancelled or error
  }
}

// ==================== Baseline ====================

function openBaselineDialog() {
  Object.assign(baselineForm, {
    name: '',
    projectId: selectedProjectId.value || null,
    description: '',
    baselineDate: dayjs().format('YYYY-MM-DD'),
  })
  showBaselineDialog.value = true
}

async function submitBaseline() {
  if (!baselineForm.name) {
    ElMessage.warning('请填写基线名称')
    return
  }
  if (!baselineForm.projectId) {
    ElMessage.warning('请选择所属项目')
    return
  }
  baselineSubmitting.value = true
  try {
    await requirementApi.createBaseline(baselineForm.projectId as number, { ...baselineForm })
    ElMessage.success('基线创建成功')
    showBaselineDialog.value = false
    await loadBaselines()
  } catch (e: any) {
    ElMessage.error(e.message || '创建失败')
  } finally {
    baselineSubmitting.value = false
  }
}

async function freezeBaseline(baseline: any) {
  try {
    await ElMessageBox.confirm('冻结后基线将不可修改，确定冻结？', '提示', { type: 'warning' })
    await requirementApi.updateBaselineStatus(selectedProjectId.value as number, baseline.id, 'frozen')
    ElMessage.success('基线已冻结')
    await loadBaselines()
  } catch {
    // cancelled
  }
}

function viewBaseline(baseline: any) {
  ElMessage.info(`查看基线: ${baseline.baselineName}`)
}

async function deleteBaseline(baseline: any) {
  try {
    await ElMessageBox.confirm(`确定删除基线「${baseline.baselineName}」？`, '提示', { type: 'warning' })
    // Use updateBaselineStatus with a deleted status or a dedicated API if available
    await requirementApi.updateBaselineStatus(selectedProjectId.value as number, baseline.id, 'deleted')
    ElMessage.success('基线已删除')
    await loadBaselines()
  } catch {
    // cancelled
  }
}

// ==================== Change Request ====================

function openChangeRequestDialog() {
  Object.assign(crForm, {
    title: '',
    projectId: selectedProjectId.value || null,
    description: '',
    impactAnalysis: '',
    priority: 'medium',
    reason: '',
  })
  showCRDialog.value = true
}

async function submitChangeRequest() {
  if (!crForm.title) {
    ElMessage.warning('请填写变更标题')
    return
  }
  if (!crForm.projectId) {
    ElMessage.warning('请选择所属项目')
    return
  }
  crSubmitting.value = true
  try {
    await requirementApi.createChangeRequest(crForm.projectId as number, { ...crForm })
    ElMessage.success('变更请求已提交')
    showCRDialog.value = false
    await loadChangeRequests()
  } catch (e: any) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    crSubmitting.value = false
  }
}

async function submitCR(cr: any) {
  try {
    await requirementApi.updateChangeRequestStatus(selectedProjectId.value as number, cr.id, 'submitted')
    ElMessage.success('变更请求已提交')
    await loadChangeRequests()
  } catch (e: any) {
    ElMessage.error(e.message || '提交失败')
  }
}

async function approveCR(cr: any) {
  try {
    await requirementApi.updateChangeRequestStatus(selectedProjectId.value as number, cr.id, 'approved')
    ElMessage.success('变更请求已批准')
    await loadChangeRequests()
  } catch (e: any) {
    ElMessage.error(e.message || '批准失败')
  }
}

async function rejectCR(cr: any) {
  try {
    await ElMessageBox.confirm('确定驳回此变更请求？', '提示', { type: 'warning' })
    await requirementApi.updateChangeRequestStatus(selectedProjectId.value as number, cr.id, 'rejected')
    ElMessage.success('变更请求已驳回')
    await loadChangeRequests()
  } catch {
    // cancelled
  }
}

function viewChangeRequest(cr: any) {
  ElMessage.info(`查看变更请求: ${cr.crNo || cr.title}`)
}

// ==================== Lifecycle ====================

onMounted(async () => {
  await loadProjects()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
