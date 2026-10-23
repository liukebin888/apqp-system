import request from './request'

export const authApi = {
  login: (data: { username: string; password: string }) => request.post('/auth/login', data),
  refresh: (refreshToken: string) => request.post('/auth/refresh', { refreshToken }),
  getProfile: () => request.get('/auth/profile'),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request.put('/auth/password', data),
}

export const userApi = {
  list: (params: any) => request.get('/users', { params }),
  get: (id: number) => request.get(`/users/${id}`),
  create: (data: any) => request.post('/users', data),
  update: (id: number, data: any) => request.put(`/users/${id}`, data),
  delete: (id: number) => request.delete(`/users/${id}`),
  resetPassword: (id: number, newPassword: string) =>
    request.put(`/users/${id}/reset-password`, { newPassword }),
}

export const departmentApi = {
  tree: () => request.get('/departments/tree'),
  list: () => request.get('/departments'),
  create: (data: any) => request.post('/departments', data),
  update: (id: number, data: any) => request.put(`/departments/${id}`, data),
  delete: (id: number) => request.delete(`/departments/${id}`),
}

export const roleApi = {
  list: () => request.get('/roles'),
  get: (id: number) => request.get(`/roles/${id}`),
  permissions: () => request.get('/roles/permissions'),
  create: (data: any) => request.post('/roles', data),
  update: (id: number, data: any) => request.put(`/roles/${id}`, data),
  delete: (id: number) => request.delete(`/roles/${id}`),
}

export const masterDataApi = {
  customers: {
    list: (params: any) => request.get('/master-data/customers', { params }),
    create: (data: any) => request.post('/master-data/customers', data),
    update: (id: number, data: any) => request.put(`/master-data/customers/${id}`, data),
    delete: (id: number) => request.delete(`/master-data/customers/${id}`),
  },
  products: {
    list: (params: any) => request.get('/master-data/products', { params }),
    create: (data: any) => request.post('/master-data/products', data),
    update: (id: number, data: any) => request.put(`/master-data/products/${id}`, data),
    delete: (id: number) => request.delete(`/master-data/products/${id}`),
  },
  suppliers: {
    list: (params: any) => request.get('/master-data/suppliers', { params }),
    create: (data: any) => request.post('/master-data/suppliers', data),
    update: (id: number, data: any) => request.put(`/master-data/suppliers/${id}`, data),
    delete: (id: number) => request.delete(`/master-data/suppliers/${id}`),
  },
  productCategories: {
    tree: () => request.get('/master-data/product-categories'),
  },
}

export const projectApi = {
  list: (params: any) => request.get('/projects', { params }),
  get: (id: number) => request.get(`/projects/${id}`),
  stats: () => request.get('/projects/stats'),
  create: (data: any) => request.post('/projects', data),
  update: (id: number, data: any) => request.put(`/projects/${id}`, data),
  updateTeam: (id: number, members: any[]) => request.put(`/projects/${id}/team`, { members }),
}

export const scheduleApi = {
  get: (projectId: number) => request.get(`/projects/${projectId}/schedule`),
  create: (projectId: number, data: any) => request.post(`/projects/${projectId}/schedule`, data),
  updateTask: (projectId: number, taskId: number, data: any) =>
    request.put(`/projects/${projectId}/schedule/tasks/${taskId}`, data),
  addDependency: (projectId: number, data: any) =>
    request.post(`/projects/${projectId}/schedule/tasks/dependencies`, data),
  removeDependency: (projectId: number, id: number) =>
    request.delete(`/projects/${projectId}/schedule/tasks/dependencies/${id}`),
}

export const riskApi = {
  list: (projectId: number, params: any) =>
    request.get(`/projects/${projectId}/risks`, { params }),
  matrix: (projectId: number) => request.get(`/projects/${projectId}/risks/matrix`),
  create: (projectId: number, data: any) => request.post(`/projects/${projectId}/risks`, data),
  update: (projectId: number, id: number, data: any) =>
    request.put(`/projects/${projectId}/risks/${id}`, data),
  addResponse: (projectId: number, riskId: number, data: any) =>
    request.post(`/projects/${projectId}/risks/${riskId}/responses`, data),
  updateResponse: (projectId: number, responseId: number, data: any) =>
    request.put(`/projects/${projectId}/risks/responses/${responseId}`, data),
}

export const workflowApi = {
  definitions: {
    list: (params?: any) => request.get('/workflows/definitions', { params }),
    get: (id: number) => request.get(`/workflows/definitions/${id}`),
    create: (data: any) => request.post('/workflows/definitions', data),
    update: (id: number, data: any) => request.put(`/workflows/definitions/${id}`, data),
    activate: (id: number) => request.put(`/workflows/definitions/${id}/activate`),
    deprecate: (id: number) => request.put(`/workflows/definitions/${id}/deprecate`),
  },
  instances: {
    start: (data: any) => request.post('/workflows/instances/start', data),
    approve: (nodeInstanceId: number, opinion?: string) =>
      request.post(`/workflows/instances/${nodeInstanceId}/approve`, { opinion }),
    reject: (nodeInstanceId: number, opinion?: string) =>
      request.post(`/workflows/instances/${nodeInstanceId}/reject`, { opinion }),
    rollback: (instanceId: number, targetNodeKey: string, reason?: string) =>
      request.post(`/workflows/instances/${instanceId}/rollback`, { targetNodeKey, reason }),
    myPending: () => request.get('/workflows/instances/my-pending'),
    myInitiated: (params?: any) => request.get('/workflows/instances/my-initiated', { params }),
    detail: (id: number) => request.get(`/workflows/instances/${id}`),
  },
}

export const notificationApi = {
  list: (params?: any) => request.get('/notifications', { params }),
  unreadCount: () => request.get('/notifications/unread-count'),
  markRead: (ids: number[]) => request.put('/notifications/read', { ids }),
  markAllRead: () => request.put('/notifications/read-all'),
}

export const auditLogApi = {
  list: (params: any) => request.get('/audit-logs', { params }),
}
