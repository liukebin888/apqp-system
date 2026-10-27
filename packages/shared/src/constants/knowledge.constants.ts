// ==================== 知识库分类 ====================
export const KB_CATEGORY = {
  design: '设计',
  process: '工艺',
  quality: '质量',
  management: '管理',
} as const

// ==================== 模板分类 ====================
export const TEMPLATE_CATEGORY = {
  apqp: 'APQP模板',
  form: '表单模板',
  report: '报告模板',
  checklist: '检查表模板',
} as const

// ==================== Checklist分类 ====================
export const CHECKLIST_CATEGORY = {
  review: '评审检查表',
  entry: '准入检查表',
  delivery: '交付检查表',
} as const

// ==================== 适用阶段 ====================
export const APPLICABLE_PHASE = {
  phase1: 'Phase 1 计划与定义',
  phase2: 'Phase 2 产品设计',
  phase3: 'Phase 3 过程设计',
  phase4: 'Phase 4 产品与过程确认',
  phase5: 'Phase 5 反馈与纠正',
} as const
