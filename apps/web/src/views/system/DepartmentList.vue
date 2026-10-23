<template>
  <div class="page-container">
    <div class="page-header">
      <h2>组织架构</h2>
      <el-button type="primary" @click="showCreateDialog">新增部门</el-button>
    </div>

    <el-table :data="departments" v-loading="loading" row-key="id" border default-expand-all :tree-props="{ children: 'children' }">
      <el-table-column prop="name" label="部门名称" width="250" />
      <el-table-column prop="code" label="部门编码" width="120" />
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showEditDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除?" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button type="danger" link size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingDept ? '编辑部门' : '新增部门'" width="450px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="部门编码" prop="code">
          <el-input v-model="form.code" :disabled="!!editingDept" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-select v-model="form.parentId" placeholder="无（顶级部门）" clearable style="width: 100%">
            <el-option v-for="d in flatDepts" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { departmentApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const departments = ref<any[]>([])
const flatDepts = ref<any[]>([])
const editingDept = ref<any>(null)
const formRef = ref<FormInstance>()

const form = reactive({ name: '', code: '', parentId: undefined as number | undefined, sortOrder: 0 })
const formRules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入部门编码', trigger: 'blur' }],
}

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const tree: any = await departmentApi.tree()
    const list: any = await departmentApi.list()
    departments.value = tree || []
    flatDepts.value = list || []
  } finally {
    loading.value = false
  }
}

function showCreateDialog() {
  editingDept.value = null
  Object.assign(form, { name: '', code: '', parentId: undefined, sortOrder: 0 })
  dialogVisible.value = true
}

function showEditDialog(row: any) {
  editingDept.value = row
  Object.assign(form, { name: row.name, code: row.code, parentId: row.parentId, sortOrder: row.sortOrder })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingDept.value) {
      await departmentApi.update(editingDept.value.id, { name: form.name, parentId: form.parentId, sortOrder: form.sortOrder })
      ElMessage.success('更新成功')
    } else {
      await departmentApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await departmentApi.delete(id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  }
}
</script>
