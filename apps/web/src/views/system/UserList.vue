<template>
  <div class="page-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="showCreateDialog">新增用户</el-button>
    </div>

    <div class="search-bar">
      <el-input v-model="search.keyword" placeholder="搜索用户名/姓名" clearable style="width: 200px" @clear="loadData" @keyup.enter="loadData" />
      <el-select v-model="search.departmentId" placeholder="选择部门" clearable style="width: 160px" @change="loadData">
        <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
      </el-select>
      <el-button @click="loadData">查询</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" border stripe>
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="realName" label="姓名" width="120" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="phone" label="手机" width="130" />
      <el-table-column label="部门" width="120">
        <template #default="{ row }">{{ row.department?.name }}</template>
      </el-table-column>
      <el-table-column label="角色" width="200">
        <template #default="{ row }">
          <el-tag v-for="r in row.userRoles" :key="r.role.id" size="small" class="role-tag">{{ r.role.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showEditDialog(row)">编辑</el-button>
          <el-button type="warning" link size="small" @click="handleResetPassword(row)">重置密码</el-button>
          <el-popconfirm title="确定删除?" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button type="danger" link size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @current-change="loadData"
        @size-change="loadData"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingUser ? '编辑用户' : '新增用户'" width="500px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!editingUser" />
        </el-form-item>
        <el-form-item v-if="!editingUser" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="form.departmentId" placeholder="选择部门" clearable style="width: 100%">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple placeholder="选择角色" style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { userApi, departmentApi, roleApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const tableData = ref<any[]>([])
const departments = ref<any[]>([])
const roles = ref<any[]>([])
const editingUser = ref<any>(null)
const formRef = ref<FormInstance>()

const search = reactive({ keyword: '', departmentId: undefined as number | undefined })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const form = reactive({
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  departmentId: undefined as number | undefined,
  roleIds: [] as number[],
})

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
}

onMounted(() => {
  loadData()
  loadMeta()
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await userApi.list({ ...pagination, ...search })
    tableData.value = res.list
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}

async function loadMeta() {
  const [deptRes, roleRes]: any[] = await Promise.all([departmentApi.list(), roleApi.list()])
  departments.value = deptRes || []
  roles.value = roleRes || []
}

function showCreateDialog() {
  editingUser.value = null
  Object.assign(form, { username: '', password: '', realName: '', email: '', phone: '', departmentId: undefined, roleIds: [] })
  dialogVisible.value = true
}

function showEditDialog(row: any) {
  editingUser.value = row
  Object.assign(form, {
    username: row.username,
    password: '',
    realName: row.realName,
    email: row.email || '',
    phone: row.phone || '',
    departmentId: row.department?.id,
    roleIds: row.userRoles?.map((ur: any) => ur.role.id) || [],
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingUser.value) {
      await userApi.update(editingUser.value.id, {
        realName: form.realName,
        email: form.email,
        phone: form.phone,
        departmentId: form.departmentId,
        roleIds: form.roleIds,
      })
      ElMessage.success('更新成功')
    } else {
      await userApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  await userApi.delete(id)
  ElMessage.success('删除成功')
  loadData()
}

async function handleResetPassword(row: any) {
  const { value } = await ElMessageBox.prompt('请输入新密码', '重置密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.{6,}/,
    inputErrorMessage: '密码至少6位',
  })
  await userApi.resetPassword(row.id, value)
  ElMessage.success('密码已重置')
}
</script>

<style scoped>
.role-tag {
  margin-right: 4px;
}
</style>
