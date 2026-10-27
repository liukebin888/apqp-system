<template>
  <div class="project-tier-config">
    <div class="page-header">
      <h2>项目分级配置</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增级别
      </el-button>
    </div>

    <el-alert type="info" :closable="false" style="margin-bottom: 16px">
      <template #title>
        项目分级用于区分不同规模/复杂度的项目，触发差异化的审批流程、评审要求和管控阈值。
      </template>
    </el-alert>

    <el-row :gutter="16">
      <el-col :span="8" v-for="tier in tiers" :key="tier.code">
        <el-card shadow="hover" class="tier-card" :class="'tier-' + tier.code.toLowerCase()">
          <template #header>
            <div class="tier-header">
              <span class="tier-code">{{ tier.code }}</span>
              <span class="tier-name">{{ tier.name }}</span>
              <div class="tier-actions">
                <el-button link type="primary" @click="handleEdit(tier)">编辑</el-button>
                <el-button link type="danger" @click="handleDelete(tier.code)">删除</el-button>
              </div>
            </div>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="预算范围">{{ formatRange(tier.budgetMin, tier.budgetMax, '万元') }}</el-descriptions-item>
            <el-descriptions-item label="周期范围">{{ formatRange(tier.durationMin, tier.durationMax, '月') }}</el-descriptions-item>
            <el-descriptions-item label="团队规模">{{ formatRange(tier.teamMin, tier.teamMax, '人') }}</el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <el-tag :type="riskTagMap[tier.riskLevel] || 'info'" size="small">{{ tier.riskLevel || '-' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审批层级">{{ tier.approvalLevel || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Gate评审">{{ tier.gateReview ? '需要' : '不需要' }}</el-descriptions-item>
            <el-descriptions-item label="说明">{{ tier.description || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="tiers.length === 0" description="暂无分级配置，请点击新增级别" />

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑项目级别' : '新增项目级别'" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="级别代码" required>
          <el-input v-model="form.code" :disabled="isEdit" placeholder="如 S/A/B/C/D" maxlength="10" />
        </el-form-item>
        <el-form-item label="级别名称" required>
          <el-input v-model="form.name" placeholder="如 战略级/重大/一般/小型" />
        </el-form-item>
        <el-form-item label="预算下限(万)">
          <el-input-number v-model="form.budgetMin" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="预算上限(万)">
          <el-input-number v-model="form.budgetMax" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="周期下限(月)">
          <el-input-number v-model="form.durationMin" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="周期上限(月)">
          <el-input-number v-model="form.durationMax" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="团队下限(人)">
          <el-input-number v-model="form.teamMin" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="团队上限(人)">
          <el-input-number v-model="form.teamMax" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="form.riskLevel" placeholder="选择风险等级">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="审批层级">
          <el-input v-model="form.approvalLevel" placeholder="如 公司级/部门级/项目组级" />
        </el-form-item>
        <el-form-item label="Gate评审">
          <el-switch v-model="form.gateReview" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { configApi } from '@/api'

const CONFIG_KEY = 'project.tier_config'
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const tiers = ref<any[]>([])

const defaultForm = () => ({
  code: '', name: '', budgetMin: 0, budgetMax: 0,
  durationMin: 0, durationMax: 0, teamMin: 0, teamMax: 0,
  riskLevel: '', approvalLevel: '', gateReview: false, description: '',
})
const form = reactive(defaultForm())

const riskTagMap: Record<string, string> = { '高': 'danger', '中': 'warning', '低': 'success' }

function formatRange(min: number, max: number, unit: string) {
  if (!min && !max) return '-'
  if (min && max) return `${min} ~ ${max} ${unit}`
  if (min) return `>= ${min} ${unit}`
  return `<= ${max} ${unit}`
}

async function loadConfig() {
  try {
    const res = await configApi.get(CONFIG_KEY)
    const val = res.data?.data?.configValue || res.data?.configValue
    if (val) {
      tiers.value = JSON.parse(val)
    }
  } catch {
    tiers.value = []
  }
}

function handleAdd() {
  isEdit.value = false
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

function handleEdit(tier: any) {
  isEdit.value = true
  Object.assign(form, { ...defaultForm(), ...tier })
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.code || !form.name) {
    ElMessage.warning('级别代码和名称不能为空')
    return
  }
  saving.value = true
  try {
    let list = [...tiers.value]
    if (isEdit.value) {
      const idx = list.findIndex(t => t.code === form.code)
      if (idx >= 0) list[idx] = { ...form }
    } else {
      if (list.find(t => t.code === form.code)) {
        ElMessage.warning('该级别代码已存在')
        saving.value = false
        return
      }
      list.push({ ...form })
    }
    await configApi.upsert(CONFIG_KEY, {
      configValue: JSON.stringify(list),
      description: '项目分级配置',
    })
    tiers.value = list
    ElMessage.success('保存成功')
    dialogVisible.value = false
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(code: string) {
  await ElMessageBox.confirm(`确认删除级别 "${code}"？`, '提示', { type: 'warning' })
  const list = tiers.value.filter(t => t.code !== code)
  try {
    await configApi.upsert(CONFIG_KEY, {
      configValue: JSON.stringify(list),
      description: '项目分级配置',
    })
    tiers.value = list
    ElMessage.success('删除成功')
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(loadConfig)
</script>

<style scoped>
.project-tier-config { padding: 0; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h2 { margin: 0; font-size: 18px; }
.tier-card { margin-bottom: 16px; }
.tier-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tier-code {
  font-size: 20px;
  font-weight: 700;
  min-width: 30px;
}
.tier-name { font-size: 15px; flex: 1; }
.tier-actions { margin-left: auto; }
.tier-s .tier-code { color: #f56c6c; }
.tier-a .tier-code { color: #e6a23c; }
.tier-b .tier-code { color: #409eff; }
.tier-c .tier-code { color: #67c23a; }
.tier-d .tier-code { color: #909399; }
</style>
