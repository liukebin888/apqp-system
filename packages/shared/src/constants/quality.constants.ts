export const PROBLEM_STATUS = {
  new: '新建',
  analyzing: '分析中',
  correcting: '纠正中',
  verifying: '验证中',
  closed: '已关闭',
  escalated: '已升级',
} as const

export type ProblemStatus = keyof typeof PROBLEM_STATUS

export const PROBLEM_CLASSIFICATION = {
  quality: '质量问题',
  process: '工艺问题',
  material: '材料问题',
  customer: '客户问题',
} as const

export type ProblemClassification = keyof typeof PROBLEM_CLASSIFICATION

export const PROBLEM_SEVERITY = {
  critical: '关键',
  major: '重大',
  minor: '一般',
  trivial: '轻微',
} as const

export type ProblemSeverity = keyof typeof PROBLEM_SEVERITY

export const PROBLEM_SOURCE = {
  process_inspection: '过程检验',
  customer_complaint: '客户投诉',
  supplier_material: '供应商来料',
  internal_audit: '内部审核',
  external_audit: '外部审核',
  management_review: '管理评审',
} as const

export type ProblemSource = keyof typeof PROBLEM_SOURCE

export const EIGHT_D_STATUS = {
  in_progress: '进行中',
  completed: '已完成',
} as const

export type EightDStatus = keyof typeof EIGHT_D_STATUS

export const DEFECT_TYPE = {
  dimension: '尺寸超差',
  appearance: '外观缺陷',
  function: '功能失效',
  material: '材料不符',
  packaging: '包装破损',
} as const

export type DefectType = keyof typeof DEFECT_TYPE

export const DISPOSITION = {
  rework: '返工',
  repair: '返修',
  concession: '让步接收',
  scrap: '报废',
  return: '退回供应商',
} as const

export type Disposition = keyof typeof DISPOSITION

export const CAPA_SOURCE = {
  problem: '问题单',
  nonconformance: '不合格品',
  internal_audit: '内审',
  management_review: '管理评审',
  customer_complaint: '客户投诉',
  process_analysis: '过程分析',
} as const

export type CapaSource = keyof typeof CAPA_SOURCE

export const CAPA_TYPE = {
  corrective: '纠正措施',
  preventive: '预防措施',
} as const

export type CapaType = keyof typeof CAPA_TYPE

export const CAPA_STATUS = {
  pending: '待审批',
  in_progress: '进行中',
  completed: '已完成',
  verified: '已验证',
  closed: '已关闭',
} as const

export type CapaStatus = keyof typeof CAPA_STATUS

export const INSPECTION_TYPE = {
  first_article: '首件检验',
  incoming: '进货检验',
  process: '过程检验',
  final: '最终检验',
} as const

export type InspectionType = keyof typeof INSPECTION_TYPE

export const INSPECTION_RESULT = {
  pass: '合格',
  fail: '不合格',
  concession: '让步接收',
} as const

export type InspectionResult = keyof typeof INSPECTION_RESULT

export const ESCALATION_RULES = [
  { level: 'L1', severity: 'critical', days: 3, escalateTo: '总经理', description: '关键问题3天未关闭→升级至总经理' },
  { level: 'L2', severity: 'major', days: 7, escalateTo: '部门经理', description: '重大问题7天未关闭→升级至部门经理' },
  { level: 'L3', severity: 'minor', days: 14, escalateTo: '项目经理', description: '一般问题14天未关闭→升级至项目经理' },
] as const

export const ESCALATION_LEVEL = {
  L1: '总经理',
  L2: '部门经理',
  L3: '项目经理',
} as const

export type EscalationLevel = keyof typeof ESCALATION_LEVEL

export const ESCALATION_TRIGGER_TYPE = {
  auto: '自动',
  manual: '手动',
} as const

export type EscalationTriggerType = keyof typeof ESCALATION_TRIGGER_TYPE

export const PPM_TARGETS: Record<string, number> = {
  L1: 10,
  L2: 50,
  L3: 100,
  L4: 500,
  L5: 1000,
} as const

export const PPM_STATUS = {
  on_track: '达标',
  warning: '预警',
  exceeded: '超标',
} as const

export type PpmStatus = keyof typeof PPM_STATUS

export const PPM_PERIOD_TYPE = {
  monthly: '月度',
  quarterly: '季度',
  yearly: '年度',
} as const

export type PpmPeriodType = keyof typeof PPM_PERIOD_TYPE
