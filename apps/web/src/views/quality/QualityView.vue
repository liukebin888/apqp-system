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
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewProblem(row)">详情</el-button>
              <el-button v-if="row.status === 'new'" link type="primary" size="small" @click="assignProblem(row)">分配</el-button>
              <el-button v-if="!row.has8DReport && row.status !== 'closed'" link type="warning" size="small" @click="create8D(row)">创建8D</el-button>
              <el-button v-if="row.status !== 'closed'" link type="success" size="small" @click="closeProblem(row)">关闭</el-button>
              <el-button link type="danger" size="small" @click="showEscalationHistory(row)">升级历史</el-button>
              <el-button v-if="row.status !== 'closed' && row.status !== 'escalated'" link type="warning" size="small" @click="showManualEscalate(row)">手动升级</el-button>
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

      <!-- ==================== PPM追踪 ==================== -->
      <el-tab-pane label="PPM追踪" name="ppm">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreatePPM = true">新建PPM记录</el-button>
          <el-button @click="loadPpmTrend">自动计算</el-button>
          <el-select v-model="ppmFilter.periodType" placeholder="周期类型" clearable @change="loadPpmRecords">
            <el-option label="月度" value="monthly" />
            <el-option label="季度" value="quarterly" />
            <el-option label="年度" value="yearly" />
          </el-select>
        </div>
        <el-row :gutter="16" class="kpi-row" style="margin-bottom: 16px">
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card">
              <div class="kpi-value">{{ ppmCompliance.onTrack || 0 }}</div>
              <div class="kpi-label">达标记录</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card">
              <div class="kpi-value" style="color: #e6a23c">{{ ppmCompliance.warning || 0 }}</div>
              <div class="kpi-label">预警记录</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card">
              <div class="kpi-value" style="color: #f56c6c">{{ ppmCompliance.exceeded || 0 }}</div>
              <div class="kpi-label">超标记录</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card">
              <div class="kpi-value">{{ ppmCompliance.complianceRate || 0 }}%</div>
              <div class="kpi-label">达标率</div>
            </el-card>
          </el-col>
        </el-row>
        <el-table :data="ppmRecords" stripe v-loading="loading">
          <el-table-column label="项目" min-width="180">
            <template #default="{ row }">{{ row.project?.projectName }}</template>
          </el-table-column>
          <el-table-column prop="period" label="周期" width="120" />
          <el-table-column label="周期类型" width="90">
            <template #default="{ row }">{{ { monthly: '月度', quarterly: '季度', yearly: '年度' }[row.periodType] || row.periodType }}</template>
          </el-table-column>
          <el-table-column prop="totalParts" label="总件数" width="90" align="right" />
          <el-table-column prop="defectParts" label="缺陷件数" width="90" align="right" />
          <el-table-column label="PPM值" width="100" align="right">
            <template #default="{ row }">{{ Number(row.ppmValue).toFixed(1) }}</template>
          </el-table-column>
          <el-table-column label="目标PPM" width="100" align="right">
            <template #default="{ row }">{{ Number(row.targetPpm).toFixed(1) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'on_track' ? 'success' : row.status === 'warning' ? 'warning' : 'danger'" size="small">
                {{ { on_track: '达标', warning: '预警', exceeded: '超标' }[row.status] || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" size="small" @click="deletePpmRecord(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-card style="margin-top: 16px">
          <template #header>PPM趋势</template>
          <div ref="ppmTrendChartRef" style="height: 300px"></div>
        </el-card>
      </el-tab-pane>

      <!-- ==================== 统计分析 ==================== -->
      <el-tab-pane label="统计分析" name="stats">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card>
              <template #header>8D闭环趋势</template>
              <div ref="eightDTrendChartRef" style="height: 280px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>问题老化分析</template>
              <div ref="problemAgingChartRef" style="height: 280px"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16" style="margin-top: 16px">
          <el-col :span="12">
            <el-card>
              <template #header>Top 10缺陷Pareto</template>
              <div ref="topDefectsChartRef" style="height: 280px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>质量成本汇总</template>
              <div v-if="qualityCost" style="padding: 20px">
                <el-row :gutter="16">
                  <el-col :span="8">
                    <div class="kpi-value" style="font-size: 24px; color: #f56c6c">¥{{ qualityCost.totalCost?.toLocaleString() }}</div>
                    <div class="kpi-label">总质量成本</div>
                  </el-col>
                  <el-col :span="8">
                    <div class="kpi-value" style="font-size: 24px">{{ qualityCost.recordCount }}</div>
                    <div class="kpi-label">不合格品记录数</div>
                  </el-col>
                  <el-col :span="8">
                    <div class="kpi-value" style="font-size: 24px; color: #e6a23c">{{ enhancedStats.avgClosureDays || 0 }}</div>
                    <div class="kpi-label">平均关闭天数</div>
                  </el-col>
                </el-row>
                <div style="margin-top: 20px">
                  <div v-for="(cost, disp) in qualityCost.byDisposition" :key="disp" style="margin-bottom: 8px">
                    <span>{{ { rework: '返工', repair: '返修', concession: '让步', scrap: '报废', return: '退回' }[disp as string] || disp }}</span>
                    <span style="float: right; font-weight: bold">¥{{ Number(cost).toLocaleString() }}</span>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无数据" />
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16" style="margin-top: 16px">
          <el-col :span="24">
            <el-card>
              <template #header>问题严重程度分布</template>
              <div v-for="item in problemAnalysis?.bySeverity || []" :key="item.severity" style="margin-bottom: 8px">
                <span>{{ PROBLEM_SEVERITY[item.severity] || item.severity }}</span>
                <el-progress :percentage="calcPercentage(item._count, totalProblems)" :stroke-width="16" style="margin-left: 12px" />
              </div>
              <el-empty v-if="!problemAnalysis?.bySeverity?.length" description="暂无数据" />
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

    <!-- 升级历史 -->
    <el-dialog v-model="showEscalationHistoryDialog" title="升级历史" width="600px">
      <el-timeline v-if="escalationHistoryList.length">
        <el-timeline-item v-for="item in escalationHistoryList" :key="item.id" :timestamp="formatDate(item.createdAt)" placement="top" :type="item.escalationLevel === 'L1' ? 'danger' : item.escalationLevel === 'L2' ? 'warning' : 'info'">
          <el-card>
            <div><b>{{ item.escalationLevel }}</b> - 升级至{{ item.escalateTo }}</div>
            <div style="color: #909399; font-size: 12px; margin-top: 4px">
              {{ item.triggeredBy === 'auto' ? '自动触发' : `手动触发 (${item.triggeredByUser?.realName || '-'})` }} | 已开启{{ item.daysOpen }}天
            </div>
            <div style="margin-top: 4px">{{ item.remark }}</div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无升级记录" />
    </el-dialog>

    <!-- 手动升级 -->
    <el-dialog v-model="showManualEscalateDialog" title="手动升级" width="400px">
      <el-form label-width="100px">
        <el-form-item label="升级级别">
          <el-select v-model="escalateLevel" style="width: 100%">
            <el-option label="L1 - 总经理" value="L1" />
            <el-option label="L2 - 部门经理" value="L2" />
            <el-option label="L3 - 项目经理" value="L3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showManualEscalateDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmManualEscalate">确认升级</el-button>
      </template>
    </el-dialog>

    <!-- 新建PPM记录 -->
    <el-dialog v-model="showCreatePPM" title="新建PPM记录" width="540px">
      <el-form :model="ppmForm" label-width="100px">
        <el-form-item label="项目" required>
          <el-select v-model="ppmForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="周期" required>
          <el-input v-model="ppmForm.period" placeholder="如: 2026-01" />
        </el-form-item>
        <el-form-item label="周期类型">
          <el-select v-model="ppmForm.periodType" style="width: 100%">
            <el-option label="月度" value="monthly" />
            <el-option label="季度" value="quarterly" />
            <el-option label="年度" value="yearly" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="总件数"><el-input-number v-model="ppmForm.totalParts" :min="0" style="width: 100%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="缺陷件数"><el-input-number v-model="ppmForm.defectParts" :min="0" style="width: 100%" /></el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showCreatePPM = false">取消</el-button>
        <el-button type="primary" @click="createPpmRecord">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { qualityApi } from '@/api'
import { projectApi } from '@/api'
import { procurementApi } from '@/api'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  PROBLEM_STATUS, PROBLEM_CLASSIFICATION, PROBLEM_SEVERITY, PROBLEM_SOURCE,
  EIGHT_D_STATUS, DEFECT_TYPE, DISPOSITION,
  CAPA_SOURCE, CAPA_TYPE, CAPA_STATUS,
  INSPECTION_TYPE, INSPECTION_RESULT,
} from '@apqp/shared/constants/quality.constants'

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

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

// PPM data
const ppmRecords = ref<any[]>([])
const ppmCompliance = ref<any>({})
const ppmTrendData = ref<any[]>([])
const ppmFilter = reactive({ periodType: '' })
const showCreatePPM = ref(false)
const ppmForm = reactive<any>({ projectId: null, period: '', periodType: 'monthly', totalParts: 0, defectParts: 0 })

// Escalation data
const showEscalationHistoryDialog = ref(false)
const showManualEscalateDialog = ref(false)
const escalationHistoryList = ref<any[]>([])
const escalateProblemId = ref<number | null>(null)
const escalateLevel = ref('L2')

// Enhanced stats
const enhancedStats = ref<any>({})
const qualityCost = ref<any>(null)

// Chart refs
const ppmTrendChartRef = ref<HTMLElement | null>(null)
const eightDTrendChartRef = ref<HTMLElement | null>(null)
const problemAgingChartRef = ref<HTMLElement | null>(null)
const topDefectsChartRef = ref<HTMLElement | null>(null)
let ppmTrendChart: echarts.ECharts | null = null
let eightDTrendChart: echarts.ECharts | null = null
let problemAgingChart: echarts.ECharts | null = null
let topDefectsChart: echarts.ECharts | null = null

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

// Escalation methods
async function showEscalationHistory(row: any) {
  try {
    const res = await qualityApi.escalation.history(row.id)
    escalationHistoryList.value = res.data?.data || res.data || []
    showEscalationHistoryDialog.value = true
  } catch { escalationHistoryList.value = []; showEscalationHistoryDialog.value = true }
}
function showManualEscalate(row: any) {
  escalateProblemId.value = row.id
  escalateLevel.value = 'L2'
  showManualEscalateDialog.value = true
}
async function confirmManualEscalate() {
  if (!escalateProblemId.value) return
  await qualityApi.escalation.manualEscalate(escalateProblemId.value, escalateLevel.value)
  ElMessage.success('升级成功')
  showManualEscalateDialog.value = false
  await loadProblems()
}

// PPM methods
async function loadPpmRecords() {
  try {
    const params: any = {}
    if (filterProjectId.value) params.projectId = filterProjectId.value
    if (ppmFilter.periodType) params.periodType = ppmFilter.periodType
    const res = await qualityApi.ppm.list(params)
    ppmRecords.value = res.data?.data || res.data || []
  } catch {}
}
async function loadPpmCompliance() {
  try {
    const res = await qualityApi.ppm.compliance(filterProjectId.value ? { projectId: filterProjectId.value } : {})
    ppmCompliance.value = res.data?.data || res.data || {}
  } catch {}
}
async function loadPpmTrend() {
  try {
    const res = await qualityApi.ppm.trend(filterProjectId.value ? { projectId: filterProjectId.value } : {})
    ppmTrendData.value = res.data?.data || res.data || []
    renderPpmTrendChart()
  } catch {}
}
async function createPpmRecord() {
  if (!ppmForm.projectId || !ppmForm.period) { ElMessage.warning('请填写必要信息'); return }
  await qualityApi.ppm.create(ppmForm)
  ElMessage.success('PPM记录创建成功')
  showCreatePPM.value = false
  Object.assign(ppmForm, { projectId: null, period: '', periodType: 'monthly', totalParts: 0, defectParts: 0 })
  await loadPpmRecords()
  await loadPpmCompliance()
}
async function deletePpmRecord(row: any) {
  await ElMessageBox.confirm('确认删除此PPM记录？', '确认')
  await qualityApi.ppm.delete(row.id)
  ElMessage.success('已删除')
  await loadPpmRecords()
  await loadPpmCompliance()
}

// Enhanced stats methods
async function loadEnhancedStats() {
  try {
    const [enhanced, cost, aging, topDefects, eightDTrend] = await Promise.all([
      qualityApi.stats.enhanced(),
      qualityApi.stats.qualityCost(filterProjectId.value ? { projectId: filterProjectId.value } : {}),
      qualityApi.stats.problemAging(filterProjectId.value ? { projectId: filterProjectId.value } : {}),
      qualityApi.stats.topDefects({ limit: 10, ...(filterProjectId.value ? { projectId: filterProjectId.value } : {}) }),
      qualityApi.stats.eightDClosureTrend({ months: 6 }),
    ])
    enhancedStats.value = enhanced.data?.data || enhanced.data || {}
    qualityCost.value = cost.data?.data || cost.data || null
    await nextTick()
    renderProblemAgingChart(aging.data?.data || aging.data || {})
    renderTopDefectsChart(topDefects.data?.data || topDefects.data || [])
    renderEightDTrendChart(eightDTrend.data?.data || eightDTrend.data || [])
  } catch {}
}

// Chart rendering
function renderPpmTrendChart() {
  if (!ppmTrendChartRef.value) return
  if (!ppmTrendChart) ppmTrendChart = echarts.init(ppmTrendChartRef.value)
  ppmTrendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['PPM值', '目标PPM'] },
    xAxis: { type: 'category', data: ppmTrendData.value.map((d: any) => d.period) },
    yAxis: { type: 'value', name: 'PPM' },
    series: [
      { name: 'PPM值', type: 'line', data: ppmTrendData.value.map((d: any) => d.ppmValue), itemStyle: { color: '#409eff' } },
      { name: '目标PPM', type: 'line', data: ppmTrendData.value.map((d: any) => d.targetPpm), lineStyle: { type: 'dashed' }, itemStyle: { color: '#67c23a' } },
    ],
  })
}
function renderEightDTrendChart(data: any[]) {
  if (!eightDTrendChartRef.value) return
  if (!eightDTrendChart) eightDTrendChart = echarts.init(eightDTrendChartRef.value)
  eightDTrendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['创建', '关闭'] },
    xAxis: { type: 'category', data: data.map((d: any) => d.month) },
    yAxis: { type: 'value' },
    series: [
      { name: '创建', type: 'line', data: data.map((d: any) => d.created), itemStyle: { color: '#e6a23c' } },
      { name: '关闭', type: 'line', data: data.map((d: any) => d.completed), itemStyle: { color: '#67c23a' } },
    ],
  })
}
function renderProblemAgingChart(data: any) {
  if (!problemAgingChartRef.value) return
  if (!problemAgingChart) problemAgingChart = echarts.init(problemAgingChartRef.value)
  const labels = Object.keys(data)
  const values = Object.values(data)
  problemAgingChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels.map((l) => l + '天') },
    yAxis: { type: 'value', name: '问题数' },
    series: [{ type: 'bar', data: values, itemStyle: { color: '#409eff' } }],
  })
}
function renderTopDefectsChart(data: any[]) {
  if (!topDefectsChartRef.value) return
  if (!topDefectsChart) topDefectsChart = echarts.init(topDefectsChartRef.value)
  const typeLabels: Record<string, string> = { dimension: '尺寸超差', appearance: '外观缺陷', function: '功能失效', material: '材料不符', packaging: '包装破损' }
  const labels = data.map((d: any) => typeLabels[d.defectType] || d.defectType)
  const values = data.map((d: any) => d.defectQty)
  const total = values.reduce((s: number, v: number) => s + v, 0)
  let cum = 0
  const cumPct = values.map((v: number) => { cum += v; return total > 0 ? Math.round((cum / total) * 100) : 0 })
  topDefectsChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels, axisLabel: { rotate: 30 } },
    yAxis: [
      { type: 'value', name: '缺陷数' },
      { type: 'value', name: '累积%', max: 100, axisLabel: { formatter: '{value}%' } },
    ],
    series: [
      { type: 'bar', data: values, itemStyle: { color: '#f56c6c' } },
      { type: 'line', yAxisIndex: 1, data: cumPct, itemStyle: { color: '#409eff' } },
    ],
  })
}

// Tab watcher for lazy-loading charts
watch(activeTab, (tab) => {
  if (tab === 'ppm') {
    loadPpmRecords()
    loadPpmCompliance()
    nextTick(() => loadPpmTrend())
  } else if (tab === 'stats') {
    nextTick(() => loadEnhancedStats())
  }
})

onBeforeUnmount(() => {
  ppmTrendChart?.dispose()
  eightDTrendChart?.dispose()
  problemAgingChart?.dispose()
  topDefectsChart?.dispose()
})

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
