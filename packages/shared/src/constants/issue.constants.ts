// ==================== 问题类型 ====================
export const ISSUE_TYPE = {
  design: '设计问题',
  process: '工艺问题',
  supplier: '供应商问题',
  customer: '客户反馈',
  other: '其他',
} as const

// ==================== 严重度 ====================
export const ISSUE_SEVERITY = {
  critical: '严重',
  major: '主要',
  minor: '次要',
} as const

// ==================== 优先级 ====================
export const ISSUE_PRIORITY = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
} as const

// ==================== 问题状态 ====================
export const ISSUE_STATUS = {
  open: '待处理',
  investigating: '调查中',
  '8d_in_progress': '8D进行中',
  resolved: '已解决',
  closed: '已关闭',
} as const

// ==================== 问题来源 ====================
export const ISSUE_SOURCE = {
  internal: '内部发现',
  audit: '审核发现',
  customer: '客户反馈',
  supplier: '供应商反馈',
} as const

// ==================== 8D 步骤 ====================
export const EIGHT_D_STEPS = {
  d0: 'D0 准备',
  d1: 'D1 成立团队',
  d2: 'D2 问题描述',
  d3: 'D3 临时遏制措施',
  d4: 'D4 根本原因分析',
  d5: 'D5 永久纠正措施',
  d6: 'D6 实施与验证',
  d7: 'D7 预防措施',
  d8: 'D8 表彰团队',
} as const

// ==================== 经验教训类型 ====================
export const LESSON_TYPE = {
  lesson_learned: '经验教训',
  best_practice: '最佳实践',
  pitfall: '陷阱警示',
} as const

// ==================== 经验教训分类 ====================
export const LESSON_CATEGORY = {
  design: '设计',
  process: '工艺',
  quality: '质量',
  management: '管理',
} as const

export type IssueType = keyof typeof ISSUE_TYPE
export type IssueSeverity = keyof typeof ISSUE_SEVERITY
export type IssuePriority = keyof typeof ISSUE_PRIORITY
export type IssueStatus = keyof typeof ISSUE_STATUS
