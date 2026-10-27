<template>
  <div class="supplier-collab-view">
    <h2>供方协同</h2>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: 供方APQP -->
      <el-tab-pane label="供方APQP" name="apqp">
        <div class="tab-toolbar">
          <el-form :inline="true" :model="devFilters" class="filter-form">
            <el-form-item label="开发编号">
              <el-input v-model="devFilters.devNo" placeholder="请输入开发编号" clearable />
            </el-form-item>
            <el-form-item label="供应商">
              <el-input v-model="devFilters.supplierName" placeholder="请输入供应商名称" clearable />
            </el-form-item>
            <el-form-item label="阶段">
              <el-select v-model="devFilters.stage" placeholder="请选择阶段" clearable>
                <el-option
                  v-for="item in SUPPLIER_DEV_STAGE"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchDevelopments">查询</el-button>
              <el-button @click="resetDevFilters">重置</el-button>
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="openDevDialog()">新增供方APQP</el-button>
        </div>

        <el-table :data="developmentList" v-loading="devLoading" border stripe>
          <el-table-column prop="devNo" label="开发编号" min-width="140" />
          <el-table-column prop="supplierName" label="供应商" min-width="160" />
          <el-table-column prop="projectName" label="项目名称" min-width="160" />
          <el-table-column prop="stage" label="阶段" min-width="120">
            <template #default="{ row }">
              <el-tag>{{ getStageLabel(row.stage) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="progressRate" label="进度(%)" min-width="100">
            <template #default="{ row }">
              <el-progress :percentage="row.progressRate ?? 0" :stroke-width="8" />
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始日期" min-width="120" />
          <el-table-column prop="targetDate" label="目标日期" min-width="120" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDevDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDeleteDev(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-if="devTotal > devPageSize"
          class="pagination"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="devTotal"
          :page-size="devPageSize"
          :current-page="devPage"
          @current-change="onDevPageChange"
          @size-change="onDevSizeChange"
        />
      </el-tab-pane>

      <!-- Tab 2: 供方8D -->
      <el-tab-pane label="供方8D" name="8d">
        <div class="tab-toolbar">
          <el-form :inline="true" :model="eightDFilters" class="filter-form">
            <el-form-item label="报告编号">
              <el-input v-model="eightDFilters.reportNo" placeholder="请输入报告编号" clearable />
            </el-form-item>
            <el-form-item label="供应商">
              <el-input v-model="eightDFilters.supplierName" placeholder="请输入供应商名称" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="eightDFilters.status" placeholder="请选择状态" clearable>
                <el-option
                  v-for="item in SUPPLIER_8D_STATUS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetch8Ds">查询</el-button>
              <el-button @click="reset8DFilters">重置</el-button>
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="open8DDialog()">新增8D报告</el-button>
        </div>

        <el-table :data="eightDList" v-loading="eightDLoading" border stripe>
          <el-table-column prop="reportNo" label="报告编号" min-width="140" />
          <el-table-column prop="supplierName" label="供应商" min-width="160" />
          <el-table-column prop="issueDescription" label="问题描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" min-width="120">
            <template #default="{ row }">
              <el-tag :type="get8DStatusType(row.status)">{{ get8DStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="rootCause" label="根本原因" min-width="180" show-overflow-tooltip />
          <el-table-column prop="correctiveAction" label="纠正措施" min-width="180" show-overflow-tooltip />
          <el-table-column prop="dueDate" label="到期日期" min-width="120" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="open8DDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete8D(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-if="eightDTotal > eightDPageSize"
          class="pagination"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="eightDTotal"
          :page-size="eightDPageSize"
          :current-page="eightDPage"
          @current-change="on8DPageChange"
          @size-change="on8DSizeChange"
        />
      </el-tab-pane>

      <!-- Tab 3: 供方绩效 -->
      <el-tab-pane label="供方绩效" name="performance">
        <div class="tab-toolbar">
          <el-form :inline="true" :model="perfFilters" class="filter-form">
            <el-form-item label="评价编号">
              <el-input v-model="perfFilters.evalNo" placeholder="请输入评价编号" clearable />
            </el-form-item>
            <el-form-item label="供应商">
              <el-input v-model="perfFilters.supplierName" placeholder="请输入供应商名称" clearable />
            </el-form-item>
            <el-form-item label="周期">
              <el-select v-model="perfFilters.period" placeholder="请选择周期" clearable>
                <el-option
                  v-for="item in SUPPLIER_PERIOD"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="等级">
              <el-select v-model="perfFilters.grade" placeholder="请选择等级" clearable>
                <el-option
                  v-for="item in SUPPLIER_GRADE"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchPerformances">查询</el-button>
              <el-button @click="resetPerfFilters">重置</el-button>
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="openPerfDialog()">新增绩效评价</el-button>
        </div>

        <el-table :data="performanceList" v-loading="perfLoading" border stripe>
          <el-table-column prop="evalNo" label="评价编号" min-width="140" />
          <el-table-column prop="supplierName" label="供应商" min-width="160" />
          <el-table-column prop="period" label="周期" min-width="100">
            <template #default="{ row }">
              {{ getPeriodLabel(row.period) }}
            </template>
          </el-table-column>
          <el-table-column prop="qualityScore" label="质量得分" min-width="100" align="center" />
          <el-table-column prop="deliveryScore" label="交付得分" min-width="100" align="center" />
          <el-table-column prop="responseScore" label="响应得分" min-width="100" align="center" />
          <el-table-column prop="totalScore" label="总分" min-width="80" align="center" />
          <el-table-column prop="grade" label="等级" min-width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getGradeTagType(row.grade)">{{ row.grade }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openPerfDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDeletePerf(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-if="perfTotal > perfPageSize"
          class="pagination"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="perfTotal"
          :page-size="perfPageSize"
          :current-page="perfPage"
          @current-change="onPerfPageChange"
          @size-change="onPerfSizeChange"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- Dialog: 供方APQP -->
    <el-dialog
      v-model="devDialogVisible"
      :title="devForm.id ? '编辑供方APQP' : '新增供方APQP'"
      width="640px"
      destroy-on-close
    >
      <el-form ref="devFormRef" :model="devForm" :rules="devRules" label-width="100px">
        <el-form-item label="供应商" prop="supplierName">
          <el-input v-model="devForm.supplierName" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="devForm.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="阶段" prop="stage">
          <el-select v-model="devForm.stage" placeholder="请选择阶段" style="width: 100%">
            <el-option
              v-for="item in SUPPLIER_DEV_STAGE"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="devForm.startDate"
            type="date"
            placeholder="请选择开始日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="目标日期" prop="targetDate">
          <el-date-picker
            v-model="devForm.targetDate"
            type="date"
            placeholder="请选择目标日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="devForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="里程碑" prop="milestones">
          <el-input v-model="devForm.milestones" type="textarea" :rows="4" placeholder="请输入里程碑，每行一个" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="devDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="devSubmitting" @click="submitDevForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- Dialog: 供方8D -->
    <el-dialog
      v-model="eightDDialogVisible"
      :title="eightDForm.id ? '编辑8D报告' : '新增8D报告'"
      width="720px"
      destroy-on-close
    >
      <el-form ref="eightDFormRef" :model="eightDForm" :rules="eightDRules" label-width="100px">
        <el-form-item label="供应商" prop="supplierName">
          <el-input v-model="eightDForm.supplierName" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="问题描述" prop="issueDescription">
          <el-input v-model="eightDForm.issueDescription" type="textarea" :rows="3" placeholder="请输入问题描述" />
        </el-form-item>
        <el-form-item label="D1 团队" prop="d1Team">
          <el-input v-model="eightDForm.d1Team" placeholder="请输入团队成员" />
        </el-form-item>
        <el-form-item label="D2 问题说明" prop="d2Description">
          <el-input v-model="eightDForm.d2Description" type="textarea" :rows="2" placeholder="请详细描述问题" />
        </el-form-item>
        <el-form-item label="D3 围堵措施" prop="d3Containment">
          <el-input v-model="eightDForm.d3Containment" type="textarea" :rows="2" placeholder="请输入临时围堵措施" />
        </el-form-item>
        <el-form-item label="D4 根本原因" prop="d4RootCause">
          <el-input v-model="eightDForm.d4RootCause" type="textarea" :rows="2" placeholder="请输入根本原因分析" />
        </el-form-item>
        <el-form-item label="D5 纠正措施" prop="d5CorrectiveAction">
          <el-input v-model="eightDForm.d5CorrectiveAction" type="textarea" :rows="2" placeholder="请输入永久纠正措施" />
        </el-form-item>
        <el-form-item label="D6 验证" prop="d6Verification">
          <el-input v-model="eightDForm.d6Verification" type="textarea" :rows="2" placeholder="请输入措施验证结果" />
        </el-form-item>
        <el-form-item label="D7 预防" prop="d7Prevention">
          <el-input v-model="eightDForm.d7Prevention" type="textarea" :rows="2" placeholder="请输入预防措施" />
        </el-form-item>
        <el-form-item label="D8 祝贺" prop="d8Congratulate">
          <el-input v-model="eightDForm.d8Congratulate" type="textarea" :rows="2" placeholder="请输入团队认可与总结" />
        </el-form-item>
        <el-form-item label="到期日期" prop="dueDate">
          <el-date-picker
            v-model="eightDForm.dueDate"
            type="date"
            placeholder="请选择到期日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="eightDDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="eightDSubmitting" @click="submit8DForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- Dialog: 供方绩效 -->
    <el-dialog
      v-model="perfDialogVisible"
      :title="perfForm.id ? '编辑绩效评价' : '新增绩效评价'"
      width="600px"
      destroy-on-close
    >
      <el-form ref="perfFormRef" :model="perfForm" :rules="perfRules" label-width="100px">
        <el-form-item label="供应商" prop="supplierName">
          <el-input v-model="perfForm.supplierName" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="评价周期" prop="period">
          <el-select v-model="perfForm.period" placeholder="请选择评价周期" style="width: 100%">
            <el-option
              v-for="item in SUPPLIER_PERIOD"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="质量得分" prop="qualityScore">
          <el-input-number v-model="perfForm.qualityScore" :min="0" :max="100" :precision="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="交付得分" prop="deliveryScore">
          <el-input-number v-model="perfForm.deliveryScore" :min="0" :max="100" :precision="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="响应得分" prop="responseScore">
          <el-input-number v-model="perfForm.responseScore" :min="0" :max="100" :precision="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="comments">
          <el-input v-model="perfForm.comments" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="perfDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="perfSubmitting" @click="submitPerfForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { supplierCollabApi } from '@/api'
import {
  SUPPLIER_DEV_STAGE,
  SUPPLIER_8D_STATUS,
  SUPPLIER_GRADE,
  SUPPLIER_PERIOD,
} from '@apqp/shared'

// ======================== Active Tab ========================
const activeTab = ref('apqp')

// ======================== Helper Functions ========================
function getStageLabel(value: string): string {
  return SUPPLIER_DEV_STAGE.find((s) => s.value === value)?.label ?? value
}

function get8DStatusLabel(value: string): string {
  return SUPPLIER_8D_STATUS.find((s) => s.value === value)?.label ?? value
}

function get8DStatusType(value: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    open: 'danger',
    in_progress: 'warning',
    closed: 'success',
  }
  return map[value] ?? 'info'
}

function getPeriodLabel(value: string): string {
  return SUPPLIER_PERIOD.find((p) => p.value === value)?.label ?? value
}

function getGradeTagType(grade: string): '' | 'success' | 'warning' | 'info' | 'danger' | 'primary' {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    A: 'success',
    B: 'primary',
    C: 'warning',
    D: 'danger',
  }
  return map[grade] ?? 'info'
}

// ======================== Tab 1: 供方APQP ========================
const devLoading = ref(false)
const developmentList = ref<any[]>([])
const devTotal = ref(0)
const devPage = ref(1)
const devPageSize = ref(20)

const devFilters = reactive({
  devNo: '',
  supplierName: '',
  stage: '',
})

function resetDevFilters() {
  devFilters.devNo = ''
  devFilters.supplierName = ''
  devFilters.stage = ''
  devPage.value = 1
  fetchDevelopments()
}

async function fetchDevelopments() {
  devLoading.value = true
  try {
    const params: Record<string, any> = {
      page: devPage.value,
      pageSize: devPageSize.value,
    }
    if (devFilters.devNo) params.devNo = devFilters.devNo
    if (devFilters.supplierName) params.supplierName = devFilters.supplierName
    if (devFilters.stage) params.stage = devFilters.stage

    const res = await supplierCollabApi.developments.list(params)
    developmentList.value = res.data?.data?.items || res.data?.items || res.data?.data || []
    devTotal.value = res.data?.data?.total ?? res.data?.total ?? 0
  } catch (e) {
    ElMessage.error('获取供方APQP列表失败')
  } finally {
    devLoading.value = false
  }
}

function onDevPageChange(page: number) {
  devPage.value = page
  fetchDevelopments()
}

function onDevSizeChange(size: number) {
  devPageSize.value = size
  devPage.value = 1
  fetchDevelopments()
}

// Dev Dialog
const devDialogVisible = ref(false)
const devSubmitting = ref(false)
const devFormRef = ref<FormInstance>()

const initialDevForm = () => ({
  id: undefined as string | undefined,
  supplierName: '',
  projectName: '',
  stage: '',
  startDate: '',
  targetDate: '',
  description: '',
  milestones: '',
})

const devForm = reactive(initialDevForm())

const devRules: FormRules = {
  supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  stage: [{ required: true, message: '请选择阶段', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  targetDate: [{ required: true, message: '请选择目标日期', trigger: 'change' }],
}

function openDevDialog(row?: any) {
  Object.assign(devForm, initialDevForm())
  if (row) {
    Object.assign(devForm, {
      id: row.id,
      supplierName: row.supplierName,
      projectName: row.projectName,
      stage: row.stage,
      startDate: row.startDate,
      targetDate: row.targetDate,
      description: row.description ?? '',
      milestones: row.milestones ?? '',
    })
  }
  devDialogVisible.value = true
}

async function submitDevForm() {
  const valid = await devFormRef.value?.validate().catch(() => false)
  if (!valid) return

  devSubmitting.value = true
  try {
    const payload = { ...devForm }
    if (devForm.id) {
      await supplierCollabApi.developments.update(devForm.id, payload)
      ElMessage.success('更新成功')
    } else {
      await supplierCollabApi.developments.create(payload)
      ElMessage.success('创建成功')
    }
    devDialogVisible.value = false
    fetchDevelopments()
  } catch (e) {
    ElMessage.error(devForm.id ? '更新失败' : '创建失败')
  } finally {
    devSubmitting.value = false
  }
}

async function handleDeleteDev(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除该供方APQP记录（${row.devNo}）？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await supplierCollabApi.developments.delete(row.id)
    ElMessage.success('删除成功')
    fetchDevelopments()
  } catch {
    // cancelled or error
  }
}

// ======================== Tab 2: 供方8D ========================
const eightDLoading = ref(false)
const eightDList = ref<any[]>([])
const eightDTotal = ref(0)
const eightDPage = ref(1)
const eightDPageSize = ref(20)

const eightDFilters = reactive({
  reportNo: '',
  supplierName: '',
  status: '',
})

function reset8DFilters() {
  eightDFilters.reportNo = ''
  eightDFilters.supplierName = ''
  eightDFilters.status = ''
  eightDPage.value = 1
  fetch8Ds()
}

async function fetch8Ds() {
  eightDLoading.value = true
  try {
    const params: Record<string, any> = {
      page: eightDPage.value,
      pageSize: eightDPageSize.value,
    }
    if (eightDFilters.reportNo) params.reportNo = eightDFilters.reportNo
    if (eightDFilters.supplierName) params.supplierName = eightDFilters.supplierName
    if (eightDFilters.status) params.status = eightDFilters.status

    const res = await supplierCollabApi['8ds'].list(params)
    eightDList.value = res.data?.data?.items || res.data?.items || res.data?.data || []
    eightDTotal.value = res.data?.data?.total ?? res.data?.total ?? 0
  } catch (e) {
    ElMessage.error('获取8D报告列表失败')
  } finally {
    eightDLoading.value = false
  }
}

function on8DPageChange(page: number) {
  eightDPage.value = page
  fetch8Ds()
}

function on8DSizeChange(size: number) {
  eightDPageSize.value = size
  eightDPage.value = 1
  fetch8Ds()
}

// 8D Dialog
const eightDDialogVisible = ref(false)
const eightDSubmitting = ref(false)
const eightDFormRef = ref<FormInstance>()

const initial8DForm = () => ({
  id: undefined as string | undefined,
  supplierName: '',
  issueDescription: '',
  d1Team: '',
  d2Description: '',
  d3Containment: '',
  d4RootCause: '',
  d5CorrectiveAction: '',
  d6Verification: '',
  d7Prevention: '',
  d8Congratulate: '',
  dueDate: '',
})

const eightDForm = reactive(initial8DForm())

const eightDRules: FormRules = {
  supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  issueDescription: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
  dueDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }],
}

function open8DDialog(row?: any) {
  Object.assign(eightDForm, initial8DForm())
  if (row) {
    Object.assign(eightDForm, {
      id: row.id,
      supplierName: row.supplierName,
      issueDescription: row.issueDescription ?? '',
      d1Team: row.d1Team ?? '',
      d2Description: row.d2Description ?? '',
      d3Containment: row.d3Containment ?? '',
      d4RootCause: row.d4RootCause ?? '',
      d5CorrectiveAction: row.d5CorrectiveAction ?? '',
      d6Verification: row.d6Verification ?? '',
      d7Prevention: row.d7Prevention ?? '',
      d8Congratulate: row.d8Congratulate ?? '',
      dueDate: row.dueDate ?? '',
    })
  }
  eightDDialogVisible.value = true
}

async function submit8DForm() {
  const valid = await eightDFormRef.value?.validate().catch(() => false)
  if (!valid) return

  eightDSubmitting.value = true
  try {
    const payload = { ...eightDForm }
    if (eightDForm.id) {
      await supplierCollabApi['8ds'].update(eightDForm.id, payload)
      ElMessage.success('更新成功')
    } else {
      await supplierCollabApi['8ds'].create(payload)
      ElMessage.success('创建成功')
    }
    eightDDialogVisible.value = false
    fetch8Ds()
  } catch (e) {
    ElMessage.error(eightDForm.id ? '更新失败' : '创建失败')
  } finally {
    eightDSubmitting.value = false
  }
}

async function handleDelete8D(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除该8D报告（${row.reportNo}）？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await supplierCollabApi['8ds'].delete(row.id)
    ElMessage.success('删除成功')
    fetch8Ds()
  } catch {
    // cancelled or error
  }
}

// ======================== Tab 3: 供方绩效 ========================
const perfLoading = ref(false)
const performanceList = ref<any[]>([])
const perfTotal = ref(0)
const perfPage = ref(1)
const perfPageSize = ref(20)

const perfFilters = reactive({
  evalNo: '',
  supplierName: '',
  period: '',
  grade: '',
})

function resetPerfFilters() {
  perfFilters.evalNo = ''
  perfFilters.supplierName = ''
  perfFilters.period = ''
  perfFilters.grade = ''
  perfPage.value = 1
  fetchPerformances()
}

async function fetchPerformances() {
  perfLoading.value = true
  try {
    const params: Record<string, any> = {
      page: perfPage.value,
      pageSize: perfPageSize.value,
    }
    if (perfFilters.evalNo) params.evalNo = perfFilters.evalNo
    if (perfFilters.supplierName) params.supplierName = perfFilters.supplierName
    if (perfFilters.period) params.period = perfFilters.period
    if (perfFilters.grade) params.grade = perfFilters.grade

    const res = await supplierCollabApi.performances.list(params)
    performanceList.value = res.data?.data?.items || res.data?.items || res.data?.data || []
    perfTotal.value = res.data?.data?.total ?? res.data?.total ?? 0
  } catch (e) {
    ElMessage.error('获取供方绩效列表失败')
  } finally {
    perfLoading.value = false
  }
}

function onPerfPageChange(page: number) {
  perfPage.value = page
  fetchPerformances()
}

function onPerfSizeChange(size: number) {
  perfPageSize.value = size
  perfPage.value = 1
  fetchPerformances()
}

// Performance Dialog
const perfDialogVisible = ref(false)
const perfSubmitting = ref(false)
const perfFormRef = ref<FormInstance>()

const initialPerfForm = () => ({
  id: undefined as string | undefined,
  supplierName: '',
  period: '',
  qualityScore: undefined as number | undefined,
  deliveryScore: undefined as number | undefined,
  responseScore: undefined as number | undefined,
  comments: '',
})

const perfForm = reactive(initialPerfForm())

const perfRules: FormRules = {
  supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  period: [{ required: true, message: '请选择评价周期', trigger: 'change' }],
  qualityScore: [{ required: true, message: '请输入质量得分', trigger: 'blur' }],
  deliveryScore: [{ required: true, message: '请输入交付得分', trigger: 'blur' }],
  responseScore: [{ required: true, message: '请输入响应得分', trigger: 'blur' }],
}

function openPerfDialog(row?: any) {
  Object.assign(perfForm, initialPerfForm())
  if (row) {
    Object.assign(perfForm, {
      id: row.id,
      supplierName: row.supplierName,
      period: row.period,
      qualityScore: row.qualityScore,
      deliveryScore: row.deliveryScore,
      responseScore: row.responseScore,
      comments: row.comments ?? '',
    })
  }
  perfDialogVisible.value = true
}

async function submitPerfForm() {
  const valid = await perfFormRef.value?.validate().catch(() => false)
  if (!valid) return

  perfSubmitting.value = true
  try {
    const payload = { ...perfForm }
    if (perfForm.id) {
      await supplierCollabApi.performances.update(perfForm.id, payload)
      ElMessage.success('更新成功')
    } else {
      await supplierCollabApi.performances.create(payload)
      ElMessage.success('创建成功')
    }
    perfDialogVisible.value = false
    fetchPerformances()
  } catch (e) {
    ElMessage.error(perfForm.id ? '更新失败' : '创建失败')
  } finally {
    perfSubmitting.value = false
  }
}

async function handleDeletePerf(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除该绩效评价（${row.evalNo}）？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await supplierCollabApi.performances.delete(row.id)
    ElMessage.success('删除成功')
    fetchPerformances()
  } catch {
    // cancelled or error
  }
}

// ======================== Init ========================
onMounted(() => {
  fetchDevelopments()
  fetch8Ds()
  fetchPerformances()
})
</script>

<style scoped>
.supplier-collab-view {
  padding: 20px;
}

.supplier-collab-view h2 {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
}

.tab-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.filter-form {
  flex: 1;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
