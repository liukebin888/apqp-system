// ==================== 结项状态 ====================
export const CLOSURE_STATUS = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  completed: '已完成',
} as const

// ==================== 移交状态 ====================
export const HANDOVER_STATUS = {
  pending: '待移交',
  in_progress: '移交中',
  completed: '已完成',
} as const

// ==================== 量产追溯状态 ====================
export const PRODUCTION_TRACE_STATUS = {
  open: '待处理',
  investigating: '调查中',
  resolved: '已解决',
} as const

export type ClosureStatus = keyof typeof CLOSURE_STATUS
export type HandoverStatus = keyof typeof HANDOVER_STATUS
