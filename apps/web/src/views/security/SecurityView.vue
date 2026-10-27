<template>
  <div class="security-view">
    <div class="page-header">
      <h2>信息安全</h2>
      <div class="header-actions">
        <el-select v-model="projectFilter" placeholder="选择项目" clearable style="width: 200px" @change="onProjectChange">
          <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
        </el-select>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- ==================== Tab 1: TARA分析 ==================== -->
      <el-tab-pane label="TARA分析" name="tara">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showTaraDialog()">新建TARA分析</el-button>
          <el-select v-model="taraFilter.status" placeholder="状态" clearable style="width: 130px; margin-left: 12px" @change="loadTaraList">
            <el-option v-for="(v, k) in TARA_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
          <el-select v-model="taraFilter.riskLevel" placeholder="风险等级" clearable style="width: 130px; margin-left: 8px" @change="loadTaraList">
            <el-option v-for="(v, k) in TARA_RISK_LEVEL" :key="k" :label="v" :value="k" />
          </el-select>
        </div>

        <el-table :data="taraList" stripe v-loading="taraLoading" style="width: 100%">
          <el-table-column prop="taraNo" label="编号" width="170" />
          <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="assetType" label="资产类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ TARA_ASSET_TYPE[row.assetType as keyof typeof TARA_ASSET_TYPE] || row.assetType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="threatDescription" label="威胁描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="impactLevel" label="影响等级" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ TARA_IMPACT_LEVEL[row.impactLevel as keyof typeof TARA_IMPACT_LEVEL] || row.impactLevel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="likelihood" label="可能性" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ TARA_LIKELIHOOD[row.likelihood as keyof typeof TARA_LIKELIHOOD] || row.likelihood }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="riskLevel" label="风险等级" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="riskLevelTagType(row.riskLevel)" effect="dark">
                {{ TARA_RISK_LEVEL[row.riskLevel as keyof typeof TARA_RISK_LEVEL] || row.riskLevel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ TARA_STATUS[row.status as keyof typeof TARA_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="showTaraDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click.stop="deleteTara(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- TARA Dialog -->
        <el-dialog v-model="taraDialogVisible" :title="taraForm.id ? '编辑TARA分析' : '新建TARA分析'" width="650px" destroy-on-close>
          <el-form :model="taraForm" label-width="120px">
            <el-form-item label="所属项目" required>
              <el-select v-model="taraForm.projectId" placeholder="选择项目" style="width: 100%">
                <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="资产名称" required>
              <el-input v-model="taraForm.assetName" placeholder="资产名称" />
            </el-form-item>
            <el-form-item label="资产类型">
              <el-select v-model="taraForm.assetType" style="width: 100%">
                <el-option v-for="(v, k) in TARA_ASSET_TYPE" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="威胁描述">
              <el-input v-model="taraForm.threatDescription" type="textarea" :rows="3" placeholder="描述威胁场景" />
            </el-form-item>
            <el-form-item label="影响等级">
              <el-select v-model="taraForm.impactLevel" style="width: 100%">
                <el-option v-for="(v, k) in TARA_IMPACT_LEVEL" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="可能性">
              <el-select v-model="taraForm.likelihood" style="width: 100%">
                <el-option v-for="(v, k) in TARA_LIKELIHOOD" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="风险等级">
              <el-select v-model="taraForm.riskLevel" style="width: 100%">
                <el-option v-for="(v, k) in TARA_RISK_LEVEL" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="缓解措施">
              <el-input v-model="taraForm.mitigationMeasures" type="textarea" :rows="3" placeholder="缓解措施描述" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="taraForm.status" style="width: 100%">
                <el-option v-for="(v, k) in TARA_STATUS" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="taraDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveTara" :loading="saving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ==================== Tab 2: 网络安全需求 ==================== -->
      <el-tab-pane label="网络安全需求" name="cyberReq">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showCyberReqDialog()">新建需求</el-button>
          <el-select v-model="cyberReqFilter.status" placeholder="状态" clearable style="width: 130px; margin-left: 12px" @change="loadCyberReqList">
            <el-option v-for="(v, k) in CYBER_REQ_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
        </div>

        <el-table :data="cyberReqList" stripe v-loading="cyberReqLoading" style="width: 100%">
          <el-table-column prop="reqNo" label="编号" width="170" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="source" label="来源" width="150" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ CYBER_REQ_STATUS[row.status as keyof typeof CYBER_REQ_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="100" />
          <el-table-column prop="projectName" label="所属项目" width="160" show-overflow-tooltip />
          <el-table-column prop="verifiedAt" label="验证时间" width="170">
            <template #default="{ row }">
              {{ row.verifiedAt ? new Date(row.verifiedAt).toLocaleString() : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="showCyberReqDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click.stop="deleteCyberReq(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Cyber Requirement Dialog -->
        <el-dialog v-model="cyberReqDialogVisible" :title="cyberReqForm.id ? '编辑网络安全需求' : '新建网络安全需求'" width="650px" destroy-on-close>
          <el-form :model="cyberReqForm" label-width="120px">
            <el-form-item label="所属项目" required>
              <el-select v-model="cyberReqForm.projectId" placeholder="选择项目" style="width: 100%">
                <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="标题" required>
              <el-input v-model="cyberReqForm.title" placeholder="需求标题" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="cyberReqForm.description" type="textarea" :rows="3" placeholder="需求描述" />
            </el-form-item>
            <el-form-item label="来源">
              <el-input v-model="cyberReqForm.source" placeholder="需求来源（如 ISO/SAE 21434 条款）" />
            </el-form-item>
            <el-form-item label="优先级">
              <el-input v-model="cyberReqForm.priority" placeholder="优先级" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="cyberReqForm.status" style="width: 100%">
                <el-option v-for="(v, k) in CYBER_REQ_STATUS" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="cyberReqDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveCyberReq" :loading="saving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ==================== Tab 3: 漏洞管理 ==================== -->
      <el-tab-pane label="漏洞管理" name="vuln">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showVulnDialog()">新建漏洞</el-button>
          <el-select v-model="vulnFilter.status" placeholder="状态" clearable style="width: 130px; margin-left: 12px" @change="loadVulnList">
            <el-option v-for="(v, k) in VULN_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
          <el-select v-model="vulnFilter.severity" placeholder="严重度" clearable style="width: 130px; margin-left: 8px" @change="loadVulnList">
            <el-option v-for="(v, k) in VULN_SEVERITY" :key="k" :label="v" :value="k" />
          </el-select>
        </div>

        <el-table :data="vulnList" stripe v-loading="vulnLoading" style="width: 100%">
          <el-table-column prop="vulnNo" label="编号" width="170" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="severity" label="严重度" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="vulnSeverityTagType(row.severity)" effect="dark">
                {{ VULN_SEVERITY[row.severity as keyof typeof VULN_SEVERITY] || row.severity }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="cvssScore" label="CVSS评分" width="100" align="center">
            <template #default="{ row }">
              {{ row.cvssScore != null ? Number(row.cvssScore).toFixed(1) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ VULN_STATUS[row.status as keyof typeof VULN_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="projectName" label="所属项目" width="160" show-overflow-tooltip />
          <el-table-column prop="discoveredDate" label="发现日期" width="120">
            <template #default="{ row }">
              {{ row.discoveredDate ? new Date(row.discoveredDate).toLocaleDateString() : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="showVulnDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click.stop="deleteVuln(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Vulnerability Dialog -->
        <el-dialog v-model="vulnDialogVisible" :title="vulnForm.id ? '编辑漏洞' : '新建漏洞'" width="650px" destroy-on-close>
          <el-form :model="vulnForm" label-width="120px">
            <el-form-item label="所属项目" required>
              <el-select v-model="vulnForm.projectId" placeholder="选择项目" style="width: 100%">
                <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="标题" required>
              <el-input v-model="vulnForm.title" placeholder="漏洞标题" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="vulnForm.description" type="textarea" :rows="3" placeholder="漏洞详细描述" />
            </el-form-item>
            <el-form-item label="严重度">
              <el-select v-model="vulnForm.severity" style="width: 100%">
                <el-option v-for="(v, k) in VULN_SEVERITY" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="CVSS评分">
              <el-input-number v-model="vulnForm.cvssScore" :min="0" :max="10" :precision="1" :step="0.1" style="width: 100%" />
            </el-form-item>
            <el-form-item label="发现日期">
              <el-date-picker v-model="vulnForm.discoveredDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="vulnForm.status" style="width: 100%">
                <el-option v-for="(v, k) in VULN_STATUS" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="修复方案">
              <el-input v-model="vulnForm.remediation" type="textarea" :rows="3" placeholder="修复方案描述" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="vulnDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveVuln" :loading="saving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ==================== Tab 4: CSMS合规 ==================== -->
      <el-tab-pane label="CSMS合规" name="csms">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showCsmsDialog()">新建合规记录</el-button>
          <el-select v-model="csmsFilter.status" placeholder="状态" clearable style="width: 130px; margin-left: 12px" @change="loadCsmsList">
            <el-option v-for="(v, k) in CSMS_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
        </div>

        <el-table :data="csmsList" stripe v-loading="csmsLoading" style="width: 100%">
          <el-table-column prop="complianceNo" label="编号" width="170" />
          <el-table-column prop="projectName" label="所属项目" min-width="160" show-overflow-tooltip />
          <el-table-column prop="processArea" label="过程域" min-width="150" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ CSMS_STATUS[row.status as keyof typeof CSMS_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="complianceRate" label="合规率" width="100" align="center">
            <template #default="{ row }">
              <el-progress :percentage="row.complianceRate || 0" :stroke-width="14" :text-inside="true" />
            </template>
          </el-table-column>
          <el-table-column prop="lastAssessment" label="最近评估" width="170">
            <template #default="{ row }">
              {{ row.lastAssessment ? new Date(row.lastAssessment).toLocaleString() : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="showCsmsDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click.stop="deleteCsms(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- CSMS Dialog -->
        <el-dialog v-model="csmsDialogVisible" :title="csmsForm.id ? '编辑CSMS合规' : '新建CSMS合规'" width="650px" destroy-on-close>
          <el-form :model="csmsForm" label-width="120px">
            <el-form-item label="所属项目" required>
              <el-select v-model="csmsForm.projectId" placeholder="选择项目" style="width: 100%">
                <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="过程域" required>
              <el-input v-model="csmsForm.processArea" placeholder="过程域名称" />
            </el-form-item>
            <el-form-item label="合规率 (%)">
              <el-input-number v-model="csmsForm.complianceRate" :min="0" :max="100" :precision="1" style="width: 100%" />
            </el-form-item>
            <el-form-item label="证据">
              <el-input v-model="csmsForm.evidence" type="textarea" :rows="3" placeholder="合规证据描述" />
            </el-form-item>
            <el-form-item label="发现项">
              <el-input v-model="csmsForm.findings" type="textarea" :rows="3" placeholder="审计发现项" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="csmsForm.status" style="width: 100%">
                <el-option v-for="(v, k) in CSMS_STATUS" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="csmsDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveCsms" :loading="saving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ==================== Tab 5: 供应链安全 ==================== -->
      <el-tab-pane label="供应链安全" name="supplyChain">
        <div class="tab-toolbar">
          <el-button type="primary" @click="showSupplyChainDialog()">新建评估</el-button>
          <el-select v-model="supplyChainFilter.status" placeholder="状态" clearable style="width: 130px; margin-left: 12px" @change="loadSupplyChainList">
            <el-option v-for="(v, k) in SUPPLY_CHAIN_STATUS" :key="k" :label="v" :value="k" />
          </el-select>
        </div>

        <el-table :data="supplyChainList" stripe v-loading="supplyChainLoading" style="width: 100%">
          <el-table-column prop="assessmentNo" label="编号" width="170" />
          <el-table-column prop="supplierName" label="供应商" min-width="150" show-overflow-tooltip />
          <el-table-column prop="projectName" label="所属项目" min-width="160" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ SUPPLY_CHAIN_STATUS[row.status as keyof typeof SUPPLY_CHAIN_STATUS] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="riskLevel" label="风险等级" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="riskLevelTagType(row.riskLevel)">
                {{ TARA_RISK_LEVEL[row.riskLevel as keyof typeof TARA_RISK_LEVEL] || row.riskLevel || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assessmentDate" label="评估日期" width="120">
            <template #default="{ row }">
              {{ row.assessmentDate ? new Date(row.assessmentDate).toLocaleDateString() : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="showSupplyChainDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click.stop="deleteSupplyChain(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Supply Chain Dialog -->
        <el-dialog v-model="supplyChainDialogVisible" :title="supplyChainForm.id ? '编辑供应链评估' : '新建供应链评估'" width="650px" destroy-on-close>
          <el-form :model="supplyChainForm" label-width="120px">
            <el-form-item label="供应商名称" required>
              <el-input v-model="supplyChainForm.supplierName" placeholder="供应商名称" />
            </el-form-item>
            <el-form-item label="所属项目" required>
              <el-select v-model="supplyChainForm.projectId" placeholder="选择项目" style="width: 100%">
                <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="评估日期">
              <el-date-picker v-model="supplyChainForm.assessmentDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
            <el-form-item label="风险等级">
              <el-select v-model="supplyChainForm.riskLevel" style="width: 100%">
                <el-option v-for="(v, k) in TARA_RISK_LEVEL" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="发现项">
              <el-input v-model="supplyChainForm.findings" type="textarea" :rows="3" placeholder="评估发现项" />
            </el-form-item>
            <el-form-item label="建议措施">
              <el-input v-model="supplyChainForm.recommendations" type="textarea" :rows="3" placeholder="改进建议" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="supplyChainForm.status" style="width: 100%">
                <el-option v-for="(v, k) in SUPPLY_CHAIN_STATUS" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="supplyChainDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveSupplyChain" :loading="saving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { securityApi, projectApi } from '@/api'
import {
  TARA_RISK_LEVEL,
  TARA_IMPACT_LEVEL,
  TARA_LIKELIHOOD,
  TARA_ASSET_TYPE,
  TARA_STATUS,
  VULN_SEVERITY,
  VULN_STATUS,
  CYBER_REQ_STATUS,
  CSMS_STATUS,
  SUPPLY_CHAIN_STATUS,
} from '@apqp/shared/constants/security.constants'

// ==================== Common ====================
const projects = ref<any[]>([])
const projectFilter = ref<number | undefined>()
const activeTab = ref('tara')
const saving = ref(false)

async function loadProjects() {
  const res = await projectApi.list({ take: 200 })
  projects.value = res.data?.items || res.data || []
}

function onProjectChange() {
  if (activeTab.value === 'tara') loadTaraList()
  else if (activeTab.value === 'cyberReq') loadCyberReqList()
  else if (activeTab.value === 'vuln') loadVulnList()
  else if (activeTab.value === 'csms') loadCsmsList()
  else if (activeTab.value === 'supplyChain') loadSupplyChainList()
}

watch(activeTab, () => onProjectChange())

onMounted(() => {
  loadProjects()
})

// ==================== Tag helpers ====================
function riskLevelTagType(level: string) {
  if (level === 'high') return 'danger'
  if (level === 'medium') return 'warning'
  if (level === 'low') return 'success'
  return 'info'
}

function vulnSeverityTagType(severity: string) {
  if (severity === 'critical') return 'danger'
  if (severity === 'high') return 'danger'
  if (severity === 'medium') return 'warning'
  if (severity === 'low') return 'success'
  return 'info'
}

// ==================== Tab 1: TARA分析 ====================
const taraList = ref<any[]>([])
const taraLoading = ref(false)
const taraDialogVisible = ref(false)
const taraFilter = reactive<{ status?: string; riskLevel?: string }>({})
const taraForm = reactive<any>({
  id: null, projectId: null, assetName: '', assetType: 'data',
  threatDescription: '', impactLevel: 'medium', likelihood: 'medium',
  riskLevel: 'medium', mitigationMeasures: '', status: 'open',
})

async function loadTaraList() {
  taraLoading.value = true
  try {
    const params: any = {}
    if (projectFilter.value) params.projectId = projectFilter.value
    if (taraFilter.status) params.status = taraFilter.status
    if (taraFilter.riskLevel) params.riskLevel = taraFilter.riskLevel
    const res = await securityApi.tara.list(params)
    taraList.value = res.data?.items || res.data || []
  } finally { taraLoading.value = false }
}

function showTaraDialog(row?: any) {
  if (row) {
    Object.assign(taraForm, {
      id: row.id, projectId: row.projectId, assetName: row.assetName,
      assetType: row.assetType, threatDescription: row.threatDescription,
      impactLevel: row.impactLevel, likelihood: row.likelihood,
      riskLevel: row.riskLevel, mitigationMeasures: row.mitigationMeasures,
      status: row.status,
    })
  } else {
    Object.assign(taraForm, {
      id: null, projectId: projectFilter.value || null, assetName: '', assetType: 'data',
      threatDescription: '', impactLevel: 'medium', likelihood: 'medium',
      riskLevel: 'medium', mitigationMeasures: '', status: 'open',
    })
  }
  taraDialogVisible.value = true
}

async function saveTara() {
  if (!taraForm.projectId) return ElMessage.warning('请选择所属项目')
  if (!taraForm.assetName) return ElMessage.warning('请输入资产名称')
  saving.value = true
  try {
    if (taraForm.id) {
      await securityApi.tara.update(taraForm.id, { ...taraForm })
    } else {
      await securityApi.tara.create({ ...taraForm })
    }
    ElMessage.success('保存成功')
    taraDialogVisible.value = false
    loadTaraList()
  } finally { saving.value = false }
}

async function deleteTara(id: number) {
  await ElMessageBox.confirm('确认删除该TARA分析记录？', '提示', { type: 'warning' })
  await securityApi.tara.delete(id)
  ElMessage.success('删除成功')
  loadTaraList()
}

// ==================== Tab 2: 网络安全需求 ====================
const cyberReqList = ref<any[]>([])
const cyberReqLoading = ref(false)
const cyberReqDialogVisible = ref(false)
const cyberReqFilter = reactive<{ status?: string }>({})
const cyberReqForm = reactive<any>({
  id: null, projectId: null, title: '', description: '',
  source: '', priority: '', status: 'draft',
})

async function loadCyberReqList() {
  cyberReqLoading.value = true
  try {
    const params: any = {}
    if (projectFilter.value) params.projectId = projectFilter.value
    if (cyberReqFilter.status) params.status = cyberReqFilter.status
    const res = await securityApi.cyberRequirements.list(params)
    cyberReqList.value = res.data?.items || res.data || []
  } finally { cyberReqLoading.value = false }
}

function showCyberReqDialog(row?: any) {
  if (row) {
    Object.assign(cyberReqForm, {
      id: row.id, projectId: row.projectId, title: row.title,
      description: row.description, source: row.source,
      priority: row.priority, status: row.status,
    })
  } else {
    Object.assign(cyberReqForm, {
      id: null, projectId: projectFilter.value || null, title: '', description: '',
      source: '', priority: '', status: 'draft',
    })
  }
  cyberReqDialogVisible.value = true
}

async function saveCyberReq() {
  if (!cyberReqForm.projectId) return ElMessage.warning('请选择所属项目')
  if (!cyberReqForm.title) return ElMessage.warning('请输入标题')
  saving.value = true
  try {
    if (cyberReqForm.id) {
      await securityApi.cyberRequirements.update(cyberReqForm.id, { ...cyberReqForm })
    } else {
      await securityApi.cyberRequirements.create({ ...cyberReqForm })
    }
    ElMessage.success('保存成功')
    cyberReqDialogVisible.value = false
    loadCyberReqList()
  } finally { saving.value = false }
}

async function deleteCyberReq(id: number) {
  await ElMessageBox.confirm('确认删除该网络安全需求？', '提示', { type: 'warning' })
  await securityApi.cyberRequirements.delete(id)
  ElMessage.success('删除成功')
  loadCyberReqList()
}

// ==================== Tab 3: 漏洞管理 ====================
const vulnList = ref<any[]>([])
const vulnLoading = ref(false)
const vulnDialogVisible = ref(false)
const vulnFilter = reactive<{ status?: string; severity?: string }>({})
const vulnForm = reactive<any>({
  id: null, projectId: null, title: '', description: '',
  severity: 'medium', cvssScore: null, discoveredDate: '',
  status: 'open', remediation: '',
})

async function loadVulnList() {
  vulnLoading.value = true
  try {
    const params: any = {}
    if (projectFilter.value) params.projectId = projectFilter.value
    if (vulnFilter.status) params.status = vulnFilter.status
    if (vulnFilter.severity) params.severity = vulnFilter.severity
    const res = await securityApi.vulnerabilities.list(params)
    vulnList.value = res.data?.items || res.data || []
  } finally { vulnLoading.value = false }
}

function showVulnDialog(row?: any) {
  if (row) {
    Object.assign(vulnForm, {
      id: row.id, projectId: row.projectId, title: row.title,
      description: row.description, severity: row.severity,
      cvssScore: row.cvssScore != null ? Number(row.cvssScore) : null,
      discoveredDate: row.discoveredDate ? new Date(row.discoveredDate).toISOString().slice(0, 10) : '',
      status: row.status, remediation: row.remediation,
    })
  } else {
    Object.assign(vulnForm, {
      id: null, projectId: projectFilter.value || null, title: '', description: '',
      severity: 'medium', cvssScore: null, discoveredDate: '',
      status: 'open', remediation: '',
    })
  }
  vulnDialogVisible.value = true
}

async function saveVuln() {
  if (!vulnForm.projectId) return ElMessage.warning('请选择所属项目')
  if (!vulnForm.title) return ElMessage.warning('请输入标题')
  saving.value = true
  try {
    if (vulnForm.id) {
      await securityApi.vulnerabilities.update(vulnForm.id, { ...vulnForm })
    } else {
      await securityApi.vulnerabilities.create({ ...vulnForm })
    }
    ElMessage.success('保存成功')
    vulnDialogVisible.value = false
    loadVulnList()
  } finally { saving.value = false }
}

async function deleteVuln(id: number) {
  await ElMessageBox.confirm('确认删除该漏洞记录？', '提示', { type: 'warning' })
  await securityApi.vulnerabilities.delete(id)
  ElMessage.success('删除成功')
  loadVulnList()
}

// ==================== Tab 4: CSMS合规 ====================
const csmsList = ref<any[]>([])
const csmsLoading = ref(false)
const csmsDialogVisible = ref(false)
const csmsFilter = reactive<{ status?: string }>({})
const csmsForm = reactive<any>({
  id: null, projectId: null, processArea: '', complianceRate: 0,
  evidence: '', findings: '', status: 'not_started',
})

async function loadCsmsList() {
  csmsLoading.value = true
  try {
    const params: any = {}
    if (projectFilter.value) params.projectId = projectFilter.value
    if (csmsFilter.status) params.status = csmsFilter.status
    const res = await securityApi.csms.list(params)
    csmsList.value = res.data?.items || res.data || []
  } finally { csmsLoading.value = false }
}

function showCsmsDialog(row?: any) {
  if (row) {
    Object.assign(csmsForm, {
      id: row.id, projectId: row.projectId, processArea: row.processArea,
      complianceRate: row.complianceRate != null ? Number(row.complianceRate) : 0,
      evidence: row.evidence, findings: row.findings, status: row.status,
    })
  } else {
    Object.assign(csmsForm, {
      id: null, projectId: projectFilter.value || null, processArea: '', complianceRate: 0,
      evidence: '', findings: '', status: 'not_started',
    })
  }
  csmsDialogVisible.value = true
}

async function saveCsms() {
  if (!csmsForm.projectId) return ElMessage.warning('请选择所属项目')
  if (!csmsForm.processArea) return ElMessage.warning('请输入过程域')
  saving.value = true
  try {
    if (csmsForm.id) {
      await securityApi.csms.update(csmsForm.id, { ...csmsForm })
    } else {
      await securityApi.csms.create({ ...csmsForm })
    }
    ElMessage.success('保存成功')
    csmsDialogVisible.value = false
    loadCsmsList()
  } finally { saving.value = false }
}

async function deleteCsms(id: number) {
  await ElMessageBox.confirm('确认删除该CSMS合规记录？', '提示', { type: 'warning' })
  await securityApi.csms.delete(id)
  ElMessage.success('删除成功')
  loadCsmsList()
}

// ==================== Tab 5: 供应链安全 ====================
const supplyChainList = ref<any[]>([])
const supplyChainLoading = ref(false)
const supplyChainDialogVisible = ref(false)
const supplyChainFilter = reactive<{ status?: string }>({})
const supplyChainForm = reactive<any>({
  id: null, supplierName: '', projectId: null, assessmentDate: '',
  riskLevel: 'medium', findings: '', recommendations: '', status: 'pending',
})

async function loadSupplyChainList() {
  supplyChainLoading.value = true
  try {
    const params: any = {}
    if (projectFilter.value) params.projectId = projectFilter.value
    if (supplyChainFilter.status) params.status = supplyChainFilter.status
    const res = await securityApi.supplyChains.list(params)
    supplyChainList.value = res.data?.items || res.data || []
  } finally { supplyChainLoading.value = false }
}

function showSupplyChainDialog(row?: any) {
  if (row) {
    Object.assign(supplyChainForm, {
      id: row.id, supplierName: row.supplierName, projectId: row.projectId,
      assessmentDate: row.assessmentDate ? new Date(row.assessmentDate).toISOString().slice(0, 10) : '',
      riskLevel: row.riskLevel, findings: row.findings,
      recommendations: row.recommendations, status: row.status,
    })
  } else {
    Object.assign(supplyChainForm, {
      id: null, supplierName: '', projectId: projectFilter.value || null, assessmentDate: '',
      riskLevel: 'medium', findings: '', recommendations: '', status: 'pending',
    })
  }
  supplyChainDialogVisible.value = true
}

async function saveSupplyChain() {
  if (!supplyChainForm.projectId) return ElMessage.warning('请选择所属项目')
  if (!supplyChainForm.supplierName) return ElMessage.warning('请输入供应商名称')
  saving.value = true
  try {
    if (supplyChainForm.id) {
      await securityApi.supplyChains.update(supplyChainForm.id, { ...supplyChainForm })
    } else {
      await securityApi.supplyChains.create({ ...supplyChainForm })
    }
    ElMessage.success('保存成功')
    supplyChainDialogVisible.value = false
    loadSupplyChainList()
  } finally { saving.value = false }
}

async function deleteSupplyChain(id: number) {
  await ElMessageBox.confirm('确认删除该供应链评估记录？', '提示', { type: 'warning' })
  await securityApi.supplyChains.delete(id)
  ElMessage.success('删除成功')
  loadSupplyChainList()
}
</script>

<style scoped>
.security-view {
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
.tab-toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
</style>
