<template>
  <div class="system-config-view">
    <div class="page-header">
      <h2>系统参数配置</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增参数
      </el-button>
    </div>

    <el-card shadow="never">
      <div class="filter-bar">
        <el-input v-model="searchKey" placeholder="搜索参数键名" clearable style="width: 300px" @input="handleSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <el-table :data="filteredList" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="configKey" label="参数键名" width="280" />
        <el-table-column prop="configValue" label="参数值" min-width="300" show-overflow-tooltip />
        <el-table-column prop="description" label="说明" width="250" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确认删除此参数？" @confirm="handleDelete(row.configKey)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑参数' : '新增参数'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="参数键名" required>
          <el-input v-model="form.configKey" :disabled="isEdit" placeholder="如: system.project.max_count" />
        </el-form-item>
        <el-form-item label="参数值" required>
          <el-input v-model="form.configValue" type="textarea" :rows="3" placeholder="参数值" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" placeholder="参数说明" />
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
import { ref, computed, onMounted } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { configApi } from '@/api'

const loading = ref(false)
const saving = ref(false)
const configList = ref<any[]>([])
const searchKey = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({ configKey: '', configValue: '', description: '' })

const filteredList = computed(() => {
  if (!searchKey.value) return configList.value
  const kw = searchKey.value.toLowerCase()
  return configList.value.filter(
    item => item.configKey.toLowerCase().includes(kw) || (item.description || '').toLowerCase().includes(kw),
  )
})

async function loadData() {
  loading.value = true
  try {
    const res = await configApi.list()
    configList.value = res.data?.data || res.data || []
  } catch {
    ElMessage.error('获取系统参数失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  // filteredList is computed, no action needed
}

function handleAdd() {
  isEdit.value = false
  form.value = { configKey: '', configValue: '', description: '' }
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  form.value = { configKey: row.configKey, configValue: row.configValue || '', description: row.description || '' }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.value.configKey || !form.value.configValue) {
    ElMessage.warning('参数键名和参数值不能为空')
    return
  }
  saving.value = true
  try {
    await configApi.upsert(form.value.configKey, {
      configValue: form.value.configValue,
      description: form.value.description,
    })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadData()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(key: string) {
  try {
    await configApi.delete(key)
    ElMessage.success('删除成功')
    await loadData()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.system-config-view {
  padding: 0;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
  font-size: 18px;
}
.filter-bar {
  margin-bottom: 16px;
}
</style>
