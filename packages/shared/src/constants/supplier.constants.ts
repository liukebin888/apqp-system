// ==================== 供方开发阶段 ====================
export const SUPPLIER_DEV_STAGE = {
  planning: '规划中',
  in_progress: '进行中',
  completed: '已完成',
} as const

// ==================== 供方8D状态 ====================
export const SUPPLIER_8D_STATUS = {
  draft: '草稿',
  submitted: '已提交',
  approved: '已批准',
  closed: '已关闭',
} as const

// ==================== 供方评价等级 ====================
export const SUPPLIER_GRADE = {
  A: '优秀 (90-100)',
  B: '良好 (75-89)',
  C: '合格 (60-74)',
  D: '不合格 (<60)',
} as const

// ==================== 供方评价周期 ====================
export const SUPPLIER_PERIOD = {
  '2026-Q1': '2026年Q1',
  '2026-Q2': '2026年Q2',
  '2026-Q3': '2026年Q3',
  '2026-Q4': '2026年Q4',
  '2026-H1': '2026年H1',
  '2026-H2': '2026年H2',
  '2026': '2026年度',
} as const

export type SupplierGrade = keyof typeof SUPPLIER_GRADE
