export const COST_CATEGORIES = {
  labor: '人工成本',
  material: '材料成本',
  outsourcing: '外协成本',
  travel: '差旅成本',
  equipment: '设备成本',
  other: '其他成本',
} as const

export type CostCategory = keyof typeof COST_CATEGORIES

export const ESTIMATE_VERSIONS = {
  'V1.0': '立项估算',
  'V2.0': '设计估算',
  'V3.0': '开发估算',
  'V4.0': '决算',
} as const

export const COST_STATUS = {
  draft: '草稿',
  calculating: '计算中',
  pending_approval: '待审批',
  approved: '已批准',
  published: '已发布',
  rejected: '已驳回',
} as const

export const BUDGET_ADJUSTMENT_TYPES = {
  transfer: '预算内调整',
  addition: '预算追加',
  reduction: '预算削减',
} as const

export const COST_ALERT_LEVELS = {
  yellow: { label: '黄色预警', threshold: 0.8, color: '#E6A23C' },
  orange: { label: '橙色预警', threshold: 0.9, color: '#F56C6C' },
  red: { label: '红色预警', threshold: 1.0, color: '#F50000' },
} as const

export const COST_SOURCE_TYPES = {
  po: '采购订单',
  invoice: '发票',
  timesheet: '工时',
  manual: '手动录入',
  erp: 'ERP 系统',
  expense: '报销',
  equipment: '设备',
} as const

export const BUDGET_APPROVAL_THRESHOLDS = [
  { max: 10, label: '简化审批', approver: '项目经理' },
  { max: 100, label: '标准审批', approver: '部门经理' },
  { max: 500, label: '严格审批', approver: '财务总监' },
  { max: Infinity, label: '重大审批', approver: '总经理' },
] as const

export const TARGET_MARGINS: Record<string, number> = {
  L1: 0.15,
  L2: 0.12,
  L3: 0.10,
  L4: 0.08,
}
