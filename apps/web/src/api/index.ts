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

export const milestoneApi = {
  list: (projectId: number) => request.get(`/projects/${projectId}/milestones`),
  create: (projectId: number, data: any) => request.post(`/projects/${projectId}/milestones`, data),
  update: (projectId: number, id: number, data: any) => request.put(`/projects/${projectId}/milestones/${id}`, data),
  delete: (projectId: number, id: number) => request.delete(`/projects/${projectId}/milestones/${id}`),
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

export const documentApi = {
  list: (params?: any) => request.get('/documents', { params }),
  get: (id: number) => request.get(`/documents/${id}`),
  create: (data: any) => request.post('/documents', data),
  update: (id: number, data: any) => request.put(`/documents/${id}`, data),
  delete: (id: number) => request.delete(`/documents/${id}`),
  upload: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`/documents/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  approve: (id: number, data?: any) => request.put(`/documents/${id}/approve`, data),
  release: (id: number) => request.put(`/documents/${id}/release`),
  setPermissions: (id: number, permissions: any[]) => request.put(`/documents/${id}/permissions`, { permissions }),
}

export const requirementApi = {
  list: (projectId: number, params: any) =>
    request.get(`/projects/${projectId}/requirements`, { params }),
  get: (projectId: number, id: number) =>
    request.get(`/projects/${projectId}/requirements/${id}`),
  create: (projectId: number, data: any) =>
    request.post(`/projects/${projectId}/requirements`, data),
  update: (projectId: number, id: number, data: any) =>
    request.put(`/projects/${projectId}/requirements/${id}`, data),
  delete: (projectId: number, id: number) =>
    request.delete(`/projects/${projectId}/requirements/${id}`),
  traceMatrix: (projectId: number) =>
    request.get(`/projects/${projectId}/requirements/trace-matrix`),
  coverage: (projectId: number) =>
    request.get(`/projects/${projectId}/requirements/coverage`),
  createTraceLink: (projectId: number, data: any) =>
    request.post(`/projects/${projectId}/requirements/trace-links`, data),
  deleteTraceLink: (projectId: number, linkId: number) =>
    request.delete(`/projects/${projectId}/requirements/trace-links/${linkId}`),
  baselines: (projectId: number) =>
    request.get(`/projects/${projectId}/requirements/baselines/list`),
  createBaseline: (projectId: number, data: any) =>
    request.post(`/projects/${projectId}/requirements/baselines`, data),
  updateBaselineStatus: (projectId: number, id: number, status: string) =>
    request.put(`/projects/${projectId}/requirements/baselines/${id}/status`, { status }),
  changeRequests: (projectId: number, params: any) =>
    request.get(`/projects/${projectId}/requirements/change-requests/list`, { params }),
  createChangeRequest: (projectId: number, data: any) =>
    request.post(`/projects/${projectId}/requirements/change-requests`, data),
  updateChangeRequestStatus: (projectId: number, id: number, status: string) =>
    request.put(`/projects/${projectId}/requirements/change-requests/${id}/status`, { status }),
}

export const preProjectApi = {
  rfqs: {
    list: (params?: any) => request.get('/pre-project/rfqs', { params }),
    get: (id: number) => request.get(`/pre-project/rfqs/${id}`),
    create: (data: any) => request.post('/pre-project/rfqs', data),
    update: (id: number, data: any) => request.put(`/pre-project/rfqs/${id}`, data),
    delete: (id: number) => request.delete(`/pre-project/rfqs/${id}`),
    updateStatus: (id: number, status: string) => request.put(`/pre-project/rfqs/${id}/status`, { status }),
  },
  quotations: {
    create: (rfqId: number, data: any) => request.post(`/pre-project/rfqs/${rfqId}/quotations`, data),
    update: (id: number, data: any) => request.put(`/pre-project/quotations/${id}`, data),
  },
  proposals: {
    create: (rfqId: number, data: any) => request.post(`/pre-project/rfqs/${rfqId}/proposals`, data),
    approve: (id: number) => request.put(`/pre-project/proposals/${id}/approve`),
  },
  feasibility: {
    createOrUpdate: (rfqId: number, data: any) => request.post(`/pre-project/rfqs/${rfqId}/feasibility`, data),
  },
  nominations: {
    create: (rfqId: number, data: any) => request.post(`/pre-project/rfqs/${rfqId}/nominations`, data),
  },
}

export const gateReviewApi = {
  list: (params?: any) => request.get('/gate-reviews', { params }),
  get: (id: number) => request.get(`/gate-reviews/${id}`),
  create: (data: any) => request.post('/gate-reviews', data),
  update: (id: number, data: any) => request.put(`/gate-reviews/${id}`, data),
  delete: (id: number) => request.delete(`/gate-reviews/${id}`),
  addItem: (id: number, data: any) => request.post(`/gate-reviews/${id}/items`, data),
  updateItem: (itemId: number, data: any) => request.put(`/gate-reviews/items/${itemId}`, data),
  deleteItem: (itemId: number) => request.delete(`/gate-reviews/items/${itemId}`),
  addParticipant: (id: number, data: any) => request.post(`/gate-reviews/${id}/participants`, data),
  updateParticipant: (participantId: number, data: any) => request.put(`/gate-reviews/participants/${participantId}`, data),
  deleteParticipant: (participantId: number) => request.delete(`/gate-reviews/participants/${participantId}`),
  complete: (id: number, data: any) => request.put(`/gate-reviews/${id}/complete`, data),
  template: (gateType: string) => request.get(`/gate-reviews/template/${gateType}`),
}

export const otsApi = {
  samples: {
    list: (params?: any) => request.get('/ots/samples', { params }),
    get: (id: number) => request.get(`/ots/samples/${id}`),
    create: (data: any) => request.post('/ots/samples', data),
    update: (id: number, data: any) => request.put(`/ots/samples/${id}`, data),
    delete: (id: number) => request.delete(`/ots/samples/${id}`),
    updateStatus: (id: number, status: string) => request.put(`/ots/samples/${id}/status`, { status }),
  },
  reports: {
    create: (sampleId: number, data: any) => request.post(`/ots/samples/${sampleId}/reports`, data),
    update: (id: number, data: any) => request.put(`/ots/reports/${id}`, data),
    delete: (id: number) => request.delete(`/ots/reports/${id}`),
  },
  testRecords: {
    create: (sampleId: number, data: any) => request.post(`/ots/samples/${sampleId}/test-records`, data),
    update: (id: number, data: any) => request.put(`/ots/test-records/${id}`, data),
    delete: (id: number) => request.delete(`/ots/test-records/${id}`),
  },
  approvals: {
    create: (sampleId: number, data: any) => request.post(`/ots/samples/${sampleId}/approvals`, data),
    update: (id: number, data: any) => request.put(`/ots/approvals/${id}`, data),
  },
}

export const ppapApi = {
  packages: {
    list: (params?: any) => request.get('/ppap/packages', { params }),
    get: (id: number) => request.get(`/ppap/packages/${id}`),
    create: (data: any) => request.post('/ppap/packages', data),
    update: (id: number, data: any) => request.put(`/ppap/packages/${id}`, data),
    delete: (id: number) => request.delete(`/ppap/packages/${id}`),
    updateStatus: (id: number, status: string) => request.put(`/ppap/packages/${id}/status`, { status }),
  },
  items: {
    create: (packageId: number, data: any) => request.post(`/ppap/packages/${packageId}/items`, data),
    update: (id: number, data: any) => request.put(`/ppap/items/${id}`, data),
    delete: (id: number) => request.delete(`/ppap/items/${id}`),
    initDefault: (packageId: number) => request.post(`/ppap/packages/${packageId}/init-items`),
  },
  submissions: {
    create: (packageId: number, data: any) => request.post(`/ppap/packages/${packageId}/submissions`, data),
    review: (id: number, data: any) => request.put(`/ppap/submissions/${id}/review`, data),
  },
}

export const costApi = {
  estimates: {
    list: (params?: any) => request.get('/cost/estimates', { params }),
    get: (id: number) => request.get(`/cost/estimates/${id}`),
    create: (data: any) => request.post('/cost/estimates', data),
    update: (id: number, data: any) => request.put(`/cost/estimates/${id}`, data),
    delete: (id: number) => request.delete(`/cost/estimates/${id}`),
    calculate: (id: number) => request.post(`/cost/estimates/${id}/calculate`),
    submit: (id: number) => request.put(`/cost/estimates/${id}/submit`),
    approve: (id: number) => request.put(`/cost/estimates/${id}/approve`),
    reject: (id: number) => request.put(`/cost/estimates/${id}/reject`),
    publish: (id: number) => request.put(`/cost/estimates/${id}/publish`),
  },
  estimateItems: {
    create: (estimateId: number, data: any) => request.post(`/cost/estimates/${estimateId}/items`, data),
    update: (id: number, data: any) => request.put(`/cost/items/${id}`, data),
    delete: (id: number) => request.delete(`/cost/items/${id}`),
    batchUpdate: (estimateId: number, items: any[]) => request.put(`/cost/estimates/${estimateId}/items/batch`, { items }),
  },
  budgets: {
    list: (params?: any) => request.get('/cost/budgets', { params }),
    get: (id: number) => request.get(`/cost/budgets/${id}`),
    create: (data: any) => request.post('/cost/budgets', data),
    update: (id: number, data: any) => request.put(`/cost/budgets/${id}`, data),
    delete: (id: number) => request.delete(`/cost/budgets/${id}`),
  },
  adjustments: {
    list: (params?: any) => request.get('/cost/adjustments', { params }),
    create: (data: any) => request.post('/cost/adjustments', data),
    approve: (id: number) => request.put(`/cost/adjustments/${id}/approve`),
    reject: (id: number) => request.put(`/cost/adjustments/${id}/reject`),
  },
  entries: {
    list: (params?: any) => request.get('/cost/entries', { params }),
    create: (data: any) => request.post('/cost/entries', data),
    update: (id: number, data: any) => request.put(`/cost/entries/${id}`, data),
    delete: (id: number) => request.delete(`/cost/entries/${id}`),
    batchImport: (entries: any[]) => request.post('/cost/entries/batch', { entries }),
  },
  variance: (projectId: number) => request.get(`/cost/variance/${projectId}`),
  tracking: (projectId: number) => request.get(`/cost/tracking/${projectId}`),
  analysis: {
    project: (projectId: number) => request.get(`/cost/analysis/project/${projectId}`),
    department: (params?: any) => request.get('/cost/analysis/department', { params }),
    company: (params?: any) => request.get('/cost/analysis/company', { params }),
    profitability: (projectId: number) => request.get(`/cost/analysis/profitability/${projectId}`),
  },
  alerts: {
    list: (params?: any) => request.get('/cost/alerts', { params }),
    resolve: (id: number) => request.put(`/cost/alerts/${id}/resolve`),
    check: (projectId: number) => request.post(`/cost/alerts/check/${projectId}`),
  },
}

export const procurementApi = {
  requests: {
    list: (params?: any) => request.get('/procurement/requests', { params }),
    get: (id: number) => request.get(`/procurement/requests/${id}`),
    create: (data: any) => request.post('/procurement/requests', data),
    update: (id: number, data: any) => request.put(`/procurement/requests/${id}`, data),
    delete: (id: number) => request.delete(`/procurement/requests/${id}`),
    submit: (id: number) => request.post(`/procurement/requests/${id}/submit`),
    approve: (id: number) => request.put(`/procurement/requests/${id}/approve`),
    reject: (id: number) => request.put(`/procurement/requests/${id}/reject`),
    cancel: (id: number) => request.put(`/procurement/requests/${id}/cancel`),
  },
  requestItems: {
    create: (requestId: number, data: any) => request.post(`/procurement/requests/${requestId}/items`, data),
    update: (id: number, data: any) => request.put(`/procurement/request-items/${id}`, data),
    delete: (id: number) => request.delete(`/procurement/request-items/${id}`),
  },
  orders: {
    list: (params?: any) => request.get('/procurement/orders', { params }),
    get: (id: number) => request.get(`/procurement/orders/${id}`),
    create: (data: any) => request.post('/procurement/orders', data),
    createFromRequest: (requestId: number, data: any) => request.post(`/procurement/orders/from-request/${requestId}`, data),
    update: (id: number, data: any) => request.put(`/procurement/orders/${id}`, data),
    delete: (id: number) => request.delete(`/procurement/orders/${id}`),
    confirm: (id: number) => request.put(`/procurement/orders/${id}/confirm`),
    receive: (id: number, items: any[]) => request.post(`/procurement/orders/${id}/receive`, { items }),
    close: (id: number) => request.put(`/procurement/orders/${id}/close`),
    cancel: (id: number) => request.put(`/procurement/orders/${id}/cancel`),
  },
  orderItems: {
    create: (orderId: number, data: any) => request.post(`/procurement/orders/${orderId}/items`, data),
    update: (id: number, data: any) => request.put(`/procurement/order-items/${id}`, data),
    delete: (id: number) => request.delete(`/procurement/order-items/${id}`),
  },
  suppliers: {
    list: (params?: any) => request.get('/procurement/suppliers', { params }),
    get: (id: number) => request.get(`/procurement/suppliers/${id}`),
    admit: (id: number, data: any) => request.post(`/procurement/suppliers/${id}/admit`, data),
    blacklist: (id: number, reason?: string) => request.put(`/procurement/suppliers/${id}/blacklist`, { reason }),
    restore: (id: number) => request.put(`/procurement/suppliers/${id}/restore`),
  },
  evaluations: {
    list: (params?: any) => request.get('/procurement/evaluations', { params }),
    get: (id: number) => request.get(`/procurement/evaluations/${id}`),
    create: (data: any) => request.post('/procurement/evaluations', data),
  },
  audits: {
    list: (params?: any) => request.get('/procurement/audits', { params }),
    get: (id: number) => request.get(`/procurement/audits/${id}`),
    create: (data: any) => request.post('/procurement/audits', data),
    update: (id: number, data: any) => request.put(`/procurement/audits/${id}`, data),
  },
  stats: {
    overview: () => request.get('/procurement/stats/overview'),
    supplierPerformance: () => request.get('/procurement/stats/supplier-performance'),
  },
}

export const qualityApi = {
  problems: {
    list: (params?: any) => request.get('/quality/problems', { params }),
    get: (id: number) => request.get(`/quality/problems/${id}`),
    create: (data: any) => request.post('/quality/problems', data),
    update: (id: number, data: any) => request.put(`/quality/problems/${id}`, data),
    delete: (id: number) => request.delete(`/quality/problems/${id}`),
    assign: (id: number, ownerId: number) => request.put(`/quality/problems/${id}/assign`, { ownerId }),
    close: (id: number) => request.put(`/quality/problems/${id}/close`),
    escalate: (id: number) => request.put(`/quality/problems/${id}/escalate`),
    updateStatus: (id: number, status: string) => request.put(`/quality/problems/${id}/status`, { status }),
  },
  eightD: {
    list: (params?: any) => request.get('/quality/8d-reports', { params }),
    get: (id: number) => request.get(`/quality/8d-reports/${id}`),
    create: (problemId: number) => request.post(`/quality/problems/${problemId}/8d`),
    updateStep: (id: number, step: string, data: any) => request.put(`/quality/8d-reports/${id}/${step}`, data),
  },
  nonconformances: {
    list: (params?: any) => request.get('/quality/nonconformances', { params }),
    get: (id: number) => request.get(`/quality/nonconformances/${id}`),
    create: (data: any) => request.post('/quality/nonconformances', data),
    update: (id: number, data: any) => request.put(`/quality/nonconformances/${id}`, data),
    delete: (id: number) => request.delete(`/quality/nonconformances/${id}`),
    dispose: (id: number, data: any) => request.put(`/quality/nonconformances/${id}/dispose`, data),
  },
  capas: {
    list: (params?: any) => request.get('/quality/capas', { params }),
    get: (id: number) => request.get(`/quality/capas/${id}`),
    create: (data: any) => request.post('/quality/capas', data),
    update: (id: number, data: any) => request.put(`/quality/capas/${id}`, data),
    delete: (id: number) => request.delete(`/quality/capas/${id}`),
    verify: (id: number, effectivenessResult: string) => request.put(`/quality/capas/${id}/verify`, { effectivenessResult }),
    close: (id: number) => request.put(`/quality/capas/${id}/close`),
  },
  inspections: {
    list: (params?: any) => request.get('/quality/inspections', { params }),
    get: (id: number) => request.get(`/quality/inspections/${id}`),
    create: (data: any) => request.post('/quality/inspections', data),
    update: (id: number, data: any) => request.put(`/quality/inspections/${id}`, data),
    delete: (id: number) => request.delete(`/quality/inspections/${id}`),
  },
  stats: {
    overview: () => request.get('/quality/stats/overview'),
    problemAnalysis: (params?: any) => request.get('/quality/stats/problem-analysis', { params }),
  },
}

export const fmeaApi = {
  dfmeas: {
    list: (params?: any) => request.get('/fmea/dfmeas', { params }),
    get: (id: number) => request.get(`/fmea/dfmeas/${id}`),
    create: (data: any) => request.post('/fmea/dfmeas', data),
    update: (id: number, data: any) => request.put(`/fmea/dfmeas/${id}`, data),
    delete: (id: number) => request.delete(`/fmea/dfmeas/${id}`),
    approve: (id: number) => request.put(`/fmea/dfmeas/${id}/approve`),
    copy: (id: number) => request.post(`/fmea/dfmeas/${id}/copy`),
    createItem: (dfmeaId: number, data: any) => request.post(`/fmea/dfmeas/${dfmeaId}/items`, data),
    updateItem: (id: number, data: any) => request.put(`/fmea/dfmea-items/${id}`, data),
    deleteItem: (id: number) => request.delete(`/fmea/dfmea-items/${id}`),
  },
  processFlows: {
    list: (params?: any) => request.get('/fmea/process-flows', { params }),
    get: (id: number) => request.get(`/fmea/process-flows/${id}`),
    create: (data: any) => request.post('/fmea/process-flows', data),
    update: (id: number, data: any) => request.put(`/fmea/process-flows/${id}`, data),
    delete: (id: number) => request.delete(`/fmea/process-flows/${id}`),
    addStep: (flowId: number, data: any) => request.post(`/fmea/process-flows/${flowId}/steps`, data),
    updateStep: (id: number, data: any) => request.put(`/fmea/process-flow-steps/${id}`, data),
    deleteStep: (id: number) => request.delete(`/fmea/process-flow-steps/${id}`),
  },
  pfmeas: {
    list: (params?: any) => request.get('/fmea/pfmeas', { params }),
    get: (id: number) => request.get(`/fmea/pfmeas/${id}`),
    create: (data: any) => request.post('/fmea/pfmeas', data),
    update: (id: number, data: any) => request.put(`/fmea/pfmeas/${id}`, data),
    delete: (id: number) => request.delete(`/fmea/pfmeas/${id}`),
    approve: (id: number) => request.put(`/fmea/pfmeas/${id}/approve`),
    createItem: (pfmeaId: number, data: any) => request.post(`/fmea/pfmeas/${pfmeaId}/items`, data),
    updateItem: (id: number, data: any) => request.put(`/fmea/pfmea-items/${id}`, data),
    deleteItem: (id: number) => request.delete(`/fmea/pfmea-items/${id}`),
  },
  controlPlans: {
    list: (params?: any) => request.get('/fmea/control-plans', { params }),
    get: (id: number) => request.get(`/fmea/control-plans/${id}`),
    create: (data: any) => request.post('/fmea/control-plans', data),
    update: (id: number, data: any) => request.put(`/fmea/control-plans/${id}`, data),
    delete: (id: number) => request.delete(`/fmea/control-plans/${id}`),
    approve: (id: number) => request.put(`/fmea/control-plans/${id}/approve`),
    createItem: (cpId: number, data: any) => request.post(`/fmea/control-plans/${cpId}/items`, data),
    updateItem: (id: number, data: any) => request.put(`/fmea/cp-items/${id}`, data),
    deleteItem: (id: number) => request.delete(`/fmea/cp-items/${id}`),
    generateFromPfmea: (cpId: number) => request.post(`/fmea/control-plans/${cpId}/generate-from-pfmea`),
  },
  specialChars: {
    list: (params?: any) => request.get('/fmea/special-chars', { params }),
    create: (data: any) => request.post('/fmea/special-chars', data),
    update: (id: number, data: any) => request.put(`/fmea/special-chars/${id}`, data),
    delete: (id: number) => request.delete(`/fmea/special-chars/${id}`),
    traceability: (id: number) => request.get(`/fmea/special-chars/${id}/traceability`),
  },
  spc: {
    list: (params?: any) => request.get('/fmea/spc-studies', { params }),
    get: (id: number) => request.get(`/fmea/spc-studies/${id}`),
    create: (data: any) => request.post('/fmea/spc-studies', data),
    update: (id: number, data: any) => request.put(`/fmea/spc-studies/${id}`, data),
    delete: (id: number) => request.delete(`/fmea/spc-studies/${id}`),
    addDataPoint: (id: number, data: any) => request.post(`/fmea/spc-studies/${id}/data-points`, data),
    addDataPointsBulk: (id: number, points: any[]) => request.post(`/fmea/spc-studies/${id}/data-points/bulk`, { points }),
    calculate: (id: number) => request.post(`/fmea/spc-studies/${id}/calculate`),
    chartData: (id: number) => request.get(`/fmea/spc-studies/${id}/chart-data`),
  },
  msa: {
    list: (params?: any) => request.get('/fmea/msa-studies', { params }),
    get: (id: number) => request.get(`/fmea/msa-studies/${id}`),
    create: (data: any) => request.post('/fmea/msa-studies', data),
    update: (id: number, data: any) => request.put(`/fmea/msa-studies/${id}`, data),
    delete: (id: number) => request.delete(`/fmea/msa-studies/${id}`),
    addMeasurement: (id: number, data: any) => request.post(`/fmea/msa-studies/${id}/measurements`, data),
    addMeasurementsBulk: (id: number, measurements: any[]) => request.post(`/fmea/msa-studies/${id}/measurements/bulk`, { measurements }),
    calculate: (id: number) => request.post(`/fmea/msa-studies/${id}/calculate`),
  },
  kb: {
    list: (params?: any) => request.get('/fmea/kb', { params }),
    get: (id: number) => request.get(`/fmea/kb/${id}`),
    create: (data: any) => request.post('/fmea/kb', data),
    update: (id: number, data: any) => request.put(`/fmea/kb/${id}`, data),
    delete: (id: number) => request.delete(`/fmea/kb/${id}`),
    recommend: (keywords: string, fmeaType?: string) => request.post('/fmea/kb/recommend', { keywords, fmeaType }),
    referenceTables: () => request.get('/fmea/kb/reference-tables'),
  },
  stats: {
    overview: (params?: any) => request.get('/fmea/stats/overview', { params }),
    apDistribution: (params?: any) => request.get('/fmea/stats/ap-distribution', { params }),
  },
}

export const changeApi = {
  ecrs: {
    list: (params?: any) => request.get('/change/ecrs', { params }),
    get: (id: number) => request.get(`/change/ecrs/${id}`),
    create: (data: any) => request.post('/change/ecrs', data),
    update: (id: number, data: any) => request.put(`/change/ecrs/${id}`, data),
    delete: (id: number) => request.delete(`/change/ecrs/${id}`),
    submit: (id: number) => request.put(`/change/ecrs/${id}/submit`),
    startImpactAnalysis: (id: number) => request.put(`/change/ecrs/${id}/start-impact-analysis`),
    submitCcb: (id: number) => request.put(`/change/ecrs/${id}/submit-ccb`),
    approve: (id: number, data: any) => request.post(`/change/ecrs/${id}/approve`, data),
    reject: (id: number, data: any) => request.post(`/change/ecrs/${id}/reject`, data),
    close: (id: number) => request.put(`/change/ecrs/${id}/close`),
  },
  impactItems: {
    create: (ecrId: number, data: any) => request.post(`/change/ecrs/${ecrId}/impact-items`, data),
    update: (id: number, data: any) => request.put(`/change/impact-items/${id}`, data),
    delete: (id: number) => request.delete(`/change/impact-items/${id}`),
  },
  ccbReviews: {
    list: (params?: any) => request.get('/change/ccb-reviews', { params }),
    create: (ecrId: number, data: any) => request.post(`/change/ecrs/${ecrId}/ccb-review`, data),
    update: (id: number, data: any) => request.put(`/change/ccb-reviews/${id}`, data),
  },
  ecns: {
    list: (params?: any) => request.get('/change/ecns', { params }),
    get: (id: number) => request.get(`/change/ecns/${id}`),
    createFromEcr: (ecrId: number, data: any) => request.post(`/change/ecrs/${ecrId}/ecn`, data),
    update: (id: number, data: any) => request.put(`/change/ecns/${id}`, data),
    startExecution: (id: number) => request.put(`/change/ecns/${id}/start-execution`),
    startVerification: (id: number) => request.put(`/change/ecns/${id}/start-verification`),
    close: (id: number) => request.put(`/change/ecns/${id}/close`),
  },
  actionItems: {
    create: (ecnId: number, data: any) => request.post(`/change/ecns/${ecnId}/action-items`, data),
    update: (id: number, data: any) => request.put(`/change/action-items/${id}`, data),
    delete: (id: number) => request.delete(`/change/action-items/${id}`),
    complete: (id: number) => request.put(`/change/action-items/${id}/complete`),
    verify: (id: number, data?: any) => request.put(`/change/action-items/${id}/verify`, data),
  },
  stats: {
    overview: (params?: any) => request.get('/change/stats/overview', { params }),
  },
}
