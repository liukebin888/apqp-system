<template>
  <div class="page-container">
    <div class="page-header">
      <h2>新建项目</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px" style="max-width: 700px">
      <el-card>
        <template #header><span>基本信息</span></template>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="客户">
          <el-select v-model="form.customerId" placeholder="选择客户" clearable filterable style="width: 100%">
            <el-option v-for="c in customers" :key="c.id" :label="c.customerName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品">
          <el-select v-model="form.productId" placeholder="选择产品" clearable filterable style="width: 100%">
            <el-option v-for="p in products" :key="p.id" :label="p.productName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目级别">
          <el-select v-model="form.projectLevel" style="width: 100%">
            <el-option v-for="l in ['L1','L2','L3','L4','L5']" :key="l" :label="l" :value="l" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目经理">
          <el-select v-model="form.managerId" placeholder="选择项目经理" clearable filterable style="width: 100%">
            <el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划周期">
          <el-date-picker v-model="form.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-card>

      <el-card style="margin-top: 20px">
        <template #header><span>项目团队</span></template>
        <div v-for="(member, index) in form.teamMembers" :key="index" style="display: flex; gap: 10px; margin-bottom: 10px">
          <el-select v-model="member.userId" placeholder="选择成员" filterable style="flex: 1">
            <el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
          <el-select v-model="member.role" placeholder="角色" style="width: 150px">
            <el-option label="项目经理" value="pm" />
            <el-option label="质量工程师" value="qe" />
            <el-option label="产品工程师" value="pe" />
            <el-option label="工艺工程师" value="me" />
            <el-option label="采购员" value="buyer" />
          </el-select>
          <el-button type="danger" :icon="Delete" circle @click="form.teamMembers.splice(index, 1)" />
        </div>
        <el-button type="primary" plain @click="form.teamMembers.push({ userId: undefined, role: '' })">添加成员</el-button>
      </el-card>

      <div style="margin-top: 20px; text-align: center">
        <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">创建项目</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { projectApi, masterDataApi, userApi } from '@/api'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const customers = ref<any[]>([])
const products = ref<any[]>([])
const users = ref<any[]>([])

const form = reactive({
  projectName: '',
  customerId: undefined as number | undefined,
  productId: undefined as number | undefined,
  projectLevel: 'L3',
  managerId: undefined as number | undefined,
  dateRange: null as [Date, Date] | null,
  description: '',
  teamMembers: [] as Array<{ userId: number | undefined; role: string }>,
})

const formRules: FormRules = {
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
}

onMounted(async () => {
  const [custRes, prodRes, userRes]: any[] = await Promise.all([
    masterDataApi.customers.list({ page: 1, pageSize: 200 }),
    masterDataApi.products.list({ page: 1, pageSize: 200 }),
    userApi.list({ page: 1, pageSize: 200 }),
  ])
  customers.value = custRes?.list || []
  products.value = prodRes?.list || []
  users.value = userRes?.list || []
})

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data: any = {
      projectName: form.projectName,
      customerId: form.customerId,
      productId: form.productId,
      projectLevel: form.projectLevel,
      managerId: form.managerId,
      description: form.description,
      startDate: form.dateRange ? form.dateRange[0].toISOString() : undefined,
      endDate: form.dateRange ? form.dateRange[1].toISOString() : undefined,
      teamMembers: form.teamMembers.filter((m) => m.userId).map((m) => ({ userId: m.userId!, role: m.role })),
    }
    await projectApi.create(data)
    ElMessage.success('项目创建成功')
    router.push('/projects')
  } finally {
    submitting.value = false
  }
}
</script>
