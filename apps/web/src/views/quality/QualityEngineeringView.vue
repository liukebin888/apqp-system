<template>
  <div class="qe-view">
    <div class="page-header">
      <h2>质量工程 (FMEA / SPC / MSA)</h2>
      <div class="header-actions">
        <el-select v-model="filterProjectId" placeholder="选择项目" clearable style="width: 240px" @change="loadAllData">
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
      </div>
    </div>

    <el-row :gutter="16" class="kpi-row">
      <el-col :span="4"><el-card shadow="hover" class="kpi-card"><div class="kpi-value">{{ stats.dfmeas }}</div><div class="kpi-label">DFMEA</div></el-card></el-col>
      <el-col :span="4"><el-card shadow="hover" class="kpi-card"><div class="kpi-value">{{ stats.pfmeas }}</div><div class="kpi-label">PFMEA</div></el-card></el-col>
      <el-col :span="4"><el-card shadow="hover" class="kpi-card"><div class="kpi-value">{{ stats.controlPlans }}</div><div class="kpi-label">控制计划</div></el-card></el-col>
      <el-col :span="4"><el-card shadow="hover" class="kpi-card"><div class="kpi-value">{{ stats.specialChars }}</div><div class="kpi-label">特殊特性</div></el-card></el-col>
      <el-col :span="4"><el-card shadow="hover" class="kpi-card"><div class="kpi-value">{{ stats.spcStudies }}</div><div class="kpi-label">SPC 研究</div></el-card></el-col>
      <el-col :span="4"><el-card shadow="hover" class="kpi-card"><div class="kpi-value">{{ stats.msaStudies }}</div><div class="kpi-label">MSA 研究</div></el-card></el-col>
    </el-row>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- ==================== DFMEA Tab ==================== -->
      <el-tab-pane label="DFMEA" name="dfmea">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreateDfmea = true">新建 DFMEA</el-button>
        </div>
        <el-table :data="dfmeas" stripe v-loading="loading">
          <el-table-column prop="fmeaNo" label="编号" width="160" />
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column label="项目" width="160"><template #default="{ row }">{{ row.project?.projectName }}</template></el-table-column>
          <el-table-column label="负责人" width="100"><template #default="{ row }">{{ row.teamLeader?.realName }}</template></el-table-column>
          <el-table-column label="版本" width="60" align="center"><template #default="{ row }">V{{ row.version }}</template></el-table-column>
          <el-table-column label="明细" width="60" align="center"><template #default="{ row }">{{ row._count?.items || 0 }}</template></el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }"><el-tag :type="statusTagType(row.status)" size="small">{{ FMEA_STATUS[row.status] || row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewDfmea(row)">详情</el-button>
              <el-button v-if="row.status === 'draft' || row.status === 'in_progress'" link type="success" size="small" @click="approveDfmea(row.id)">批准</el-button>
              <el-button link type="warning" size="small" @click="copyDfmea(row.id)">复制</el-button>
              <el-button link type="danger" size="small" @click="deleteDfmea(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== PFMEA Tab ==================== -->
      <el-tab-pane label="PFMEA" name="pfmea">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreatePfmea = true">新建 PFMEA</el-button>
        </div>
        <el-table :data="pfmeas" stripe v-loading="loading">
          <el-table-column prop="fmeaNo" label="编号" width="160" />
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column label="流程图" width="160"><template #default="{ row }">{{ row.processFlow?.flowNo }}</template></el-table-column>
          <el-table-column label="负责人" width="100"><template #default="{ row }">{{ row.teamLeader?.realName }}</template></el-table-column>
          <el-table-column label="明细" width="60" align="center"><template #default="{ row }">{{ row._count?.items || 0 }}</template></el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }"><el-tag :type="statusTagType(row.status)" size="small">{{ FMEA_STATUS[row.status] || row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewPfmea(row)">详情</el-button>
              <el-button v-if="row.status !== 'approved'" link type="success" size="small" @click="approvePfmea(row.id)">批准</el-button>
              <el-button link type="danger" size="small" @click="deletePfmea(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== Control Plan Tab ==================== -->
      <el-tab-pane label="控制计划" name="cp">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreateCp = true">新建控制计划</el-button>
          <el-select v-model="cpTypeFilter" placeholder="类型" clearable @change="loadControlPlans" style="width: 160px">
            <el-option v-for="(label, key) in CP_TYPE" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="controlPlans" stripe v-loading="loading">
          <el-table-column prop="cpNo" label="编号" width="160" />
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column label="类型" width="120"><template #default="{ row }">{{ CP_TYPE[row.cpType] || row.cpType }}</template></el-table-column>
          <el-table-column label="零件号" width="120"><template #default="{ row }">{{ row.partNumber }}</template></el-table-column>
          <el-table-column label="明细" width="60" align="center"><template #default="{ row }">{{ row._count?.items || 0 }}</template></el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }"><el-tag :type="statusTagType(row.status)" size="small">{{ FMEA_STATUS[row.status] || row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewCp(row)">详情</el-button>
              <el-button link type="success" size="small" @click="generateCpFromPfmea(row.id)">从PFMEA生成</el-button>
              <el-button link type="danger" size="small" @click="deleteCp(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== Special Characteristics Tab ==================== -->
      <el-tab-pane label="特殊特性" name="sc">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreateSc = true">识别特殊特性</el-button>
          <el-select v-model="scTypeFilter" placeholder="类型" clearable @change="loadSpecialChars" style="width: 160px">
            <el-option v-for="(label, key) in SPECIAL_CHAR_TYPE" :key="key" :label="label" :value="key" />
          </el-select>
        </div>
        <el-table :data="specialChars" stripe v-loading="loading">
          <el-table-column prop="charCode" label="特性代码" width="120" />
          <el-table-column prop="charName" label="特性名称" min-width="200" />
          <el-table-column label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="row.charType === 'CC' ? 'danger' : 'warning'" size="small">{{ SPECIAL_CHAR_TYPE[row.charType] || row.charType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="来源" width="100"><template #default="{ row }">{{ SPEC_CHAR_SOURCE[row.source] || row.source }}</template></el-table-column>
          <el-table-column label="状态" width="80"><template #default="{ row }"><el-tag size="small">{{ row.status }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewTraceability(row)">追溯</el-button>
              <el-button link type="danger" size="small" @click="deleteSc(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== SPC Tab ==================== -->
      <el-tab-pane label="SPC" name="spc">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreateSpc = true">新建 SPC 研究</el-button>
        </div>
        <el-table :data="spcStudies" stripe v-loading="loading">
          <el-table-column prop="studyNo" label="编号" width="160" />
          <el-table-column prop="characteristicName" label="特性名称" min-width="180" />
          <el-table-column label="图表" width="100"><template #default="{ row }">{{ SPC_CHART_TYPE[row.chartType] || row.chartType }}</template></el-table-column>
          <el-table-column label="Cpk" width="80" align="right"><template #default="{ row }">{{ row.cpk ? Number(row.cpk).toFixed(2) : '-' }}</template></el-table-column>
          <el-table-column label="Ppk" width="80" align="right"><template #default="{ row }">{{ row.ppk ? Number(row.ppk).toFixed(2) : '-' }}</template></el-table-column>
          <el-table-column label="能力" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.capabilityResult" :type="row.capabilityResult === 'capable' ? 'success' : row.capabilityResult === 'marginal' ? 'warning' : 'danger'" size="small">{{ SPC_CAPABILITY_RESULT[row.capabilityResult] || row.capabilityResult }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="数据点" width="70" align="center"><template #default="{ row }">{{ row._count?.dataPoints || 0 }}</template></el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewSpc(row)">详情</el-button>
              <el-button link type="success" size="small" @click="calculateSpc(row.id)">计算</el-button>
              <el-button link type="danger" size="small" @click="deleteSpc(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== MSA Tab ==================== -->
      <el-tab-pane label="MSA" name="msa">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreateMsa = true">新建 MSA 研究</el-button>
        </div>
        <el-table :data="msaStudies" stripe v-loading="loading">
          <el-table-column prop="studyNo" label="编号" width="160" />
          <el-table-column prop="gageName" label="量具名称" min-width="180" />
          <el-table-column label="类型" width="100"><template #default="{ row }">{{ MSA_STUDY_TYPE[row.studyType] || row.studyType }}</template></el-table-column>
          <el-table-column label="%GR&R" width="80" align="right"><template #default="{ row }">{{ row.grrPercent ? Number(row.grrPercent).toFixed(1) + '%' : '-' }}</template></el-table-column>
          <el-table-column label="NDC" width="60" align="center"><template #default="{ row }">{{ row.ndc || '-' }}</template></el-table-column>
          <el-table-column label="判定" width="90">
            <template #default="{ row }">
              <el-tag v-if="row.acceptanceResult" :type="row.acceptanceResult === 'acceptable' ? 'success' : row.acceptanceResult === 'marginal' ? 'warning' : 'danger'" size="small">{{ MSA_ACCEPTANCE[row.acceptanceResult] || row.acceptanceResult }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewMsa(row)">详情</el-button>
              <el-button link type="success" size="small" @click="calculateMsa(row.id)">计算</el-button>
              <el-button link type="danger" size="small" @click="deleteMsa(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== Knowledge Base Tab ==================== -->
      <el-tab-pane label="对策库" name="kb">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" @click="showCreateKb = true">新增条目</el-button>
          <el-select v-model="kbTypeFilter" placeholder="类型" clearable @change="loadKb" style="width: 160px">
            <el-option v-for="(label, key) in KB_ENTRY_TYPE" :key="key" :label="label" :value="key" />
          </el-select>
          <el-input v-model="kbSearch" placeholder="搜索关键词..." clearable style="width: 200px" @clear="loadKb" @keyup.enter="searchKb">
            <template #append><el-button @click="searchKb">搜索</el-button></template>
          </el-input>
        </div>
        <el-table :data="kbEntries" stripe v-loading="loading">
          <el-table-column label="类型" width="120"><template #default="{ row }">{{ KB_ENTRY_TYPE[row.entryType] || row.entryType }}</template></el-table-column>
          <el-table-column prop="category" label="类别" width="120" />
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column label="S/O/D" width="100"><template #default="{ row }">{{ row.suggestedSeverity || '-' }}/{{ row.suggestedOccurrence || '-' }}/{{ row.suggestedDetection || '-' }}</template></el-table-column>
          <el-table-column label="适用" width="80"><template #default="{ row }">{{ FMEA_TYPE[row.applicableFmeaType] || row.applicableFmeaType || '通用' }}</template></el-table-column>
          <el-table-column label="使用次数" width="80" align="center"><template #default="{ row }">{{ row.usageCount }}</template></el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="editKb(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="deleteKb(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-collapse class="ref-tables" v-if="showRefTables">
          <el-collapse-item title="严重度(S)参考表" name="s"><el-table :data="SEVERITY_TABLE" size="small" stripe><el-table-column prop="rating" label="S" width="60" /><el-table-column prop="criteria" label="准则" width="100" /><el-table-column prop="description" label="描述" /></el-table></el-collapse-item>
          <el-collapse-item title="频度(O)参考表" name="o"><el-table :data="OCCURRENCE_TABLE" size="small" stripe><el-table-column prop="rating" label="O" width="60" /><el-table-column prop="criteria" label="准则" width="100" /><el-table-column prop="description" label="描述" /></el-table></el-collapse-item>
          <el-collapse-item title="探测度(D)参考表" name="d"><el-table :data="DETECTION_TABLE" size="small" stripe><el-table-column prop="rating" label="D" width="60" /><el-table-column prop="criteria" label="准则" width="100" /><el-table-column prop="description" label="描述" /></el-table></el-collapse-item>
        </el-collapse>
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== Dialogs ==================== -->

    <!-- Create DFMEA Dialog -->
    <el-dialog v-model="showCreateDfmea" title="新建 DFMEA" width="500px">
      <el-form :model="dfmeaForm" label-width="80px">
        <el-form-item label="项目"><el-select v-model="dfmeaForm.projectId" placeholder="选择项目"><el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" /></el-select></el-form-item>
        <el-form-item label="标题"><el-input v-model="dfmeaForm.title" /></el-form-item>
        <el-form-item label="范围"><el-input v-model="dfmeaForm.scope" type="textarea" /></el-form-item>
        <el-form-item label="负责人"><el-select v-model="dfmeaForm.teamLeaderId" placeholder="选择" clearable><el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="showCreateDfmea = false">取消</el-button><el-button type="primary" @click="createDfmea">创建</el-button></template>
    </el-dialog>

    <!-- Create PFMEA Dialog -->
    <el-dialog v-model="showCreatePfmea" title="新建 PFMEA" width="500px">
      <el-form :model="pfmeaForm" label-width="80px">
        <el-form-item label="项目"><el-select v-model="pfmeaForm.projectId" placeholder="选择项目"><el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" /></el-select></el-form-item>
        <el-form-item label="标题"><el-input v-model="pfmeaForm.title" /></el-form-item>
        <el-form-item label="流程图"><el-select v-model="pfmeaForm.processFlowId" placeholder="关联流程图" clearable><el-option v-for="f in processFlows" :key="f.id" :label="f.title" :value="f.id" /></el-select></el-form-item>
        <el-form-item label="负责人"><el-select v-model="pfmeaForm.teamLeaderId" placeholder="选择" clearable><el-option v-for="u in users" :key="u.id" :label="u.realName" :value="u.id" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="showCreatePfmea = false">取消</el-button><el-button type="primary" @click="createPfmea">创建</el-button></template>
    </el-dialog>

    <!-- Create CP Dialog -->
    <el-dialog v-model="showCreateCp" title="新建控制计划" width="500px">
      <el-form :model="cpForm" label-width="80px">
        <el-form-item label="项目"><el-select v-model="cpForm.projectId" placeholder="选择项目"><el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" /></el-select></el-form-item>
        <el-form-item label="标题"><el-input v-model="cpForm.title" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="cpForm.cpType"><el-option v-for="(label, key) in CP_TYPE" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="零件号"><el-input v-model="cpForm.partNumber" /></el-form-item>
        <el-form-item label="零件名"><el-input v-model="cpForm.partName" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showCreateCp = false">取消</el-button><el-button type="primary" @click="createCp">创建</el-button></template>
    </el-dialog>

    <!-- Create SC Dialog -->
    <el-dialog v-model="showCreateSc" title="识别特殊特性" width="500px">
      <el-form :model="scForm" label-width="80px">
        <el-form-item label="项目"><el-select v-model="scForm.projectId" placeholder="选择项目"><el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" /></el-select></el-form-item>
        <el-form-item label="代码"><el-input v-model="scForm.charCode" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="scForm.charName" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="scForm.charType"><el-option v-for="(label, key) in SPECIAL_CHAR_TYPE" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="来源"><el-select v-model="scForm.source" clearable><el-option v-for="(label, key) in SPEC_CHAR_SOURCE" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="描述"><el-input v-model="scForm.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showCreateSc = false">取消</el-button><el-button type="primary" @click="createSc">创建</el-button></template>
    </el-dialog>

    <!-- Create SPC Dialog -->
    <el-dialog v-model="showCreateSpc" title="新建 SPC 研究" width="500px">
      <el-form :model="spcForm" label-width="80px">
        <el-form-item label="项目"><el-select v-model="spcForm.projectId" placeholder="选择项目"><el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" /></el-select></el-form-item>
        <el-form-item label="特性名"><el-input v-model="spcForm.characteristicName" /></el-form-item>
        <el-form-item label="图表类型"><el-select v-model="spcForm.chartType"><el-option v-for="(label, key) in SPC_CHART_TYPE" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="子组大小"><el-input-number v-model="spcForm.subgroupSize" :min="2" :max="10" /></el-form-item>
        <el-form-item label="USL"><el-input-number v-model="spcForm.usl" :precision="4" /></el-form-item>
        <el-form-item label="LSL"><el-input-number v-model="spcForm.lsl" :precision="4" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showCreateSpc = false">取消</el-button><el-button type="primary" @click="createSpc">创建</el-button></template>
    </el-dialog>

    <!-- Create MSA Dialog -->
    <el-dialog v-model="showCreateMsa" title="新建 MSA 研究" width="500px">
      <el-form :model="msaForm" label-width="80px">
        <el-form-item label="项目"><el-select v-model="msaForm.projectId" placeholder="选择项目"><el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" /></el-select></el-form-item>
        <el-form-item label="量具名"><el-input v-model="msaForm.gageName" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="msaForm.studyType"><el-option v-for="(label, key) in MSA_STUDY_TYPE" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="操作员数"><el-input-number v-model="msaForm.numOperators" :min="2" :max="5" /></el-form-item>
        <el-form-item label="试验次数"><el-input-number v-model="msaForm.numTrials" :min="2" :max="5" /></el-form-item>
        <el-form-item label="零件数"><el-input-number v-model="msaForm.numParts" :min="5" :max="20" /></el-form-item>
        <el-form-item label="公差"><el-input-number v-model="msaForm.tolerance" :precision="4" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showCreateMsa = false">取消</el-button><el-button type="primary" @click="createMsa">创建</el-button></template>
    </el-dialog>

    <!-- Create KB Dialog -->
    <el-dialog v-model="showCreateKb" title="新增对策库条目" width="500px">
      <el-form :model="kbForm" label-width="80px">
        <el-form-item label="类型"><el-select v-model="kbForm.entryType"><el-option v-for="(label, key) in KB_ENTRY_TYPE" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="类别"><el-input v-model="kbForm.category" /></el-form-item>
        <el-form-item label="标题"><el-input v-model="kbForm.title" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="kbForm.description" type="textarea" /></el-form-item>
        <el-form-item label="建议S"><el-input-number v-model="kbForm.suggestedSeverity" :min="1" :max="10" /></el-form-item>
        <el-form-item label="建议O"><el-input-number v-model="kbForm.suggestedOccurrence" :min="1" :max="10" /></el-form-item>
        <el-form-item label="建议D"><el-input-number v-model="kbForm.suggestedDetection" :min="1" :max="10" /></el-form-item>
        <el-form-item label="适用"><el-select v-model="kbForm.applicableFmeaType" clearable><el-option v-for="(label, key) in FMEA_TYPE" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="标签"><el-input v-model="kbForm.tags" placeholder="逗号分隔" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showCreateKb = false">取消</el-button><el-button type="primary" @click="createKb">创建</el-button></template>
    </el-dialog>

    <!-- Detail Drawer -->
    <el-drawer v-model="showDetail" :title="detailTitle" size="70%">
      <div v-html="detailContent"></div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { fmeaApi } from '@/api'
import { projectApi, userApi } from '@/api'
import {
  FMEA_STATUS, CP_TYPE, SPECIAL_CHAR_TYPE, SPEC_CHAR_SOURCE, SPC_CHART_TYPE,
  SPC_CAPABILITY_RESULT, MSA_STUDY_TYPE, MSA_ACCEPTANCE, KB_ENTRY_TYPE, FMEA_TYPE,
  SEVERITY_TABLE, OCCURRENCE_TABLE, DETECTION_TABLE,
} from '@apqp/shared'

const loading = ref(false)
const activeTab = ref('dfmea')
const filterProjectId = ref<number | undefined>()
const projects = ref<any[]>([])
const users = ref<any[]>([])
const stats = reactive({ dfmeas: 0, pfmeas: 0, controlPlans: 0, specialChars: 0, spcStudies: 0, msaStudies: 0 })

// Data arrays
const dfmeas = ref<any[]>([])
const pfmeas = ref<any[]>([])
const processFlows = ref<any[]>([])
const controlPlans = ref<any[]>([])
const specialChars = ref<any[]>([])
const spcStudies = ref<any[]>([])
const msaStudies = ref<any[]>([])
const kbEntries = ref<any[]>([])

// Filters
const cpTypeFilter = ref('')
const scTypeFilter = ref('')
const kbTypeFilter = ref('')
const kbSearch = ref('')
const showRefTables = ref(true)

// Dialogs
const showCreateDfmea = ref(false)
const showCreatePfmea = ref(false)
const showCreateCp = ref(false)
const showCreateSc = ref(false)
const showCreateSpc = ref(false)
const showCreateMsa = ref(false)
const showCreateKb = ref(false)
const showDetail = ref(false)
const detailTitle = ref('')
const detailContent = ref('')

// Forms
const dfmeaForm = reactive({ projectId: undefined as number | undefined, title: '', scope: '', teamLeaderId: undefined as number | undefined })
const pfmeaForm = reactive({ projectId: undefined as number | undefined, title: '', processFlowId: undefined as number | undefined, teamLeaderId: undefined as number | undefined })
const cpForm = reactive({ projectId: undefined as number | undefined, title: '', cpType: 'prototype', partNumber: '', partName: '' })
const scForm = reactive({ projectId: undefined as number | undefined, charCode: '', charName: '', charType: 'CC', source: 'customer', description: '' })
const spcForm = reactive({ projectId: undefined as number | undefined, characteristicName: '', chartType: 'xbar_r', subgroupSize: 5, usl: undefined as number | undefined, lsl: undefined as number | undefined })
const msaForm = reactive({ projectId: undefined as number | undefined, gageName: '', studyType: 'grr', numOperators: 3, numTrials: 3, numParts: 10, tolerance: undefined as number | undefined })
const kbForm = reactive({ entryType: 'failure_mode', category: '', title: '', description: '', suggestedSeverity: undefined as number | undefined, suggestedOccurrence: undefined as number | undefined, suggestedDetection: undefined as number | undefined, applicableFmeaType: 'both', tags: '' })

function statusTagType(status: string) {
  const map: Record<string, string> = { draft: 'info', in_progress: '', reviewed: 'warning', approved: 'success', released: 'success' }
  return map[status] || 'info'
}

async function loadAllData() {
  await Promise.all([loadProjects(), loadUsers(), loadStats(), loadDfmeas(), loadPfmeas(), loadControlPlans(), loadSpecialChars(), loadSpcStudies(), loadMsaStudies(), loadKb(), loadProcessFlows()])
}

async function loadProjects() { const r = await projectApi.list(); projects.value = r.data?.data || r.data || [] }
async function loadUsers() { const r = await userApi.list({}); users.value = r.data?.data || r.data || [] }
async function loadStats() {
  const r = await fmeaApi.stats.overview(filterProjectId.value ? { projectId: filterProjectId.value } : {})
  const d = r.data?.data || r.data || {}
  Object.assign(stats, { dfmeas: d.dfmeas || 0, pfmeas: d.pfmeas || 0, controlPlans: d.controlPlans || 0, specialChars: d.specialChars || 0, spcStudies: d.spcStudies || 0, msaStudies: d.msaStudies || 0 })
}
async function loadDfmeas() { const r = await fmeaApi.dfmeas.list(filterProjectId.value ? { projectId: filterProjectId.value } : {}); dfmeas.value = r.data?.data || r.data || [] }
async function loadPfmeas() { const r = await fmeaApi.pfmeas.list(filterProjectId.value ? { projectId: filterProjectId.value } : {}); pfmeas.value = r.data?.data || r.data || [] }
async function loadProcessFlows() { const r = await fmeaApi.processFlows.list(filterProjectId.value ? { projectId: filterProjectId.value } : {}); processFlows.value = r.data?.data || r.data || [] }
async function loadControlPlans() { const params: any = {}; if (filterProjectId.value) params.projectId = filterProjectId.value; if (cpTypeFilter.value) params.cpType = cpTypeFilter.value; const r = await fmeaApi.controlPlans.list(params); controlPlans.value = r.data?.data || r.data || [] }
async function loadSpecialChars() { const params: any = {}; if (filterProjectId.value) params.projectId = filterProjectId.value; if (scTypeFilter.value) params.charType = scTypeFilter.value; const r = await fmeaApi.specialChars.list(params); specialChars.value = r.data?.data || r.data || [] }
async function loadSpcStudies() { const r = await fmeaApi.spc.list(filterProjectId.value ? { projectId: filterProjectId.value } : {}); spcStudies.value = r.data?.data || r.data || [] }
async function loadMsaStudies() { const r = await fmeaApi.msa.list(filterProjectId.value ? { projectId: filterProjectId.value } : {}); msaStudies.value = r.data?.data || r.data || [] }
async function loadKb() { const params: any = {}; if (kbTypeFilter.value) params.entryType = kbTypeFilter.value; const r = await fmeaApi.kb.list(params); kbEntries.value = r.data?.data || r.data || [] }

// DFMEA actions
async function createDfmea() { await fmeaApi.dfmeas.create(dfmeaForm); showCreateDfmea.value = false; ElMessage.success('创建成功'); await loadDfmeas(); await loadStats() }
async function viewDfmea(row: any) { const r = await fmeaApi.dfmeas.get(row.id); const d = r.data?.data || r.data; detailTitle.value = `DFMEA: ${d.title}`; detailContent.value = `<p>编号: ${d.fmeaNo}</p><p>状态: ${FMEA_STATUS[d.status as keyof typeof FMEA_STATUS] || d.status}</p><p>明细数: ${d.items?.length || 0}</p>`; showDetail.value = true }
async function approveDfmea(id: number) { await fmeaApi.dfmeas.approve(id); ElMessage.success('已批准'); await loadDfmeas() }
async function copyDfmea(id: number) { await fmeaApi.dfmeas.copy(id); ElMessage.success('已复制'); await loadDfmeas(); await loadStats() }
async function deleteDfmea(id: number) { await ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' }); await fmeaApi.dfmeas.delete(id); ElMessage.success('已删除'); await loadDfmeas(); await loadStats() }

// PFMEA actions
async function createPfmea() { await fmeaApi.pfmeas.create(pfmeaForm); showCreatePfmea.value = false; ElMessage.success('创建成功'); await loadPfmeas(); await loadStats() }
async function viewPfmea(row: any) { const r = await fmeaApi.pfmeas.get(row.id); const d = r.data?.data || r.data; detailTitle.value = `PFMEA: ${d.title}`; detailContent.value = `<p>编号: ${d.fmeaNo}</p><p>状态: ${FMEA_STATUS[d.status as keyof typeof FMEA_STATUS] || d.status}</p><p>明细数: ${d.items?.length || 0}</p>`; showDetail.value = true }
async function approvePfmea(id: number) { await fmeaApi.pfmeas.approve(id); ElMessage.success('已批准'); await loadPfmeas() }
async function deletePfmea(id: number) { await ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' }); await fmeaApi.pfmeas.delete(id); ElMessage.success('已删除'); await loadPfmeas(); await loadStats() }

// CP actions
async function createCp() { await fmeaApi.controlPlans.create(cpForm); showCreateCp.value = false; ElMessage.success('创建成功'); await loadControlPlans(); await loadStats() }
async function viewCp(row: any) { const r = await fmeaApi.controlPlans.get(row.id); const d = r.data?.data || r.data; detailTitle.value = `控制计划: ${d.title}`; detailContent.value = `<p>编号: ${d.cpNo}</p><p>类型: ${CP_TYPE[d.cpType as keyof typeof CP_TYPE] || d.cpType}</p><p>明细数: ${d.items?.length || 0}</p>`; showDetail.value = true }
async function generateCpFromPfmea(cpId: number) { const r = await fmeaApi.controlPlans.generateFromPfmea(cpId); const d = r.data?.data || r.data; ElMessage.success(`已生成 ${d.generated} 条明细`); await loadControlPlans() }
async function deleteCp(id: number) { await ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' }); await fmeaApi.controlPlans.delete(id); ElMessage.success('已删除'); await loadControlPlans(); await loadStats() }

// SC actions
async function createSc() { await fmeaApi.specialChars.create(scForm); showCreateSc.value = false; ElMessage.success('创建成功'); await loadSpecialChars(); await loadStats() }
async function viewTraceability(row: any) { const r = await fmeaApi.specialChars.traceability(row.id); const d = r.data?.data || r.data; detailTitle.value = `特殊特性追溯: ${d.specialChar?.charCode}`; let html = `<h4>${d.specialChar?.charName} (${d.specialChar?.charType})</h4>`; html += `<p>DFMEA 关联: ${d.dfmeaItems?.length || 0} 项</p>`; html += `<p>PFMEA 关联: ${d.pfmeaItems?.length || 0} 项</p>`; html += `<p>控制计划 关联: ${d.cpItems?.length || 0} 项</p>`; detailContent.value = html; showDetail.value = true }
async function deleteSc(id: number) { await ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' }); await fmeaApi.specialChars.delete(id); ElMessage.success('已删除'); await loadSpecialChars(); await loadStats() }

// SPC actions
async function createSpc() { await fmeaApi.spc.create(spcForm); showCreateSpc.value = false; ElMessage.success('创建成功'); await loadSpcStudies(); await loadStats() }
async function viewSpc(row: any) { const r = await fmeaApi.spc.get(row.id); const d = r.data?.data || r.data; detailTitle.value = `SPC: ${d.characteristicName}`; let html = `<p>编号: ${d.studyNo}</p><p>图表: ${SPC_CHART_TYPE[d.chartType as keyof typeof SPC_CHART_TYPE] || d.chartType}</p>`; if (d.cpk) html += `<p>Cpk: ${Number(d.cpk).toFixed(4)}</p><p>Ppk: ${Number(d.ppk).toFixed(4)}</p>`; html += `<p>数据点: ${d.dataPoints?.length || 0}</p>`; detailContent.value = html; showDetail.value = true }
async function calculateSpc(id: number) { await fmeaApi.spc.calculate(id); ElMessage.success('计算完成'); await loadSpcStudies() }
async function deleteSpc(id: number) { await ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' }); await fmeaApi.spc.delete(id); ElMessage.success('已删除'); await loadSpcStudies(); await loadStats() }

// MSA actions
async function createMsa() { await fmeaApi.msa.create(msaForm); showCreateMsa.value = false; ElMessage.success('创建成功'); await loadMsaStudies(); await loadStats() }
async function viewMsa(row: any) { const r = await fmeaApi.msa.get(row.id); const d = r.data?.data || r.data; detailTitle.value = `MSA: ${d.gageName}`; let html = `<p>编号: ${d.studyNo}</p><p>类型: ${MSA_STUDY_TYPE[d.studyType as keyof typeof MSA_STUDY_TYPE] || d.studyType}</p>`; if (d.grrPercent) html += `<p>%GR&R: ${Number(d.grrPercent).toFixed(2)}%</p><p>NDC: ${d.ndc}</p>`; html += `<p>测量值: ${d.measurements?.length || 0}</p>`; detailContent.value = html; showDetail.value = true }
async function calculateMsa(id: number) { await fmeaApi.msa.calculate(id); ElMessage.success('计算完成'); await loadMsaStudies() }
async function deleteMsa(id: number) { await ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' }); await fmeaApi.msa.delete(id); ElMessage.success('已删除'); await loadMsaStudies(); await loadStats() }

// KB actions
async function createKb() { await fmeaApi.kb.create(kbForm); showCreateKb.value = false; ElMessage.success('创建成功'); await loadKb() }
async function editKb(row: any) { Object.assign(kbForm, row); showCreateKb.value = true }
async function deleteKb(id: number) { await ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' }); await fmeaApi.kb.delete(id); ElMessage.success('已删除'); await loadKb() }
async function searchKb() { if (!kbSearch.value) { await loadKb(); return } const r = await fmeaApi.kb.recommend(kbSearch.value); kbEntries.value = r.data?.data || r.data || [] }

onMounted(() => { loadAllData() })
</script>

<style scoped>
.qe-view { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.header-actions { display: flex; gap: 8px; }
.kpi-row { margin-bottom: 16px; }
.kpi-card { text-align: center; }
.kpi-value { font-size: 24px; font-weight: bold; color: #409eff; }
.kpi-label { font-size: 13px; color: #909399; margin-top: 4px; }
.tab-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.ref-tables { margin-top: 16px; }
</style>
