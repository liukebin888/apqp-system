<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>流程定义管理</h2>
      <el-button type="primary" @click="openCreateDialog">新建流程定义</el-button>
    </div>

    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>流程定义列表</span>
          <div style="display: flex; gap: 12px">
            <el-select v-model="filter.bizType" placeholder="业务类型" clearable size="small" style="width: 150px" @change="loadData">
              <el-option label="项目立项" value="project" />
              <el-option label="设计变更" value="design_change" />
              <el-option label="供应商审批" value="supplier" />
              <el-option label="采购申请" value="purchase" />
            </el-select>
            <el-select v-model="filter.status" placeholder="状态" clearable size="small" style="width: 120px" @change="loadData">
              <el-option label="草稿" value="draft" />
              <el-option label="启用" value="active" />
              <el-option label="已停用" value="deprecated" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="definitions" border stripe>
        <el-table-column prop="code" label="流程编码" width="160" />
        <el-table-column prop="name" label="流程名称" min-width="180" />
        <el-table-column prop="bizType" label="业务类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ bizTypeLabel(row.bizType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="节点数" width="80" align="center">
          <template #default="{ row }">{{ row.nodeDefinitions?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-if="row.status === 'draft' || row.status === 'deprecated'" type="success" link size="small" @click="handleActivate(row)">启用</el-button>
            <el-button v-if="row.status === 'active'" type="warning" link size="small" @click="handleDeprecate(row)">停用</el-button>
            <el-button type="info" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!definitions.length && !loading" description="暂无流程定义" :image-size="100" />
    </el-card>

    <el-dialog v-model="showDialog" :title="editingId ? '编辑流程定义' : '新建流程定义'" width="900px" destroy-on-close>
      <el-form :model="formData" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="流程编码" required>
              <el-input v-model="formData.code" placeholder="如: project_approval" :disabled="!!editingId" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="流程名称" required>
              <el-input v-model="formData.name" placeholder="请输入流程名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="业务类型" required>
              <el-select v-model="formData.bizType" style="width: 100%">
                <el-option label="项目立项" value="project" />
                <el-option label="设计变更" value="design_change" />
                <el-option label="供应商审批" value="supplier" />
                <el-option label="采购申请" value="purchase" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">流程节点</el-divider>
        <div style="margin-bottom: 12px">
          <el-button type="primary" size="small" @click="addNode">添加节点</el-button>
        </div>
        <el-table :data="formData.nodes" border size="small" v-if="formData.nodes.length">
          <el-table-column label="排序" width="70" align="center">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="节点标识" width="140">
            <template #default="{ row }">
              <el-input v-model="row.nodeKey" size="small" placeholder="如: start" />
            </template>
          </el-table-column>
          <el-table-column label="节点名称" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.nodeName" size="small" placeholder="如: 开始" />
            </template>
          </el-table-column>
          <el-table-column label="节点类型" width="130">
            <template #default="{ row }">
              <el-select v-model="row.nodeType" size="small">
                <el-option label="开始" value="start" />
                <el-option label="审批" value="approval" />
                <el-option label="通知" value="notification" />
                <el-option label="结束" value="end" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="审批人类型" width="130">
            <template #default="{ row }">
              <el-select v-model="row.assigneeType" size="small" clearable>
                <el-option label="指定用户" value="user" />
                <el-option label="角色" value="role" />
                <el-option label="部门" value="department" />
                <el-option label="发起人上级" value="manager" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="formData.nodes.splice($index, 1)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">流转规则</el-divider>
        <div style="margin-bottom: 12px">
          <el-button type="primary" size="small" @click="addTransition">添加流转</el-button>
        </div>
        <el-table :data="formData.transitions" border size="small" v-if="formData.transitions.length">
          <el-table-column label="起始节点" width="160">
            <template #default="{ row }">
              <el-select v-model="row.fromNodeKey" size="small">
                <el-option v-for="n in formData.nodes" :key="n.nodeKey" :label="n.nodeName || n.nodeKey" :value="n.nodeKey" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="目标节点" width="160">
            <template #default="{ row }">
              <el-select v-model="row.toNodeKey" size="small">
                <el-option v-for="n in formData.nodes" :key="n.nodeKey" :label="n.nodeName || n.nodeKey" :value="n.nodeKey" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="条件表达式" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.conditionExpression" size="small" placeholder="可选，如: amount > 10000" />
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="90">
            <template #default="{ row }">
              <el-input-number v-model="row.priority" size="small" :min="0" :max="99" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="formData.transitions.splice($index, 1)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveDefinition" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="流程定义详情" width="700px">
      <template v-if="detailData">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="流程编码">{{ detailData.code }}</el-descriptions-item>
          <el-descriptions-item label="流程名称">{{ detailData.name }}</el-descriptions-item>
          <el-descriptions-item label="业务类型">{{ bizTypeLabel(detailData.bizType) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detailData.status)" size="small">{{ statusLabel(detailData.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="版本">v{{ detailData.version }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(detailData.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 20px 0 10px">流程节点 ({{ detailData.nodeDefinitions?.length || 0 }})</h4>
        <el-steps v-if="detailData.nodeDefinitions?.length" :active="detailData.nodeDefinitions.length" finish-status="success" simple>
          <el-step v-for="node in detailData.nodeDefinitions" :key="node.nodeKey" :title="node.nodeName" />
        </el-steps>

        <h4 style="margin: 20px 0 10px">流转规则 ({{ detailData.transitions?.length || 0 }})</h4>
        <el-table :data="detailData.transitions || []" border size="small" v-if="detailData.transitions?.length">
          <el-table-column label="起始节点" width="150">
            <template #default="{ row }">{{ nodeName(row.fromNodeKey, detailData) }}</template>
          </el-table-column>
          <el-table-column label="→" width="40" align="center" />
          <el-table-column label="目标节点" width="150">
            <template #default="{ row }">{{ nodeName(row.toNodeKey, detailData) }}</template>
          </el-table-column>
          <el-table-column prop="conditionExpression" label="条件" min-width="200">
            <template #default="{ row }">{{ row.conditionExpression || '-' }}</template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="80" align="center" />
        </el-table>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workflowApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const saving = ref(false)
const definitions = ref<any[]>([])
const showDialog = ref(false)
const detailVisible = ref(false)
const editingId = ref<number | null>(null)
const detailData = ref<any>(null)

const filter = reactive({ bizType: '', status: '' })

const formData = reactive({
  code: '',
  name: '',
  bizType: '',
  nodes: [] as any[],
  transitions: [] as any[],
})

const bizTypeMap: Record<string, string> = {
  project: '项目立项',
  design_change: '设计变更',
  supplier: '供应商审批',
  purchase: '采购申请',
}

const statusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  active: { label: '启用', type: 'success' },
  deprecated: { label: '已停用', type: 'warning' },
}

