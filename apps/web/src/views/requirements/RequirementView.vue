<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>{{ project?.projectName }} - A-SPICE 需求管理</h2>
      <div>
        <el-button @click="$router.push(`/projects/${projectId}`)">返回项目</el-button>
        <el-button type="primary" @click="openCreateDialog">新建需求</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <!-- 需求列表 -->
      <el-tab-pane label="需求列表" name="list">
        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="需求总数" :value="stats.total" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="已批准" :value="stats.approved" value-style="color: #67c23a" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="评审中" :value="stats.inReview" value-style="color: #e6a23c" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="覆盖率" :value="stats.coverage" suffix="%" :precision="1" value-style="color: #409eff" />
            </el-card>
          </el-col>
        </el-row>

        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>需求清单</span>
              <div>
                <el-input v-model="filter.keyword" placeholder="搜索编号/标题" clearable size="small" style="width: 200px; margin-right: 8px" @clear="loadRequirements" @keyup.enter="loadRequirements" />
                <el-select v-model="filter.reqType" placeholder="类型" clearable size="small" style="width: 120px; margin-right: 8px" @change="loadRequirements">
                  <el-option label="客户需求" value="customer" />
                  <el-option label="系统需求" value="system" />
                  <el-option label="软件需求" value="software" />
                  <el-option label="性能需求" value="performance" />
                  <el-option label="安全需求" value="safety" />
                  <el-option label="法规需求" value="regulatory" />
                </el-select>
                <el-select v-model="filter.status" placeholder="状态" clearable size="small" style="width: 120px" @change="loadRequirements">
                  <el-option label="草稿" value="draft" />
                  <el-option label="评审中" value="in_review" />
                  <el-option label="已批准" value="approved" />
                  <el-option label="已变更" value="changed" />
                  <el-option label="已废弃" value="obsolete" />
                </el-select>
              </div>
            </div>
          </template>

          <el-table :data="requirements" border stripe>
            <el-table-column prop="reqCode" label="需求编号" width="160" />
            <el-table-column prop="title" label="需求标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="reqType" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ reqTypeLabel(row.reqType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="asilLevel" label="ASIL" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.asilLevel" :type="asilType(row.asilLevel)" size="small" effect="dark">
                  {{ row.asilLevel }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="80">
              <template #default="{ row }">
                <el-tag :type="priorityType(row.priority)" size="small">{{ priorityLabel(row.priority) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="70" align="center" />
            <el-table-column label="追溯" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.sourceLinks?.length > 0 ? 'success' : 'danger'" size="small">
                  {{ row.sourceLinks?.length || 0 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewRequirement(row)">详情</el-button>
                <el-button type="warning" link size="small" @click="openTraceLinkDialog(row)">追溯</el-button>
                <el-button type="danger" link size="small" @click="deleteRequirement(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-pagination">
            <el-pagination
              v-model:current-page="pagination.page"
              :total="pagination.total"
              layout="total, prev, pager, next"
              @current-change="loadRequirements"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 追溯矩阵 -->
      <el-tab-pane label="追溯矩阵" name="trace">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>需求追溯矩阵 (Requirement Traceability Matrix)</span>
              <el-button type="primary" size="small" @click="loadTraceMatrix">刷新</el-button>
            </div>
          </template>

          <el-table :data="traceMatrix" border stripe>
            <el-table-column prop="reqCode" label="需求编号" width="160" fixed />
            <el-table-column prop="title" label="需求标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="reqType" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ reqTypeLabel(row.reqType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="asilLevel" label="ASIL" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.asilLevel" :type="asilType(row.asilLevel)" size="small" effect="dark">{{ row.asilLevel }}</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="下游追溯" min-width="300">
              <template #default="{ row }">
                <div v-if="row.downstreamLinks?.length > 0">
                  <el-tag
                    v-for="link in row.downstreamLinks"
                    :key="link.linkId"
                    size="small"
                    :type="linkTypeColor(link.linkType)"
                    style="margin: 2px"
                  >
                    {{ linkTypeLabel(link.linkType) }} → {{ link.target?.reqCode || link.targetType }}
                  </el-tag>
                </div>
                <span v-else style="color: #f56c6c">无追溯</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 基线管理 -->
      <el-tab-pane label="基线管理" name="baseline">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>需求基线 (Requirement Baselines)</span>
              <el-button type="primary" size="small" @click="openBaselineDialog">创建基线</el-button>
            </div>
          </template>

          <el-table :data="baselines" border stripe>
            <el-table-column prop="baselineCode" label="基线编号" width="160" />
            <el-table-column prop="baselineName" label="基线名称" min-width="200" />
            <el-table-column prop="baselineType" label="基线类型" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ baselineTypeLabel(row.baselineType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="baselineStatusType(row.status)" size="small">{{ baselineStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="包含需求" width="100" align="center">
              <template #default="{ row }">{{ row.requirements?.length || 0 }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="freezeBaseline(row)">冻结</el-button>
                <el-button type="primary" link size="small" @click="viewBaseline(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 变更请求 -->
      <el-tab-pane label="变更请求" name="change">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>需求变更请求 (Change Requests)</span>
              <el-button type="primary" size="small" @click="openChangeRequestDialog">发起变更</el-button>
            </div>
          </template>

          <el-table :data="changeRequests" border stripe>
            <el-table-column prop="crCode" label="变更编号" width="160" />
            <el-table-column prop="title" label="变更标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="changeType" label="变更类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ changeTypeLabel(row.changeType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="80">
              <template #default="{ row }">
                <el-tag :type="priorityType(row.priority)" size="small">{{ priorityLabel(row.priority) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="crStatusType(row.status)" size="small">{{ crStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="影响需求" width="100" align="center">
              <template #default="{ row }">{{ row.requirements?.length || 0 }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button v-if="row.status === 'draft'" type="primary" link size="small" @click="submitCR(row)">提交</el-button>
                <el-button v-if="row.status === 'under_review'" type="success" link size="small" @click="approveCR(row)">批准</el-button>
                <el-button v-if="row.status === 'under_review'" type="danger" link size="small" @click="rejectCR(row)">驳回</el-button>
                <el-button v-if="row.status === 'approved'" type="warning" link size="small" @click="implementCR(row)">实施</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 覆盖率分析 -->
      <el-tab-pane label="覆盖率分析" name="coverage">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>需求覆盖率分析 (Coverage Analysis)</span>
              <el-button type="primary" size="small" @click="runCoverageAnalysis" :loading="coverageLoading">执行分析</el-button>
            </div>
          </template>

          <div v-if="coverageResult">
            <el-row :gutter="20" style="margin-bottom: 20px">
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="总需求数" :value="coverageResult.total" />
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="已追溯" :value="coverageResult.traced" value-style="color: #67c23a" />
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="覆盖率" :value="coverageResult.coverageRate" suffix="%" :precision="1" value-style="color: #409eff" />
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover">
                  <el-statistic title="孤立需求" :value="coverageResult.orphans?.length || 0" value-style="color: #f56c6c" />
                </el-card>
              </el-col>
            </el-row>

            <div v-if="coverageResult.asilBreakdown" style="margin-bottom: 20px">
              <h4>ASIL 等级覆盖分布</h4>
              <el-table :data="asilBreakdownData" border size="small" style="margin-top: 8px">
                <el-table-column prop="level" label="ASIL 等级" width="100" />
                <el-table-column prop="total" label="总数" width="100" align="center" />
                <el-table-column prop="traced" label="已追溯" width="100" align="center" />
                <el-table-column label="覆盖率" width="120" align="center">
                  <template #default="{ row }">
                    {{ row.total > 0 ? ((row.traced / row.total) * 100).toFixed(1) : 0 }}%
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div v-if="coverageResult.orphans?.length > 0">
              <h4 style="color: #f56c6c">孤立需求 (无下游追溯)</h4>
              <el-table :data="coverageResult.orphans" border size="small" style="margin-top: 8px">
                <el-table-column prop="reqCode" label="需求编号" width="160" />
                <el-table-column prop="title" label="需求标题" min-width="200" show-overflow-tooltip />
                <el-table-column prop="reqType" label="类型" width="100">
                  <template #default="{ row }">
                    <el-tag size="small">{{ reqTypeLabel(row.reqType) }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          <el-empty v-else description="点击「执行分析」查看需求覆盖率" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建需求对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建需求" width="700px">
      <el-form :model="newReq" label-width="120px">
        <el-form-item label="需求标题" required>
          <el-input v-model="newReq.title" placeholder="输入需求标题" />
        </el-form-item>
        <el-form-item label="需求描述">
          <el-input v-model="newReq.description" type="textarea" :rows="4" placeholder="详细描述需求内容" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="需求类型" required>
              <el-select v-model="newReq.reqType" style="width: 100%">
                <el-option label="客户需求" value="customer" />
                <el-option label="系统需求" value="system" />
                <el-option label="软件需求" value="software" />
                <el-option label="性能需求" value="performance" />
                <el-option label="安全需求" value="safety" />
                <el-option label="法规需求" value="regulatory" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="newReq.priority" style="width: 100%">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="ASIL 等级">
              <el-select v-model="newReq.asilLevel" clearable style="width: 100%">
                <el-option label="QM" value="QM" />
                <el-option label="ASIL A" value="A" />
                <el-option label="ASIL B" value="B" />
                <el-option label="ASIL C" value="C" />
                <el-option label="ASIL D" value="D" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源">
              <el-input v-model="newReq.source" placeholder="来源文档或参考" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="验收标准">
          <el-input v-model="newReq.acceptanceCriteria" type="textarea" :rows="3" placeholder="定义需求的验收标准" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createRequirement">创建</el-button>
      </template>
    </el-dialog>

    <!-- 需求详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="需求详情" width="800px">
      <div v-if="selectedReq">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="需求编号">{{ selectedReq.reqCode }}</el-descriptions-item>
          <el-descriptions-item label="版本">V{{ selectedReq.version }}</el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ selectedReq.title }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ reqTypeLabel(selectedReq.reqType) }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="priorityType(selectedReq.priority)" size="small">{{ priorityLabel(selectedReq.priority) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="ASIL 等级">
            <el-tag v-if="selectedReq.asilLevel" :type="asilType(selectedReq.asilLevel)" size="small" effect="dark">{{ selectedReq.asilLevel }}</el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(selectedReq.status)" size="small">{{ statusLabel(selectedReq.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedReq.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ selectedReq.source || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedReq.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="验收标准" :span="2">{{ selectedReq.acceptanceCriteria || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px">
          <h4>追溯链接</h4>
          <el-table :data="selectedReq.sourceLinks || []" border size="small" style="margin-top: 8px">
            <el-table-column label="链接类型" width="120">
              <template #default="{ row }">{{ linkTypeLabel(row.linkType) }}</template>
            </el-table-column>
            <el-table-column label="目标需求" min-width="200">
              <template #default="{ row }">
                {{ row.targetReq?.reqCode }} - {{ row.targetReq?.title || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="验证方法" width="120">
              <template #default="{ row }">{{ row.verificationMethod || '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!selectedReq.sourceLinks?.length" description="暂无追溯链接" :image-size="40" />
        </div>

        <div style="margin-top: 20px">
          <h4>版本历史</h4>
          <el-table :data="selectedReq.versions || []" border size="small" style="margin-top: 8px">
            <el-table-column prop="versionNo" label="版本" width="80" align="center">
              <template #default="{ row }">V{{ row.versionNo }}</template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column prop="changeNote" label="变更说明" min-width="200" />
            <el-table-column label="时间" width="120">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 追溯链接对话框 -->
    <el-dialog v-model="showTraceLinkDialog" title="添加追溯链接" width="600px">
      <el-form :model="newTraceLink" label-width="120px">
        <el-form-item label="源需求">
          <el-input :value="`${traceLinkSource?.reqCode} - ${traceLinkSource?.title}`" disabled />
        </el-form-item>
        <el-form-item label="链接类型" required>
          <el-select v-model="newTraceLink.linkType" style="width: 100%">
            <el-option label="派生 (Derive)" value="derive" />
            <el-option label="分配 (Allocate)" value="allocate" />
            <el-option label="实现 (Implement)" value="implement" />
            <el-option label="验证 (Verify)" value="verify" />
            <el-option label="追溯 (Trace)" value="trace" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标类型" required>
          <el-select v-model="newTraceLink.targetType" style="width: 100%">
            <el-option label="需求" value="requirement" />
            <el-option label="测试用例" value="test_case" />
            <el-option label="设计文档" value="design" />
            <el-option label="代码模块" value="code" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="newTraceLink.targetType === 'requirement'" label="目标需求" required>
          <el-select v-model="newTraceLink.targetReqId" filterable placeholder="选择目标需求" style="width: 100%">
            <el-option v-for="req in allRequirements" :key="req.id" :label="`${req.reqCode} - ${req.title}`" :value="req.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="验证方法">
          <el-select v-model="newTraceLink.verificationMethod" clearable style="width: 100%">
            <el-option label="测试" value="test" />
            <el-option label="分析" value="analysis" />
            <el-option label="演示" value="demonstration" />
            <el-option label="审查" value="inspection" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTraceLinkDialog = false">取消</el-button>
        <el-button type="primary" @click="createTraceLink">添加</el-button>
      </template>
    </el-dialog>

    <!-- 基线对话框 -->
    <el-dialog v-model="showBaselineDialog" title="创建基线" width="600px">
      <el-form :model="newBaseline" label-width="120px">
        <el-form-item label="基线名称" required>
          <el-input v-model="newBaseline.baselineName" placeholder="输入基线名称" />
        </el-form-item>
        <el-form-item label="基线编号" required>
          <el-input v-model="newBaseline.baselineCode" placeholder="如: BL-001" />
        </el-form-item>
        <el-form-item label="基线类型" required>
          <el-select v-model="newBaseline.baselineType" style="width: 100%">
            <el-option label="功能基线" value="functional" />
            <el-option label="分配基线" value="allocated" />
            <el-option label="产品基线" value="product" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本号" required>
          <el-input v-model="newBaseline.version" placeholder="如: 1.0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newBaseline.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="包含需求">
          <el-select v-model="newBaseline.requirementIds" multiple filterable placeholder="选择需求" style="width: 100%">
            <el-option v-for="req in allRequirements" :key="req.id" :label="`${req.reqCode} - ${req.title}`" :value="req.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBaselineDialog = false">取消</el-button>
        <el-button type="primary" @click="createBaseline">创建</el-button>
      </template>
    </el-dialog>

    <!-- 变更请求对话框 -->
    <el-dialog v-model="showChangeRequestDialog" title="发起变更请求" width="600px">
      <el-form :model="newCR" label-width="120px">
        <el-form-item label="变更标题" required>
          <el-input v-model="newCR.title" placeholder="输入变更标题" />
        </el-form-item>
        <el-form-item label="变更描述">
          <el-input v-model="newCR.description" type="textarea" :rows="3" placeholder="详细描述变更内容" />
        </el-form-item>
        <el-form-item label="变更类型" required>
          <el-select v-model="newCR.changeType" style="width: 100%">
            <el-option label="新增" value="add" />
            <el-option label="修改" value="modify" />
            <el-option label="删除" value="delete" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="newCR.priority" style="width: 100%">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="影响分析">
          <el-input v-model="newCR.impactAnalysis" type="textarea" :rows="3" placeholder="分析变更对项目的影响" />
        </el-form-item>
        <el-form-item label="影响需求">
          <el-select v-model="newCR.requirementIds" multiple filterable placeholder="选择受影响的需求" style="width: 100%">
            <el-option v-for="req in allRequirements" :key="req.id" :label="`${req.reqCode} - ${req.title}`" :value="req.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangeRequestDialog = false">取消</el-button>
        <el-button type="primary" @click="createChangeRequest">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { projectApi, requirementApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const projectId = +route.params.projectId
const loading = ref(false)
const project = ref<any>(null)
const requirements = ref<any[]>([])
const allRequirements = ref<any[]>([])
const traceMatrix = ref<any[]>([])
const baselines = ref<any[]>([])
const changeRequests = ref<any[]>([])
const selectedReq = ref<any>(null)
const traceLinkSource = ref<any>(null)
const coverageResult = ref<any>(null)
const coverageLoading = ref(false)
const activeTab = ref('list')

const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showTraceLinkDialog = ref(false)
const showBaselineDialog = ref(false)
const showChangeRequestDialog = ref(false)

const filter = reactive({ keyword: '', reqType: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const newReq = reactive({
  title: '',
  description: '',
  reqType: 'system',
  priority: 'medium',
  asilLevel: '',
  source: '',
  acceptanceCriteria: '',
})

const newTraceLink = reactive({
  sourceReqId: 0,
  targetReqId: null as number | null,
  targetType: 'requirement',
  targetId: null as number | null,
  linkType: 'derive',
  verificationMethod: '',
})

const newBaseline = reactive({
  baselineName: '',
  baselineCode: '',
  baselineType: 'functional',
  version: '1.0',
  description: '',
  requirementIds: [] as number[],
})

const newCR = reactive({
  title: '',
  description: '',
  changeType: 'modify',
  priority: 'medium',
  impactAnalysis: '',
  requirementIds: [] as number[],
})

const stats = computed(() => {
  const all = requirements.value
  return {
    total: pagination.total,
    approved: all.filter((r: any) => r.status === 'approved').length,
    inReview: all.filter((r: any) => r.status === 'in_review').length,
    coverage: all.length > 0
      ? (all.filter((r: any) => r.sourceLinks?.length > 0).length / all.length) * 100
      : 0,
  }
})

const asilBreakdownData = computed(() => {
  if (!coverageResult.value?.asilBreakdown) return []
  return Object.entries(coverageResult.value.asilBreakdown).map(([level, data]: [string, any]) => ({
    level,
    total: data.total,
    traced: data.traced,
  }))
})

const reqTypeMap: Record<string, string> = {
  customer: '客户需求', system: '系统需求', software: '软件需求',
  performance: '性能需求', safety: '安全需求', regulatory: '法规需求',
}
const priorityMap: Record<string, { label: string; type: string }> = {
  high: { label: '高', type: 'danger' },
  medium: { label: '中', type: 'warning' },
  low: { label: '低', type: 'info' },
}
const statusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  in_review: { label: '评审中', type: 'warning' },
  approved: { label: '已批准', type: 'success' },
  changed: { label: '已变更', type: '' },
  obsolete: { label: '已废弃', type: 'danger' },
}
const linkTypeMap: Record<string, string> = {
  derive: '派生', allocate: '分配', implement: '实现', verify: '验证', trace: '追溯',
}
const baselineTypeMap: Record<string, string> = {
  functional: '功能基线', allocated: '分配基线', product: '产品基线',
}
const baselineStatusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  frozen: { label: '已冻结', type: 'success' },
  changed: { label: '已变更', type: 'warning' },
}
const crStatusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  submitted: { label: '已提交', type: '' },
  under_review: { label: '评审中', type: 'warning' },
  approved: { label: '已批准', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  implemented: { label: '已实施', type: 'success' },
}
const changeTypeMap: Record<string, string> = {
  add: '新增', modify: '修改', delete: '删除',
}

function reqTypeLabel(t: string) { return reqTypeMap[t] || t }
function priorityLabel(p: string) { return priorityMap[p]?.label || p }
function priorityType(p: string) { return priorityMap[p]?.type || 'info' }
function statusLabel(s: string) { return statusMap[s]?.label || s }
function statusType(s: string) { return statusMap[s]?.type || 'info' }
function asilType(a: string) {
  if (a === 'D') return 'danger'
  if (a === 'C') return 'warning'
  if (a === 'B') return ''
  return 'info'
}
function linkTypeLabel(t: string) { return linkTypeMap[t] || t }
function linkTypeColor(t: string) {
  if (t === 'derive') return 'primary'
  if (t === 'allocate') return 'success'
  if (t === 'implement') return 'warning'
  if (t === 'verify') return 'danger'
  return 'info'
}
function baselineTypeLabel(t: string) { return baselineTypeMap[t] || t }
function baselineStatusLabel(s: string) { return baselineStatusMap[s]?.label || s }
function baselineStatusType(s: string) { return baselineStatusMap[s]?.type || 'info' }
function crStatusLabel(s: string) { return crStatusMap[s]?.label || s }
function crStatusType(s: string) { return crStatusMap[s]?.type || 'info' }
function changeTypeLabel(t: string) { return changeTypeMap[t] || t }
function formatDate(d: string | null) { return d ? dayjs(d).format('YYYY-MM-DD') : '-' }

async function loadProject() {
  try {
    const res: any = await projectApi.get(projectId)
    project.value = res
  } catch (e) {
    console.error('Failed to load project', e)
  }
}

async function loadRequirements() {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.pageSize }
    if (filter.keyword) params.keyword = filter.keyword
    if (filter.reqType) params.reqType = filter.reqType
    if (filter.status) params.status = filter.status
    const res: any = await requirementApi.list(projectId, params)
    requirements.value = res.list
    pagination.total = res.total
  } catch (e) {
    console.error('Failed to load requirements', e)
  } finally {
    loading.value = false
  }
}

async function loadAllRequirements() {
  try {
    const res: any = await requirementApi.list(projectId, { page: 1, pageSize: 1000 })
    allRequirements.value = res.list
  } catch (e) {
    console.error('Failed to load all requirements', e)
  }
}

async function loadTraceMatrix() {
  try {
    const res: any = await requirementApi.traceMatrix(projectId)
    traceMatrix.value = res
  } catch (e) {
    console.error('Failed to load trace matrix', e)
  }
}

async function loadBaselines() {
  try {
    const res: any = await requirementApi.baselines(projectId)
    baselines.value = res
  } catch (e) {
    console.error('Failed to load baselines', e)
  }
}

async function loadChangeRequests() {
  try {
    const res: any = await requirementApi.changeRequests(projectId, { page: 1, pageSize: 100 })
    changeRequests.value = res.list
  } catch (e) {
    console.error('Failed to load change requests', e)
  }
}

async function runCoverageAnalysis() {
  coverageLoading.value = true
  try {
    const res: any = await requirementApi.coverage(projectId)
    coverageResult.value = res
  } catch (e) {
    console.error('Failed to run coverage analysis', e)
  } finally {
    coverageLoading.value = false
  }
}

function handleTabChange(tab: any) {
  if (tab.paneName === 'trace') loadTraceMatrix()
  if (tab.paneName === 'baseline') loadBaselines()
  if (tab.paneName === 'change') loadChangeRequests()
}

function openCreateDialog() {
  Object.assign(newReq, {
    title: '', description: '', reqType: 'system', priority: 'medium',
    asilLevel: '', source: '', acceptanceCriteria: '',
  })
  showCreateDialog.value = true
}

async function createRequirement() {
  if (!newReq.title) {
    ElMessage.warning('请填写需求标题')
    return
  }
  try {
    await requirementApi.create(projectId, { ...newReq })
    ElMessage.success('需求创建成功')
    showCreateDialog.value = false
    await loadRequirements()
    await loadAllRequirements()
  } catch (e: any) {
    ElMessage.error(e.message || '创建失败')
  }
}

async function viewRequirement(req: any) {
  try {
    const res: any = await requirementApi.get(projectId, req.id)
    selectedReq.value = res
    showDetailDialog.value = true
  } catch (e: any) {
    ElMessage.error(e.message || '获取详情失败')
  }
}

async function deleteRequirement(id: number) {
  try {
    await ElMessageBox.confirm('确定删除此需求？', '提示', { type: 'warning' })
    await requirementApi.delete(projectId, id)
    ElMessage.success('删除成功')
    await loadRequirements()
    await loadAllRequirements()
  } catch {
    // cancelled
  }
}

function openTraceLinkDialog(req: any) {
  traceLinkSource.value = req
  Object.assign(newTraceLink, {
    sourceReqId: req.id,
    targetReqId: null,
    targetType: 'requirement',
    targetId: null,
    linkType: 'derive',
    verificationMethod: '',
  })
  loadAllRequirements()
  showTraceLinkDialog.value = true
}

async function createTraceLink() {
  try {
    await requirementApi.createTraceLink(projectId, {
      sourceReqId: newTraceLink.sourceReqId,
      targetReqId: newTraceLink.targetReqId,
      targetType: newTraceLink.targetType,
      targetId: newTraceLink.targetType === 'requirement' ? newTraceLink.targetReqId : newTraceLink.targetId,
      linkType: newTraceLink.linkType,
      verificationMethod: newTraceLink.verificationMethod,
    })
    ElMessage.success('追溯链接添加成功')
    showTraceLinkDialog.value = false
    await loadRequirements()
    await loadTraceMatrix()
  } catch (e: any) {
    ElMessage.error(e.message || '添加失败')
  }
}

function openBaselineDialog() {
  Object.assign(newBaseline, {
    baselineName: '', baselineCode: '', baselineType: 'functional',
    version: '1.0', description: '', requirementIds: [],
  })
  loadAllRequirements()
  showBaselineDialog.value = true
}

async function createBaseline() {
  if (!newBaseline.baselineName || !newBaseline.baselineCode) {
    ElMessage.warning('请填写基线名称和编号')
    return
  }
  try {
    await requirementApi.createBaseline(projectId, { ...newBaseline })
    ElMessage.success('基线创建成功')
    showBaselineDialog.value = false
    await loadBaselines()
  } catch (e: any) {
    ElMessage.error(e.message || '创建失败')
  }
}

async function freezeBaseline(baseline: any) {
  try {
    await ElMessageBox.confirm('冻结后基线将不可修改，确定冻结？', '提示', { type: 'warning' })
    await requirementApi.updateBaselineStatus(projectId, baseline.id, 'frozen')
    ElMessage.success('基线已冻结')
    await loadBaselines()
  } catch {
    // cancelled
  }
}

function viewBaseline(baseline: any) {
  ElMessage.info(`查看基线: ${baseline.baselineName}`)
}

function openChangeRequestDialog() {
  Object.assign(newCR, {
    title: '', description: '', changeType: 'modify',
    priority: 'medium', impactAnalysis: '', requirementIds: [],
  })
  loadAllRequirements()
  showChangeRequestDialog.value = true
}

async function createChangeRequest() {
  if (!newCR.title) {
    ElMessage.warning('请填写变更标题')
    return
  }
  try {
    await requirementApi.createChangeRequest(projectId, { ...newCR })
    ElMessage.success('变更请求已提交')
    showChangeRequestDialog.value = false
    await loadChangeRequests()
  } catch (e: any) {
    ElMessage.error(e.message || '提交失败')
  }
}

async function submitCR(cr: any) {
  try {
    await requirementApi.updateChangeRequestStatus(projectId, cr.id, 'submitted')
    ElMessage.success('变更请求已提交')
    await loadChangeRequests()
  } catch (e: any) {
    ElMessage.error(e.message || '提交失败')
  }
}

async function approveCR(cr: any) {
  try {
    await requirementApi.updateChangeRequestStatus(projectId, cr.id, 'approved')
    ElMessage.success('变更请求已批准')
    await loadChangeRequests()
  } catch (e: any) {
    ElMessage.error(e.message || '批准失败')
  }
}

async function rejectCR(cr: any) {
  try {
    await ElMessageBox.confirm('确定驳回此变更请求？', '提示', { type: 'warning' })
    await requirementApi.updateChangeRequestStatus(projectId, cr.id, 'rejected')
    ElMessage.success('变更请求已驳回')
    await loadChangeRequests()
  } catch {
    // cancelled
  }
}

async function implementCR(cr: any) {
  try {
    await requirementApi.updateChangeRequestStatus(projectId, cr.id, 'implemented')
    ElMessage.success('变更已实施')
    await loadChangeRequests()
    await loadRequirements()
  } catch (e: any) {
    ElMessage.error(e.message || '实施失败')
  }
}

onMounted(async () => {
  await loadProject()
  await loadRequirements()
  await loadAllRequirements()
})
</script>

<style scoped>
.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
