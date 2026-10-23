<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>{{ project?.projectName }} - 进度计划</h2>
      <div>
        <el-button @click="$router.push(`/projects/${projectId}`)">返回项目</el-button>
        <el-button type="primary" @click="showCreateDialog = true" v-if="!schedule">创建计划</el-button>
        <el-button type="success" @click="saveSchedule" v-if="schedule && hasChanges">保存更改</el-button>
      </div>
    </div>

    <el-empty v-if="!schedule && !loading" description="暂无进度计划" :image-size="100">
      <el-button type="primary" @click="showCreateDialog = true">创建第一个计划</el-button>
    </el-empty>

    <div v-if="schedule">
      <el-card style="margin-bottom: 20px">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <span>计划信息</span>
            <el-tag :type="schedule.status === 'active' ? 'success' : 'info'">
              {{ schedule.status === 'active' ? '已激活' : '草稿' }}
            </el-tag>
          </div>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="计划版本">V{{ schedule.baselineVersion }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ formatDate(schedule.startDate) }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ formatDate(schedule.endDate) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card>
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <span>任务列表</span>
            <el-button type="primary" size="small" @click="addTask">添加任务</el-button>
          </div>
        </template>

        <el-table :data="schedule.tasks" border row-key="id" default-expand-all>
          <el-table-column prop="taskCode" label="任务编号" width="120" />
          <el-table-column prop="taskName" label="任务名称" min-width="200">
            <template #default="{ row }">
              <el-input v-if="editingTask === row.id" v-model="row.taskName" size="small" />
              <span v-else>{{ row.taskName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="计划开始" width="130">
            <template #default="{ row }">
              <el-date-picker
                v-if="editingTask === row.id"
                v-model="row.plannedStart"
                type="date"
                size="small"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
              <span v-else>{{ formatDate(row.plannedStart) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="计划结束" width="130">
            <template #default="{ row }">
              <el-date-picker
                v-if="editingTask === row.id"
                v-model="row.plannedEnd"
                type="date"
                size="small"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
              <span v-else>{{ formatDate(row.plannedEnd) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="进度" width="150">
            <template #default="{ row }">
              <el-slider
                v-if="editingTask === row.id"
                v-model="row.progressPct"
                :max="100"
                :step="5"
                size="small"
                show-input
              />
              <el-progress v-else :percentage="row.progressPct || 0" :stroke-width="10" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-select v-if="editingTask === row.id" v-model="row.status" size="small">
                <el-option label="未开始" value="not_started" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
                <el-option label="延期" value="delayed" />
              </el-select>
              <el-tag v-else :type="statusType(row.status)" size="small">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="里程碑" width="80" align="center">
            <template #default="{ row }">
              <el-checkbox v-if="editingTask === row.id" v-model="row.milestoneFlag" />
              <el-icon v-else-if="row.milestoneFlag" color="#e6a23c"><Star /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row, $index }">
              <el-button
                v-if="editingTask !== row.id"
                type="primary"
                link
                size="small"
                @click="startEdit(row)"
              >
                编辑
              </el-button>
              <template v-else>
                <el-button type="success" link size="small" @click="saveEdit(row)">保存</el-button>
                <el-button type="info" link size="small" @click="cancelEdit(row)">取消</el-button>
              </template>
              <el-button type="danger" link size="small" @click="deleteTask(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card style="margin-top: 20px">
        <template #header><span>甘特图</span></template>
        <div class="gantt-chart" v-if="schedule.tasks.length">
          <div class="gantt-header">
            <div class="gantt-task-col">任务</div>
            <div class="gantt-timeline">
              <div v-for="date in timelineDates" :key="date" class="gantt-date">
                {{ date }}
              </div>
            </div>
          </div>
          <div v-for="task in schedule.tasks" :key="task.id" class="gantt-row">
            <div class="gantt-task-col">{{ task.taskName }}</div>
            <div class="gantt-timeline">
              <div
                class="gantt-bar"
                :style="getBarStyle(task)"
                :class="`status-${task.status}`"
                :title="`${task.taskName}: ${formatDate(task.plannedStart)} - ${formatDate(task.plannedEnd)}`"
              >
                <span v-if="task.milestoneFlag" class="milestone-marker">★</span>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无任务" :image-size="60" />
      </el-card>
    </div>

    <el-dialog v-model="showCreateDialog" title="创建进度计划" width="600px">
      <el-form :model="newSchedule" label-width="100px">
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="newSchedule.startDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="newSchedule.endDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createSchedule">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { projectApi, scheduleApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const route = useRoute()
const projectId = +route.params.projectId
const loading = ref(false)
const project = ref<any>(null)
const schedule = ref<any>(null)
const editingTask = ref<number | null>(null)
const hasChanges = ref(false)
const showCreateDialog = ref(false)
const newSchedule = ref({ startDate: '', endDate: '' })

const statusMap: Record<string, { label: string; type: string }> = {
  not_started: { label: '未开始', type: 'info' },
  in_progress: { label: '进行中', type: '' },
  completed: { label: '已完成', type: 'success' },
  delayed: { label: '延期', type: 'danger' },
}

function statusLabel(s: string) { return statusMap[s]?.label || s }
function statusType(s: string) { return statusMap[s]?.type || 'info' }
function formatDate(d: string | null) { return d ? dayjs(d).format('YYYY-MM-DD') : '-' }

const timelineDates = computed(() => {
  if (!schedule.value?.tasks.length) return []
  const dates: string[] = []
  const start = dayjs(schedule.value.startDate)
  const end = dayjs(schedule.value.endDate)
  const days = end.diff(start, 'day')
  const step = Math.max(1, Math.floor(days / 20))
  
  for (let i = 0; i <= days; i += step) {
    dates.push(start.add(i, 'day').format('MM/DD'))
  }
  return dates
})

function getBarStyle(task: any) {
  if (!task.plannedStart || !task.plannedEnd || !schedule.value.startDate) return { display: 'none' }
  
  const totalDays = dayjs(schedule.value.endDate).diff(dayjs(schedule.value.startDate), 'day')
  const startOffset = dayjs(task.plannedStart).diff(dayjs(schedule.value.startDate), 'day')
  const duration = dayjs(task.plannedEnd).diff(dayjs(task.plannedStart), 'day')
  
  const left = (startOffset / totalDays) * 100
  const width = (duration / totalDays) * 100
  
  return {
    left: `${left}%`,
    width: `${Math.max(width, 1)}%`,
  }
}

async function loadProject() {
  try {
    const res: any = await projectApi.get(projectId)
    project.value = res
  } catch (e) {
    console.error('Failed to load project', e)
  }
}

async function loadSchedule() {
  loading.value = true
  try {
    const res: any = await scheduleApi.get(projectId)
    schedule.value = res
  } catch (e) {
    console.error('Failed to load schedule', e)
  } finally {
    loading.value = false
  }
}

async function createSchedule() {
  if (!newSchedule.value.startDate || !newSchedule.value.endDate) {
    ElMessage.warning('请选择开始和结束日期')
    return
  }
  
  try {
    await scheduleApi.create(projectId, {
      startDate: newSchedule.value.startDate,
      endDate: newSchedule.value.endDate,
      tasks: [],
    })
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    await loadSchedule()
  } catch (e: any) {
    ElMessage.error(e.message || '创建失败')
  }
}

function addTask() {
  const newTask = {
    id: Date.now(),
    taskCode: `T${String(schedule.value.tasks.length + 1).padStart(3, '0')}`,
    taskName: '新任务',
    plannedStart: schedule.value.startDate,
    plannedEnd: schedule.value.endDate,
    progressPct: 0,
    status: 'not_started',
    milestoneFlag: false,
    sortOrder: schedule.value.tasks.length + 1,
  }
  schedule.value.tasks.push(newTask)
  hasChanges.value = true
  startEdit(newTask)
}

function startEdit(task: any) {
  editingTask.value = task.id
  task._backup = { ...task }
}

function cancelEdit(task: any) {
  if (task._backup) {
    Object.assign(task, task._backup)
  }
  editingTask.value = null
}

async function saveEdit(task: any) {
  try {
    await scheduleApi.updateTask(projectId, task.id, {
      taskName: task.taskName,
      plannedStart: task.plannedStart,
      plannedEnd: task.plannedEnd,
      progressPct: task.progressPct,
      status: task.status,
      milestoneFlag: task.milestoneFlag,
    })
    ElMessage.success('保存成功')
    editingTask.value = null
    hasChanges.value = true
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  }
}

async function deleteTask(taskId: number) {
  try {
    await ElMessageBox.confirm('确定删除此任务？', '提示', { type: 'warning' })
    schedule.value.tasks = schedule.value.tasks.filter((t: any) => t.id !== taskId)
    hasChanges.value = true
    ElMessage.success('删除成功')
  } catch {
    // cancelled
  }
}

async function saveSchedule() {
  try {
    await scheduleApi.create(projectId, {
      startDate: schedule.value.startDate,
      endDate: schedule.value.endDate,
      tasks: schedule.value.tasks.map((t: any) => ({
        taskCode: t.taskCode,
        taskName: t.taskName,
        plannedStart: t.plannedStart,
        plannedEnd: t.plannedEnd,
        progressPct: t.progressPct,
        status: t.status,
        milestoneFlag: t.milestoneFlag,
        sortOrder: t.sortOrder,
      })),
    })
    ElMessage.success('保存成功')
    hasChanges.value = false
    await loadSchedule()
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  }
}

onMounted(async () => {
  await loadProject()
  await loadSchedule()
})
</script>

<style scoped>
.gantt-chart {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow-x: auto;
}

.gantt-header,
.gantt-row {
  display: flex;
  border-bottom: 1px solid #ebeef5;
}

.gantt-header {
  background: #f5f7fa;
  font-weight: bold;
}

.gantt-task-col {
  width: 200px;
  min-width: 200px;
  padding: 10px;
  border-right: 1px solid #ebeef5;
  display: flex;
  align-items: center;
}

.gantt-timeline {
  flex: 1;
  display: flex;
  position: relative;
  min-width: 600px;
}

.gantt-date {
  flex: 1;
  padding: 10px 5px;
  text-align: center;
  border-right: 1px solid #ebeef5;
  font-size: 12px;
}

.gantt-row .gantt-timeline {
  height: 40px;
  align-items: center;
}

.gantt-bar {
  position: absolute;
  height: 24px;
  background: #409eff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.gantt-bar:hover {
  opacity: 0.8;
}

.gantt-bar.status-not_started {
  background: #909399;
}

.gantt-bar.status-in_progress {
  background: #409eff;
}

.gantt-bar.status-completed {
  background: #67c23a;
}

.gantt-bar.status-delayed {
  background: #f56c6c;
}

.milestone-marker {
  color: #e6a23c;
  font-size: 16px;
}
</style>
