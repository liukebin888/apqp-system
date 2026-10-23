export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ApqpPhase {
  PHASE_1 = 1,
  PHASE_2 = 2,
  PHASE_3 = 3,
  PHASE_4 = 4,
  PHASE_5 = 5,
}

export enum ApqpPhaseLabel {
  PHASE_1 = '计划和确定项目',
  PHASE_2 = '产品设计和开发',
  PHASE_3 = '过程设计和开发',
  PHASE_4 = '产品和过程确认',
  PHASE_5 = '反馈、评定和纠正措施',
}

export enum ProjectLevel {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  L4 = 'L4',
  L5 = 'L5',
}

export enum ProductForm {
  HARDWARE = 'hardware',
  SOFTWARE = 'software',
  HYBRID = 'hybrid',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

export enum DependencyType {
  FS = 'FS',
  FF = 'FF',
  SS = 'SS',
  SF = 'SF',
}

export enum MilestoneType {
  GATE1 = 'gate1',
  GATE2 = 'gate2',
  GATE3 = 'gate3',
  GATE4 = 'gate4',
  GATE5 = 'gate5',
  OTS = 'ots',
  PVS = 'pvs',
  SOP = 'sop',
}

export enum RiskCategory {
  TECHNICAL = 'technical',
  SCHEDULE = 'schedule',
  COST = 'cost',
  SUPPLY = 'supply',
  QUALITY = 'quality',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RiskStatus {
  OPEN = 'open',
  MITIGATING = 'mitigating',
  CLOSED = 'closed',
  ACCEPTED = 'accepted',
}

export enum ResponseStrategy {
  AVOID = 'avoid',
  MITIGATE = 'mitigate',
  TRANSFER = 'transfer',
  ACCEPT = 'accept',
}

export enum TeamRole {
  PM = 'pm',
  QE = 'qe',
  PE = 'pe',
  ME = 'me',
  BUYER = 'buyer',
}
