import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginView.vue'),
      meta: { hidden: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/portal/DashboardView.vue'),
          meta: { title: '工作台', icon: 'HomeFilled', group: 'portal' },
        },
        // ---- 系统管理 ----
        {
          path: 'system/users',
          name: 'UserList',
          component: () => import('@/views/system/UserList.vue'),
          meta: { title: '用户管理', icon: 'User', group: 'system' },
        },
        {
          path: 'system/roles',
          name: 'RoleList',
          component: () => import('@/views/system/RoleList.vue'),
          meta: { title: '角色管理', icon: 'Lock', group: 'system' },
        },
        {
          path: 'system/departments',
          name: 'DepartmentList',
          component: () => import('@/views/system/DepartmentList.vue'),
          meta: { title: '组织架构', icon: 'OfficeBuilding', group: 'system' },
        },
        {
          path: 'system/audit-logs',
          name: 'AuditLog',
          component: () => import('@/views/system/AuditLogView.vue'),
          meta: { title: '审计日志', icon: 'Document', group: 'system' },
        },
        {
          path: 'system/config',
          name: 'SystemConfig',
          component: () => import('@/views/system/SystemConfigView.vue'),
          meta: { title: '系统参数', icon: 'Setting', group: 'system' },
        },
        {
          path: 'system/project-tiers',
          name: 'ProjectTierConfig',
          component: () => import('@/views/system/ProjectTierConfig.vue'),
          meta: { title: '项目分级配置', icon: 'Rank', group: 'system' },
        },
        // ---- 主数据 ----
        {
          path: 'master-data/customers',
          name: 'CustomerList',
          component: () => import('@/views/master-data/CustomerList.vue'),
          meta: { title: '客户管理', icon: 'Avatar', group: 'master-data' },
        },
        {
          path: 'master-data/products',
          name: 'ProductList',
          component: () => import('@/views/master-data/ProductList.vue'),
          meta: { title: '产品管理', icon: 'Goods', group: 'master-data' },
        },
        {
          path: 'master-data/suppliers',
          name: 'SupplierList',
          component: () => import('@/views/master-data/SupplierList.vue'),
          meta: { title: '供应商管理', icon: 'Truck', group: 'master-data' },
        },
        // ---- 项目管理 ----
        {
          path: 'projects',
          name: 'ProjectList',
          component: () => import('@/views/project/ProjectList.vue'),
          meta: { title: '项目列表', icon: 'Folder', group: 'project' },
        },
        {
          path: 'projects/create',
          name: 'ProjectCreate',
          component: () => import('@/views/project/ProjectCreate.vue'),
          meta: { title: '创建项目', hidden: true },
        },
        {
          path: 'projects/:id',
          name: 'ProjectDetail',
          component: () => import('@/views/project/ProjectDetail.vue'),
          meta: { title: '项目详情', hidden: true },
        },
        {
          path: 'projects/:projectId/schedule',
          name: 'ProjectSchedule',
          component: () => import('@/views/project/ScheduleView.vue'),
          meta: { title: '进度计划', hidden: true },
        },
        {
          path: 'projects/:projectId/risks',
          name: 'ProjectRisks',
          component: () => import('@/views/project/RiskView.vue'),
          meta: { title: '风险管理', hidden: true },
        },
        {
          path: 'projects/:projectId/milestones',
          name: 'ProjectMilestones',
          component: () => import('@/views/project/MilestoneView.vue'),
          meta: { title: '里程碑管理', hidden: true },
        },
        {
          path: 'projects/:projectId/requirements',
          name: 'ProjectRequirements',
          component: () => import('@/views/requirements/RequirementView.vue'),
          meta: { title: 'A-SPICE 需求管理', hidden: true },
        },
        // ---- 工作流 ----
        {
          path: 'workflow/definitions',
          name: 'WorkflowDefinitions',
          component: () => import('@/views/workflow/WorkflowDefinitionView.vue'),
          meta: { title: '流程定义', icon: 'SetUp', group: 'workflow' },
        },
        {
          path: 'workflow/approval-center',
          name: 'ApprovalCenter',
          component: () => import('@/views/workflow/ApprovalCenter.vue'),
          meta: { title: '审批中心', icon: 'Stamp', group: 'workflow' },
        },
        {
          path: 'workflow/my-initiated',
          name: 'MyInitiated',
          component: () => import('@/views/workflow/MyInitiated.vue'),
          meta: { title: '我发起的', icon: 'Promotion', group: 'workflow' },
        },
        {
          path: 'workflow/instances/:instanceId',
          name: 'WorkflowInstance',
          component: () => import('@/views/workflow/WorkflowInstanceView.vue'),
          meta: { title: '流程跟踪', hidden: true },
        },
        // ---- 文档管理 ----
        {
          path: 'documents',
          name: 'DocumentList',
          component: () => import('@/views/document/DocumentView.vue'),
          meta: { title: '文档管理', icon: 'Document', group: 'document' },
        },
        // ---- 预立项管理 ----
        {
          path: 'pre-project',
          name: 'PreProjectList',
          component: () => import('@/views/pre-project/PreProjectView.vue'),
          meta: { title: '预立项管理', icon: 'TrendCharts', group: 'pre-project' },
        },
        // ---- Gate 评审 ----
        {
          path: 'gate-reviews',
          name: 'GateReviewList',
          component: () => import('@/views/gate-review/GateReviewView.vue'),
          meta: { title: 'Gate 评审', icon: 'Checked', group: 'gate-review' },
        },
        // ---- OTS 样件管理 ----
        {
          path: 'ots',
          name: 'OtsList',
          component: () => import('@/views/ots/OtsView.vue'),
          meta: { title: 'OTS 样件管理', icon: 'Box', group: 'ots-ppap' },
        },
        // ---- PPAP 提报管理 ----
        {
          path: 'ppap',
          name: 'PpapList',
          component: () => import('@/views/ppap/PpapView.vue'),
          meta: { title: 'PPAP 提报管理', icon: 'FolderOpened', group: 'ots-ppap' },
        },
        // ---- 成本管理 ----
        {
          path: 'cost',
          name: 'CostManagement',
          component: () => import('@/views/cost/CostView.vue'),
          meta: { title: '成本管理', icon: 'Money', group: 'cost' },
        },
        // ---- 采购管理 ----
        {
          path: 'procurement',
          name: 'Procurement',
          component: () => import('@/views/procurement/ProcurementView.vue'),
          meta: { title: '采购管理', icon: 'ShoppingCart', group: 'procurement' },
        },
        // ---- 质量管理 ----
        {
          path: 'quality',
          name: 'Quality',
          component: () => import('@/views/quality/QualityView.vue'),
          meta: { title: '质量管理', icon: 'CircleCheck', group: 'quality' },
        },
        // ---- 质量工程 ----
        {
          path: 'quality-engineering',
          name: 'QualityEngineering',
          component: () => import('@/views/quality/QualityEngineeringView.vue'),
          meta: { title: '质量工程', icon: 'DataAnalysis', group: 'quality' },
        },
        // ---- 变更管理 ----
        {
          path: 'change-management',
          name: 'ChangeManagement',
          component: () => import('@/views/change/ChangeManagementView.vue'),
          meta: { title: '工程变更管理', icon: 'Switch', group: 'change' },
        },
        // ---- 功能安全 ----
        {
          path: 'functional-safety',
          name: 'FunctionalSafety',
          component: () => import('@/views/safety/FunctionalSafetyView.vue'),
          meta: { title: '功能安全', icon: 'Finished', group: 'safety' },
        },
        // ---- 问题管理 ----
        {
          path: 'issues',
          name: 'IssueManagement',
          component: () => import('@/views/issue/IssueView.vue'),
          meta: { title: '问题管理', icon: 'Warning', group: 'issue' },
        },
        // ---- A-SPICE 需求管理 ----
        {
          path: 'aspice-requirements',
          name: 'AspiceRequirements',
          component: () => import('@/views/aspice/AspiceRequirementView.vue'),
          meta: { title: 'A-SPICE 需求管理', icon: 'Notebook', group: 'aspice' },
        },
        // ---- 信息安全 ----
        {
          path: 'security',
          name: 'Security',
          component: () => import('@/views/security/SecurityView.vue'),
          meta: { title: '信息安全', icon: 'Lock', group: 'security' },
        },
        // ---- 结项与移交 ----
        {
          path: 'closures',
          name: 'Closure',
          component: () => import('@/views/closure/ClosureView.vue'),
          meta: { title: '结项与移交', icon: 'CircleCheckFilled', group: 'closure' },
        },
        // ---- 供方协同 ----
        {
          path: 'supplier-collab',
          name: 'SupplierCollab',
          component: () => import('@/views/supplier/SupplierCollabView.vue'),
          meta: { title: '供方协同', icon: 'Van', group: 'supplier' },
        },
        // ---- 知识库 ----
        {
          path: 'knowledge',
          name: 'Knowledge',
          component: () => import('@/views/knowledge/KnowledgeView.vue'),
          meta: { title: '知识库', icon: 'Collection', group: 'knowledge' },
        },
        // ---- 数据分析 ----
        {
          path: 'analytics',
          name: 'Analytics',
          component: () => import('@/views/analytics/AnalyticsView.vue'),
          meta: { title: '数据分析', icon: 'PieChart', group: 'analytics' },
        },
        // ---- 安全审计 ----
        {
          path: 'security-audits',
          name: 'SecurityAudit',
          component: () => import('@/views/audit/SecurityAuditView.vue'),
          meta: { title: '安全审计', icon: 'View', group: 'audit' },
        },
        // ---- 项目看板 ----
        {
          path: 'project-kanban',
          name: 'ProjectKanban',
          component: () => import('@/views/project/KanbanView.vue'),
          meta: { title: '项目看板', icon: 'Grid', group: 'project' },
        },
        // ---- 进度报告 ----
        {
          path: 'progress-reports',
          name: 'ProgressReports',
          component: () => import('@/views/project/ProgressReportView.vue'),
          meta: { title: '进度报告', icon: 'Ticket', group: 'project' },
        },
        // ---- 通知 ----
        {
          path: 'my-tasks',
          name: 'MyTasks',
          component: () => import('@/views/portal/MyTasksView.vue'),
          meta: { title: '我的任务', icon: 'List', group: 'portal' },
        },
        {
          path: 'notifications',
          name: 'NotificationCenter',
          component: () => import('@/views/portal/NotificationCenter.vue'),
          meta: { title: '消息中心', icon: 'Bell', group: 'portal' },
        },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.hidden !== true && to.path !== '/login') {
    if (!authStore.isLoggedIn) {
      next('/login')
      return
    }
  }

  if (to.path === '/login' && authStore.isLoggedIn) {
    next('/')
    return
  }

  next()
})

export default router
