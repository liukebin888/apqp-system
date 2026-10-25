export const PURCHASE_CATEGORIES = {
  raw_material: '原材料',
  parts: '零部件',
  outsource: '外协加工',
  equipment: '设备',
  tooling: '工装模具',
  other: '其他',
} as const

export type PurchaseCategory = keyof typeof PURCHASE_CATEGORIES

export const SUPPLIER_LEVELS = {
  strategic: '战略供应商',
  important: '重要供应商',
  general: '一般供应商',
  temporary: '临时供应商',
} as const

export type SupplierLevel = keyof typeof SUPPLIER_LEVELS

export const REQUEST_STATUS = {
  draft: '草稿',
  pending: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  cancelled: '已取消',
  completed: '已完成',
} as const

export type RequestStatus = keyof typeof REQUEST_STATUS

export const ORDER_STATUS = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已批准',
  confirmed: '已确认',
  in_transit: '运输中',
  received: '已收货',
  closed: '已关闭',
  cancelled: '已取消',
} as const

export type OrderStatus = keyof typeof ORDER_STATUS

export const EVALUATION_LEVELS = {
  A: { label: 'A级-优秀', min: 90, color: '#67C23A' },
  B: { label: 'B级-良好', min: 80, color: '#409EFF' },
  C: { label: 'C级-合格', min: 70, color: '#E6A23C' },
  D: { label: 'D级-不合格', min: 0, color: '#F56C6C' },
} as const

export const AUDIT_TYPES = {
  annual: '年度审核',
  special: '专项审核',
  onsite: '现场审核',
} as const

export const AUDIT_RESULTS = {
  pass: '通过',
  conditional: '有条件通过',
  fail: '不通过',
} as const

export const PURCHASE_APPROVAL_THRESHOLDS = [
  { max: 5, label: '简化审批', approver: '采购工程师' },
  { max: 50, label: '标准审批', approver: '采购经理' },
  { max: 200, label: '严格审批', approver: '采购总监' },
  { max: Infinity, label: '重大审批', approver: '总经理' },
] as const

export const EVALUATION_WEIGHTS = {
  quality: 0.40,
  delivery: 0.30,
  cost: 0.20,
  service: 0.10,
} as const

export const QUALIFICATION_STATUS = {
  pending: '待审核',
  qualified: '合格',
  probation: '试用期',
  blacklisted: '黑名单',
} as const
