<template>
  <div class="page-container">
    <div class="page-header">
      <h2>项目列表</h2>
      <el-button type="primary" @click="$router.push('/projects/create')">新建项目</el-button>
    </div>

    <div class="search-bar">
      <el-input v-model="search.keyword" placeholder="搜索项目编号/名称" clearable style="width: 220px" @keyup.enter="loadData" />
      <el-select v-model="search.status" placeholder="项目状态" clearable style="width: 130px" @change="loadData">
        <el-option label="草稿" value="draft" />
        <el-option label="进行中" value="active" />
        <el-option label="暂停" value="on_hold" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-button @click="loadData">查询</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" border stripe>
      <el-table-column prop="projectCode" label="项目编号" width="150" />
      <el-table-column prop="projectName" label="项目名称" min-width="200" />
      <el-table-column label="客户" width="130">
        <template #default="{ row }">{{ row.customer?.customerName }}</template>
      </el-table-column>
      <el-table-column prop="projectLevel" label="级别" width="70" />
      <el-table-column label="APQP阶段" width="100">
        <template #default="{ row }">
          <el-tag size="small">Phase {{ row.apqpPhase }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="项目经理" width="110">
        <template #default="{ row }">{{ row.manager?.realName }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="$router.push(`/projects/${row.id}`)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-pagination">
      <el-pagination v-model:current-page="pagination.page" :total="pagination.total" layout="total, sizes, prev, pager, next" @current-change="loadData" @size-change="loadData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { projectApi } from '@/api'

const loading = ref(false)
const tableData = ref<any[]>([])
const search = reactive({ keyword: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const statusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  active: { label: '进行中', type: 'success' },
  on_hold: { label: '暂停', type: 'warning' },
  completed: { label: '已完成', type: '' },
  cancelled: { label: '已取消', type: 'danger' },
}

function statusLabel(status: string) { return statusMap[status]?.label || status }
function statusType(status: string) { return statusMap[status]?.type || 'info' }

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const res: any = await projectApi.list({ ...pagination, ...search })
    tableData.value = res.list
    pagination.total = res.total
  } finally { loading.value = false }
}
</script>
