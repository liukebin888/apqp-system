// ==================== 功能安全 (ISO 26262) 常量 ====================

// --- ASIL 等级 ---
export const ASIL_LEVEL = {
  QM: 'QM (无安全要求)',
  A: 'ASIL A',
  B: 'ASIL B',
  C: 'ASIL C',
  D: 'ASIL D',
} as const
export type AsilLevel = keyof typeof ASIL_LEVEL

// --- 严重程度评级 (Severity) ---
export const SEVERITY_RATING = {
  0: 'S0 - 无伤害',
  1: 'S1 - 轻伤/中度',
  2: 'S2 - 严重伤害',
  3: 'S3 - 危及生命',
  4: 'S4 - 致命',
} as const

// --- 暴露度评级 (Exposure) ---
export const EXPOSURE_RATING = {
  1: 'E1 - 极低 (<1%运行时间)',
  2: 'E2 - 低 (1%-10%运行时间)',
  3: 'E3 - 中等 (10%-90%运行时间)',
  4: 'E4 - 高 (>90%运行时间)',
} as const

// --- 可控度评级 (Controllability) ---
export const CONTROLLABILITY_RATING = {
  1: 'C1 - 可控',
  2: 'C2 - 一般',
  3: 'C3 - 难以控制',
} as const

// --- ASIL 确定矩阵 (ISO 26262-3 Table 4) ---
// ASIL_MATRIX[severity][exposure][controllability] = ASIL level
export const ASIL_MATRIX: number[][][] = [
  // S0: No injury
  [
    [0, 0, 0], // E1: C1,QM C2,QM C3,QM
    [0, 0, 0], // E2
    [0, 0, 0], // E3
    [0, 0, 0], // E4
  ],
  // S1: Light/moderate injury
  [
    [0, 0, 0], // E1
    [0, 0, 0], // E2
    [0, 1, 1], // E3: C1,QM C2,A C3,A
    [1, 1, 2], // E4: C1,A C2,A C3,B
  ],
  // S2: Severe injury
  [
    [0, 0, 1], // E1: C1,QM C2,QM C3,A
    [0, 1, 2], // E2: C1,QM C2,A C3,B
    [1, 2, 3], // E3: C1,A C2,B C3,C
    [2, 3, 4], // E4: C1,B C2,C C3,D
  ],
  // S3: Life-threatening injury
  [
    [0, 1, 2], // E1: C1,QM C2,A C3,B
    [1, 2, 3], // E2: C1,A C2,B C3,C
    [2, 3, 4], // E3: C1,B C2,C C3,D
    [3, 4, 4], // E4: C1,C C2,D C3,D
  ],
  // S4: Fatal injury
  [
    [1, 2, 3], // E1: C1,A C2,B C3,C
    [2, 3, 4], // E2: C1,B C2,C C3,D
    [3, 4, 4], // E3: C1,C C2,D C3,D
    [4, 4, 4], // E4: C1,D C2,D C3,D
  ],
]

const ASIL_NAMES = ['QM', 'A', 'B', 'C', 'D']

export function calculateASIL(severity: number, exposure: number, controllability: number): string {
  const s = Math.max(0, Math.min(4, severity))
  const e = Math.max(1, Math.min(4, exposure))
  const c = Math.max(1, Math.min(3, controllability))
  const idx = ASIL_MATRIX[s]?.[e - 1]?.[c - 1]
  return ASIL_NAMES[idx ?? 0] || 'QM'
}

// --- 危害类型 ---
export const HAZARD_TYPE = {
  mechanical: '机械',
  electrical: '电气',
  thermal: '热',
  chemical: '化学',
  software: '软件',
  environmental: '环境',
} as const

// --- 危害分析状态 ---
export const SAFETY_HAZARD_STATUS = {
  draft: '草稿',
  in_review: '评审中',
  approved: '已批准',
  archived: '已归档',
} as const

// --- 安全目标状态 ---
export const SAFETY_GOAL_STATUS = {
  draft: '草稿',
  in_review: '评审中',
  approved: '已批准',
  deprecated: '已废弃',
} as const

// --- FTA 事件类型 ---
export const FTA_EVENT_TYPE = {
  top_event: '顶事件',
  gate: '逻辑门',
  basic_event: '基本事件',
  undeveloped: '未展开事件',
  transfer_in: '转入',
  transfer_out: '转出',
  house: '房形事件',
} as const

// --- FTA 门类型 ---
export const FTA_GATE_TYPE = {
  and: 'AND门',
  or: 'OR门',
  xor: 'XOR门',
  not: 'NOT门',
  voting: '表决门(k/n)',
} as const

// --- FTA 状态 ---
export const SAFETY_FTA_STATUS = {
  draft: '草稿',
  in_progress: '编制中',
  reviewed: '已评审',
  approved: '已批准',
} as const

// --- GSN 节点类型 ---
export const GSN_NODE_TYPE = {
  goal: '目标(Goal)',
  strategy: '策略(Strategy)',
  assumption: '假设(Assumption)',
  context: '上下文(Context)',
  solution: '解决方案(Solution)',
  justification: '论证(Justification)',
} as const

