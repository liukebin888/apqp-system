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
        // ---- 工作流 ----
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
        // ---- 通知 ----
        {
          path: 'notifications',
          name: 'NotificationCenter',
          component: () => import('@/views/portal/NotificationCenter.vue'),
          meta: { title: '通知中心', icon: 'Bell', hidden: true },
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
