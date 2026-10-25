export const ECR_STATUS = {
  draft: '草稿',
  submitted: '已提交',
  impact_analysis: '影响分析中',
  ccb_review: 'CCB评审中',
  approved: '已批准',
  rejected: '已驳回',
  closed: '已关闭',
} as const
export type EcrStatus = keyof typeof ECR_STATUS

export const ECN_STATUS = {
  planning: '计划中',
  executing: '执行中',
  verifying: '验证中',
  closed: '已关闭',
} as const
export type EcnStatus = keyof typeof ECN_STATUS

export const CHANGE_TYPE = {
  design: '设计变更',
  process: '工艺变更',
  material: '材料变更',
  specification: '规格变更',
  plan: '计划变更',
  schedule: '进度变更',
  cost: '成本变更',
} as const
export type ChangeType = keyof typeof CHANGE_TYPE

export const CHANGE_PRIORITY = {
  critical: '紧急',
  major: '重要',
  general: '一般',
  minor: '轻微',
} as const
export type ChangePriority = keyof typeof CHANGE_PRIORITY

export const IMPACT_AREA = {
  bom: 'BOM',
  fmea: 'FMEA',
  sample: '样件',
  cost: '成本',
  document: '文档',
  tooling: '工装模具',
  safety: '安全特性',
  process: '工艺流程',
  control_plan: '控制计划',
  spc: 'SPC',
  msa: 'MSA',
  ppap: 'PPAP',
} as const
export type ImpactArea = keyof typeof IMPACT_AREA

export const IMPACT_LEVEL = {
  high: '高',
  medium: '中',
  low: '低',
} as const
export type ImpactLevel = keyof typeof IMPACT_LEVEL

export const CCB_DECISION = {
  approve: '批准',
  reject: '驳回',
  conditional: '有条件批准',
  defer: '延期',
} as const
export type CcbDecision = keyof typeof CCB_DECISION

export const ECN_ACTION_TYPE = {
  update_bom: '更新BOM',
  update_fmea: '更新FMEA',
  update_control_plan: '更新控制计划',
  update_drawing: '更新图纸',
  update_process: '更新工艺文件',
  update_ppap: '更新PPAP',
  update_document: '更新文档',
  tooling_change: '工装变更',
  sample_verification: '样件验证',
  other: '其他',
} as const
export type EcnActionType = keyof typeof ECN_ACTION_TYPE

export const ECN_ACTION_STATUS = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  verified: '已验证',
} as const
export type EcnActionStatus = keyof typeof ECN_ACTION_STATUS
