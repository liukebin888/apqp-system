<template>
  <div class="change-management-view">
    <div class="page-header">
      <h2>工程变更管理</h2>
      <div class="header-actions">
        <el-select v-model="projectFilter" placeholder="选择项目" clearable style="width: 200px; margin-right: 12px" @change="loadAll">
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
        <el-button type="primary" @click="showCreateEcrDialog">新建 ECR</el-button>
      </div>
    </div>

    <!-- KPI Cards -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value" style="color: #E6A23C">{{ stats.openEcrs || 0 }}</div>
          <div class="kpi-label">待处理 ECR</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value" style="color: #F56C6C">{{ stats.pendingCcb || 0 }}</div>
          <div class="kpi-label">CCB 待审</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value" style="color: #409EFF">{{ stats.activeEcns || 0 }}</div>
          <div class="kpi-label">活跃 ECN</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value" style="color: #67C23A">{{ stats.closureRate || 0 }}%</div>
          <div class="kpi-label">ECN 关闭率</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: ECR List -->
      <el-tab-pane label="ECR 申请" name="ecr">
        <div class="tab-toolbar">
          <el-select v-model="ecrFilter.status" placeholder="状态" clearable style="width: 140px" @change="loadEcrs">
            <el-option v-for="(v, k) in ECR_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
          <el-select v-model="ecrFilter.changeType" placeholder="变更类型" clearable style="width: 140px; margin-left: 8px" @change="loadEcrs">
            <el-option v-for="(v, k) in CHANGE_TYPE" :key="k" :label="v" :value="k" />
          </el-select>
          <el-select v-model="ecrFilter.priority" placeholder="优先级" clearable style="width: 120px; margin-left: 8px" @change="loadEcrs">
            <el-option v-for="(v, k) in CHANGE_PRIORITY" :key="k" :label="v" :value="k" />
          </el-select>
        </div>
        <el-table :data="ecrList" stripe v-loading="ecrLoading" @row-click="viewEcrDetail">
          <el-table-column prop="ecrCode" label="ECR 编号" width="180" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="changeType" label="变更类型" width="110">
            <template #default="{ row }">
              <el-tag size="small">{{ CHANGE_TYPE[row.changeType as keyof typeof CHANGE_TYPE] || row.changeType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="priorityTagType(row.priority)">{{ CHANGE_PRIORITY[row.priority as keyof typeof CHANGE_PRIORITY] || row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag size="small" :type="ecrStatusType(row.status)">{{ ECR_STATUS[row.status as keyof typeof ECR_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="发起人" width="100">
            <template #default="{ row }">{{ row.requester?.realName || '-' }}</template>
          </el-table-column>
          <el-table-column label="影响项" width="80" align="center">
            <template #default="{ row }">{{ row._count?.impactItems || 0 }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="120">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right" @click.stop>
            <template #default="{ row }">
              <el-button v-if="row.status === 'draft'" size="small" type="primary" link @click.stop="submitEcr(row)">提交</el-button>
              <el-button v-if="row.status === 'submitted'" size="small" type="warning" link @click.stop="startImpactAnalysis(row)">开始分析</el-button>
              <el-button v-if="row.status === 'impact_analysis'" size="small" type="info" link @click.stop="submitToCcb(row)">提交CCB</el-button>
              <el-button v-if="row.status === 'ccb_review'" size="small" type="success" link @click.stop="showApproveDialog(row)">批准</el-button>
              <el-button v-if="row.status === 'ccb_review'" size="small" type="danger" link @click.stop="showRejectDialog(row)">驳回</el-button>
              <el-button v-if="row.status === 'approved'" size="small" type="primary" link @click.stop="createEcnFromEcr(row)">创建ECN</el-button>
              <el-button v-if="row.status === 'approved'" size="small" link @click.stop="closeEcr(row)">关闭</el-button>
              <el-button v-if="row.status === 'draft'" size="small" type="danger" link @click.stop="deleteEcr(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 2: ECN List -->
      <el-tab-pane label="ECN 执行" name="ecn">
        <div class="tab-toolbar">
          <el-select v-model="ecnFilter.status" placeholder="状态" clearable style="width: 140px" @change="loadEcns">
            <el-option v-for="(v, k) in ECN_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
        </div>
        <el-table :data="ecnList" stripe v-loading="ecnLoading" @row-click="viewEcnDetail">
          <el-table-column prop="ecnCode" label="ECN 编号" width="180" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="关联 ECR" width="180">
            <template #default="{ row }">{{ row.ecr?.ecrCode || '-' }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag size="small" :type="ecnStatusType(row.status)">{{ ECN_STATUS[row.status as keyof typeof ECN_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="生效日期" width="120">
            <template #default="{ row }">{{ row.effectiveDate ? formatDate(row.effectiveDate) : '-' }}</template>
          </el-table-column>
          <el-table-column label="发布人" width="100">
            <template #default="{ row }">{{ row.issuedBy?.realName || '-' }}</template>
          </el-table-column>
          <el-table-column label="执行项" width="80" align="center">
            <template #default="{ row }">{{ row._count?.actionItems || 0 }}</template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right" @click.stop>
            <template #default="{ row }">
              <el-button v-if="row.status === 'planning'" size="small" type="primary" link @click.stop="startEcnExecution(row)">开始执行</el-button>
              <el-button v-if="row.status === 'executing'" size="small" type="warning" link @click.stop="startEcnVerification(row)">开始验证</el-button>
              <el-button v-if="row.status === 'verifying'" size="small" type="success" link @click.stop="closeEcn(row)">关闭</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 3: CCB Records -->
      <el-tab-pane label="CCB 评审记录" name="ccb">
        <el-table :data="ccbList" stripe v-loading="ccbLoading">
          <el-table-column label="ECR 编号" width="180">
            <template #default="{ row }">{{ row.ecr?.ecrCode || '-' }}</template>
          </el-table-column>
          <el-table-column label="ECR 标题" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.ecr?.title || '-' }}</template>
          </el-table-column>
          <el-table-column label="评审日期" width="120">
            <template #default="{ row }">{{ formatDate(row.reviewDate) }}</template>
          </el-table-column>
          <el-table-column label="评审人" width="100">
            <template #default="{ row }">{{ row.reviewer?.realName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="decision" label="决定" width="130">
            <template #default="{ row }">
              <el-tag size="small" :type="ccbDecisionType(row.decision)">{{ CCB_DECISION[row.decision as keyof typeof CCB_DECISION] || row.decision }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="opinion" label="意见" min-width="200" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Create/Edit ECR Dialog -->
    <el-dialog v-model="ecrDialogVisible" :title="ecrEditing ? '编辑 ECR' : '新建 ECR'" width="700px" destroy-on-close>
      <el-form :model="ecrForm" label-width="120px">
        <el-form-item label="所属项目" required>
          <el-select v-model="ecrForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="ecrForm.title" placeholder="变更标题" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="变更类型" required>
              <el-select v-model="ecrForm.changeType" style="width: 100%">
                <el-option v-for="(v, k) in CHANGE_TYPE" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="ecrForm.priority" style="width: 100%">
                <el-option v-for="(v, k) in CHANGE_PRIORITY" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="变更原因">
          <el-input v-model="ecrForm.reason" type="textarea" :rows="2" placeholder="为什么需要变更" />
        </el-form-item>
        <el-form-item label="当前状况">
          <el-input v-model="ecrForm.currentCondition" type="textarea" :rows="2" placeholder="描述当前状况" />
        </el-form-item>
        <el-form-item label="建议变更">
          <el-input v-model="ecrForm.proposedChange" type="textarea" :rows="2" placeholder="描述建议的变更方案" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="ecrForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="目标日期">
              <el-date-picker v-model="ecrForm.targetDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预估成本">
              <el-input-number v-model="ecrForm.estimatedCost" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-checkbox v-model="ecrForm.safetyRelated">安全相关</el-checkbox></el-col>
          <el-col :span="8"><el-checkbox v-model="ecrForm.customerNotified">通知客户</el-checkbox></el-col>
          <el-col :span="8"><el-checkbox v-model="ecrForm.ppapResubmissionRequired">需重新PPAP</el-checkbox></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="ecrDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEcr" :loading="ecrSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- ECR Detail Drawer -->
    <el-drawer v-model="ecrDetailVisible" title="ECR 详情" size="600px">
      <template v-if="ecrDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ECR 编号">{{ ecrDetail.ecrCode }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="ecrStatusType(ecrDetail.status)">{{ ECR_STATUS[ecrDetail.status as keyof typeof ECR_STATUS] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ ecrDetail.title }}</el-descriptions-item>
          <el-descriptions-item label="变更类型">{{ CHANGE_TYPE[ecrDetail.changeType as keyof typeof CHANGE_TYPE] }}</el-descriptions-item>
          <el-descriptions-item label="优先级">{{ CHANGE_PRIORITY[ecrDetail.priority as keyof typeof CHANGE_PRIORITY] }}</el-descriptions-item>
          <el-descriptions-item label="发起人">{{ ecrDetail.requester?.realName }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ ecrDetail.assignedTo?.realName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="安全相关">{{ ecrDetail.safetyRelated ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="需重新PPAP">{{ ecrDetail.ppapResubmissionRequired ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="变更原因" :span="2">{{ ecrDetail.reason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前状况" :span="2">{{ ecrDetail.currentCondition || '-' }}</el-descriptions-item>
          <el-descriptions-item label="建议变更" :span="2">{{ ecrDetail.proposedChange || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px">影响分析明细</h4>
        <el-table :data="ecrDetail.impactItems" stripe size="small">
          <el-table-column prop="impactArea" label="影响领域" width="120">
            <template #default="{ row }">{{ IMPACT_AREA[row.impactArea as keyof typeof IMPACT_AREA] || row.impactArea }}</template>
          </el-table-column>
          <el-table-column prop="affectedItem" label="受影响项目" width="150" />
          <el-table-column prop="impactLevel" label="影响程度" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.impactLevel === 'high' ? 'danger' : row.impactLevel === 'medium' ? 'warning' : 'info'">{{ IMPACT_LEVEL[row.impactLevel as keyof typeof IMPACT_LEVEL] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
        </el-table>

        <div v-if="ecrDetail.status === 'draft' || ecrDetail.status === 'submitted' || ecrDetail.status === 'impact_analysis'">
          <h4 style="margin-top: 20px">添加影响分析</h4>
          <el-form :inline="true" :model="impactForm" size="small">
            <el-form-item label="领域">
              <el-select v-model="impactForm.impactArea" style="width: 120px">
                <el-option v-for="(v, k) in IMPACT_AREA" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="程度">
              <el-select v-model="impactForm.impactLevel" style="width: 80px">
                <el-option v-for="(v, k) in IMPACT_LEVEL" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="impactForm.description" style="width: 200px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addImpactItem">添加</el-button>
            </el-form-item>
          </el-form>
        </div>

        <h4 style="margin-top: 20px">CCB 评审记录</h4>
        <el-timeline v-if="ecrDetail.ccbReviews?.length">
          <el-timeline-item v-for="review in ecrDetail.ccbReviews" :key="review.id" :timestamp="formatDate(review.reviewDate)" :type="review.decision === 'approve' ? 'success' : review.decision === 'reject' ? 'danger' : 'warning'">
            <strong>{{ CCB_DECISION[review.decision as keyof typeof CCB_DECISION] }}</strong> - {{ review.reviewer?.realName }}
            <p v-if="review.opinion">{{ review.opinion }}</p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无评审记录" :image-size="60" />

        <h4 style="margin-top: 20px">关联 ECN</h4>
        <el-table v-if="ecrDetail.ecns?.length" :data="ecrDetail.ecns" stripe size="small">
          <el-table-column prop="ecnCode" label="ECN 编号" width="180" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="ecnStatusType(row.status)">{{ ECN_STATUS[row.status as keyof typeof ECN_STATUS] }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无关联 ECN" :image-size="60" />
      </template>
    </el-drawer>

    <!-- ECN Detail Drawer -->
    <el-drawer v-model="ecnDetailVisible" title="ECN 详情" size="600px">
      <template v-if="ecnDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ECN 编号">{{ ecnDetail.ecnCode }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="ecnStatusType(ecnDetail.status)">{{ ECN_STATUS[ecnDetail.status as keyof typeof ECN_STATUS] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ ecnDetail.title }}</el-descriptions-item>
          <el-descriptions-item label="关联 ECR">{{ ecnDetail.ecr?.ecrCode }} - {{ ecnDetail.ecr?.title }}</el-descriptions-item>
          <el-descriptions-item label="生效日期">{{ ecnDetail.effectiveDate ? formatDate(ecnDetail.effectiveDate) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="发布人">{{ ecnDetail.issuedBy?.realName }}</el-descriptions-item>
          <el-descriptions-item label="验证人">{{ ecnDetail.verifiedBy?.realName || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px">
          执行明细
          <el-button v-if="ecnDetail.status === 'planning' || ecnDetail.status === 'executing'" size="small" type="primary" style="float: right" @click="showAddActionItemDialog">添加</el-button>
        </h4>
        <el-table :data="ecnDetail.actionItems" stripe size="small">
          <el-table-column prop="actionType" label="类型" width="130">
            <template #default="{ row }">{{ ECN_ACTION_TYPE[row.actionType as keyof typeof ECN_ACTION_TYPE] || row.actionType }}</template>
          </el-table-column>
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
          <el-table-column label="负责人" width="100">
            <template #default="{ row }">{{ row.assignedTo?.realName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="actionStatusType(row.status)">{{ ECN_ACTION_STATUS[row.status as keyof typeof ECN_ACTION_STATUS] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-button v-if="row.status === 'pending' || row.status === 'in_progress'" size="small" type="success" link @click="completeActionItem(row)">完成</el-button>
              <el-button v-if="row.status === 'completed'" size="small" type="primary" link @click="verifyActionItem(row)">验证</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>

    <!-- Approve Dialog -->
    <el-dialog v-model="approveDialogVisible" title="CCB 批准" width="500px">
      <el-form label-width="80px">
        <el-form-item label="意见">
          <el-input v-model="approveForm.opinion" type="textarea" :rows="3" placeholder="批准意见（可选）" />
        </el-form-item>
        <el-form-item label="条件">
          <el-input v-model="approveForm.conditions" type="textarea" :rows="2" placeholder="批准条件（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="success" @click="doApproveEcr">确认批准</el-button>
      </template>
    </el-dialog>

    <!-- Reject Dialog -->
    <el-dialog v-model="rejectDialogVisible" title="CCB 驳回" width="500px">
      <el-form label-width="80px">
        <el-form-item label="原因">
          <el-input v-model="rejectForm.opinion" type="textarea" :rows="3" placeholder="驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="doRejectEcr">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- Create ECN Dialog -->
    <el-dialog v-model="ecnCreateDialogVisible" title="从 ECR 创建 ECN" width="500px">
      <el-form :model="ecnCreateForm" label-width="100px">
        <el-form-item label="来源 ECR">
          <el-input :model-value="ecnCreateForm.ecrCode" disabled />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="ecnCreateForm.title" />
        </el-form-item>
        <el-form-item label="生效日期">
          <el-date-picker v-model="ecnCreateForm.effectiveDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="ecnCreateForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ecnCreateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doCreateEcn">创建</el-button>
      </template>
    </el-dialog>

    <!-- Add Action Item Dialog -->
    <el-dialog v-model="actionItemDialogVisible" title="添加执行项" width="500px">
      <el-form :model="actionItemForm" label-width="100px">
        <el-form-item label="类型">
          <el-select v-model="actionItemForm.actionType" style="width: 100%">
            <el-option v-for="(v, k) in ECN_ACTION_TYPE" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="actionItemForm.description" />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="actionItemForm.dueDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionItemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doAddActionItem">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { changeApi } from '@/api'
import { projectApi } from '@/api'

const ECR_STATUS: Record<string, string> = { draft: '草稿', submitted: '已提交', impact_analysis: '影响分析中', ccb_review: 'CCB评审中', approved: '已批准', rejected: '已驳回', closed: '已关闭' }
const ECN_STATUS: Record<string, string> = { planning: '计划中', executing: '执行中', verifying: '验证中', closed: '已关闭' }
const CHANGE_TYPE: Record<string, string> = { design: '设计变更', process: '工艺变更', material: '材料变更', specification: '规格变更', plan: '计划变更', schedule: '进度变更', cost: '成本变更' }
const CHANGE_PRIORITY: Record<string, string> = { critical: '紧急', major: '重要', general: '一般', minor: '轻微' }
const IMPACT_AREA: Record<string, string> = { bom: 'BOM', fmea: 'FMEA', sample: '样件', cost: '成本', document: '文档', tooling: '工装模具', safety: '安全特性', process: '工艺流程', control_plan: '控制计划', spc: 'SPC', msa: 'MSA', ppap: 'PPAP' }
const IMPACT_LEVEL: Record<string, string> = { high: '高', medium: '中', low: '低' }
const CCB_DECISION: Record<string, string> = { approve: '批准', reject: '驳回', conditional: '有条件批准', defer: '延期' }
const ECN_ACTION_TYPE: Record<string, string> = { update_bom: '更新BOM', update_fmea: '更新FMEA', update_control_plan: '更新控制计划', update_drawing: '更新图纸', update_process: '更新工艺文件', update_ppap: '更新PPAP', update_document: '更新文档', tooling_change: '工装变更', sample_verification: '样件验证', other: '其他' }
const ECN_ACTION_STATUS: Record<string, string> = { pending: '待处理', in_progress: '进行中', completed: '已完成', verified: '已验证' }

const activeTab = ref('ecr')
const projectFilter = ref<number | undefined>()
const projects = ref<any[]>([])

// Stats
const stats = ref<any>({})

// ECR
const ecrList = ref<any[]>([])
const ecrLoading = ref(false)
const ecrFilter = reactive({ status: '', changeType: '', priority: '' })
const ecrDialogVisible = ref(false)
const ecrEditing = ref(false)
const ecrSaving = ref(false)
const ecrForm = reactive<any>({ projectId: null, title: '', changeType: 'design', priority: 'general', reason: '', currentCondition: '', proposedChange: '', description: '', targetDate: null, estimatedCost: null, safetyRelated: false, customerNotified: false, ppapResubmissionRequired: false })
const ecrDetailVisible = ref(false)
const ecrDetail = ref<any>(null)
const impactForm = reactive<any>({ impactArea: 'bom', impactLevel: 'medium', description: '' })

// ECN
const ecnList = ref<any[]>([])
const ecnLoading = ref(false)
const ecnFilter = reactive({ status: '' })
const ecnDetailVisible = ref(false)
const ecnDetail = ref<any>(null)
const ecnCreateDialogVisible = ref(false)
const ecnCreateForm = reactive<any>({ ecrId: null, ecrCode: '', title: '', effectiveDate: null, description: '' })
const actionItemDialogVisible = ref(false)
const actionItemForm = reactive<any>({ actionType: 'update_document', description: '', dueDate: null })

// CCB
const ccbList = ref<any[]>([])
const ccbLoading = ref(false)
const approveDialogVisible = ref(false)
const approveForm = reactive<any>({ ecrId: null, opinion: '', conditions: '' })
const rejectDialogVisible = ref(false)
const rejectForm = reactive<any>({ ecrId: null, opinion: '' })

// Helpers
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('zh-CN') : '-'
const priorityTagType = (p: string) => ({ critical: 'danger', major: 'warning', general: '', minor: 'info' } as any)[p] || ''
const ecrStatusType = (s: string) => ({ draft: 'info', submitted: '', impact_analysis: 'warning', ccb_review: 'warning', approved: 'success', rejected: 'danger', closed: '' } as any)[s] || ''
const ecnStatusType = (s: string) => ({ planning: 'info', executing: '', verifying: 'warning', closed: 'success' } as any)[s] || ''
const ccbDecisionType = (d: string) => ({ approve: 'success', reject: 'danger', conditional: 'warning', defer: 'info' } as any)[d] || ''
const actionStatusType = (s: string) => ({ pending: 'info', in_progress: '', completed: 'success', verified: 'success' } as any)[s] || ''

async function loadProjects() {
  try {
    const res = await projectApi.list()
    projects.value = res.data?.data || res.data || []
  } catch { projects.value = [] }
}

async function loadStats() {
  try {
    const res = await changeApi.stats.overview(projectFilter.value ? { projectId: projectFilter.value } : {})
    stats.value = res.data?.data || res.data || {}
  } catch { stats.value = {} }
}

async function loadEcrs() {
  ecrLoading.value = true
  try {
    const params: any = {}
    if (projectFilter.value) params.projectId = projectFilter.value
    if (ecrFilter.status) params.status = ecrFilter.status
    if (ecrFilter.changeType) params.changeType = ecrFilter.changeType
    if (ecrFilter.priority) params.priority = ecrFilter.priority
    const res = await changeApi.ecrs.list(params)
    ecrList.value = res.data?.data || res.data || []
  } catch { ecrList.value = [] }
  ecrLoading.value = false
}

async function loadEcns() {
  ecnLoading.value = true
  try {
    const params: any = {}
    if (projectFilter.value) params.projectId = projectFilter.value
    if (ecnFilter.status) params.status = ecnFilter.status
    const res = await changeApi.ecns.list(params)
    ecnList.value = res.data?.data || res.data || []
  } catch { ecnList.value = [] }
  ecnLoading.value = false
}

async function loadCcbReviews() {
  ccbLoading.value = true
  try {
    const res = await changeApi.ccbReviews.list()
    ccbList.value = res.data?.data || res.data || []
  } catch { ccbList.value = [] }
  ccbLoading.value = false
}

function loadAll() { loadStats(); loadEcrs(); loadEcns(); loadCcbReviews() }

function showCreateEcrDialog() {
  ecrEditing.value = false
  Object.assign(ecrForm, { projectId: projectFilter.value || null, title: '', changeType: 'design', priority: 'general', reason: '', currentCondition: '', proposedChange: '', description: '', targetDate: null, estimatedCost: null, safetyRelated: false, customerNotified: false, ppapResubmissionRequired: false })
  ecrDialogVisible.value = true
}

async function saveEcr() {
  if (!ecrForm.title || !ecrForm.projectId) { ElMessage.warning('请填写标题和项目'); return }
  ecrSaving.value = true
  try {
    if (ecrEditing.value) {
      await changeApi.ecrs.update(ecrForm.id, ecrForm)
    } else {
      await changeApi.ecrs.create(ecrForm)
    }
    ElMessage.success('保存成功')
    ecrDialogVisible.value = false
    loadAll()
  } catch (e: any) { ElMessage.error(e.response?.data?.message || '保存失败') }
  ecrSaving.value = false
}

async function viewEcrDetail(row: any) {
  try {
    const res = await changeApi.ecrs.get(row.id)
    ecrDetail.value = res.data?.data || res.data
    ecrDetailVisible.value = true
  } catch { ElMessage.error('获取详情失败') }
}

async function submitEcr(row: any) {
  try { await changeApi.ecrs.submit(row.id); ElMessage.success('已提交'); loadAll() } catch (e: any) { ElMessage.error(e.response?.data?.message || '操作失败') }
}

async function startImpactAnalysis(row: any) {
  try { await changeApi.ecrs.startImpactAnalysis(row.id); ElMessage.success('开始影响分析'); loadAll() } catch (e: any) { ElMessage.error(e.response?.data?.message || '操作失败') }
}

async function submitToCcb(row: any) {
  try { await changeApi.ecrs.submitCcb(row.id); ElMessage.success('已提交CCB评审'); loadAll() } catch (e: any) { ElMessage.error(e.response?.data?.message || '操作失败') }
}

function showApproveDialog(row: any) {
  Object.assign(approveForm, { ecrId: row.id, opinion: '', conditions: '' })
  approveDialogVisible.value = true
}

async function doApproveEcr() {
  try { await changeApi.ecrs.approve(approveForm.ecrId, approveForm); ElMessage.success('已批准'); approveDialogVisible.value = false; loadAll(); if (ecrDetailVisible.value) viewEcrDetail({ id: approveForm.ecrId }) } catch (e: any) { ElMessage.error(e.response?.data?.message || '操作失败') }
}

function showRejectDialog(row: any) {
  Object.assign(rejectForm, { ecrId: row.id, opinion: '' })
  rejectDialogVisible.value = true
}

async function doRejectEcr() {
  try { await changeApi.ecrs.reject(rejectForm.ecrId, rejectForm); ElMessage.success('已驳回'); rejectDialogVisible.value = false; loadAll() } catch (e: any) { ElMessage.error(e.response?.data?.message || '操作失败') }
}

async function closeEcr(row: any) {
  try { await ElMessageBox.confirm('确认关闭此 ECR？'); await changeApi.ecrs.close(row.id); ElMessage.success('已关闭'); loadAll() } catch {}
}

async function deleteEcr(row: any) {
  try { await ElMessageBox.confirm('确认删除此 ECR？'); await changeApi.ecrs.delete(row.id); ElMessage.success('已删除'); loadAll() } catch {}
}

async function addImpactItem() {
  if (!ecrDetail.value) return
  try {
    await changeApi.impactItems.create(ecrDetail.value.id, impactForm)
    ElMessage.success('已添加')
    Object.assign(impactForm, { impactArea: 'bom', impactLevel: 'medium', description: '' })
    viewEcrDetail(ecrDetail.value)
    loadEcrs()
  } catch (e: any) { ElMessage.error(e.response?.data?.message || '添加失败') }
}

async function viewEcnDetail(row: any) {
  try {
    const res = await changeApi.ecns.get(row.id)
    ecnDetail.value = res.data?.data || res.data
    ecnDetailVisible.value = true
  } catch { ElMessage.error('获取详情失败') }
}

async function createEcnFromEcr(row: any) {
  Object.assign(ecnCreateForm, { ecrId: row.id, ecrCode: row.ecrCode, title: row.title, effectiveDate: null, description: '' })
  ecnCreateDialogVisible.value = true
}

async function doCreateEcn() {
  try {
    await changeApi.ecns.createFromEcr(ecnCreateForm.ecrId, ecnCreateForm)
    ElMessage.success('ECN 创建成功')
    ecnCreateDialogVisible.value = false
    loadAll()
  } catch (e: any) { ElMessage.error(e.response?.data?.message || '创建失败') }
}

async function startEcnExecution(row: any) {
  try { await changeApi.ecns.startExecution(row.id); ElMessage.success('开始执行'); loadAll() } catch (e: any) { ElMessage.error(e.response?.data?.message || '操作失败') }
}

async function startEcnVerification(row: any) {
  try { await changeApi.ecns.startVerification(row.id); ElMessage.success('开始验证'); loadAll() } catch (e: any) { ElMessage.error(e.response?.data?.message || '操作失败') }
}

async function closeEcn(row: any) {
  try { await ElMessageBox.confirm('确认关闭此 ECN？所有执行项必须已完成验证。'); await changeApi.ecns.close(row.id); ElMessage.success('已关闭'); loadAll() } catch {}
}

function showAddActionItemDialog() {
  Object.assign(actionItemForm, { actionType: 'update_document', description: '', dueDate: null })
  actionItemDialogVisible.value = true
}

async function doAddActionItem() {
  if (!ecnDetail.value) return
  try {
    await changeApi.actionItems.create(ecnDetail.value.id, actionItemForm)
    ElMessage.success('已添加')
    actionItemDialogVisible.value = false
    viewEcnDetail(ecnDetail.value)
    loadEcns()
  } catch (e: any) { ElMessage.error(e.response?.data?.message || '添加失败') }
}

async function completeActionItem(row: any) {
  try { await changeApi.actionItems.complete(row.id); ElMessage.success('已完成'); viewEcnDetail(ecnDetail.value) } catch (e: any) { ElMessage.error(e.response?.data?.message || '操作失败') }
}

async function verifyActionItem(row: any) {
  try { await changeApi.actionItems.verify(row.id, {}); ElMessage.success('已验证'); viewEcnDetail(ecnDetail.value) } catch (e: any) { ElMessage.error(e.response?.data?.message || '操作失败') }
}

onMounted(() => { loadProjects(); loadAll() })
</script>

<style scoped>
.change-management-view { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.kpi-row { margin-bottom: 16px; }
.kpi-card { text-align: center; }
.kpi-value { font-size: 28px; font-weight: bold; }
.kpi-label { font-size: 13px; color: #909399; margin-top: 4px; }
.tab-toolbar { margin-bottom: 12px; }
</style>
