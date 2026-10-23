export const PERMISSIONS = {
  system: {
    user: {
      view: 'system:user:view',
      create: 'system:user:create',
      edit: 'system:user:edit',
      delete: 'system:user:delete',
    },
    role: {
      view: 'system:role:view',
      create: 'system:role:create',
      edit: 'system:role:edit',
      delete: 'system:role:delete',
    },
    department: {
      view: 'system:department:view',
      create: 'system:department:create',
      edit: 'system:department:edit',
      delete: 'system:department:delete',
    },
    auditLog: {
      view: 'system:audit-log:view',
    },
  },
  project: {
    view: 'project:view',
    create: 'project:create',
    edit: 'project:edit',
    delete: 'project:delete',
    manageTeam: 'project:manage-team',
    schedule: {
      view: 'project:schedule:view',
      edit: 'project:schedule:edit',
    },
    risk: {
      view: 'project:risk:view',
      create: 'project:risk:create',
      edit: 'project:risk:edit',
    },
    cost: {
      view: 'project:cost:view',
      edit: 'project:cost:edit',
    },
    resource: {
      view: 'project:resource:view',
      edit: 'project:resource:edit',
    },
  },
  change: {
    ecr: {
      view: 'change:ecr:view',
      create: 'change:ecr:create',
      approve: 'change:ecr:approve',
    },
    ecn: {
      view: 'change:ecn:view',
      create: 'change:ecn:create',
      approve: 'change:ecn:approve',
    },
  },
  workflow: {
    define: 'workflow:define',
    manage: 'workflow:manage',
    approve: 'workflow:approve',
  },
  masterData: {
    customer: {
      view: 'master-data:customer:view',
      edit: 'master-data:customer:edit',
    },
    product: {
      view: 'master-data:product:view',
      edit: 'master-data:product:edit',
    },
    supplier: {
      view: 'master-data:supplier:view',
      edit: 'master-data:supplier:edit',
    },
  },
} as const

export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  GM: 'gm',
  DIRECTOR: 'director',
  MANAGER: 'manager',
  PM: 'project_manager',
  QE: 'quality_engineer',
  PE: 'product_engineer',
  ME: 'manufacturing_engineer',
  BUYER: 'buyer',
  SQE: 'supplier_quality_engineer',
  EMPLOYEE: 'employee',
} as const
