// ASPICE (Automotive SPICE PAM 4.0 + VDA 指引) 常量

export const ASPICE_PROCESS_GROUPS = {
  SYS: '系统工程',
  SWE: '软件工程',
  SUP: '支持过程',
  MAN: '管理过程',
  ACQ: '获取过程',
  HW: '硬件工程',
  MECH: '机械工程',
} as const;
export type AspiceProcessGroup = keyof typeof ASPICE_PROCESS_GROUPS;

export const ASPICE_PROCESSES = {
  'SYS.1': '需求挖掘 (Requirements Elicitation)',
  'SYS.2': '系统需求分析 (System Requirements Analysis)',
  'SYS.3': '系统架构设计 (System Architectural Design)',
  'SYS.4': '系统集成与集成测试 (System Integration and Integration Test)',
  'SYS.5': '系统合格性测试 (System Qualification Test)',
  'SWE.1': '软件需求分析 (Software Requirements Analysis)',
  'SWE.2': '软件架构设计 (Software Architectural Design)',
  'SWE.3': '软件详细设计与单元构建 (Software Detailed Design and Unit Construction)',
  'SWE.4': '软件单元验证 (Software Unit Verification)',
  'SWE.5': '软件集成与集成测试 (Software Integration and Integration Test)',
  'SWE.6': '软件合格性测试 (Software Qualification Test)',
  'SUP.1': '质量保证 (Quality Assurance)',
  'SUP.4': '联合评审 (Joint Review)',
  'SUP.7': '文档化 (Documentation)',
  'SUP.8': '配置管理 (Configuration Management)',
  'SUP.9': '问题解决管理 (Problem Resolution Management)',
  'SUP.10': '变更请求分析 (Change Request Analysis)',
  'MAN.3': '项目管理 (Project Management)',
  'MAN.5': '度量 (Measurement)',
  'MAN.6': '风险管理 (Risk Management)',
  'ACQ.4': '供应商监控 (Supplier Monitoring)',
} as const;
export type AspiceProcessId = keyof typeof ASPICE_PROCESSES;

export const ASPICE_CAPABILITY_LEVELS = {
  0: 'CL0 - 不完整过程 (Incomplete)',
  1: 'CL1 - 已执行过程 (Performed)',
  2: 'CL2 - 已管理过程 (Managed)',
  3: 'CL3 - 已建立过程 (Established)',
  4: 'CL4 - 可预测过程 (Predictable)',
  5: 'CL5 - 优化过程 (Optimizing)',
} as const;
export type AspiceCapabilityLevel = keyof typeof ASPICE_CAPABILITY_LEVELS;

export const ASPICE_BP_RATING = {
  F: '完全达成 (Fully Achieved)',
  L: '大部分达成 (Largely Achieved)',
  P: '部分达成 (Partially Achieved)',
  N: '未达成 (Not Achieved)',
} as const;
export type AspiceBpRating = keyof typeof ASPICE_BP_RATING;

export const ASPICE_EVIDENCE_READY = {
  not_ready: '未就绪',
  partial: '部分就绪',
  ready: '已就绪',
} as const;

export const ASPICE_ASSESSMENT_STATUS = {
  planned: '已计划',
  gap_analysis: '差距分析中',
  in_progress: '评估进行中',
  assessed: '已评估',
} as const;

// 标准 ASPICE 过程初始化模板（按 VDA 指引主流 OEM 要求）
export const ASPICE_STANDARD_PROCESSES = [
  { processGroup: 'SYS', processId: 'SYS.1', processName: ASPICE_PROCESSES['SYS.1'], targetLevel: 2 },
  { processGroup: 'SYS', processId: 'SYS.2', processName: ASPICE_PROCESSES['SYS.2'], targetLevel: 2 },
  { processGroup: 'SYS', processId: 'SYS.3', processName: ASPICE_PROCESSES['SYS.3'], targetLevel: 2 },
  { processGroup: 'SYS', processId: 'SYS.4', processName: ASPICE_PROCESSES['SYS.4'], targetLevel: 2 },
  { processGroup: 'SYS', processId: 'SYS.5', processName: ASPICE_PROCESSES['SYS.5'], targetLevel: 2 },
  { processGroup: 'SWE', processId: 'SWE.1', processName: ASPICE_PROCESSES['SWE.1'], targetLevel: 2 },
  { processGroup: 'SWE', processId: 'SWE.2', processName: ASPICE_PROCESSES['SWE.2'], targetLevel: 2 },
  { processGroup: 'SWE', processId: 'SWE.3', processName: ASPICE_PROCESSES['SWE.3'], targetLevel: 2 },
  { processGroup: 'SWE', processId: 'SWE.4', processName: ASPICE_PROCESSES['SWE.4'], targetLevel: 2 },
  { processGroup: 'SWE', processId: 'SWE.5', processName: ASPICE_PROCESSES['SWE.5'], targetLevel: 2 },
  { processGroup: 'SWE', processId: 'SWE.6', processName: ASPICE_PROCESSES['SWE.6'], targetLevel: 2 },
  { processGroup: 'SUP', processId: 'SUP.1', processName: ASPICE_PROCESSES['SUP.1'], targetLevel: 2 },
  { processGroup: 'SUP', processId: 'SUP.8', processName: ASPICE_PROCESSES['SUP.8'], targetLevel: 2 },
  { processGroup: 'SUP', processId: 'SUP.9', processName: ASPICE_PROCESSES['SUP.9'], targetLevel: 1 },
  { processGroup: 'SUP', processId: 'SUP.10', processName: ASPICE_PROCESSES['SUP.10'], targetLevel: 1 },
  { processGroup: 'MAN', processId: 'MAN.3', processName: ASPICE_PROCESSES['MAN.3'], targetLevel: 2 },
  { processGroup: 'MAN', processId: 'MAN.6', processName: ASPICE_PROCESSES['MAN.6'], targetLevel: 1 },
  { processGroup: 'ACQ', processId: 'ACQ.4', processName: ASPICE_PROCESSES['ACQ.4'], targetLevel: 1 },
] as const;
