<template>
  <div class="ots-doc-checklist-view">
    <div class="page-header">
      <el-page-header @back="$router.back()" title="返回">
        <template #content>
          <span class="page-title">OTS 文档检查表</span>
        </template>
      </el-page-header>
    </div>

    <div class="toolbar">
      <el-select v-model="selectedSampleId" placeholder="选择 OTS 样件" style="width: 260px" @change="loadData">
        <el-option v-for="s in samples" :key="s.id" :label="`${s.sampleCode} — ${s.partName || ''}`" :value="s.id" />
      </el-select>
      <el-button type="primary" style="margin-left: 12px" @click="handleInit" :loading="initializing" :disabled="!selectedSampleId">
        初始化标准文档检查表
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="8" v-for="checklist in checklists" :key="checklist.id">
        <el-card class="checklist-card">
          <template #header>
            <div class="card-header">
              <span>{{ checklist.category || '文档检查' }}</span>
              <el-progress
                type="circle"
                :percentage="calcProgress(checklist)"
                :width="60"
                :stroke-width="4"
              />
            </div>
          </template>

          <el-table :data="checklist.items || []" size="small" stripe>
            <el-table-column prop="seqNo" label="#" width="40" />
            <el-table-column prop="documentName" label="文档名称" min-width="160" />
            <el-table-column prop="checkStatus" label="状态" width="100">
              <template #default="{ row }">
                <el-select v-model="row.checkStatus" size="small" @change="handleItemUpdate(row)">
                  <el-option label="已通过" value="passed" />
                  <el-option label="待补充" value="pending" />
                  <el-option label="不适用" value="na" />
                  <el-option label="不通过" value="failed" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" width="120">
              <template #default="{ row }">
                <el-input v-model="row.remark" size="small" @blur="handleItemUpdate(row)" />
              </template>
            </el-table-column>
          </el-table>

          <div class="card-footer">
            <el-button type="danger" size="small" text @click="handleDelete(checklist.id)">删除</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="!checklists.length && selectedSampleId" description="暂无文档检查表，点击初始化" />
    <el-empty v-if="!selectedSampleId" description="请先选择 OTS 样件" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { otsApi } from '@/api'

const route = useRoute()
const projectId = Number(route.params.projectId)

const samples = ref<any[]>([])
const selectedSampleId = ref<number | null>(null)
const checklists = ref<any[]>([])
const initializing = ref(false)

function calcProgress(checklist: any) {
  const items = checklist.items || []
  if (!items.length) return 0
  const passed = items.filter((i: any) => i.checkStatus === 'passed' || i.checkStatus === 'na').length
  return Math.round((passed / items.length) * 100)
}

async function loadSamples() {
  try {
    const res = await otsApi.samples.list({ projectId })
    samples.value = (res as any).data?.list || (res as any).data || []
    if (samples.value.length) selectedSampleId.value = samples.value[0].id
  } catch (e) {
    console.error(e)
  }
}

async function loadData() {
  if (!selectedSampleId.value) return
  try {
    const res = await otsApi.docChecklists.list({ projectId })
    checklists.value = (res as any).data?.list || (res as any).data || []
  } catch (e) {
    console.error(e)
  }
}

async function handleInit() {
  initializing.value = true
  try {
    await otsApi.docChecklists.init(projectId, selectedSampleId.value!)
    ElMessage.success('文档检查表初始化完成')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '初始化失败')
  } finally {
    initializing.value = false
  }
}

async function handleItemUpdate(item: any) {
  try {
    await otsApi.docChecklists.updateItem(item.id, {
      checkStatus: item.checkStatus,
      remark: item.remark,
    })
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该检查表？', '提示', { type: 'warning' })
    await otsApi.docChecklists.delete(id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e) {
    // cancelled
  }
}

onMounted(async () => {
  await loadSamples()
  if (selectedSampleId.value) await loadData()
})
</script>

<style scoped lang="scss">
.ots-doc-checklist-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.checklist-card {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-footer {
    margin-top: 12px;
    text-align: right;
  }
}
</style>
