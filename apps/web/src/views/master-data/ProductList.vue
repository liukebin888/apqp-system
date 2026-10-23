<template>
  <div class="page-container">
    <div class="page-header"><h2>产品管理</h2><el-button type="primary" @click="showCreateDialog">新增产品</el-button></div>
    <div class="search-bar">
      <el-input v-model="search.keyword" placeholder="搜索产品编码/名称" clearable style="width: 220px" @keyup.enter="loadData" />
      <el-button @click="loadData">查询</el-button>
    </div>
    <el-table :data="tableData" v-loading="loading" border stripe>
      <el-table-column prop="productCode" label="产品编码" width="130" />
      <el-table-column prop="productName" label="产品名称" />
      <el-table-column label="分类" width="120"><template #default="{ row }">{{ row.category?.name }}</template></el-table-column>
      <el-table-column label="客户" width="150"><template #default="{ row }">{{ row.customer?.customerName }}</template></el-table-column>
      <el-table-column prop="productForm" label="类型" width="100" />
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
    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑产品' : '新增产品'" width="500px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="产品编码" prop="productCode"><el-input v-model="form.productCode" :disabled="!!editingItem" /></el-form-item>
        <el-form-item label="产品名称" prop="productName"><el-input v-model="form.productName" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.productForm" style="width: 100%">
            <el-option label="硬件" value="hardware" /><el-option label="软件" value="software" /><el-option label="混合" value="hybrid" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格"><el-input v-model="form.specs" type="textarea" /></el-form-item>
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
const form = reactive({ productCode: '', productName: '', productForm: 'hardware', specs: '' })
const formRules: FormRules = { productCode: [{ required: true, message: '请输入产品编码', trigger: 'blur' }], productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }] }

onMounted(() => loadData())
async function loadData() { loading.value = true; try { const res: any = await masterDataApi.products.list({ ...pagination, keyword: search.keyword }); tableData.value = res.list; pagination.total = res.total } finally { loading.value = false } }
function showCreateDialog() { editingItem.value = null; Object.assign(form, { productCode: '', productName: '', productForm: 'hardware', specs: '' }); dialogVisible.value = true }
function showEditDialog(row: any) { editingItem.value = row; Object.assign(form, { productCode: row.productCode, productName: row.productName, productForm: row.productForm, specs: row.specs }); dialogVisible.value = true }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitting.value = true; try { if (editingItem.value) { await masterDataApi.products.update(editingItem.value.id, form); ElMessage.success('更新成功') } else { await masterDataApi.products.create(form); ElMessage.success('创建成功') }; dialogVisible.value = false; loadData() } finally { submitting.value = false } }
async function handleDelete(id: number) { await masterDataApi.products.delete(id); ElMessage.success('删除成功'); loadData() }
</script>
