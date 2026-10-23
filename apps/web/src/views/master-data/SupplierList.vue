<template>
  <div class="page-container">
    <div class="page-header"><h2>供应商管理</h2><el-button type="primary" @click="showCreateDialog">新增供应商</el-button></div>
    <div class="search-bar">
      <el-input v-model="search.keyword" placeholder="搜索供应商编码/名称" clearable style="width: 220px" @keyup.enter="loadData" />
      <el-button @click="loadData">查询</el-button>
    </div>
    <el-table :data="tableData" v-loading="loading" border stripe>
      <el-table-column prop="supplierCode" label="供应商编码" width="130" />
      <el-table-column prop="supplierName" label="供应商名称" />
      <el-table-column prop="creditCode" label="信用代码" width="180" />
      <el-table-column prop="contactName" label="联系人" width="100" />
      <el-table-column prop="qualificationStatus" label="资质状态" width="100">
        <template #default="{ row }"><el-tag :type="row.qualificationStatus === 'qualified' ? 'success' : 'warning'" size="small">{{ row.qualificationStatus || '未评定' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="rating" label="评级" width="80" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showEditDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除?" @confirm="handleDelete(row.id)"><template #reference><el-button type="danger" link size="small">删除</el-button></template></el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <div class="table-pagination">
      <el-pagination v-model:current-page="pagination.page" :total="pagination.total" layout="total, prev, pager, next" @current-change="loadData" />
    </div>
    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑供应商' : '新增供应商'" width="500px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="供应商编码" prop="supplierCode"><el-input v-model="form.supplierCode" :disabled="!!editingItem" /></el-form-item>
        <el-form-item label="供应商名称" prop="supplierName"><el-input v-model="form.supplierName" /></el-form-item>
        <el-form-item label="信用代码"><el-input v-model="form.creditCode" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="form.contactName" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.contactPhone" /></el-form-item>
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

const loading = ref(false); const submitting = ref(false); const dialogVisible = ref(false)
const tableData = ref<any[]>([]); const editingItem = ref<any>(null); const formRef = ref<FormInstance>()
const search = reactive({ keyword: '' }); const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const form = reactive({ supplierCode: '', supplierName: '', creditCode: '', contactName: '', contactPhone: '', address: '' })
const formRules: FormRules = { supplierCode: [{ required: true, message: '请输入供应商编码', trigger: 'blur' }], supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }] }

onMounted(() => loadData())
async function loadData() { loading.value = true; try { const res: any = await masterDataApi.suppliers.list({ ...pagination, keyword: search.keyword }); tableData.value = res.list; pagination.total = res.total } finally { loading.value = false } }
function showCreateDialog() { editingItem.value = null; Object.assign(form, { supplierCode: '', supplierName: '', creditCode: '', contactName: '', contactPhone: '', address: '' }); dialogVisible.value = true }
function showEditDialog(row: any) { editingItem.value = row; Object.assign(form, { supplierCode: row.supplierCode, supplierName: row.supplierName, creditCode: row.creditCode, contactName: row.contactName, contactPhone: row.contactPhone, address: row.address }); dialogVisible.value = true }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitting.value = true; try { if (editingItem.value) { await masterDataApi.suppliers.update(editingItem.value.id, form); ElMessage.success('更新成功') } else { await masterDataApi.suppliers.create(form); ElMessage.success('创建成功') }; dialogVisible.value = false; loadData() } finally { submitting.value = false } }
async function handleDelete(id: number) { await masterDataApi.suppliers.delete(id); ElMessage.success('删除成功'); loadData() }
</script>
