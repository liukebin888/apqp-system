export enum WfDefinitionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
}

export enum WfNodeType {
  START = 'start',
  END = 'end',
  APPROVAL = 'approval',
  COUNTERSIGN = 'countersign',
  CONDITION = 'condition',
  AUTO = 'auto',
  NOTIFY = 'notify',
}

export enum WfAssigneeType {
  ROLE = 'role',
  USER = 'user',
  DEPARTMENT = 'department',
  INITIATOR = 'initiator',
  DYNAMIC = 'dynamic',
}

export enum WfInstanceStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

export enum WfNodeInstanceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SKIPPED = 'skipped',
  COUNTERSIGNED = 'countersigned',
}

export enum WfAction {
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  COUNTERSIGN = 'countersign',
  ROLLBACK = 'rollback',
  RESUBMIT = 'resubmit',
  TIMEOUT = 'timeout',
  TRANSFER = 'transfer',
}
