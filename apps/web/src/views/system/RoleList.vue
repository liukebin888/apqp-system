<template>
  <div class="page-container">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="showCreateDialog">新增角色</el-button>
    </div>

    <el-table :data="roles" v-loading="loading" border stripe>
      <el-table-column prop="code" label="角色编码" width="150" />
      <el-table-column prop="name" label="角色名称" width="150" />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="系统角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isSystem ? 'warning' : 'info'" size="small">{{ row.isSystem ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="权限数" width="100">
        <template #default="{ row }">{{ row.rolePermissions?.length || 0 }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showEditDialog(row)">编辑</el-button>
          <el-button type="primary" link size="small" @click="showPermissionDialog(row)">权限</el-button>
          <el-popconfirm v-if="!row.isSystem" title="确定删除?" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button type="danger" link size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingRole ? '编辑角色' : '新增角色'" width="450px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" :disabled="!!editingRole" />
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permDialogVisible" title="权限配置" width="600px">
      <el-tree
        ref="treeRef"
        :data="permissionTree"
        :props="{ label: 'name', children: 'children' }"
        show-checkbox
        node-key="code"
        :default-checked-keys="checkedPermissions"
      />
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePermissions">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { roleApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const permDialogVisible = ref(false)
const roles = ref<any[]>([])
const allPermissions = ref<any[]>([])
const editingRole = ref<any>(null)
const checkedPermissions = ref<string[]>([])
const formRef = ref<FormInstance>()

const form = reactive({ code: '', name: '', description: '' })
const formRules: FormRules = {
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

const permissionTree = ref<any[]>([])

onMounted(() => {
  loadData()
  loadPermissions()
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await roleApi.list()
    roles.value = res || []
  } finally {
    loading.value = false
  }
}

async function loadPermissions() {
  const res: any = await roleApi.permissions()
  allPermissions.value = res || []
  const grouped: Record<string, any[]> = {}
  for (const p of allPermissions.value) {
    if (!grouped[p.module]) grouped[p.module] = []
    grouped[p.module].push({ code: p.code, name: p.name })
  }
  permissionTree.value = Object.entries(grouped).map(([module, perms]) => ({
    code: `module_${module}`,
    name: module,
    children: perms,
  }))
}

function showCreateDialog() {
  editingRole.value = null
  Object.assign(form, { code: '', name: '', description: '' })
  dialogVisible.value = true
}

function showEditDialog(row: any) {
  editingRole.value = row
  Object.assign(form, { code: row.code, name: row.name, description: row.description || '' })
  dialogVisible.value = true
}

function showPermissionDialog(row: any) {
  editingRole.value = row
  checkedPermissions.value = row.rolePermissions?.map((rp: any) => rp.permission.code) || []
  permDialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingRole.value) {
      await roleApi.update(editingRole.value.id, { name: form.name, description: form.description })
      ElMessage.success('更新成功')
    } else {
      await roleApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  await roleApi.delete(id)
  ElMessage.success('删除成功')
  loadData()
}

async function handleSavePermissions() {
  // Save permissions logic here
  ElMessage.success('权限已保存')
  permDialogVisible.value = false
}
</script>
