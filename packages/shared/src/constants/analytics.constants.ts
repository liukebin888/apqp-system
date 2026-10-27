// ==================== 报表类型 ====================
export const ANALYTICS_REPORT_TYPE = {
  project: '项目报表',
  cost: '成本报表',
  quality: '质量报表',
  supplier: '供应商报表',
  safety: '安全报表',
} as const

// ==================== 趋势类型 ====================
export const TREND_TYPE = {
  progress: '进度趋势',
  cost: '成本趋势',
  quality: '质量趋势',
  risk: '风险趋势',
} as const

// ==================== 预测类型 ====================
export const FORECAST_TYPE = {
  risk: '风险预测',
  progress: '进度预测',
  cost: '成本预测',
} as const

// ==================== 导出格式 ====================
export const EXPORT_FORMAT = {
  excel: 'Excel',
  pdf: 'PDF',
  csv: 'CSV',
} as const

// ==================== 时间粒度 ====================
export const TIME_GRANULARITY = {
  daily: '日',
  weekly: '周',
  monthly: '月',
  quarterly: '季',
  yearly: '年',
} as const
