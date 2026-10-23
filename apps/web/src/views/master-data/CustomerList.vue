<template>
  <div class="page-container">
    <div class="page-header">
      <h2>客户管理</h2>
      <el-button type="primary" @click="showCreateDialog">新增客户</el-button>
    </div>

    <div class="search-bar">
      <el-input v-model="search.keyword" placeholder="搜索客户编码/名称" clearable style="width: 220px" @keyup.enter="loadData" />
      <el-button @click="loadData">查询</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" border stripe>
      <el-table-column prop="customerCode" label="客户编码" width="120" />
      <el-table-column prop="customerName" label="客户名称" />
      <el-table-column prop="oemType" label="类型" width="100" />
      <el-table-column prop="contactName" label="联系人" width="100" />
      <el-table-column prop="contactPhone" label="电话" width="130" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showEditDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除?" @confirm="handleDelete(row.id)">
            <template #reference><el-button type="danger" link size="small">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-pagination">
      <el-pagination v-model:current-page="pagination.page" :total="pagination.total" layout="total, prev, pager, next" @current-change="loadData" />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑客户' : '新增客户'" width="500px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="客户编码" prop="customerCode"><el-input v-model="form.customerCode" :disabled="!!editingItem" /></el-form-item>
        <el-form-item label="客户名称" prop="customerName"><el-input v-model="form.customerName" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.oemType" style="width: 100%">
            <el-option label="OEM" value="OEM" />
            <el-option label="Tier1" value="Tier1" />
            <el-option label="Tier2" value="Tier2" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人"><el-input v-model="form.contactName" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.contactPhone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.contactEmail" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" type="textarea" /></el-form-item>
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
import { masterDataApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const tableData = ref<any[]>([])
const editingItem = ref<any>(null)
const formRef = ref<FormInstance>()

const search = reactive({ keyword: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const form = reactive({ customerCode: '', customerName: '', oemType: 'OEM', contactName: '', contactPhone: '', contactEmail: '', address: '' })
const formRules: FormRules = {
  customerCode: [{ required: true, message: '请输入客户编码', trigger: 'blur' }],
  customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
}

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const res: any = await masterDataApi.customers.list({ ...pagination, keyword: search.keyword })
    tableData.value = res.list
    pagination.total = res.total
  } finally { loading.value = false }
}

function showCreateDialog() {
  editingItem.value = null
  Object.assign(form, { customerCode: '', customerName: '', oemType: 'OEM', contactName: '', contactPhone: '', contactEmail: '', address: '' })
  dialogVisible.value = true
}

function showEditDialog(row: any) {
  editingItem.value = row
  Object.assign(form, { customerCode: row.customerCode, customerName: row.customerName, oemType: row.oemType, contactName: row.contactName, contactPhone: row.contactPhone, contactEmail: row.contactEmail, address: row.address })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (editingItem.value) {
      await masterDataApi.customers.update(editingItem.value.id, form)
      ElMessage.success('更新成功')
    } else {
      await masterDataApi.customers.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally { submitting.value = false }
}

async function handleDelete(id: number) {
  await masterDataApi.customers.delete(id)
  ElMessage.success('删除成功')
  loadData()
}
</script>
