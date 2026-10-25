<template>
  <div class="quality-view">
    <div class="page-header">
      <h2>质量管理</h2>
      <div class="header-actions">
        <el-select v-model="filterProjectId" placeholder="选择项目" clearable style="width: 240px" @change="loadAllData">
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="showCreateProblem = true">新建问题</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="kpi-row">
      <el-col :span="5">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value">{{ overviewStats.problems?.open || 0 }}</div>
          <div class="kpi-label">待处理问题</div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value">{{ overviewStats.eightD?.closureRate || 0 }}%</div>
          <div class="kpi-label">8D闭环率</div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value">{{ overviewStats.nonconformances?.open || 0 }}</div>
          <div class="kpi-label">待处置不合格品</div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value">{{ overviewStats.capas?.open || 0 }}</div>
          <div class="kpi-label">进行中CAPA</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value">{{ overviewStats.inspections?.passRate || 0 }}%</div>
          <div class="kpi-label">检验合格率</div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- ==================== 问题台账 ==================== -->
      <el-tab-pane label="问题台账" name="problems">
        <div class="tab-toolbar">
          <el-select v-model="problemFilter.status" placeholder="状态" clearable @change="loadProblems">
            <el-option v-for="(label, key) in PROBLEM_STATUS" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="problemFilter.severity" placeholder="严重程度" clearable @change="loadProblems">
            <el-option v-for="(label, key) in PROBLEM_SEVERITY" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="problemFilter.classification" placeholder="分类" clearable @change="loadProblems">
            <el-option v-for="(label, key) in PROBLEM_CLASSIFICATION" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="problems" stripe v-loading="loading">
          <el-table-column prop="problemNo" label="问题编号" width="150" />
          <el-table-column prop="title" label="问题标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="严重程度" width="100">
            <template #default="{ row }">
              <el-tag :type="severityType(row.severity)" size="small">{{ PROBLEM_SEVERITY[row.severity] || row.severity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="分类" width="100">
            <template #default="{ row }">{{ PROBLEM_CLASSIFICATION[row.classification] || row.classification }}</template>
          </el-table-column>
          <el-table-column label="来源" width="110">
            <template #default="{ row }">{{ PROBLEM_SOURCE[row.source] || row.source }}</template>
          </el-table-column>
          <el-table-column label="责任人" width="90">
            <template #default="{ row }">{{ row.owner?.realName || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ PROBLEM_STATUS[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="8D" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.has8DReport" type="success" size="small">有</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewProblem(row)">详情</el-button>
              <el-button v-if="row.status === 'new'" link type="primary" size="small" @click="assignProblem(row)">分配</el-button>
              <el-button v-if="!row.has8DReport && row.status !== 'closed'" link type="warning" size="small" @click="create8D(row)">创建8D</el-button>
              <el-button v-if="row.status !== 'closed'" link type="success" size="small" @click="closeProblem(row)">关闭</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== 8D管理 ==================== -->
      <el-tab-pane label="8D管理" name="eightd">
        <el-table :data="eightDReports" stripe v-loading="loading">
          <el-table-column prop="reportNo" label="报告编号" width="150" />
          <el-table-column label="关联问题" min-width="200">
            <template #default="{ row }">
              <div>{{ row.problem?.problemNo }}</div>
              <div style="color: #999; font-size: 12px">{{ row.problem?.title }}</div>
            </template>
          </el-table-column>
          <el-table-column label="严重程度" width="100">
            <template #default="{ row }">
              <el-tag :type="severityType(row.problem?.severity)" size="small">{{ PROBLEM_SEVERITY[row.problem?.severity] || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="完成度" width="120">
            <template #default="{ row }">
              <el-progress :percentage="Number(row.completionRate)" :stroke-width="14" :text-inside="true" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">{{ EIGHT_D_STATUS[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="view8D(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== 不合格品 ==================== -->
      <el-tab-pane label="不合格品" name="nonconformances">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreateNC = true">新建不合格品</el-button>
          <el-select v-model="ncFilter.defectType" placeholder="缺陷类型" clearable @change="loadNonconformances">
            <el-option v-for="(label, key) in DEFECT_TYPE" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="ncFilter.disposition" placeholder="处置状态" clearable @change="loadNonconformances">
            <el-option v-for="(label, key) in DISPOSITION" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="nonconformances" stripe v-loading="loading">
          <el-table-column prop="ncNo" label="编号" width="150" />
          <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="product" label="产品" width="120" />
          <el-table-column label="缺陷类型" width="110">
            <template #default="{ row }">{{ DEFECT_TYPE[row.defectType] || row.defectType }}</template>
          </el-table-column>
          <el-table-column label="数量/缺陷" width="110" align="center">
            <template #default="{ row }">{{ row.defectQuantity }}/{{ row.quantity }}</template>
          </el-table-column>
          <el-table-column label="供应商" width="120">
            <template #default="{ row }">{{ row.supplier?.supplierName || '-' }}</template>
          </el-table-column>
          <el-table-column label="处置" width="110">
            <template #default="{ row }">
              <el-tag v-if="row.disposition" :type="dispositionType(row.disposition)" size="small">{{ DISPOSITION[row.disposition] || row.disposition }}</el-tag>
              <span v-else style="color: #e6a23c">待处置</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button v-if="!row.disposition" link type="warning" size="small" @click="disposeNC(row)">处置</el-button>
              <el-button link type="primary" size="small" @click="viewNC(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== CAPA ==================== -->
      <el-tab-pane label="CAPA" name="capas">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreateCAPA = true">新建CAPA</el-button>
          <el-select v-model="capaFilter.type" placeholder="类型" clearable @change="loadCapas">
            <el-option v-for="(label, key) in CAPA_TYPE" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="capaFilter.status" placeholder="状态" clearable @change="loadCapas">
            <el-option v-for="(label, key) in CAPA_STATUS" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="capas" stripe v-loading="loading">
          <el-table-column prop="capaNo" label="编号" width="150" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'corrective' ? 'danger' : 'info'" size="small">{{ CAPA_TYPE[row.type] || row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="来源" width="100">
            <template #default="{ row }">{{ CAPA_SOURCE[row.source] || row.source }}</template>
          </el-table-column>
          <el-table-column label="负责人" width="90">
            <template #default="{ row }">{{ row.assignedTo?.realName || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="capaStatusType(row.status)" size="small">{{ CAPA_STATUS[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="目标日期" width="120">
            <template #default="{ row }">{{ row.targetDate ? formatDate(row.targetDate) : '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewCAPA(row)">详情</el-button>
              <el-button v-if="row.status === 'completed'" link type="success" size="small" @click="verifyCAPA(row)">验证</el-button>
              <el-button v-if="row.status === 'verified'" link type="info" size="small" @click="closeCAPA(row)">关闭</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== 检验记录 ==================== -->
      <el-tab-pane label="检验记录" name="inspections">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreateInspection = true">新建检验</el-button>
          <el-select v-model="inspectionFilter.type" placeholder="检验类型" clearable @change="loadInspections">
            <el-option v-for="(label, key) in INSPECTION_TYPE" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="inspectionFilter.result" placeholder="结果" clearable @change="loadInspections">
            <el-option v-for="(label, key) in INSPECTION_RESULT" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="inspections" stripe v-loading="loading">
          <el-table-column prop="inspectionNo" label="检验编号" width="150" />
          <el-table-column prop="title" label="检验标题" min-width="180" show-overflow-tooltip />
          <el-table-column label="类型" width="110">
            <template #default="{ row }">{{ INSPECTION_TYPE[row.type] || row.type }}</template>
          </el-table-column>
          <el-table-column label="检验日期" width="120">
            <template #default="{ row }">{{ formatDate(row.inspectionDate) }}</template>
          </el-table-column>
          <el-table-column label="检验员" width="90">
            <template #default="{ row }">{{ row.inspector?.realName }}</template>
          </el-table-column>
          <el-table-column label="抽样/缺陷" width="110" align="center">
            <template #default="{ row }">{{ row.sampleSize }}/{{ row.defectCount }}</template>
          </el-table-column>
          <el-table-column label="结果" width="100">
            <template #default="{ row }">
              <el-tag :type="row.result === 'pass' ? 'success' : row.result === 'fail' ? 'danger' : 'warning'" size="small">{{ INSPECTION_RESULT[row.result] || row.result }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewInspection(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== 统计分析 ==================== -->
      <el-tab-pane label="统计分析" name="stats">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card>
              <template #header>问题严重程度分布</template>
              <div v-for="item in problemAnalysis?.bySeverity || []" :key="item.severity" style="margin-bottom: 8px">
                <span>{{ PROBLEM_SEVERITY[item.severity] || item.severity }}</span>
                <el-progress :percentage="calcPercentage(item._count, totalProblems)" :stroke-width="16" style="margin-left: 12px" />
              </div>
              <el-empty v-if="!problemAnalysis?.bySeverity?.length" description="暂无数据" />
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>问题来源分布</template>
              <div v-for="item in problemAnalysis?.bySource || []" :key="item.source" style="margin-bottom: 8px">
                <span>{{ PROBLEM_SOURCE[item.source] || item.source }}</span>
                <el-progress :percentage="calcPercentage(item._count, totalProblems)" :stroke-width="16" style="margin-left: 12px" />
              </div>
              <el-empty v-if="!problemAnalysis?.bySource?.length" description="暂无数据" />
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16" style="margin-top: 16px">
          <el-col :span="24">
            <el-card>
              <template #header>最近问题</template>
              <el-table :data="problemAnalysis?.recentProblems || []" stripe size="small">
                <el-table-column prop="problemNo" label="编号" width="150" />
                <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
                <el-table-column label="严重程度" width="100">
                  <template #default="{ row }">
                    <el-tag :type="severityType(row.severity)" size="small">{{ PROBLEM_SEVERITY[row.severity] || row.severity }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="statusType(row.status)" size="small">{{ PROBLEM_STATUS[row.status] || row.status }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="创建时间" width="120">
                  <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== Dialogs ==================== -->

    <!-- 创建问题 -->
    <el-dialog v-model="showCreateProblem" title="新建问题" width="640px">
      <el-form :model="problemForm" label-width="100px">
        <el-form-item label="项目" required>
          <el-select v-model="problemForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="problemForm.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="problemForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="problemForm.classification" style="width: 100%">
                <el-option v-for="(label, key) in PROBLEM_CLASSIFICATION" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="严重程度">
              <el-select v-model="problemForm.severity" style="width: 100%">
                <el-option v-for="(label, key) in PROBLEM_SEVERITY" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="来源">
          <el-select v-model="problemForm.source" style="width: 100%">
            <el-option v-for="(label, key) in PROBLEM_SOURCE" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="problemForm.dueDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateProblem = false">取消</el-button>
        <el-button type="primary" @click="createProblem">创建</el-button>
      </template>
    </el-dialog>

    <!-- 8D编辑 -->
    <el-dialog v-model="show8DEdit" title="8D报告" width="800px" top="5vh">
      <div v-if="current8D">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 16px">
          <el-descriptions-item label="报告编号">{{ current8D.reportNo }}</el-descriptions-item>
          <el-descriptions-item label="完成度">
            <el-progress :percentage="Number(current8D.completionRate)" :stroke-width="14" :text-inside="true" style="width: 150px" />
          </el-descriptions-item>
          <el-descriptions-item label="关联问题" :span="2">{{ current8D.problem?.problemNo }} - {{ current8D.problem?.title }}</el-descriptions-item>
        </el-descriptions>
        <el-tabs v-model="current8DStep" type="card">
          <el-tab-pane label="D1 团队" name="d1">
            <el-form label-width="120px">
              <el-form-item label="团队成员"><el-input v-model="eightDForm.d1Team" type="textarea" :rows="2" /></el-form-item>
              <el-form-item label="问题描述"><el-input v-model="eightDForm.d1ProblemDescription" type="textarea" :rows="3" /></el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D2 遏制" name="d2">
            <el-form label-width="120px">
              <el-form-item label="遏制措施"><el-input v-model="eightDForm.d2ContainmentAction" type="textarea" :rows="3" /></el-form-item>
              <el-form-item label="实施日期"><el-date-picker v-model="eightDForm.d2ContainmentDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D3 根因" name="d3">
            <el-form label-width="120px">
              <el-form-item label="根因分析"><el-input v-model="eightDForm.d3RootCauseAnalysis" type="textarea" :rows="3" /></el-form-item>
              <el-form-item label="根因验证"><el-switch v-model="eightDForm.d3RootCauseVerified" /></el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D4 纠正" name="d4">
            <el-form label-width="120px">
              <el-form-item label="永久纠正措施"><el-input v-model="eightDForm.d4PermanentCorrectiveAction" type="textarea" :rows="3" /></el-form-item>
              <el-form-item label="实施日期"><el-date-picker v-model="eightDForm.d4ImplementationDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D5 预防" name="d5">
            <el-form label-width="120px">
              <el-form-item label="预防措施"><el-input v-model="eightDForm.d5PreventiveAction" type="textarea" :rows="3" /></el-form-item>
              <el-form-item label="系统化建议"><el-input v-model="eightDForm.d5SystematicRecommendation" type="textarea" :rows="2" /></el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D6 验证" name="d6">
            <el-form label-width="120px">
              <el-form-item label="效果验证"><el-input v-model="eightDForm.d6Verification" type="textarea" :rows="3" /></el-form-item>
              <el-form-item label="验证日期"><el-date-picker v-model="eightDForm.d6VerificationDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
              <el-form-item label="验证结果"><el-input v-model="eightDForm.d6Result" /></el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D7 标准化" name="d7">
            <el-form label-width="120px">
              <el-form-item label="标准化"><el-input v-model="eightDForm.d7Standardization" type="textarea" :rows="3" /></el-form-item>
              <el-form-item label="文件已更新"><el-switch v-model="eightDForm.d7DocumentUpdated" /></el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="D8 总结" name="d8">
            <el-form label-width="120px">
              <el-form-item label="经验教训"><el-input v-model="eightDForm.d8LessonsLearned" type="textarea" :rows="3" /></el-form-item>
              <el-form-item label="团队认可"><el-input v-model="eightDForm.d8Congratulate" type="textarea" :rows="2" /></el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="show8DEdit = false">取消</el-button>
        <el-button type="primary" @click="save8DStep">保存</el-button>
      </template>
    </el-dialog>

    <!-- 创建不合格品 -->
    <el-dialog v-model="showCreateNC" title="新建不合格品" width="640px">
      <el-form :model="ncForm" label-width="100px">
        <el-form-item label="项目" required>
          <el-select v-model="ncForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="ncForm.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="ncForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="产品"><el-input v-model="ncForm.product" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="材料"><el-input v-model="ncForm.material" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="缺陷类型">
              <el-select v-model="ncForm.defectType" style="width: 100%">
                <el-option v-for="(label, key) in DEFECT_TYPE" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="批次号"><el-input v-model="ncForm.lotNo" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="数量"><el-input-number v-model="ncForm.quantity" :min="0" style="width: 100%" /></el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="缺陷数"><el-input-number v-model="ncForm.defectQuantity" :min="0" style="width: 100%" /></el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="供应商">
              <el-select v-model="ncForm.supplierId" placeholder="选择" clearable style="width: 100%">
                <el-option v-for="s in suppliers" :key="s.id" :label="s.supplierName" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showCreateNC = false">取消</el-button>
        <el-button type="primary" @click="createNC">创建</el-button>
      </template>
    </el-dialog>

    <!-- 处置不合格品 -->
    <el-dialog v-model="showDisposeNC" title="不合格品处置" width="480px">
      <el-form :model="disposeForm" label-width="100px">
        <el-form-item label="处置方式" required>
          <el-select v-model="disposeForm.disposition" style="width: 100%">
            <el-option v-for="(label, key) in DISPOSITION" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="成本影响">
          <el-input-number v-model="disposeForm.costImpact" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDisposeNC = false">取消</el-button>
        <el-button type="primary" @click="confirmDispose">确认处置</el-button>
      </template>
    </el-dialog>

    <!-- 创建CAPA -->
    <el-dialog v-model="showCreateCAPA" title="新建CAPA" width="640px">
      <el-form :model="capaForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="capaForm.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="capaForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="类型" required>
              <el-select v-model="capaForm.type" style="width: 100%">
                <el-option v-for="(label, key) in CAPA_TYPE" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源">
              <el-select v-model="capaForm.source" style="width: 100%">
                <el-option v-for="(label, key) in CAPA_SOURCE" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="项目">
          <el-select v-model="capaForm.projectId" placeholder="选择项目" clearable style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="根因分析">
          <el-input v-model="capaForm.rootCause" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="纠正措施">
          <el-input v-model="capaForm.correctiveAction" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="预防措施">
          <el-input v-model="capaForm.preventiveAction" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="目标日期">
          <el-date-picker v-model="capaForm.targetDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateCAPA = false">取消</el-button>
        <el-button type="primary" @click="createCAPA">创建</el-button>
      </template>
    </el-dialog>

    <!-- 创建检验 -->
    <el-dialog v-model="showCreateInspection" title="新建检验记录" width="640px">
      <el-form :model="inspectionForm" label-width="100px">
        <el-form-item label="项目" required>
          <el-select v-model="inspectionForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="inspectionForm.title" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="检验类型">
              <el-select v-model="inspectionForm.type" style="width: 100%">
                <el-option v-for="(label, key) in INSPECTION_TYPE" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检验日期">
              <el-date-picker v-model="inspectionForm.inspectionDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="抽样数"><el-input-number v-model="inspectionForm.sampleSize" :min="0" style="width: 100%" /></el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="缺陷数"><el-input-number v-model="inspectionForm.defectCount" :min="0" style="width: 100%" /></el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结果">
              <el-select v-model="inspectionForm.result" style="width: 100%">
                <el-option v-for="(label, key) in INSPECTION_RESULT" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="检验发现">
          <el-input v-model="inspectionForm.findings" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="inspectionForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateInspection = false">取消</el-button>
        <el-button type="primary" @click="createInspection">创建</el-button>
      </template>
    </el-dialog>

    <!-- 验证CAPA -->
    <el-dialog v-model="showVerifyCAPA" title="CAPA效果验证" width="480px">
      <el-form label-width="100px">
        <el-form-item label="有效性评价">
          <el-input v-model="verifyEffectiveness" type="textarea" :rows="4" placeholder="请描述CAPA实施后的效果验证结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVerifyCAPA = false">取消</el-button>
        <el-button type="primary" @click="confirmVerifyCAPA">确认验证</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { qualityApi } from '@/api'
import { projectApi } from '@/api'
import { procurementApi } from '@/api'
import {
  PROBLEM_STATUS, PROBLEM_CLASSIFICATION, PROBLEM_SEVERITY, PROBLEM_SOURCE,
  EIGHT_D_STATUS, DEFECT_TYPE, DISPOSITION,
  CAPA_SOURCE, CAPA_TYPE, CAPA_STATUS,
  INSPECTION_TYPE, INSPECTION_RESULT,
} from '@apqp/shared/constants/quality.constants'

const loading = ref(false)
const activeTab = ref('problems')
const filterProjectId = ref<number | undefined>()
const projects = ref<any[]>([])
const suppliers = ref<any[]>([])

// Data
const problems = ref<any[]>([])
const eightDReports = ref<any[]>([])
const nonconformances = ref<any[]>([])
const capas = ref<any[]>([])
const inspections = ref<any[]>([])
const overviewStats = ref<any>({})
const problemAnalysis = ref<any>({})

// Filters
const problemFilter = reactive({ status: '', severity: '', classification: '' })
const ncFilter = reactive({ defectType: '', disposition: '' })
const capaFilter = reactive({ type: '', status: '' })
const inspectionFilter = reactive({ type: '', result: '' })

// Dialogs
const showCreateProblem = ref(false)
const show8DEdit = ref(false)
const showCreateNC = ref(false)
const showDisposeNC = ref(false)
const showCreateCAPA = ref(false)
const showCreateInspection = ref(false)
const showVerifyCAPA = ref(false)

// Forms
const problemForm = reactive<any>({ projectId: null, title: '', description: '', classification: 'quality', severity: 'minor', source: 'process_inspection', dueDate: null })
const eightDForm = reactive<any>({})
const current8D = ref<any>(null)
const current8DStep = ref('d1')
const ncForm = reactive<any>({ projectId: null, title: '', description: '', product: '', material: '', lotNo: '', defectType: 'dimension', quantity: 0, defectQuantity: 0, supplierId: null })
const disposeForm = reactive<any>({ disposition: '', costImpact: 0 })
const disposeTargetId = ref<number | null>(null)
const capaForm = reactive<any>({ projectId: null, title: '', description: '', type: 'corrective', source: 'problem', rootCause: '', correctiveAction: '', preventiveAction: '', targetDate: null })
const inspectionForm = reactive<any>({ projectId: null, title: '', type: 'first_article', inspectionDate: '', sampleSize: 0, defectCount: 0, result: 'pass', findings: '', remarks: '' })
const verifyEffectiveness = ref('')
const verifyCapaId = ref<number | null>(null)

const totalProblems = computed(() => {
  return (problemAnalysis.value?.bySeverity || []).reduce((sum: number, item: any) => sum + item._count, 0)
})

function severityType(severity: string) {
  const map: Record<string, string> = { critical: 'danger', major: 'warning', minor: 'info', trivial: '' }
  return (map[severity] || '') as any
}
function statusType(status: string) {
  const map: Record<string, string> = { new: 'info', analyzing: 'warning', correcting: '', verifying: 'warning', closed: 'success', escalated: 'danger' }
  return (map[status] || 'info') as any
}
function dispositionType(d: string) {
  const map: Record<string, string> = { rework: '', repair: 'warning', concession: 'info', scrap: 'danger', return: 'warning' }
  return (map[d] || 'info') as any
}
function capaStatusType(s: string) {
  const map: Record<string, string> = { pending: 'info', in_progress: 'warning', completed: '', verified: 'success', closed: 'info' }
  return (map[s] || 'info') as any
}
function formatDate(d: string | Date) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('zh-CN')
}
function calcPercentage(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0
}

async function loadAllData() {
  await Promise.all([loadProjects(), loadProblems(), load8DReports(), loadNonconformances(), loadCapas(), loadInspections(), loadStats()])
}
async function loadProjects() {
  try { const res = await projectApi.list(); projects.value = res.data?.data || res.data || [] } catch {}
}
async function loadSuppliers() {
  try { const res = await procurementApi.suppliers.list(); suppliers.value = res.data?.data || res.data || [] } catch {}
}
async function loadStats() {
  try {
    const [overview, analysis] = await Promise.all([qualityApi.stats.overview(), qualityApi.stats.problemAnalysis(filterProjectId.value ? { projectId: filterProjectId.value } : {})])
    overviewStats.value = overview.data?.data || overview.data || {}
    problemAnalysis.value = analysis.data?.data || analysis.data || {}
  } catch {}
}
async function loadProblems() {
  loading.value = true
  try {
    const params: any = {}
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (problemFilter.status) params.status = problemFilter.status
    if (problemFilter.severity) params.severity = problemFilter.severity
    if (problemFilter.classification) params.classification = problemFilter.classification
    const res = await qualityApi.problems.list(params)
    problems.value = res.data?.data || res.data || []
  } finally { loading.value = false }
}
async function load8DReports() {
  try {
    const res = await qualityApi.eightD.list()
    eightDReports.value = res.data?.data || res.data || []
  } catch {}
}
async function loadNonconformances() {
  loading.value = true
  try {
    const params: any = {}
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (ncFilter.defectType) params.defectType = ncFilter.defectType
    if (ncFilter.disposition) params.disposition = ncFilter.disposition
    const res = await qualityApi.nonconformances.list(params)
    nonconformances.value = res.data?.data || res.data || []
  } finally { loading.value = false }
}
async function loadCapas() {
  loading.value = true
  try {
    const params: any = {}
    if (capaFilter.type) params.type = capaFilter.type
    if (capaFilter.status) params.status = capaFilter.status
    const res = await qualityApi.capas.list(params)
    capas.value = res.data?.data || res.data || []
  } finally { loading.value = false }
}
async function loadInspections() {
  loading.value = true
  try {
    const params: any = {}
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (inspectionFilter.type) params.type = inspectionFilter.type
    if (inspectionFilter.result) params.result = inspectionFilter.result
    const res = await qualityApi.inspections.list(params)
    inspections.value = res.data?.data || res.data || []
  } finally { loading.value = false }
}

// Problem actions
async function createProblem() {
  if (!problemForm.title || !problemForm.projectId) { ElMessage.warning('请填写必要信息'); return }
  await qualityApi.problems.create(problemForm)
  ElMessage.success('问题创建成功')
  showCreateProblem.value = false
  Object.assign(problemForm, { projectId: null, title: '', description: '', classification: 'quality', severity: 'minor', source: 'process_inspection', dueDate: null })
  await loadProblems()
  await loadStats()
}
async function viewProblem(row: any) {
  const res = await qualityApi.problems.get(row.id)
  const detail = res.data?.data || res.data
  ElMessageBox.alert(
    `<div><b>编号:</b> ${detail.problemNo}</div>
     <div><b>标题:</b> ${detail.title}</div>
     <div><b>严重程度:</b> ${PROBLEM_SEVERITY[detail.severity as keyof typeof PROBLEM_SEVERITY]}</div>
     <div><b>状态:</b> ${PROBLEM_STATUS[detail.status as keyof typeof PROBLEM_STATUS]}</div>
     <div><b>描述:</b> ${detail.description || '-'}</div>`,
    '问题详情', { dangerouslyUseHTMLString: true }
  )
}
async function assignProblem(row: any) {
  await qualityApi.problems.assign(row.id, 1)
  ElMessage.success('已分配')
  await loadProblems()
}
async function closeProblem(row: any) {
  await ElMessageBox.confirm('确认关闭此问题？', '确认')
  await qualityApi.problems.close(row.id)
  ElMessage.success('问题已关闭')
  await loadProblems()
  await loadStats()
}
async function create8D(row: any) {
  await qualityApi.eightD.create(row.id)
  ElMessage.success('8D报告已创建')
  await load8DReports()
  await loadProblems()
}
async function view8D(row: any) {
  const res = await qualityApi.eightD.get(row.id)
  current8D.value = res.data?.data || res.data
  Object.assign(eightDForm, {
    d1Team: current8D.value.d1Team || '', d1ProblemDescription: current8D.value.d1ProblemDescription || '',
    d2ContainmentAction: current8D.value.d2ContainmentAction || '', d2ContainmentDate: current8D.value.d2ContainmentDate || '',
    d3RootCauseAnalysis: current8D.value.d3RootCauseAnalysis || '', d3RootCauseVerified: current8D.value.d3RootCauseVerified || false,
    d4PermanentCorrectiveAction: current8D.value.d4PermanentCorrectiveAction || '', d4ImplementationDate: current8D.value.d4ImplementationDate || '',
    d5PreventiveAction: current8D.value.d5PreventiveAction || '', d5SystematicRecommendation: current8D.value.d5SystematicRecommendation || '',
    d6Verification: current8D.value.d6Verification || '', d6VerificationDate: current8D.value.d6VerificationDate || '', d6Result: current8D.value.d6Result || '',
    d7Standardization: current8D.value.d7Standardization || '', d7DocumentUpdated: current8D.value.d7DocumentUpdated || false,
    d8LessonsLearned: current8D.value.d8LessonsLearned || '', d8Congratulate: current8D.value.d8Congratulate || '',
  })
  current8DStep.value = 'd1'
  show8DEdit.value = true
}
async function save8DStep() {
  if (!current8D.value) return
  await qualityApi.eightD.updateStep(current8D.value.id, current8DStep.value, eightDForm)
  ElMessage.success('保存成功')
  const res = await qualityApi.eightD.get(current8D.value.id)
  current8D.value = res.data?.data || res.data
  await load8DReports()
  await loadStats()
}

// NC actions
async function createNC() {
  if (!ncForm.title || !ncForm.projectId) { ElMessage.warning('请填写必要信息'); return }
  await qualityApi.nonconformances.create(ncForm)
  ElMessage.success('不合格品记录创建成功')
  showCreateNC.value = false
  Object.assign(ncForm, { projectId: null, title: '', description: '', product: '', material: '', lotNo: '', defectType: 'dimension', quantity: 0, defectQuantity: 0, supplierId: null })
  await loadNonconformances()
  await loadStats()
}
function disposeNC(row: any) {
  disposeTargetId.value = row.id
  disposeForm.disposition = ''
  disposeForm.costImpact = 0
  showDisposeNC.value = true
}
async function confirmDispose() {
  if (!disposeForm.disposition) { ElMessage.warning('请选择处置方式'); return }
  await qualityApi.nonconformances.dispose(disposeTargetId.value!, { disposition: disposeForm.disposition, costImpact: disposeForm.costImpact })
  ElMessage.success('处置完成')
  showDisposeNC.value = false
  await loadNonconformances()
}
async function viewNC(row: any) {
  const res = await qualityApi.nonconformances.get(row.id)
  const d = res.data?.data || res.data
  ElMessageBox.alert(
    `<div><b>编号:</b> ${d.ncNo}</div><div><b>标题:</b> ${d.title}</div>
     <div><b>产品:</b> ${d.product || '-'} | <b>材料:</b> ${d.material || '-'}</div>
     <div><b>缺陷类型:</b> ${DEFECT_TYPE[d.defectType as keyof typeof DEFECT_TYPE] || d.defectType}</div>
     <div><b>数量:</b> ${d.quantity} | <b>缺陷数:</b> ${d.defectQuantity}</div>
     <div><b>处置:</b> ${d.disposition ? DISPOSITION[d.disposition as keyof typeof DISPOSITION] : '待处置'}</div>`,
    '不合格品详情', { dangerouslyUseHTMLString: true }
  )
}

// CAPA actions
async function createCAPA() {
  if (!capaForm.title || !capaForm.type) { ElMessage.warning('请填写必要信息'); return }
  await qualityApi.capas.create(capaForm)
  ElMessage.success('CAPA创建成功')
  showCreateCAPA.value = false
  Object.assign(capaForm, { projectId: null, title: '', description: '', type: 'corrective', source: 'problem', rootCause: '', correctiveAction: '', preventiveAction: '', targetDate: null })
  await loadCapas()
  await loadStats()
}
async function viewCAPA(row: any) {
  const res = await qualityApi.capas.get(row.id)
  const d = res.data?.data || res.data
  ElMessageBox.alert(
    `<div><b>编号:</b> ${d.capaNo}</div><div><b>标题:</b> ${d.title}</div>
     <div><b>类型:</b> ${CAPA_TYPE[d.type as keyof typeof CAPA_TYPE]}</div>
     <div><b>根因:</b> ${d.rootCause || '-'}</div>
     <div><b>纠正措施:</b> ${d.correctiveAction || '-'}</div>
     <div><b>预防措施:</b> ${d.preventiveAction || '-'}</div>
     <div><b>状态:</b> ${CAPA_STATUS[d.status as keyof typeof CAPA_STATUS]}</div>
     <div><b>有效性:</b> ${d.effectivenessResult || '-'}</div>`,
    'CAPA详情', { dangerouslyUseHTMLString: true }
  )
}
function verifyCAPA(row: any) {
  verifyCapaId.value = row.id
  verifyEffectiveness.value = ''
  showVerifyCAPA.value = true
}
async function confirmVerifyCAPA() {
  await qualityApi.capas.verify(verifyCapaId.value!, verifyEffectiveness.value)
  ElMessage.success('验证完成')
  showVerifyCAPA.value = false
  await loadCapas()
  await loadStats()
}
async function closeCAPA(row: any) {
  await qualityApi.capas.close(row.id)
  ElMessage.success('CAPA已关闭')
  await loadCapas()
  await loadStats()
}

// Inspection actions
async function createInspection() {
  if (!inspectionForm.title || !inspectionForm.projectId) { ElMessage.warning('请填写必要信息'); return }
  await qualityApi.inspections.create(inspectionForm)
  ElMessage.success('检验记录创建成功')
  showCreateInspection.value = false
  Object.assign(inspectionForm, { projectId: null, title: '', type: 'first_article', inspectionDate: '', sampleSize: 0, defectCount: 0, result: 'pass', findings: '', remarks: '' })
  await loadInspections()
  await loadStats()
}
async function viewInspection(row: any) {
  const res = await qualityApi.inspections.get(row.id)
  const d = res.data?.data || res.data
  ElMessageBox.alert(
    `<div><b>编号:</b> ${d.inspectionNo}</div><div><b>标题:</b> ${d.title}</div>
     <div><b>类型:</b> ${INSPECTION_TYPE[d.type as keyof typeof INSPECTION_TYPE]}</div>
     <div><b>抽样数:</b> ${d.sampleSize} | <b>缺陷数:</b> ${d.defectCount}</div>
     <div><b>结果:</b> ${INSPECTION_RESULT[d.result as keyof typeof INSPECTION_RESULT]}</div>
     <div><b>发现:</b> ${d.findings || '-'}</div>`,
    '检验详情', { dangerouslyUseHTMLString: true }
  )
}

onMounted(() => {
  loadAllData()
  loadSuppliers()
})
</script>

<style scoped>
.quality-view { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.header-actions { display: flex; gap: 8px; }
.kpi-row { margin-bottom: 16px; }
.kpi-card { text-align: center; }
.kpi-value { font-size: 28px; font-weight: bold; color: #409eff; }
.kpi-label { font-size: 13px; color: #909399; margin-top: 4px; }
.tab-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
</style>