// --- Safety Case 状态 ---
export const SAFETY_CASE_STATUS = {
  draft: '草稿',
  in_progress: '编制中',
  under_review: '评审中',
  approved: '已批准',
  released: '已发布',
  archived: '已归档',
} as const

// --- 论证节点状态 ---
export const SAFETY_ARGUMENT_STATUS = {
  draft: '草稿',
  claimed: '已声明',
  substantiated: '已证实',
  challenged: '已质疑',
} as const

// --- 证据类型 ---
export const SAFETY_EVIDENCE_TYPE = {
  fmea_report: 'FMEA报告',
  test_report: '测试报告',
  design_review: '设计评审',
  verification: '验证结果',
  validation: '确认结果',
  analysis: '分析报告',
  document: '文档',
} as const

// --- 证据状态 ---
export const SAFETY_EVIDENCE_STATUS = {
  collected: '已收集',
  verified: '已验证',
  accepted: '已接受',
  rejected: '已拒绝',
} as const

// --- 安全评审类型 ---
export const SAFETY_REVIEW_TYPE = {
  safety_plan: '安全计划评审',
  concept: '安全概念评审',
  design: '安全设计评审',
  implementation: '实现评审',
  production: '生产评审',
  release: '发布评审',
} as const

// --- 安全评审状态 ---
export const SAFETY_REVIEW_STATUS = {
  planned: '已计划',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
} as const

// --- 安全评审结论 ---
export const SAFETY_REVIEW_CONCLUSION = {
  pass: '通过',
  conditional_pass: '有条件通过',
  fail: '不通过',
} as const

// ==================== FSC/TSC 安全概念 ====================

export const SAFETY_CONCEPT_TYPE = {
  FSC: '功能安全概念(FSC)',
  TSC: '技术安全概念(TSC)',
} as const

export const SAFETY_CONCEPT_STATUS = {
  draft: '草稿',
  in_progress: '编制中',
  in_review: '评审中',
  approved: '已批准',
  deprecated: '已废弃',
} as const

// ==================== 安全需求 ====================

export const SAFETY_REQ_TYPE = {
  FSR: '功能安全需求(FSR)',
  HSR: '硬件安全需求(HSR)',
  SWR: '软件安全需求(SWR)',
} as const

export const SAFETY_REQUIREMENT_STATUS = {
  draft: '草稿',
  reviewed: '已评审',
  approved: '已批准',
  implemented: '已实现',
  verified: '已验证',
} as const

// ==================== FMEDA 失效模式分析 ====================

export const FMEDA_SEVERITY = {
  S0: 'S0 - 无影响',
  S1: 'S1 - 轻微',
  S2: 'S2 - 中等',
  S3: 'S3 - 严重',
  S4: 'S4 - 致命',
} as const

export const FMEDA_STATUS = {
  draft: '草稿',
  in_progress: '分析中',
  reviewed: '已评审',
  approved: '已批准',
} as const

// ==================== 硬件安全度量 ====================

export const HARDWARE_METRIC_TYPE = {
  SPFM: 'SPFM (单点失效度量)',
  LFM: 'LFM (潜在失效度量)',
  PMHF: 'PMHF (概率度量)',
} as const

export const HARDWARE_METRIC_STATUS = {
  draft: '草稿',
  calculated: '已计算',
  reviewed: '已评审',
  passed: '达标',
  failed: '不达标',
} as const

// ==================== DFA 相关失效分析 ====================

export const DFA_STATUS = {
  draft: '草稿',
  in_progress: '分析中',
  reviewed: '已评审',
  approved: '已批准',
} as const

export const DFA_FAILURE_TYPE = {
  coupled: '相关失效(Coupled)',
  cascading: '级联失效(Cascading)',
  common_cause: '共因失效(Common Cause)',
} as const

// ==================== ASIL 分解 ====================

export const ASIL_DECOMPOSITION_STATUS = {
  proposed: '已提议',
  in_review: '评审中',
  approved: '已批准',
  rejected: '已拒绝',
} as const

// ==================== 工具鉴定与 DIA 台账 ====================

export const TOOL_CONFIDENCE_LEVEL = {
  TB1: 'TB1 (低可信度)',
  TB2: 'TB2 (中可信度)',
  TB3: 'TB3 (高可信度)',
} as const

export const TOOL_QUALIFICATION_STATUS = {
  not_qualified: '未鉴定',
  qualified: '已鉴定',
  conditional: '有条件使用',
  expired: '已过期',
  blacklisted: '禁用',
} as const

export const TOOL_TYPE = {
  verification: '验证工具',
  validation: '确认工具',
  analysis: '分析工具',
  development: '开发工具',
  testing: '测试工具',
} as const

// ==================== 确认措施管理 ====================

export const CONFIRMATION_MEASURE_STATUS = {
  planned: '已计划',
  in_progress: '执行中',
  completed: '已完成',
  passed: '通过',
  failed: '未通过',
} as const

export const CONFIRMATION_METHOD = {
  analysis: '分析方法',
  testing: '测试验证',
  inspection: '检查确认',
  review: '评审确认',
  simulation: '仿真验证',
} as const
