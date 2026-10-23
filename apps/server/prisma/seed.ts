import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create departments
  const departments = await Promise.all([
    prisma.sysDepartment.upsert({
      where: { code: 'HQ' },
      update: {},
      create: { name: '总经理办公室', code: 'HQ', sortOrder: 1 },
    }),
    prisma.sysDepartment.upsert({
      where: { code: 'PM' },
      update: {},
      create: { name: '项目管理部', code: 'PM', sortOrder: 2 },
    }),
    prisma.sysDepartment.upsert({
      where: { code: 'RD' },
      update: {},
      create: { name: '研发部', code: 'RD', sortOrder: 3 },
    }),
    prisma.sysDepartment.upsert({
      where: { code: 'QE' },
      update: {},
      create: { name: '质量部', code: 'QE', sortOrder: 4 },
    }),
    prisma.sysDepartment.upsert({
      where: { code: 'ME' },
      update: {},
      create: { name: '工艺工程部', code: 'ME', sortOrder: 5 },
    }),
    prisma.sysDepartment.upsert({
      where: { code: 'PUR' },
      update: {},
      create: { name: '采购部', code: 'PUR', sortOrder: 6 },
    }),
    prisma.sysDepartment.upsert({
      where: { code: 'MFG' },
      update: {},
      create: { name: '制造部', code: 'MFG', sortOrder: 7 },
    }),
  ])

  console.log(`Created ${departments.length} departments`)

  // 2. Create permissions
  const permissionData = [
    { code: 'system:user:view', name: '查看用户', module: 'system' },
    { code: 'system:user:create', name: '创建用户', module: 'system' },
    { code: 'system:user:edit', name: '编辑用户', module: 'system' },
    { code: 'system:user:delete', name: '删除用户', module: 'system' },
    { code: 'system:role:view', name: '查看角色', module: 'system' },
    { code: 'system:role:create', name: '创建角色', module: 'system' },
    { code: 'system:role:edit', name: '编辑角色', module: 'system' },
    { code: 'system:role:delete', name: '删除角色', module: 'system' },
    { code: 'system:department:view', name: '查看部门', module: 'system' },
    { code: 'system:department:create', name: '创建部门', module: 'system' },
    { code: 'system:department:edit', name: '编辑部门', module: 'system' },
    { code: 'system:department:delete', name: '删除部门', module: 'system' },
    { code: 'system:audit-log:view', name: '查看审计日志', module: 'system' },
    { code: 'project:view', name: '查看项目', module: 'project' },
    { code: 'project:create', name: '创建项目', module: 'project' },
    { code: 'project:edit', name: '编辑项目', module: 'project' },
    { code: 'project:delete', name: '删除项目', module: 'project' },
    { code: 'project:manage-team', name: '管理项目团队', module: 'project' },
    { code: 'project:schedule:view', name: '查看进度计划', module: 'project' },
    { code: 'project:schedule:edit', name: '编辑进度计划', module: 'project' },
    { code: 'project:risk:view', name: '查看风险', module: 'project' },
    { code: 'project:risk:create', name: '登记风险', module: 'project' },
    { code: 'project:risk:edit', name: '编辑风险', module: 'project' },
    { code: 'project:cost:view', name: '查看成本', module: 'project' },
    { code: 'project:cost:edit', name: '编辑成本', module: 'project' },
    { code: 'project:resource:view', name: '查看资源', module: 'project' },
    { code: 'project:resource:edit', name: '编辑资源', module: 'project' },
    { code: 'change:ecr:view', name: '查看ECR', module: 'change' },
    { code: 'change:ecr:create', name: '创建ECR', module: 'change' },
    { code: 'change:ecr:approve', name: '审批ECR', module: 'change' },
    { code: 'change:ecn:view', name: '查看ECN', module: 'change' },
    { code: 'change:ecn:create', name: '创建ECN', module: 'change' },
    { code: 'change:ecn:approve', name: '审批ECN', module: 'change' },
    { code: 'workflow:define', name: '定义流程', module: 'workflow' },
    { code: 'workflow:manage', name: '管理流程', module: 'workflow' },
    { code: 'workflow:approve', name: '审批流程', module: 'workflow' },
    { code: 'master-data:customer:view', name: '查看客户', module: 'master-data' },
    { code: 'master-data:customer:edit', name: '编辑客户', module: 'master-data' },
    { code: 'master-data:product:view', name: '查看产品', module: 'master-data' },
    { code: 'master-data:product:edit', name: '编辑产品', module: 'master-data' },
    { code: 'master-data:supplier:view', name: '查看供应商', module: 'master-data' },
    { code: 'master-data:supplier:edit', name: '编辑供应商', module: 'master-data' },
  ]

  const permissions = await Promise.all(
    permissionData.map((p) =>
      prisma.sysPermission.upsert({
        where: { code: p.code },
        update: {},
        create: p,
      }),
    ),
  )

  console.log(`Created ${permissions.length} permissions`)

  // 3. Create roles
  const adminRole = await prisma.sysRole.upsert({
    where: { code: 'admin' },
    update: {},
    create: { code: 'admin', name: '系统管理员', isSystem: true },
  })

  const gmRole = await prisma.sysRole.upsert({
    where: { code: 'gm' },
    update: {},
    create: { code: 'gm', name: '总经理', isSystem: true },
  })

  const pmRole = await prisma.sysRole.upsert({
    where: { code: 'project_manager' },
    update: {},
    create: { code: 'project_manager', name: '项目经理', isSystem: true },
  })

  const qeRole = await prisma.sysRole.upsert({
    where: { code: 'quality_engineer' },
    update: {},
    create: { code: 'quality_engineer', name: '质量工程师', isSystem: true },
  })

  const peRole = await prisma.sysRole.upsert({
    where: { code: 'product_engineer' },
    update: {},
    create: { code: 'product_engineer', name: '产品工程师', isSystem: true },
  })

  const buyerRole = await prisma.sysRole.upsert({
    where: { code: 'buyer' },
    update: {},
    create: { code: 'buyer', name: '采购员', isSystem: true },
  })

  console.log('Created roles')

  // 4. Assign all permissions to admin role
  const allPermissionIds = permissions.map((p) => p.id)
  await prisma.sysRolePermission.deleteMany({ where: { roleId: adminRole.id } })
  if (allPermissionIds.length > 0) {
    await prisma.sysRolePermission.createMany({
      data: allPermissionIds.map((permissionId) => ({ roleId: adminRole.id, permissionId })),
    })
  }

  // Assign limited permissions to other roles
  const pmPermissions = permissions.filter((p) =>
    p.code.startsWith('project:') || p.code.startsWith('change:ecr:') || p.code === 'workflow:approve',
  )
  await prisma.sysRolePermission.deleteMany({ where: { roleId: pmRole.id } })
  if (pmPermissions.length > 0) {
    await prisma.sysRolePermission.createMany({
      data: pmPermissions.map((p) => ({ roleId: pmRole.id, permissionId: p.id })),
    })
  }

  console.log('Assigned permissions to roles')

  // 5. Create default users
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.sysUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      realName: '系统管理员',
      email: 'admin@apqp-system.local',
      departmentId: departments[0].id,
      status: 1,
    },
  })

  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  })

  // Create demo users
  const demoPassword = await bcrypt.hash('demo123456', 10)
  const demoUsers = [
    { username: 'pm_zhang', realName: '张项目经理', departmentId: departments[1].id, roleId: pmRole.id },
    { username: 'qe_li', realName: '李质量工程师', departmentId: departments[3].id, roleId: qeRole.id },
    { username: 'pe_wang', realName: '王产品工程师', departmentId: departments[2].id, roleId: peRole.id },
    { username: 'buyer_zhao', realName: '赵采购员', departmentId: departments[5].id, roleId: buyerRole.id },
  ]

  for (const du of demoUsers) {
    const user = await prisma.sysUser.upsert({
      where: { username: du.username },
      update: {},
      create: {
        username: du.username,
        passwordHash: demoPassword,
        realName: du.realName,
        departmentId: du.departmentId,
        status: 1,
      },
    })
    await prisma.sysUserRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: du.roleId } },
      update: {},
      create: { userId: user.id, roleId: du.roleId },
    })
  }

  console.log('Created default users')

  // 6. Create sequences
  const sequences = [
    { seqName: 'PRJ', currentVal: 0, prefix: 'PRJ', dateFormat: 'YYYYMMDD' },
    { seqName: 'RSK', currentVal: 0, prefix: 'RSK', dateFormat: 'YYYYMMDD' },
    { seqName: 'ECR', currentVal: 0, prefix: 'ECR', dateFormat: 'YYYYMMDD' },
    { seqName: 'ECN', currentVal: 0, prefix: 'ECN', dateFormat: 'YYYYMMDD' },
    { seqName: 'PO', currentVal: 0, prefix: 'PO', dateFormat: 'YYYYMMDD' },
    { seqName: 'PPAP', currentVal: 0, prefix: 'PPAP', dateFormat: 'YYYYMMDD' },
    { seqName: 'DOC', currentVal: 0, prefix: 'DOC', dateFormat: 'YYYYMMDD' },
  ]

  for (const seq of sequences) {
    await prisma.sysSequence.upsert({
      where: { seqName: seq.seqName },
      update: {},
      create: seq,
    })
  }

  console.log('Created sequences')

  // 7. Create system configs
  const configs = [
    { configKey: 'system.name', configValue: 'APQP 项目管理系统', description: '系统名称' },
    { configKey: 'system.version', configValue: '1.0.0', description: '系统版本' },
    { configKey: 'workflow.auto_approve_threshold', configValue: '10000', description: '自动审批金额阈值' },
    { configKey: 'alert.schedule_overdue_days', configValue: '3', description: '进度超期预警天数' },
  ]

  for (const cfg of configs) {
    await prisma.sysConfig.upsert({
      where: { configKey: cfg.configKey },
      update: {},
      create: cfg,
    })
  }

  console.log('Created system configs')

  console.log('Seeding completed!')
  console.log('')
  console.log('Default accounts:')
  console.log('  admin / admin123 (系统管理员)')
  console.log('  pm_zhang / demo123456 (项目经理)')
  console.log('  qe_li / demo123456 (质量工程师)')
  console.log('  pe_wang / demo123456 (产品工程师)')
  console.log('  buyer_zhao / demo123456 (采购员)')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