function bizTypeLabel(t: string) { return bizTypeMap[t] || t }
function statusLabel(s: string) { return statusMap[s]?.label || s }
function statusType(s: string) { return statusMap[s]?.type || 'info' }
function formatDate(d: string) { return d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-' }
function nodeName(key: string, def: any) {
  return def.nodeDefinitions?.find((n: any) => n.nodeKey === key)?.nodeName || key
}

function addNode() {
  formData.nodes.push({
    nodeKey: '',
    nodeName: '',
    nodeType: 'approval',
    assigneeType: '',
    assigneeValue: null,
    sortOrder: formData.nodes.length,
  })
}

function addTransition() {
  formData.transitions.push({
    fromNodeKey: '',
    toNodeKey: '',
    conditionExpression: '',
    priority: 0,
  })
}

function openCreateDialog() {
  editingId.value = null
  Object.assign(formData, {
    code: '',
    name: '',
    bizType: 'project',
    nodes: [{ nodeKey: 'start', nodeName: '开始', nodeType: 'start', assigneeType: '', assigneeValue: null, sortOrder: 0 }],
    transitions: [],
  })
  showDialog.value = true
}

function openEditDialog(def: any) {
  editingId.value = def.id
  Object.assign(formData, {
    code: def.code,
    name: def.name,
    bizType: def.bizType,
    nodes: (def.nodeDefinitions || []).map((n: any) => ({
      nodeKey: n.nodeKey,
      nodeName: n.nodeName,
      nodeType: n.nodeType,
      assigneeType: n.assigneeType || '',
      assigneeValue: n.assigneeValue,
      sortOrder: n.sortOrder,
    })),
    transitions: (def.transitions || []).map((t: any) => ({
      fromNodeKey: t.fromNodeKey,
      toNodeKey: t.toNodeKey,
      conditionExpression: t.conditionExpression || '',
      priority: t.priority,
    })),
  })
  showDialog.value = true
}

async function saveDefinition() {
  if (!formData.code || !formData.name || !formData.bizType) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (!formData.nodes.length) {
    ElMessage.warning('请至少添加一个流程节点')
    return
  }
  for (const n of formData.nodes) {
    if (!n.nodeKey || !n.nodeName) {
      ElMessage.warning('请填写完整的节点标识和名称')
      return
    }
  }

  saving.value = true
  try {
    const payload = {
      code: formData.code,
      name: formData.name,
      bizType: formData.bizType,
      nodes: formData.nodes.map((n, i) => ({ ...n, sortOrder: i })),
      transitions: formData.transitions,
    }

    if (editingId.value) {
      await workflowApi.definitions.update(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await workflowApi.definitions.create(payload)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    saving.value = false
  }
}

async function handleActivate(def: any) {
  await ElMessageBox.confirm(`确定启用流程「${def.name}」？启用后可被业务引用。`, '确认')
  await workflowApi.definitions.activate(def.id)
  ElMessage.success('已启用')
  loadData()
}

async function handleDeprecate(def: any) {
  await ElMessageBox.confirm(`确定停用流程「${def.name}」？停用后将无法发起新流程。`, '确认')
  await workflowApi.definitions.deprecate(def.id)
  ElMessage.success('已停用')
  loadData()
}

async function viewDetail(def: any) {
  const res: any = await workflowApi.definitions.get(def.id)
  detailData.value = res
  detailVisible.value = true
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {}
    if (filter.bizType) params.bizType = filter.bizType
    if (filter.status) params.status = filter.status
    const res: any = await workflowApi.definitions.list(params)
    definitions.value = res || []
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
</script>
