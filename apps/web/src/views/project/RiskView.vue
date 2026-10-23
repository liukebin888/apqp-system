<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>{{ project?.projectName }} - 风险管理</h2>
      <div>
        <el-button @click="$router.push(`/projects/${projectId}`)">返回项目</el-button>
        <el-button type="primary" @click="openCreateDialog">登记风险</el-button>
      </div>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="风险总数" :value="riskStats.total" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="高风险" :value="riskStats.high" value-style="color: #f56c6c" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="处理中" :value="riskStats.mitigating" value-style="color: #e6a23c" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="已关闭" :value="riskStats.closed" value-style="color: #67c23a" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>风险登记册</span>
              <div>
                <el-select v-model="filter.category" placeholder="类别" clearable size="small" style="width: 120px; margin-right: 8px" @change="loadRisks">
                  <el-option label="技术" value="technical" />
                  <el-option label="进度" value="schedule" />
                  <el-option label="成本" value="cost" />
                  <el-option label="供应链" value="supply" />
                  <el-option label="质量" value="quality" />
                </el-select>
                <el-select v-model="filter.status" placeholder="状态" clearable size="small" style="width: 120px" @change="loadRisks">
                  <el-option label="开放" value="open" />
                  <el-option label="处理中" value="mitigating" />
                  <el-option label="已关闭" value="closed" />
                  <el-option label="已接受" value="accepted" />
                </el-select>
              </div>
            </div>
          </template>

          <el-table :data="risks" border stripe>
            <el-table-column prop="riskCode" label="编号" width="140" />
            <el-table-column prop="description" label="风险描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="category" label="类别" width="90">
              <template #default="{ row }">
                <el-tag size="small">{{ categoryLabel(row.category) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="等级" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="riskLevelType(row.riskLevel)" size="small" effect="dark">
                  {{ riskLevelLabel(row.riskLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="概率×影响" width="100" align="center">
              <template #default="{ row }">{{ row.probability }}×{{ row.impact }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="riskStatusType(row.status)" size="small">{{ riskStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="负责人" width="100">
              <template #default="{ row }">{{ row.owner?.realName || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewRisk(row)">详情</el-button>
                <el-button type="danger" link size="small" @click="deleteRisk(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-pagination">
            <el-pagination
              v-model:current-page="pagination.page"
              :total="pagination.total"
              layout="total, prev, pager, next"
              @current-change="loadRisks"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header><span>风险矩阵</span></template>
          <div class="risk-matrix">
            <div class="matrix-header">
              <div class="matrix-label">概率 ↓ / 影响 →</div>
              <div v-for="i in 5" :key="i" class="matrix-col-header">{{ i }}</div>
            </div>
            <div v-for="p in 5" :key="p" class="matrix-row">
              <div class="matrix-row-header">{{ p }}</div>
              <div
                v-for="i in 5"
                :key="i"
                class="matrix-cell"
                :class="getCellClass(p, i)"
                @click="filterByCell(p, i)"
              >
                <span v-if="getMatrixCount(p, i)" class="cell-count">{{ getMatrixCount(p, i) }}</span>
              </div>
            </div>
            <div class="matrix-legend">
              <div class="legend-item"><span class="legend-color" style="background: #67c23a"></span> 低风险</div>
              <div class="legend-item"><span class="legend-color" style="background: #e6a23c"></span> 中风险</div>
              <div class="legend-item"><span class="legend-color" style="background: #f56c6c"></span> 高风险</div>
              <div class="legend-item"><span class="legend-color" style="background: #9d1c2e"></span> 极高风险</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showCreateDialog" title="登记风险" width="600px">
      <el-form :model="newRisk" label-width="100px">
        <el-form-item label="风险描述" required>
          <el-input v-model="newRisk.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="类别" required>
          <el-select v-model="newRisk.category" style="width: 100%">
            <el-option label="技术" value="technical" />
            <el-option label="进度" value="schedule" />
            <el-option label="成本" value="cost" />
            <el-option label="供应链" value="supply" />
            <el-option label="质量" value="quality" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="概率 (1-5)" required>
              <el-slider v-model="newRisk.probability" :min="1" :max="5" show-stops />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="影响 (1-5)" required>
              <el-slider v-model="newRisk.impact" :min="1" :max="5" show-stops />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="风险等级">
          <el-tag :type="riskLevelType(calculateLevel(newRisk.probability, newRisk.impact))" effect="dark" size="large">
            {{ riskLevelLabel(calculateLevel(newRisk.probability, newRisk.impact)) }}
          </el-tag>
          <span style="margin-left: 12px; color: #909399">{{ newRisk.probability }} × {{ newRisk.impact }} = {{ newRisk.probability * newRisk.impact }}</span>
        </el-form-item>
        <el-form-item label="应对策略">
          <el-select v-model="newRisk.responseStrategy" clearable style="width: 100%">
            <el-option label="规避" value="avoid" />
            <el-option label="缓解" value="mitigate" />
            <el-option label="转移" value="transfer" />
            <el-option label="接受" value="accept" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="newRisk.ownerUserId" filterable clearable placeholder="选择负责人" style="width: 100%">
            <el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createRisk">登记</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="风险详情" width="700px">
      <div v-if="selectedRisk">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="风险编号">{{ selectedRisk.riskCode }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="riskLevelType(selectedRisk.riskLevel)" effect="dark">{{ riskLevelLabel(selectedRisk.riskLevel) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedRisk.description }}</el-descriptions-item>
          <el-descriptions-item label="类别">{{ categoryLabel(selectedRisk.category) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="riskStatusType(selectedRisk.status)">{{ riskStatusLabel(selectedRisk.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="概率">{{ selectedRisk.probability }}</el-descriptions-item>
          <el-descriptions-item label="影响">{{ selectedRisk.impact }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedRisk.owner?.realName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="应对策略">{{ strategyLabel(selectedRisk.responseStrategy) }}</el-descriptions-item>
          <el-descriptions-item label="识别时间">{{ formatDate(selectedRisk.identifiedAt) }}</el-descriptions-item>
          <el-descriptions-item label="关闭时间">{{ formatDate(selectedRisk.closedAt) }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
            <h4>应对措施</h4>
            <el-button type="primary" size="small" @click="openResponseDialog">添加措施</el-button>
          </div>
          <el-table :data="selectedRisk.responses" border size="small">
            <el-table-column prop="actionDesc" label="措施描述" min-width="200" />
            <el-table-column label="负责人" width="100">
              <template #default="{ row }">{{ row.responsible?.realName || '-' }}</template>
            </el-table-column>
            <el-table-column label="截止日期" width="110">
              <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="responseStatusType(row.status)" size="small">{{ responseStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!selectedRisk.responses?.length" description="暂无应对措施" :image-size="40" />
        </div>

        <div style="margin-top: 20px">
          <h4>更新状态</h4>
          <el-space style="margin-top: 8px">
            <el-select v-model="selectedRisk.status" style="width: 140px" @change="updateRiskStatus">
              <el-option label="开放" value="open" />
              <el-option label="处理中" value="mitigating" />
              <el-option label="已关闭" value="closed" />
              <el-option label="已接受" value="accepted" />
            </el-select>
          </el-space>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showResponseDialog" title="添加应对措施" width="500px">
      <el-form :model="newResponse" label-width="100px">
        <el-form-item label="措施描述" required>
          <el-input v-model="newResponse.actionDesc" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="newResponse.responsibleId" filterable clearable placeholder="选择负责人" style="width: 100%">
            <el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="newResponse.dueDate" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResponseDialog = false">取消</el-button>
        <el-button type="primary" @click="addResponse">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { projectApi, riskApi, userApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const projectId = +route.params.projectId
const loading = ref(false)
const project = ref<any>(null)
const risks = ref<any[]>([])
const users = ref<any[]>([])
const selectedRisk = ref<any>(null)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showResponseDialog = ref(false)

const filter = reactive({ category: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const newRisk = reactive({
  description: '',
  category: 'technical',
  probability: 3,
  impact: 3,
  responseStrategy: '',
  ownerUserId: null as number | null,
})

const newResponse = reactive({
  actionDesc: '',
  responsibleId: null as number | null,
  dueDate: '',
})

const categoryMap: Record<string, string> = {
  technical: '技术', schedule: '进度', cost: '成本', supply: '供应链', quality: '质量',
}
const riskLevelMap: Record<string, { label: string; type: string }> = {
  low: { label: '低', type: 'info' },
  medium: { label: '中', type: 'warning' },
  high: { label: '高', type: 'danger' },
  critical: { label: '极高', type: 'danger' },
}
const riskStatusMap: Record<string, { label: string; type: string }> = {
  open: { label: '开放', type: 'info' },
  mitigating: { label: '处理中', type: 'warning' },
  closed: { label: '已关闭', type: 'success' },
  accepted: { label: '已接受', type: '' },
}
const strategyMap: Record<string, string> = {
  avoid: '规避', mitigate: '缓解', transfer: '转移', accept: '接受',
}
const responseStatusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待处理', type: 'info' },
  in_progress: { label: '进行中', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
}

function categoryLabel(c: string) { return categoryMap[c] || c }
function riskLevelLabel(l: string) { return riskLevelMap[l]?.label || l }
function riskLevelType(l: string) { return riskLevelMap[l]?.type || 'info' }
function riskStatusLabel(s: string) { return riskStatusMap[s]?.label || s }
function riskStatusType(s: string) { return riskStatusMap[s]?.type || 'info' }
function strategyLabel(s: string) { return strategyMap[s] || s || '-' }
function responseStatusLabel(s: string) { return responseStatusMap[s]?.label || s }
function responseStatusType(s: string) { return responseStatusMap[s]?.type || 'info' }
function formatDate(d: string | null) { return d ? dayjs(d).format('YYYY-MM-DD') : '-' }

function calculateLevel(p: number, i: number): string {
  const score = p * i
  if (score >= 16) return 'critical'
  if (score >= 9) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

const riskStats = computed(() => {
  const all = risks.value
  return {
    total: pagination.total,
    high: all.filter((r: any) => ['high', 'critical'].includes(r.riskLevel)).length,
    mitigating: all.filter((r: any) => r.status === 'mitigating').length,
    closed: all.filter((r: any) => r.status === 'closed').length,
  }
})

function getCellClass(p: number, i: number) {
  const score = p * i
  if (score >= 16) return 'cell-critical'
  if (score >= 9) return 'cell-high'
  if (score >= 4) return 'cell-medium'
  return 'cell-low'
}

function getMatrixCount(p: number, i: number) {
  return risks.value.filter((r: any) => r.probability === p && r.impact === i && r.status !== 'closed').length
}

function filterByCell(_p: number, _i: number) {
  // Could filter risks by this cell
}

async function loadProject() {
  try {
    const res: any = await projectApi.get(projectId)
    project.value = res
  } catch (e) {
    console.error('Failed to load project', e)
  }
}

async function loadUsers() {
  try {
    const res: any = await userApi.list({ page: 1, pageSize: 100 })
    users.value = res.list
  } catch (e) {
    console.error('Failed to load users', e)
  }
}

async function loadRisks() {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.pageSize }
    if (filter.category) params.category = filter.category
    if (filter.status) params.status = filter.status
    const res: any = await riskApi.list(projectId, params)
    risks.value = res.list
    pagination.total = res.total
  } catch (e) {
    console.error('Failed to load risks', e)
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  Object.assign(newRisk, { description: '', category: 'technical', probability: 3, impact: 3, responseStrategy: '', ownerUserId: null })
  showCreateDialog.value = true
}

async function createRisk() {
  if (!newRisk.description) {
    ElMessage.warning('请填写风险描述')
    return
  }
  try {
    await riskApi.create(projectId, { ...newRisk })
    ElMessage.success('风险登记成功')
    showCreateDialog.value = false
    await loadRisks()
  } catch (e: any) {
    ElMessage.error(e.message || '登记失败')
  }
}

async function viewRisk(risk: any) {
  selectedRisk.value = risk
  showDetailDialog.value = true
}

async function updateRiskStatus() {
  if (!selectedRisk.value) return
  try {
    await riskApi.update(projectId, selectedRisk.value.id, {
      status: selectedRisk.value.status,
      ...(selectedRisk.value.status === 'closed' ? { closedAt: new Date().toISOString() } : {}),
    })
    ElMessage.success('状态更新成功')
    await loadRisks()
  } catch (e: any) {
    ElMessage.error(e.message || '更新失败')
  }
}

async function deleteRisk(riskId: number) {
  try {
    await ElMessageBox.confirm('确定删除此风险？', '提示', { type: 'warning' })
    // No delete API yet, so just refresh
    ElMessage.info('删除功能待实现')
  } catch {
    // cancelled
  }
}

function openResponseDialog() {
  Object.assign(newResponse, { actionDesc: '', responsibleId: null, dueDate: '' })
  showResponseDialog.value = true
}

async function addResponse() {
  if (!newResponse.actionDesc) {
    ElMessage.warning('请填写措施描述')
    return
  }
  try {
    await riskApi.addResponse(projectId, selectedRisk.value.id, { ...newResponse })
    ElMessage.success('应对措施添加成功')
    showResponseDialog.value = false
    // Reload risk detail
    const res: any = await riskApi.list(projectId, { page: 1, pageSize: 100 })
    const updated = res.list.find((r: any) => r.id === selectedRisk.value.id)
    if (updated) selectedRisk.value = updated
  } catch (e: any) {
    ElMessage.error(e.message || '添加失败')
  }
}

onMounted(async () => {
  await loadProject()
  await loadUsers()
  await loadRisks()
})
</script>

<style scoped>
.risk-matrix {
  font-size: 12px;
}

.matrix-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.matrix-label {
  width: 100px;
  font-weight: bold;
  font-size: 11px;
}

.matrix-col-header {
  flex: 1;
  text-align: center;
  font-weight: bold;
}

.matrix-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.matrix-row-header {
  width: 100px;
  text-align: center;
  font-weight: bold;
}

.matrix-cell {
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin: 0 2px;
  cursor: pointer;
  transition: all 0.3s;
}

.matrix-cell:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.cell-low { background: #67c23a; color: white; }
.cell-medium { background: #e6a23c; color: white; }
.cell-high { background: #f56c6c; color: white; }
.cell-critical { background: #9d1c2e; color: white; }

.cell-count {
  font-weight: bold;
  font-size: 14px;
}

.matrix-legend {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.legend-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
</style>
