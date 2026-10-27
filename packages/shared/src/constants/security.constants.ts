// ==================== TARA 风险等级 ====================
export const TARA_RISK_LEVEL = {
  high: '高',
  medium: '中',
  low: '低',
} as const

// ==================== TARA 影响等级 ====================
export const TARA_IMPACT_LEVEL = {
  high: '高',
  medium: '中',
  low: '低',
} as const

// ==================== TARA 可能性 ====================
export const TARA_LIKELIHOOD = {
  high: '高',
  medium: '中',
  low: '低',
} as const

// ==================== TARA 资产类型 ====================
export const TARA_ASSET_TYPE = {
  data: '数据',
  software: '软件',
  hardware: '硬件',
  network: '网络',
} as const

// ==================== TARA 状态 ====================
export const TARA_STATUS = {
  open: '待处理',
  mitigated: '已缓解',
  accepted: '已接受',
} as const

// ==================== 漏洞严重度 ====================
export const VULN_SEVERITY = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
} as const

// ==================== 漏洞状态 ====================
export const VULN_STATUS = {
  open: '待修复',
  in_progress: '修复中',
  fixed: '已修复',
  verified: '已验证',
} as const

// ==================== 网络安全需求状态 ====================
export const CYBER_REQ_STATUS = {
  draft: '草稿',
  approved: '已批准',
  implemented: '已实现',
  verified: '已验证',
} as const

// ==================== CSMS 合规状态 ====================
export const CSMS_STATUS = {
  not_started: '未开始',
  in_progress: '进行中',
  compliant: '合规',
  non_compliant: '不合规',
} as const

// ==================== 供应链安全状态 ====================
export const SUPPLY_CHAIN_STATUS = {
  pending: '待评估',
  completed: '已完成',
  follow_up: '需跟进',
} as const

// ==================== 审计类型 ====================
export const AUDIT_TYPE = {
  security: '安全审计',
  compliance: '合规审计',
  internal: '内部审计',
  external: '外部审计',
} as const

// ==================== 审计报告类型 ====================
export const REPORT_TYPE = {
  security: '安全报告',
  quality: '质量报告',
  process: '过程报告',
} as const

// ==================== 审计报告状态 ====================
export const REPORT_STATUS = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
} as const

export type TaraRiskLevel = keyof typeof TARA_RISK_LEVEL
export type VulnSeverity = keyof typeof VULN_SEVERITY
