<template>
  <div class="functional-safety-view">
    <div class="page-header">
      <h2>功能安全 (ISO 26262)</h2>
      <div class="header-actions">
        <el-select v-model="projectFilter" placeholder="选择项目" clearable style="width: 200px" @change="onProjectChange">
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- ==================== Tab 1: 危害分析与ASIL ==================== -->
      <el-tab-pane label="危害分析与ASIL" name="hazard">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showHazardDialog()">新建危害分析</el-button>
          <el-select v-model="hazardFilter.status" placeholder="状态" clearable style="width: 130px; margin-left: 12px" @change="loadHazards">
            <el-option v-for="(v, k) in SAFETY_HAZARD_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
          <el-select v-model="hazardFilter.asil" placeholder="ASIL等级" clearable style="width: 130px; margin-left: 8px" @change="loadHazards">
            <el-option v-for="(v, k) in ASIL_LEVEL" :key="k" :label="v" :value="k" />
          </el-select>
        </div>

        <el-row :gutter="16" style="margin-bottom: 16px">
          <el-col :span="16">
            <el-table :data="hazardList" stripe v-loading="hazardLoading" style="width: 100%">
              <el-table-column prop="hazardNo" label="编号" width="170" />
              <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
              <el-table-column prop="hazardType" label="类型" width="80">
                <template #default="{ row }">
                  <el-tag size="small">{{ HAZARD_TYPE[row.hazardType as keyof typeof HAZARD_TYPE] || row.hazardType }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="S" width="60" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="severityTagType(row.severityRating)">{{ row.severityRating }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="E" width="60" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="exposureTagType(row.exposureRating)">{{ row.exposureRating }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="C" width="60" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="controllabilityTagType(row.controllabilityRating)">{{ row.controllabilityRating }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="calculatedAsil" label="ASIL" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="asilTagType(row.calculatedAsil)" effect="dark">{{ row.calculatedAsil }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ SAFETY_HAZARD_STATUS[row.status as keyof typeof SAFETY_HAZARD_STATUS] || row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click.stop="showHazardDialog(row)">编辑</el-button>
                  <el-button link type="danger" size="small" @click.stop="deleteHazard(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
          <el-col :span="8">
            <div ref="asilChartRef" style="width: 100%; height: 300px"></div>
          </el-col>
        </el-row>

        <!-- Hazard Dialog -->
        <el-dialog v-model="hazardDialogVisible" :title="hazardForm.id ? '编辑危害分析' : '新建危害分析'" width="600px" destroy-on-close>
          <el-form :model="hazardForm" label-width="120px">
            <el-form-item label="标题" required>
              <el-input v-model="hazardForm.title" placeholder="危害标题" />
            </el-form-item>
            <el-form-item label="危害类型">
              <el-select v-model="hazardForm.hazardType" style="width: 100%">
                <el-option v-for="(v, k) in HAZARD_TYPE" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="严重程度 (S)">
              <el-select v-model="hazardForm.severityRating" style="width: 100%" @change="previewASIL">
                <el-option v-for="(v, k) in SEVERITY_RATING" :key="k" :label="v" :value="+k" />
              </el-select>
            </el-form-item>
            <el-form-item label="暴露度 (E)">
              <el-select v-model="hazardForm.exposureRating" style="width: 100%" @change="previewASIL">
                <el-option v-for="(v, k) in EXPOSURE_RATING" :key="k" :label="v" :value="+k" />
              </el-select>
            </el-form-item>
            <el-form-item label="可控度 (C)">
              <el-select v-model="hazardForm.controllabilityRating" style="width: 100%" @change="previewASIL">
                <el-option v-for="(v, k) in CONTROLLABILITY_RATING" :key="k" :label="v" :value="+k" />
              </el-select>
            </el-form-item>
            <el-form-item label="ASIL 结果">
              <el-tag :type="asilTagType(previewedAsil)" effect="dark" size="large">{{ previewedAsil }}</el-tag>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="hazardForm.description" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="hazardForm.status" style="width: 100%">
                <el-option v-for="(v, k) in SAFETY_HAZARD_STATUS" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="hazardDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveHazard" :loading="saving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ==================== Tab 2: 安全目标 ==================== -->
      <el-tab-pane label="安全目标" name="goal">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showGoalDialog()">新建安全目标</el-button>
        </div>
        <el-row :gutter="16" style="margin-top: 12px">
          <el-col :span="8">
            <el-card shadow="never">
              <template #header><span>目标树</span></template>
              <el-tree
                :data="goalTree"
                :props="{ label: 'title', children: 'children' }"
                node-key="id"
                highlight-current
                default-expand-all
                @node-click="onGoalNodeClick"
                v-loading="goalLoading"
              >
                <template #default="{ data }">
                  <span class="tree-node">
                    <el-tag size="small" :type="asilTagType(data.targetAsil)" style="margin-right: 6px">{{ data.targetAsil }}</el-tag>
                    {{ data.title }}
                  </span>
                </template>
              </el-tree>
            </el-card>
          </el-col>
          <el-col :span="16">
            <el-card shadow="never" v-if="selectedGoal">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <span>{{ selectedGoal.title }}</span>
                  <div>
                    <el-button size="small" @click="showGoalDialog(selectedGoal)">编辑</el-button>
                    <el-button size="small" type="danger" @click="deleteGoal(selectedGoal.id)">删除</el-button>
                  </div>
                </div>
              </template>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="编号">{{ selectedGoal.goalNo }}</el-descriptions-item>
                <el-descriptions-item label="目标ASIL">
                  <el-tag :type="asilTagType(selectedGoal.targetAsil)" effect="dark">{{ selectedGoal.targetAsil }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="状态">{{ SAFETY_GOAL_STATUS[selectedGoal.status as keyof typeof SAFETY_GOAL_STATUS] || selectedGoal.status }}</el-descriptions-item>
                <el-descriptions-item label="关联危害">
                  <el-tag v-if="selectedGoal.hazard" size="small">{{ selectedGoal.hazard.hazardNo }} - {{ selectedGoal.hazard.title }}</el-tag>
                  <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item label="验收标准" :span="2">{{ selectedGoal.acceptanceCriteria || '-' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
            <el-empty v-else description="点击左侧树节点查看详情" />
          </el-col>
        </el-row>

        <!-- Goal Dialog -->
        <el-dialog v-model="goalDialogVisible" :title="goalForm.id ? '编辑安全目标' : '新建安全目标'" width="550px" destroy-on-close>
          <el-form :model="goalForm" label-width="110px">
            <el-form-item label="标题" required>
              <el-input v-model="goalForm.title" />
            </el-form-item>
            <el-form-item label="目标ASIL">
              <el-select v-model="goalForm.targetAsil" style="width: 100%">
                <el-option v-for="(v, k) in ASIL_LEVEL" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="关联危害">
              <el-select v-model="goalForm.hazardId" clearable style="width: 100%">
                <el-option v-for="h in hazardList" :key="h.id" :label="`${h.hazardNo} - ${h.title}`" :value="h.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="验收标准">
              <el-input v-model="goalForm.acceptanceCriteria" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="goalForm.status" style="width: 100%">
                <el-option v-for="(v, k) in SAFETY_GOAL_STATUS" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="goalDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveGoal" :loading="saving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ==================== Tab 3: FTA 分析 ==================== -->
      <el-tab-pane label="FTA 分析" name="fta">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showFtaDialog()">新建顶事件</el-button>
          <el-button @click="calculateFta" :loading="ftaCalculating" :disabled="!selectedFtaEvent">计算概率</el-button>
        </div>
        <el-row :gutter="16" style="margin-top: 12px">
          <el-col :span="8">
            <el-card shadow="never">
              <template #header><span>故障树列表</span></template>
              <el-table :data="ftaTopEvents" stripe v-loading="ftaLoading" size="small" @row-click="onFtaRowClick" highlight-current-row>
                <el-table-column prop="eventNo" label="编号" width="160" />
                <el-table-column prop="title" label="标题" show-overflow-tooltip />
                <el-table-column prop="probability" label="概率" width="100">
                  <template #default="{ row }">{{ row.probability ? Number(row.probability).toExponential(2) : '-' }}</template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="16">
            <el-card shadow="never">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <span>故障树结构</span>
                  <el-button size="small" @click="showFtaChildDialog()" :disabled="!selectedFtaEvent">添加子事件</el-button>
                </div>
              </template>
              <div ref="ftaChartRef" style="width: 100%; height: 400px"></div>
            </el-card>
          </el-col>
        </el-row>

        <!-- FTA Dialog -->
        <el-dialog v-model="ftaDialogVisible" :title="ftaForm.id ? '编辑事件' : '新建FTA事件'" width="550px" destroy-on-close>
          <el-form :model="ftaForm" label-width="110px">
            <el-form-item label="标题" required>
              <el-input v-model="ftaForm.title" />
            </el-form-item>
            <el-form-item label="事件类型">
              <el-select v-model="ftaForm.eventType" style="width: 100%">
                <el-option v-for="(v, k) in FTA_EVENT_TYPE" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="门类型">
              <el-select v-model="ftaForm.gateType" clearable style="width: 100%">
                <el-option v-for="(v, k) in FTA_GATE_TYPE" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="故障率">
              <el-input-number v-model="ftaForm.failureRate" :min="0" :precision="6" :step="0.000001" style="width: 100%" />
            </el-form-item>
            <el-form-item label="概率">
              <el-input-number v-model="ftaForm.probability" :min="0" :max="1" :precision="6" :step="0.000001" style="width: 100%" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="ftaForm.description" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="ftaDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveFtaEvent" :loading="saving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ==================== Tab 4: Safety Case ==================== -->
      <el-tab-pane label="Safety Case" name="case">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showCaseDialog()">新建 Safety Case</el-button>
        </div>
        <el-row :gutter="16" style="margin-top: 12px">
          <el-col :span="8">
            <el-card shadow="never">
              <template #header><span>Case 列表</span></template>
              <el-table :data="caseList" stripe v-loading="caseLoading" size="small" @row-click="onCaseRowClick" highlight-current-row>
                <el-table-column prop="caseNo" label="编号" width="160" />
                <el-table-column prop="title" label="标题" show-overflow-tooltip />
                <el-table-column prop="status" label="状态" width="90">
                  <template #default="{ row }">
                    <el-tag size="small" :type="caseStatusTagType(row.status)">{{ SAFETY_CASE_STATUS[row.status as keyof typeof SAFETY_CASE_STATUS] || row.status }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="16">
            <el-card shadow="never" v-if="selectedCase">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <span>{{ selectedCase.title }} <el-tag size="small" style="margin-left: 8px">{{ selectedCase.caseNo }}</el-tag></span>
                  <div>
                    <el-button size="small" type="success" @click="approveCase(selectedCase.id)" :disabled="selectedCase.status === 'approved' || selectedCase.status === 'released'">批准</el-button>
                    <el-button size="small" @click="showArgumentDialog()">添加论证节点</el-button>
                    <el-button size="small" @click="showEvidenceDialog()">添加证据</el-button>
                  </div>
                </div>
              </template>
              <el-tabs v-model="caseSubTab">
                <el-tab-pane label="GSN 论证树" name="args">
                  <el-tree
                    :data="caseArguments"
                    :props="{ label: 'title', children: 'children' }"
                    node-key="id"
                    default-expand-all
                  >
                    <template #default="{ data }">
                      <span class="tree-node">
                        <el-tag size="small" :type="gsnNodeTypeTag(data.nodeType)" style="margin-right: 6px">{{ GSN_NODE_TYPE[data.nodeType as keyof typeof GSN_NODE_TYPE] || data.nodeType }}</el-tag>
                        {{ data.title }}
                      </span>
                    </template>
                  </el-tree>
                </el-tab-pane>
                <el-tab-pane label="证据列表" name="evidence">
                  <el-table :data="selectedCase.evidences || []" stripe size="small">
                    <el-table-column prop="evidenceType" label="类型" width="120">
                      <template #default="{ row }">{{ SAFETY_EVIDENCE_TYPE[row.evidenceType as keyof typeof SAFETY_EVIDENCE_TYPE] || row.evidenceType }}</template>
                    </el-table-column>
                    <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
                    <el-table-column prop="status" label="状态" width="100">
                      <template #default="{ row }">
                        <el-tag size="small">{{ SAFETY_EVIDENCE_STATUS[row.status as keyof typeof SAFETY_EVIDENCE_STATUS] || row.status }}</el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>
                <el-tab-pane label="合规矩阵" name="compliance">
                  <div v-if="complianceMatrix">
                    <el-descriptions :column="3" border style="margin-bottom: 16px">
                      <el-descriptions-item label="安全目标总数">{{ complianceMatrix.totalGoals }}</el-descriptions-item>
                      <el-descriptions-item label="已覆盖">{{ complianceMatrix.coveredGoals }}</el-descriptions-item>
                      <el-descriptions-item label="覆盖率">
                        <el-progress :percentage="complianceMatrix.coverageRate" :color="complianceMatrix.coverageRate >= 80 ? '#67C23A' : complianceMatrix.coverageRate >= 50 ? '#E6A23C' : '#F56C6C'" />
                      </el-descriptions-item>
                    </el-descriptions>
                    <el-table :data="complianceMatrix.matrix" stripe size="small">
                      <el-table-column prop="argumentNo" label="论证编号" width="120" />
                      <el-table-column prop="title" label="目标" min-width="180" show-overflow-tooltip />
                      <el-table-column label="关联安全目标" width="160">
                        <template #default="{ row }">{{ row.safetyGoal?.goalNo || '-' }}</template>
                      </el-table-column>
                      <el-table-column prop="evidenceCount" label="证据数" width="80" align="center" />
                      <el-table-column prop="verifiedCount" label="已验证" width="80" align="center" />
                      <el-table-column label="覆盖状态" width="100">
                        <template #default="{ row }">
                          <el-tag size="small" :type="row.status === 'covered' ? 'success' : row.status === 'partial' ? 'warning' : 'danger'">{{ row.status === 'covered' ? '已覆盖' : row.status === 'partial' ? '部分' : '未覆盖' }}</el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                  <el-empty v-else description="加载合规矩阵..." />
                </el-tab-pane>
              </el-tabs>
            </el-card>
            <el-empty v-else description="选择一个 Safety Case 查看详情" />
          </el-col>
        </el-row>

        <!-- Case Dialog -->
        <el-dialog v-model="caseDialogVisible" :title="caseForm.id ? '编辑 Safety Case' : '新建 Safety Case'" width="500px" destroy-on-close>
          <el-form :model="caseForm" label-width="100px">
            <el-form-item label="标题" required>
              <el-input v-model="caseForm.title" />
            </el-form-item>
            <el-form-item label="版本">
              <el-input v-model="caseForm.version" placeholder="1.0" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="caseForm.description" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="caseForm.status" style="width: 100%">
                <el-option v-for="(v, k) in SAFETY_CASE_STATUS" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="caseDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveCase" :loading="saving">保存</el-button>
          </template>
        </el-dialog>

        <!-- Argument Dialog -->
        <el-dialog v-model="argumentDialogVisible" title="添加论证节点" width="500px" destroy-on-close>
          <el-form :model="argumentForm" label-width="100px">
            <el-form-item label="标题" required>
              <el-input v-model="argumentForm.title" />
            </el-form-item>
            <el-form-item label="节点类型">
              <el-select v-model="argumentForm.nodeType" style="width: 100%">
                <el-option v-for="(v, k) in GSN_NODE_TYPE" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="关联安全目标">
              <el-select v-model="argumentForm.goalId" clearable style="width: 100%">
                <el-option v-for="g in allGoals" :key="g.id" :label="`${g.goalNo} - ${g.title}`" :value="g.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="argumentForm.description" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="argumentDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveArgument" :loading="saving">保存</el-button>
          </template>
        </el-dialog>

        <!-- Evidence Dialog -->
        <el-dialog v-model="evidenceDialogVisible" title="添加证据" width="500px" destroy-on-close>
          <el-form :model="evidenceForm" label-width="100px">
            <el-form-item label="标题" required>
              <el-input v-model="evidenceForm.title" />
            </el-form-item>
            <el-form-item label="证据类型">
              <el-select v-model="evidenceForm.evidenceType" style="width: 100%">
                <el-option v-for="(v, k) in SAFETY_EVIDENCE_TYPE" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="evidenceForm.status" style="width: 100%">
                <el-option v-for="(v, k) in SAFETY_EVIDENCE_STATUS" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="文件URL">
              <el-input v-model="evidenceForm.fileUrl" placeholder="可选" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="evidenceDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveEvidence" :loading="saving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ==================== Tab 5: 安全评审 ==================== -->
      <el-tab-pane label="安全评审" name="review">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showReviewDialog()">新建评审</el-button>
          <el-select v-model="reviewFilter.status" placeholder="状态" clearable style="width: 130px; margin-left: 12px" @change="loadReviews">
            <el-option v-for="(v, k) in SAFETY_REVIEW_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
        </div>
        <el-table :data="reviewList" stripe v-loading="reviewLoading" style="margin-top: 12px">
          <el-table-column prop="reviewNo" label="编号" width="170" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="reviewType" label="类型" width="130">
            <template #default="{ row }">
              <el-tag size="small">{{ SAFETY_REVIEW_TYPE[row.reviewType as keyof typeof SAFETY_REVIEW_TYPE] || row.reviewType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="plannedDate" label="计划日期" width="120">
            <template #default="{ row }">{{ row.plannedDate ? formatDate(row.plannedDate) : '-' }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ SAFETY_REVIEW_STATUS[row.status as keyof typeof SAFETY_REVIEW_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="conclusion" label="结论" width="110">
            <template #default="{ row }">
              <el-tag v-if="row.conclusion" size="small" :type="row.conclusion === 'pass' ? 'success' : row.conclusion === 'fail' ? 'danger' : 'warning'">{{ SAFETY_REVIEW_CONCLUSION[row.conclusion as keyof typeof SAFETY_REVIEW_CONCLUSION] || row.conclusion }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="主持人" width="100">
            <template #default="{ row }">{{ row.leader?.realName || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="showReviewDialog(row)">编辑</el-button>
              <el-button link type="success" size="small" @click="showCompleteReviewDialog(row)" :disabled="row.status === 'completed'">完成</el-button>
              <el-button link type="danger" size="small" @click="deleteReview(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Review Dialog -->
        <el-dialog v-model="reviewDialogVisible" :title="reviewForm.id ? '编辑评审' : '新建评审'" width="550px" destroy-on-close>
          <el-form :model="reviewForm" label-width="110px">
            <el-form-item label="标题" required>
              <el-input v-model="reviewForm.title" />
            </el-form-item>
            <el-form-item label="评审类型">
              <el-select v-model="reviewForm.reviewType" style="width: 100%">
                <el-option v-for="(v, k) in SAFETY_REVIEW_TYPE" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="计划日期">
              <el-date-picker v-model="reviewForm.plannedDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
            <el-form-item label="主持人">
              <el-input-number v-model="reviewForm.leaderId" :min="1" style="width: 100%" placeholder="用户ID" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="reviewForm.description" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="reviewDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveReview" :loading="saving">保存</el-button>
          </template>
        </el-dialog>

        <!-- Complete Review Dialog -->
        <el-dialog v-model="completeReviewDialogVisible" title="完成评审" width="500px" destroy-on-close>
          <el-form :model="completeReviewForm" label-width="100px">
            <el-form-item label="结论" required>
              <el-select v-model="completeReviewForm.conclusion" style="width: 100%">
                <el-option v-for="(v, k) in SAFETY_REVIEW_CONCLUSION" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="发现总结">
              <el-input v-model="completeReviewForm.findingsSummary" type="textarea" :rows="4" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="completeReviewDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="completeReview" :loading="saving">提交</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ==================== Tab 6: FSC/TSC 安全概念 ==================== -->
      <el-tab-pane lazy name="concept">
        <template #label><span>FSC/TSC 安全概念</span></template>
        <SafetyConceptTab v-if="projectFilter" :projectId="projectFilter" />
        <el-empty v-else description="请先选择项目" />
      </el-tab-pane>

      <!-- ==================== Tab 7: 安全需求 ==================== -->
      <el-tab-pane lazy name="requirement">
        <template #label><span>安全需求</span></template>
        <SafetyRequirementTab v-if="projectFilter" :projectId="projectFilter" />
        <el-empty v-else description="请先选择项目" />
      </el-tab-pane>

      <!-- ==================== Tab 8: FMEDA ==================== -->
      <el-tab-pane lazy name="fmeda">
        <template #label><span>FMEDA 失效模式分析</span></template>
        <FmedaTab v-if="projectFilter" :projectId="projectFilter" />
        <el-empty v-else description="请先选择项目" />
      </el-tab-pane>

      <!-- ==================== Tab 9: 硬件安全度量 ==================== -->
      <el-tab-pane lazy name="metric">
        <template #label><span>硬件安全度量</span></template>
        <HardwareMetricTab v-if="projectFilter" :projectId="projectFilter" />
        <el-empty v-else description="请先选择项目" />
      </el-tab-pane>

      <!-- ==================== Tab 10: DFA 相关失效 ==================== -->
      <el-tab-pane lazy name="dfa">
        <template #label><span>DFA 相关失效分析</span></template>
        <DfaTab v-if="projectFilter" :projectId="projectFilter" />
        <el-empty v-else description="请先选择项目" />
      </el-tab-pane>

      <!-- ==================== Tab 11: ASIL 分解 ==================== -->
      <el-tab-pane lazy name="decomposition">
        <template #label><span>ASIL 分解</span></template>
        <AsilDecompositionTab v-if="projectFilter" :projectId="projectFilter" />
        <el-empty v-else description="请先选择项目" />
      </el-tab-pane>

      <!-- ==================== Tab 12: 工具鉴定 ==================== -->
      <el-tab-pane lazy name="tool">
        <template #label><span>工具鉴定与DIA</span></template>
        <ToolQualificationTab v-if="projectFilter" :projectId="projectFilter" />
        <el-empty v-else description="请先选择项目" />
      </el-tab-pane>

      <!-- ==================== Tab 13: 确认措施 ==================== -->
      <el-tab-pane lazy name="measure">
        <template #label><span>确认措施</span></template>
        <ConfirmationMeasureTab v-if="projectFilter" :projectId="projectFilter" />
        <el-empty v-else description="请先选择项目" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { safetyApi, projectApi } from '@/api'
import {
  ASIL_LEVEL, SEVERITY_RATING, EXPOSURE_RATING, CONTROLLABILITY_RATING,
  calculateASIL, HAZARD_TYPE, FTA_EVENT_TYPE, FTA_GATE_TYPE,
  GSN_NODE_TYPE, SAFETY_EVIDENCE_TYPE, SAFETY_EVIDENCE_STATUS,
  SAFETY_HAZARD_STATUS, SAFETY_GOAL_STATUS, SAFETY_FTA_STATUS,
  SAFETY_CASE_STATUS, SAFETY_REVIEW_TYPE, SAFETY_REVIEW_STATUS,
  SAFETY_REVIEW_CONCLUSION,
} from '@apqp/shared/constants/safety.constants'
import * as echarts from 'echarts'
import SafetyConceptTab from './SafetyConceptTab.vue'
import SafetyRequirementTab from './SafetyRequirementTab.vue'
import FmedaTab from './FmedaTab.vue'
import HardwareMetricTab from './HardwareMetricTab.vue'
import DfaTab from './DfaTab.vue'
import AsilDecompositionTab from './AsilDecompositionTab.vue'
import ToolQualificationTab from './ToolQualificationTab.vue'
import ConfirmationMeasureTab from './ConfirmationMeasureTab.vue'

// ==================== Common ====================
const projects = ref<any[]>([])
const projectFilter = ref<number | undefined>()
const activeTab = ref('hazard')
const saving = ref(false)

async function loadProjects() {
  const res = await projectApi.list({ take: 200 })
  projects.value = res.data?.items || res.data || []
}

function formatDate(d: any) {
  if (!d) return '-'
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function onProjectChange() {
  loadHazards()
  loadGoalTree()
  loadFtaTopEvents()
  loadCases()
  loadReviews()
}

// ==================== ASIL Tag Helpers ====================
function asilTagType(asil: string) {
  const map: Record<string, string> = { QM: 'info', A: 'success', B: '', C: 'warning', D: 'danger' }
  return map[asil] || 'info'
}
function severityTagType(s: number) {
  if (s >= 3) return 'danger'
  if (s >= 2) return 'warning'
  return 'info'
}
function exposureTagType(e: number) {
  if (e >= 3) return 'warning'
  if (e >= 2) return ''
  return 'info'
}
function controllabilityTagType(c: number) {
  if (c >= 3) return 'danger'
  if (c >= 2) return 'warning'
  return 'info'
}
function caseStatusTagType(s: string) {
  const map: Record<string, string> = { draft: 'info', in_progress: '', under_review: 'warning', approved: 'success', released: 'success', archived: 'info' }
  return map[s] || 'info'
}
function gsnNodeTypeTag(t: string) {
  const map: Record<string, string> = { goal: 'danger', strategy: '', assumption: 'warning', context: 'info', solution: 'success', justification: '' }
  return map[t] || 'info'
}

// ==================== Tab 1: Hazard Analysis ====================
const hazardList = ref<any[]>([])
const hazardLoading = ref(false)
const hazardDialogVisible = ref(false)
const hazardFilter = reactive({ status: '', asil: '' })
const hazardForm = reactive<any>({ id: null, title: '', hazardType: 'mechanical', severityRating: 0, exposureRating: 1, controllabilityRating: 1, description: '', status: 'draft' })
const previewedAsil = ref('QM')
const asilChartRef = ref<HTMLElement>()
let asilChart: echarts.ECharts | null = null

function previewASIL() {
  previewedAsil.value = calculateASIL(hazardForm.severityRating || 0, hazardForm.exposureRating || 1, hazardForm.controllabilityRating || 1)
}

async function loadHazards() {
  hazardLoading.value = true
  try {
    const res = await safetyApi.hazards.list({ projectId: projectFilter.value, status: hazardFilter.status || undefined, asil: hazardFilter.asil || undefined })
    hazardList.value = res.data?.items || res.data || []
    await nextTick()
    renderAsilChart()
  } finally { hazardLoading.value = false }
}

async function loadHazardStats() {
  const res = await safetyApi.hazards.stats({ projectId: projectFilter.value })
  const stats = res.data || {}
  const byAsil = stats.byAsil || { QM: 0, A: 0, B: 0, C: 0, D: 0 }
  if (asilChartRef.value) {
    if (!asilChart) asilChart = echarts.init(asilChartRef.value)
    asilChart.setOption({
      title: { text: 'ASIL 分布', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item' },
      color: ['#909399', '#67C23A', '#409EFF', '#E6A23C', '#F56C6C'],
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        data: Object.entries(byAsil).map(([name, value]) => ({ name, value })),
        label: { formatter: '{b}: {c}' },
      }],
    })
  }
}

function renderAsilChart() { loadHazardStats() }

function showHazardDialog(row?: any) {
  if (row) {
    Object.assign(hazardForm, { id: row.id, title: row.title, hazardType: row.hazardType, severityRating: row.severityRating, exposureRating: row.exposureRating, controllabilityRating: row.controllabilityRating, description: row.description, status: row.status })
  } else {
    Object.assign(hazardForm, { id: null, title: '', hazardType: 'mechanical', severityRating: 0, exposureRating: 1, controllabilityRating: 1, description: '', status: 'draft' })
  }
  previewASIL()
  hazardDialogVisible.value = true
}

async function saveHazard() {
  if (!projectFilter.value) return ElMessage.warning('请先选择项目')
  saving.value = true
  try {
    const data = { ...hazardForm, projectId: projectFilter.value }
    if (hazardForm.id) {
      await safetyApi.hazards.update(hazardForm.id, data)
    } else {
      await safetyApi.hazards.create(data)
    }
    ElMessage.success('保存成功')
    hazardDialogVisible.value = false
    loadHazards()
  } finally { saving.value = false }
}

async function deleteHazard(id: number) {
  await ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' })
  await safetyApi.hazards.delete(id)
  ElMessage.success('已删除')
  loadHazards()
}

// ==================== Tab 2: Safety Goals ====================
const goalTree = ref<any[]>([])
const goalLoading = ref(false)
const goalDialogVisible = ref(false)
const selectedGoal = ref<any>(null)
const allGoals = ref<any[]>([])
const goalForm = reactive<any>({ id: null, title: '', targetAsil: 'QM', hazardId: null, acceptanceCriteria: '', status: 'draft' })

async function loadGoalTree() {
  if (!projectFilter.value) return
  goalLoading.value = true
  try {
    const res = await safetyApi.goals.tree(projectFilter.value)
    goalTree.value = res.data || []
    const listRes = await safetyApi.goals.list({ projectId: projectFilter.value, take: 500 })
    allGoals.value = listRes.data?.items || listRes.data || []
  } finally { goalLoading.value = false }
}

function onGoalNodeClick(data: any) {
  selectedGoal.value = data
}

function showGoalDialog(row?: any) {
  if (row) {
    Object.assign(goalForm, { id: row.id, title: row.title, targetAsil: row.targetAsil, hazardId: row.hazardId, acceptanceCriteria: row.acceptanceCriteria, status: row.status })
  } else {
    Object.assign(goalForm, { id: null, title: '', targetAsil: 'QM', hazardId: null, acceptanceCriteria: '', status: 'draft' })
  }
  goalDialogVisible.value = true
}

async function saveGoal() {
  if (!projectFilter.value) return ElMessage.warning('请先选择项目')
  saving.value = true
  try {
    const data = { ...goalForm, projectId: projectFilter.value }
    if (goalForm.id) {
      await safetyApi.goals.update(goalForm.id, data)
    } else {
      await safetyApi.goals.create(data)
    }
    ElMessage.success('保存成功')
    goalDialogVisible.value = false
    loadGoalTree()
  } finally { saving.value = false }
}

async function deleteGoal(id: number) {
  await ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' })
  await safetyApi.goals.delete(id)
  ElMessage.success('已删除')
  selectedGoal.value = null
  loadGoalTree()
}

// ==================== Tab 3: FTA ====================
const ftaTopEvents = ref<any[]>([])
const ftaLoading = ref(false)
const ftaCalculating = ref(false)
const ftaDialogVisible = ref(false)
const selectedFtaEvent = ref<any>(null)
const ftaForm = reactive<any>({ id: null, title: '', eventType: 'top_event', gateType: null, failureRate: null, probability: null, description: '', parentId: null })
const ftaChartRef = ref<HTMLElement>()
let ftaChart: echarts.ECharts | null = null

async function loadFtaTopEvents() {
  if (!projectFilter.value) return
  ftaLoading.value = true
  try {
    const res = await safetyApi.fta.listTopEvents({ projectId: projectFilter.value })
    ftaTopEvents.value = res.data?.items || res.data || []
  } finally { ftaLoading.value = false }
}

function onFtaRowClick(row: any) {
  selectedFtaEvent.value = row
  loadFtaTree()
}

async function loadFtaTree() {
  if (!projectFilter.value || !selectedFtaEvent.value) return
  const res = await safetyApi.fta.treeData(projectFilter.value)
  const treeData = res.data || []
  await nextTick()
  renderFtaChart(treeData)
}

function renderFtaChart(treeData: any[]) {
  if (!ftaChartRef.value) return
  if (!ftaChart) ftaChart = echarts.init(ftaChartRef.value)

  function convert(nodes: any[]): any {
    return nodes.map(n => ({
      name: `${n.eventNo}\n${n.title}\n${n.gateType ? '[' + n.gateType.toUpperCase() + ']' : ''}\nP: ${n.probability ? Number(n.probability).toExponential(1) : '-'}`,
      children: n.children?.length ? convert(n.children) : undefined,
    }))
  }

  ftaChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'tree',
      data: convert(treeData),
      layout: 'orthogonal',
      orient: 'TB',
      symbol: 'roundRect',
      symbolSize: [120, 60],
      edgeShape: 'polyline',
      label: { fontSize: 10, lineHeight: 14 },
      leaves: { label: { fontSize: 10 } },
      expandAndCollapse: false,
      animationDuration: 300,
    }],
  })
}

function showFtaDialog(row?: any) {
  if (row) {
    Object.assign(ftaForm, { id: row.id, title: row.title, eventType: row.eventType, gateType: row.gateType, failureRate: row.failureRate ? Number(row.failureRate) : null, probability: row.probability ? Number(row.probability) : null, description: row.description, parentId: null })
  } else {
    Object.assign(ftaForm, { id: null, title: '', eventType: 'top_event', gateType: null, failureRate: null, probability: null, description: '', parentId: null })
  }
  ftaDialogVisible.value = true
}

function showFtaChildDialog() {
  Object.assign(ftaForm, { id: null, title: '', eventType: 'basic_event', gateType: null, failureRate: null, probability: null, description: '', parentId: selectedFtaEvent.value?.id })
  ftaDialogVisible.value = true
}

async function saveFtaEvent() {
  if (!projectFilter.value) return ElMessage.warning('请先选择项目')
  saving.value = true
  try {
    const data = { ...ftaForm, projectId: projectFilter.value }
    if (ftaForm.id) {
      await safetyApi.fta.update(ftaForm.id, data)
    } else {
      await safetyApi.fta.create(data)
    }
    ElMessage.success('保存成功')
    ftaDialogVisible.value = false
    loadFtaTopEvents()
    if (selectedFtaEvent.value) loadFtaTree()
  } finally { saving.value = false }
}

async function calculateFta() {
  if (!selectedFtaEvent.value) return
  ftaCalculating.value = true
  try {
    await safetyApi.fta.calculate(selectedFtaEvent.value.id)
    ElMessage.success('概率计算完成')
    loadFtaTopEvents()
    loadFtaTree()
  } finally { ftaCalculating.value = false }
}

// ==================== Tab 4: Safety Case ====================
const caseList = ref<any[]>([])
const caseLoading = ref(false)
const caseDialogVisible = ref(false)
const argumentDialogVisible = ref(false)
const evidenceDialogVisible = ref(false)
const selectedCase = ref<any>(null)
const caseArguments = ref<any[]>([])
const complianceMatrix = ref<any>(null)
const caseSubTab = ref('args')
const caseForm = reactive<any>({ id: null, title: '', version: '1.0', description: '', status: 'draft' })
const argumentForm = reactive<any>({ title: '', nodeType: 'goal', goalId: null, description: '' })
const evidenceForm = reactive<any>({ title: '', evidenceType: 'document', status: 'collected', fileUrl: '' })

async function loadCases() {
  if (!projectFilter.value) return
  caseLoading.value = true
  try {
    const res = await safetyApi.cases.list({ projectId: projectFilter.value })
    caseList.value = res.data?.items || res.data || []
  } finally { caseLoading.value = false }
}

function onCaseRowClick(row: any) {
  selectedCase.value = row
  loadCaseArguments()
  loadComplianceMatrix()
}

async function loadCaseArguments() {
  if (!selectedCase.value) return
  const res = await safetyApi.cases.arguments.list(selectedCase.value.id)
  caseArguments.value = res.data || []
}

async function loadComplianceMatrix() {
  if (!selectedCase.value) return
  try {
    const res = await safetyApi.cases.complianceMatrix(selectedCase.value.id)
    complianceMatrix.value = res.data
  } catch { complianceMatrix.value = null }
}

function showCaseDialog() {
  Object.assign(caseForm, { id: null, title: '', version: '1.0', description: '', status: 'draft' })
  caseDialogVisible.value = true
}

async function saveCase() {
  if (!projectFilter.value) return ElMessage.warning('请先选择项目')
  saving.value = true
  try {
    await safetyApi.cases.create({ ...caseForm, projectId: projectFilter.value })
    ElMessage.success('创建成功')
    caseDialogVisible.value = false
    loadCases()
  } finally { saving.value = false }
}

async function approveCase(id: number) {
  await safetyApi.cases.approve(id)
  ElMessage.success('已批准')
  loadCases()
  const res = await safetyApi.cases.get(id)
  selectedCase.value = res.data
}

function showArgumentDialog() {
  Object.assign(argumentForm, { title: '', nodeType: 'goal', goalId: null, description: '' })
  argumentDialogVisible.value = true
}

async function saveArgument() {
  if (!selectedCase.value) return
  saving.value = true
  try {
    await safetyApi.cases.arguments.create(selectedCase.value.id, argumentForm)
    ElMessage.success('添加成功')
    argumentDialogVisible.value = false
    loadCaseArguments()
  } finally { saving.value = false }
}

function showEvidenceDialog() {
  Object.assign(evidenceForm, { title: '', evidenceType: 'document', status: 'collected', fileUrl: '' })
  evidenceDialogVisible.value = true
}

async function saveEvidence() {
  if (!selectedCase.value) return
  saving.value = true
  try {
    await safetyApi.cases.evidences.create(selectedCase.value.id, evidenceForm)
    ElMessage.success('添加成功')
    evidenceDialogVisible.value = false
    const res = await safetyApi.cases.get(selectedCase.value.id)
    selectedCase.value = res.data
  } finally { saving.value = false }
}

// ==================== Tab 5: Reviews ====================
const reviewList = ref<any[]>([])
const reviewLoading = ref(false)
const reviewDialogVisible = ref(false)
const completeReviewDialogVisible = ref(false)
const reviewFilter = reactive({ status: '' })
const reviewForm = reactive<any>({ id: null, title: '', reviewType: 'design', plannedDate: '', leaderId: null, description: '' })
const completeReviewForm = reactive<any>({ id: null, conclusion: 'pass', findingsSummary: '' })

async function loadReviews() {
  if (!projectFilter.value) return
  reviewLoading.value = true
  try {
    const res = await safetyApi.reviews.list({ projectId: projectFilter.value, status: reviewFilter.status || undefined })
    reviewList.value = res.data?.items || res.data || []
  } finally { reviewLoading.value = false }
}

function showReviewDialog(row?: any) {
  if (row) {
    Object.assign(reviewForm, { id: row.id, title: row.title, reviewType: row.reviewType, plannedDate: row.plannedDate ? formatDate(row.plannedDate) : '', leaderId: row.leaderId, description: row.description })
  } else {
    Object.assign(reviewForm, { id: null, title: '', reviewType: 'design', plannedDate: '', leaderId: null, description: '' })
  }
  reviewDialogVisible.value = true
}

async function saveReview() {
  if (!projectFilter.value) return ElMessage.warning('请先选择项目')
  saving.value = true
  try {
    const data = { ...reviewForm, projectId: projectFilter.value }
    if (reviewForm.id) {
      await safetyApi.reviews.update(reviewForm.id, data)
    } else {
      await safetyApi.reviews.create(data)
    }
    ElMessage.success('保存成功')
    reviewDialogVisible.value = false
    loadReviews()
  } finally { saving.value = false }
}

async function deleteReview(id: number) {
  await ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' })
  await safetyApi.reviews.delete(id)
  ElMessage.success('已删除')
  loadReviews()
}

function showCompleteReviewDialog(row: any) {
  Object.assign(completeReviewForm, { id: row.id, conclusion: 'pass', findingsSummary: '' })
  completeReviewDialogVisible.value = true
}

async function completeReview() {
  saving.value = true
  try {
    await safetyApi.reviews.complete(completeReviewForm.id, { conclusion: completeReviewForm.conclusion, findingsSummary: completeReviewForm.findingsSummary })
    ElMessage.success('评审完成')
    completeReviewDialogVisible.value = false
    loadReviews()
  } finally { saving.value = false }
}

// ==================== Init ====================
onMounted(async () => {
  await loadProjects()
  loadHazards()
})

watch(activeTab, (tab) => {
  if (tab === 'hazard') { loadHazards() }
  else if (tab === 'goal') { loadGoalTree() }
  else if (tab === 'fta') { loadFtaTopEvents() }
  else if (tab === 'case') { loadCases() }
  else if (tab === 'review') { loadReviews() }
})
</script>

<style scoped>
.functional-safety-view {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
}
.header-actions {
  display: flex;
  align-items: center;
}
.tab-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.tree-node {
  display: flex;
  align-items: center;
  font-size: 13px;
}
</style>
