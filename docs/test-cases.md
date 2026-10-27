# 魔程化解 APQP 系统 — 后端单元测试用例文档

> **版本**: V1.0  
> **日期**: 2026-10-28  
> **测试框架**: Jest 29 + ts-jest  
> **测试套件**: 13 个  
> **测试用例**: 316 个（全部通过）

---

## 目录

> **说明**: 各章节详细用例表列出的是关键/代表性测试用例。部分套件的完整用例数多于表中列出的数量（因表格仅展示核心场景），完整用例清单请查看对应的 `.spec.ts` 源文件。

1. [测试基础设施](#1-测试基础设施)
2. [认证服务 (AuthService)](#2-认证服务-authservice)
3. [用户服务 (UserService)](#3-用户服务-userservice)
4. [项目服务 (ProjectService)](#4-项目服务-projectservice)
5. [问题管理服务 (IssueService)](#5-问题管理服务-issueservice)
6. [配置服务 (ConfigService)](#6-配置服务-configservice)
7. [CSV 工具 (csv.util)](#7-csv-工具-csvutil)
8. [功能安全服务 (SafetyService)](#8-功能安全服务-safetyservice)
9. [质量管理服务 (QualityService)](#9-质量管理服务-qualityservice)
10. [FMEA 服务 (FmeaService)](#10-fmea-服务-fmeaservice)
11. [成本管理服务 (CostService)](#11-成本管理服务-costservice)
12. [采购管理服务 (ProcurementService)](#12-采购管理服务-procurementservice)
13. [工程变更服务 (ChangeService)](#13-工程变更服务-changeservice)
14. [仪表盘服务 (DashboardService)](#14-仪表盘服务-dashboardservice)
15. [运行测试](#15-运行测试)

---

## 1. 测试基础设施

### 1.1 共享 Prisma Mock

**文件**: `apps/server/src/__tests__/helpers/prisma.mock.ts`

所有测试共用同一个 Prisma 服务 mock，覆盖 ~62 个 Prisma 模型。每个模型自动具备以下方法：

| 方法 | 用途 |
|------|------|
| `findUnique` | 按唯一条件查询 |
| `findUniqueOrThrow` | 按唯一条件查询（不存在则抛异常） |
| `findMany` | 列表查询 |
| `create` | 创建记录 |
| `createMany` | 批量创建 |
| `update` | 更新记录 |
| `delete` | 删除记录 |
| `deleteMany` | 批量删除 |
| `count` | 计数查询 |
| `upsert` | 创建或更新 |
| `groupBy` | 分组查询 |
| `aggregate` | 聚合查询 |

### 1.2 MockDecimal

成本相关测试使用 `MockDecimal` 替代 `@prisma/client` 的 `Prisma.Decimal`，支持：
- 四则运算：`add`, `sub`, `mul`, `div`
- 类型转换：`toNumber`, `valueOf`（`Number()` 隐式转换必需）
- 比较：`isZero`, `gte`

### 1.3 测试模式

所有测试采用**直接实例化**模式（非 NestJS Test Module）：

```typescript
const prisma = createMockPrismaService()
const service = new XxxService(prisma as any)
```

---

## 2. 认证服务 (AuthService)

**文件**: `apps/server/src/__tests__/auth.service.spec.ts`  
**用例数**: 13

### 2.1 登录 (login)

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 有效凭证返回 token 和用户数据 | JWT 签发、用户信息返回 |
| 2 | 用户不存在抛 UnauthorizedException | 错误处理 |
| 3 | 用户被禁用抛 UnauthorizedException | 状态校验 |
| 4 | 密码错误抛 UnauthorizedException | bcrypt 比对 |
| 5 | 权限去重 | 多角色权限合并 |

### 2.2 刷新令牌 (refreshToken)

| # | 用例 | 验证点 |
|---|------|--------|
| 6 | 有效 refreshToken 返回新令牌对 | 令牌轮换 |
| 7 | 无效 token 抛异常 | 校验失败 |
| 8 | 禁用用户抛异常 | 状态校验 |

### 2.3 获取个人信息 (getProfile)

| # | 用例 | 验证点 |
|---|------|--------|
| 9 | 返回用户 profile | 字段完整性 |
| 10 | 用户不存在抛异常 | 错误处理 |

### 2.4 修改密码 (changePassword)

| # | 用例 | 验证点 |
|---|------|--------|
| 11 | 旧密码正确时更新哈希 | bcrypt 加密 |
| 12 | 旧密码错误抛异常 | 校验逻辑 |

---

## 3. 用户服务 (UserService)

**文件**: `apps/server/src/__tests__/user.service.spec.ts`  
**用例数**: 7

### 3.1 列表查询 (findAll)

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 分页返回用户列表 | skip/take 计算 |
| 2 | 按关键词过滤 | realName/username 模糊匹配 |
| 3 | 按部门过滤 | departmentId 条件 |

### 3.2 详情查询 (findOne)

| # | 用例 | 验证点 |
|---|------|--------|
| 4 | 按 ID 返回用户 | include 关联 |
| 5 | 用户不存在抛 NotFoundException | 错误处理 |

### 3.3 创建用户 (create)

| # | 用例 | 验证点 |
|---|------|--------|
| 6 | 密码哈希后创建用户 | bcrypt 加密 |
| 7 | 用户名重复抛 ConflictException | 唯一性校验 |

---

## 4. 项目服务 (ProjectService)

**文件**: `apps/server/src/__tests__/project.service.spec.ts`  
**用例数**: 7

### 4.1 列表查询 (findAll)

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 分页返回项目列表 | skip/take 计算 |
| 2 | 按状态过滤 | status 条件 |
| 3 | 按关键词过滤 | projectName 模糊匹配 |
| 4 | 第 2 页 skip 计算正确 | 分页逻辑 |

### 4.2 详情查询 (findOne)

| # | 用例 | 验证点 |
|---|------|--------|
| 5 | 按 ID 返回项目 | include 关联 |
| 6 | 项目不存在抛 NotFoundException | 错误处理 |

### 4.3 创建项目 (create)

| # | 用例 | 验证点 |
|---|------|--------|
| 7 | 自动生成项目编号 (PRJ+日期+序号) | 编号规则 |

---

## 5. 问题管理服务 (IssueService)

**文件**: `apps/server/src/__tests__/issue.service.spec.ts`  
**用例数**: 7

### 5.1 列表查询 (findAllIssues)

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 分页返回问题列表 | skip/take |
| 2 | 按项目 ID 过滤 | projectId 条件 |
| 3 | 按状态过滤 | status 条件 |
| 4 | 按类型和严重度过滤 | issueType + severity |

### 5.2 详情查询 (findOneIssue)

| # | 用例 | 验证点 |
|---|------|--------|
| 5 | 按 ID 返回问题 | include 关联 |
| 6 | 问题不存在抛 NotFoundException | 错误处理 |

### 5.3 创建问题 (createIssue)

| # | 用例 | 验证点 |
|---|------|--------|
| 7 | 自动生成问题编号 | 编号规则 |

---

## 6. 配置服务 (ConfigService)

**文件**: `apps/server/src/__tests__/config.service.spec.ts`  
**用例数**: 8

### 6.1 列表查询 (findAll)

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 按 key 排序返回所有配置 | orderBy |

### 6.2 详情查询 (findOne)

| # | 用例 | 验证点 |
|---|------|--------|
| 2 | 按 key 返回配置 | 唯一查询 |
| 3 | 配置不存在抛 NotFoundException | 错误处理 |

### 6.3 获取值 (getValue)

| # | 用例 | 验证点 |
|---|------|--------|
| 4 | 返回配置值字符串 | value 字段 |
| 5 | 不存在返回 null | 容错处理 |

### 6.4 创建/更新 (upsert)

| # | 用例 | 验证点 |
|---|------|--------|
| 6 | 创建或更新配置 | upsert 语义 |

### 6.5 删除 (delete)

| # | 用例 | 验证点 |
|---|------|--------|
| 7 | 删除配置返回成功 | 删除操作 |

### 6.6 批量更新 (bulkUpsert)

| # | 用例 | 验证点 |
|---|------|--------|
| 8 | 批量 upsert 多条配置 | 事务处理 |

---

## 7. CSV 工具 (csv.util)

**文件**: `apps/server/src/__tests__/csv.util.spec.ts`  
**用例数**: 13

### 7.1 字段转义 (escapeCsvField)

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | null 返回空字符串 | 空值处理 |
| 2 | undefined 返回空字符串 | 空值处理 |
| 3 | 无特殊字符原样返回 | 正常路径 |
| 4 | 含逗号时双引号包裹 | CSV 规范 |
| 5 | 含双引号时转义处理 | CSV 规范 |
| 6 | 含换行符时双引号包裹 | CSV 规范 |
| 7 | 数字转字符串 | 类型转换 |
| 8 | 布尔值转字符串 | 类型转换 |

### 7.2 生成 CSV (generateCsv)

| # | 用例 | 验证点 |
|---|------|--------|
| 9 | 生成含表头和行的 CSV | 基本功能 |
| 10 | 处理空行 | 边界条件 |
| 11 | 行内含逗号的字段自动转义 | 转义逻辑 |
| 12 | 行内含 null 值处理 | 空值处理 |
| 13 | 包含 BOM 头 (UTF-8 编码) | Excel 兼容性 |

---

## 8. 功能安全服务 (SafetyService)

**文件**: `apps/server/src/__tests__/safety.service.spec.ts`  
**用例数**: 32

### 8.1 危害分析 (Hazard Analysis)

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 按项目 ID 过滤列表 | projectId 条件 |
| 2 | 按状态和 ASIL 等级过滤 | 多条件组合 |
| 3 | 按 ID 查询详情 | findUnique |
| 4 | 不存在抛 NotFoundException | 错误处理 |
| 5 | 创建时自动计算 ASIL (QM) | S×E×C 矩阵查表 |
| 6 | 最高严重度/暴露度/可控性计算 ASIL D | 边界值 |
| 7 | 更新时重新计算 ASIL | 联动更新 |
| 8 | 更新不存在的危害抛异常 | 错误处理 |
| 9 | 删除危害 | 删除操作 |
| 10 | 按 ASIL 和状态分组统计 | 聚合查询 |

### 8.2 安全目标 (Safety Goals)

| # | 用例 | 验证点 |
|---|------|--------|
| 11 | 按过滤条件列出目标 | 列表查询 |
| 12 | 从扁平列表构建目标树 | 树形结构 |
| 13 | 不存在抛 NotFoundException | 错误处理 |

### 8.3 FTA 事件 (FTA Events)

| # | 用例 | 验证点 |
|---|------|--------|
| 14 | 查询顶层事件 (parentId=null) | 根节点过滤 |
| 15 | AND 门概率计算 (子事件概率之积) | 概率公式 |
| 16 | OR 门概率计算 (1 - 补集之积) | 概率公式 |
| 17 | 不存在顶层事件抛异常 | 错误处理 |
| 18 | 构建 FTA 树数据 | 递归结构 |

### 8.4 安全案例 (Safety Cases)

| # | 用例 | 验证点 |
|---|------|--------|
| 19 | 自动编号创建案例 | 编号规则 |
| 20 | 审批通过案例 | 状态流转 |
| 21 | 构建合规矩阵与覆盖率 | 目标-证据关联 |
| 22 | 不存在的案例抛异常 | 错误处理 |

### 8.5 安全评审 (Safety Reviews)

| # | 用例 | 验证点 |
|---|------|--------|
| 23 | 自动编号创建评审（默认状态） | 编号 + 默认值 |
| 24 | 完成评审并记录结论 | 状态流转 |
| 25 | 更新不存在的评审抛异常 | 错误处理 |

### 8.6 安全概念 (Safety Concepts)

| # | 用例 | 验证点 |
|---|------|--------|
| 26 | 构建概念树 | 树形结构 |
| 27 | 自动编号创建概念 | 编号规则 |

### 8.7 安全需求 (Safety Requirements)

| # | 用例 | 验证点 |
|---|------|--------|
| 28 | 获取追溯矩阵与覆盖率统计 | 需求-目标关联 |

### 8.8 工具资质 (Tool Qualification)

| # | 用例 | 验证点 |
|---|------|--------|
| 29 | 日期解析创建工具记录 | 日期处理 |
| 30 | 更新不存在的工具抛异常 | 错误处理 |

### 8.9 确认措施 (Confirmation Measures)

| # | 用例 | 验证点 |
|---|------|--------|
| 31 | 完成措施（通过/失败状态） | 状态流转 |
| 32 | passed=false 时状态设为 failed | 联动逻辑 |

---

## 9. 质量管理服务 (QualityService)

**文件**: `apps/server/src/__tests__/quality.service.spec.ts`  
**用例数**: 27

### 9.1 质量问题 (Quality Problems)

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 按过滤条件列出问题 | 列表查询 |
| 2 | 自动编号创建问题 | 编号规则 |
| 3 | 分配问题并变更状态为 analyzing | 状态流转 |
| 4 | 关闭问题记录用户和时间戳 | 关闭操作 |
| 5 | 问题升级状态 | 升级逻辑 |

### 9.2 8D 报告 (8D Reports)

| # | 用例 | 验证点 |
|---|------|--------|
| 6 | 创建 8D 报告并更新问题状态 | 关联创建 |
| 7 | 更新 D1 步骤并计算完成率 | 进度计算 |
| 8 | 只提取指定步骤的字段 | 局部更新 |
| 9 | 日期字段转换处理 | 日期解析 |

### 9.3 不合格品 (Nonconformances)

| # | 用例 | 验证点 |
|---|------|--------|
| 10 | 自动编号创建不合格品 | 编号规则 |
| 11 | 处置不合格品并记录成本影响 | 处置 + 成本 |

### 9.4 纠正预防措施 (CAPA)

| # | 用例 | 验证点 |
|---|------|--------|
| 12 | 自动编号创建 CAPA（pending 状态） | 编号 + 默认值 |
| 13 | 验证 CAPA 并记录有效性结果 | 验证操作 |
| 14 | 关闭 CAPA | 状态流转 |

### 9.5 检验记录 (Inspections)

| # | 用例 | 验证点 |
|---|------|--------|
| 15 | 创建合格检验记录 | 正常路径 |
| 16 | 检验不合格时自动创建不合格品记录 | 联动创建 |

### 9.6 统计 (Statistics)

| # | 用例 | 验证点 |
|---|------|--------|
| 17 | 概览统计含所有 KPI | 聚合查询 |
| 18 | 问题账龄分布计算（5 个区间） | 0-3/4-7/8-14/15-30/30+ 天 |
| 19 | 按处置方式汇总质量成本 | 分组聚合 |
| 20 | 按数量排序的 Top 缺陷类型 | Pareto 分析 |

### 9.7 PPM 记录 (PPM Records)

| # | 用例 | 验证点 |
|---|------|--------|
| 21 | 自动计算 PPM 值和状态 | defectParts/totalParts × 1,000,000 |
| 22 | PPM 在目标内状态为 on_track | 阈值判断 |
| 23 | PPM 在目标 1~1.5 倍之间状态为 warning | 区间判断 |
| 24 | 从不合格品数据计算 PPM | 关联计算 |

### 9.8 手动升级 (Manual Escalation)

| # | 用例 | 验证点 |
|---|------|--------|
| 25 | 创建升级历史和告警 | 升级记录 |

### 9.9 8D 关闭趋势 (8D Closure Trend)

| # | 用例 | 验证点 |
|---|------|--------|
| 26 | 构建月度趋势数据 | 时间序列聚合 |

---

## 10. FMEA 服务 (FmeaService)

**文件**: `apps/server/src/__tests__/fmea.service.spec.ts`  
**用例数**: 30

### 10.1 DFMEA

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 按项目过滤列出 DFMEA | 列表查询 |
| 2 | 自动编号创建 DFMEA | 编号规则 |
| 3 | 审批通过 DFMEA | 状态流转 |
| 4 | 复制 DFMEA 含递归子项 | 深拷贝 |
| 5 | 复制不存在的 DFMEA 抛异常 | 错误处理 |

### 10.2 DFMEA 子项与 AP 计算

| # | 用例 | 验证点 |
|---|------|--------|
| 6 | 创建子项自动计算 AP 评级 | S×O×D → H/M/L 查表 |
| 7 | 更新评分重新计算 AP | 联动计算 |
| 8 | 删除子项级联删除所有子节点 | 递归删除 |

### 10.3 过程流 (Process Flow)

| # | 用例 | 验证点 |
|---|------|--------|
| 9 | 自动编号创建过程流 | 编号规则 |
| 10 | 向过程流添加步骤 | 关联创建 |

### 10.4 PFMEA

| # | 用例 | 验证点 |
|---|------|--------|
| 11 | 自动编号创建 PFMEA | 编号规则 |
| 12 | 创建 PFMEA 子项含 AP 计算 | AP 评级 |
| 13 | 审批通过 PFMEA | 状态流转 |

### 10.5 控制计划 (Control Plan)

| # | 用例 | 验证点 |
|---|------|--------|
| 14 | 自动编号创建控制计划 | 编号规则 |
| 15 | 从审批通过的 PFMEA 生成控制计划子项 | 联动生成 |
| 16 | 从不存在的控制计划生成抛异常 | 错误处理 |

### 10.6 特殊特性 (Special Characteristics)

| # | 用例 | 验证点 |
|---|------|--------|
| 17 | 获取 DFMEA→PFMEA→控制计划追溯链 | 跨模型关联 |
| 18 | 不存在的特殊特性抛异常 | 错误处理 |

### 10.7 SPC 研究 (SPC Studies)

| # | 用例 | 验证点 |
|---|------|--------|
| 19 | 自动编号创建 SPC 研究 | 编号规则 |
| 20 | 计算过程能力指数 Cp/Cpk/Pp/Ppk | 统计公式 |
| 21 | 无数据点时计算抛异常 | 边界条件 |
| 22 | 获取 SPC 图表数据 | 数据查询 |

### 10.8 MSA 研究 (MSA Studies)

| # | 用例 | 验证点 |
|---|------|--------|
| 23 | 自动编号创建 MSA 研究 | 编号规则 |
| 24 | 计算 GR&R (EV/AV/GRR/PV/TV/NDC) | MSA 公式 |
| 25 | 无测量数据时计算抛异常 | 边界条件 |

### 10.9 知识库 (Knowledge Base)

| # | 用例 | 验证点 |
|---|------|--------|
| 26 | 按关键词匹配推荐对策 | 智能推荐 |
| 27 | 使用次数递增 | 计数器 |

### 10.10 统计 (Statistics)

| # | 用例 | 验证点 |
|---|------|--------|
| 28 | 概览统计含所有计数 | 聚合查询 |
| 29 | AP 分布按 H/M/L 分组 | 分组统计 |

---

## 11. 成本管理服务 (CostService)

**文件**: `apps/server/src/__tests__/cost.service.spec.ts`  
**用例数**: 56

### 11.1 成本估算 (Estimates)

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 按项目 ID 过滤估算列表 | 列表查询 |
| 2 | 无过滤条件返回所有估算 | 全量查询 |
| 3 | 按状态和版本过滤 | 多条件组合 |
| 4 | 返回估算详情含关联 | include 查询 |
| 5 | 创建估算含子项并计算总额 | 关联创建 + 汇总 |
| 6 | 创建无子项的估算 | 空子项处理 |
| 7 | 更新草稿状态估算 | 状态限制 |
| 8 | 非草稿状态不可更新抛异常 | 业务规则 |
| 9 | 删除草稿状态估算 | 状态限制 |
| 10 | 非草稿状态不可删除抛异常 | 业务规则 |
| 11 | 计算估算总额并更新状态 | 汇总计算 |

### 11.2 估算工作流

| # | 用例 | 验证点 |
|---|------|--------|
| 12 | 提交估算 → pending_approval | 状态流转 |
| 13 | 审批通过 → approved | 状态流转 |
| 14 | 审批驳回 → rejected | 状态流转 |

### 11.3 发布估算 (publishEstimate)

| # | 用例 | 验证点 |
|---|------|--------|
| 15 | 非审批状态不可发布抛异常 | 前置条件 |
| 16 | 按类别创建预算并发布 | 联动创建 |

### 11.4 估算子项 (Estimate Items)

| # | 用例 | 验证点 |
|---|------|--------|
| 17 | 创建子项重新计算总额 | 联动计算 |
| 18 | 更新子项数量和单价重新计算 | 联动计算 |
| 19 | 删除子项重新计算 | 联动计算 |
| 20 | 批量更新子项（删旧建新） | 批量操作 |

### 11.5 预算 (Budgets)

| # | 用例 | 验证点 |
|---|------|--------|
| 21 | 按过滤条件列出预算 | 列表查询 |
| 22 | 返回预算详情含关联 | include 查询 |
| 23 | 创建预算含 Decimal 金额 | 精度处理 |
| 24 | 更新预算金额 | 更新操作 |
| 25 | 删除草稿预算 | 状态限制 |
| 26 | 非草稿不可删除抛异常 | 业务规则 |

### 11.6 预算调整 (Adjustments)

| # | 用例 | 验证点 |
|---|------|--------|
| 27 | 按过滤条件列出调整 | 列表查询 |
| 28 | 创建调整从预算获取原始金额 | 关联查询 |
| 29 | 审批通过调整并更新预算 | 联动更新 |
| 30 | 非待审批状态不可审批抛异常 | 前置条件 |
| 31 | 驳回调整 | 状态流转 |

### 11.7 成本条目 (Cost Entries)

| # | 用例 | 验证点 |
|---|------|--------|
| 32 | 按过滤条件列出条目 | 列表查询 |
| 33 | 按日期范围过滤 | 时间区间 |
| 34 | 创建条目重新计算实际金额 | 联动计算 |
| 35 | 更新条目重新计算 | 联动计算 |
| 36 | 删除条目重新计算 | 联动计算 |
| 37 | 批量导入条目按 costId 重新计算 | 批量操作 |

### 11.8 偏差分析 (Variance)

| # | 用例 | 验证点 |
|---|------|--------|
| 38 | 按类别计算偏差和汇总 | CPI/varianceRate |
| 39 | 零实际金额时 CPI=1 | 边界条件 |
| 40 | 零预算时 varianceRate=0 | 边界条件 |

### 11.9 成本跟踪 (Tracking)

| # | 用例 | 验证点 |
|---|------|--------|
| 41 | 按月汇总条目含累计总额 | 时间聚合 |

### 11.10 成本分析

| # | 用例 | 验证点 |
|---|------|--------|
| 42 | 项目维度分析含类别汇总 | 分组聚合 |
| 43 | 零预算处理 | 边界条件 |
| 44 | 部门维度按项目聚合 | 跨项目分析 |
| 45 | 公司维度按项目等级聚合 | 多层级分析 |
| 46 | 默认当前年度 | 默认值 |

### 11.11 盈利能力 (Profitability)

| # | 用例 | 验证点 |
|---|------|--------|
| 47 | 按项目等级返回目标利润率 | 等级映射 |
| 48 | 无等级默认 L4 利润率 | 默认值 |

### 11.12 成本告警 (Alerts)

| # | 用例 | 验证点 |
|---|------|--------|
| 49 | 按过滤条件列出告警 | 列表查询 |
| 50 | 标记告警为已解决 | 状态更新 |
| 51 | 实际≥预算(100%)创建红色告警 | 阈值判断 |
| 52 | 实际≥预算90%创建橙色告警 | 阈值判断 |
| 53 | 实际≥预算80%创建黄色告警 | 阈值判断 |
| 54 | 零预算跳过告警 | 边界条件 |
| 55 | 实际<80%不创建告警 | 正常范围 |
| 56 | 告警消息使用类别标签 | 消息格式化 |

---

## 12. 采购管理服务 (ProcurementService)

**文件**: `apps/server/src/__tests__/procurement.service.spec.ts`  
**用例数**: 50

### 12.1 采购申请 (Purchase Requests)

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 按过滤条件列出申请 | 列表查询 |
| 2 | 无过滤返回所有申请 | 全量查询 |
| 3 | 按类别和申请人过滤 | 多条件组合 |
| 4 | 返回申请详情含关联 | include 查询 |
| 5 | 创建申请含子项计算总额 | 关联创建 |
| 6 | 创建无子项申请 | 空子项处理 |
| 7 | 更新申请含替换子项 | 子项重建 |
| 8 | 不含子项的更新 | 部分更新 |
| 9 | 删除申请 | 删除操作 |

### 12.2 申请工作流

| # | 用例 | 验证点 |
|---|------|--------|
| 10 | 提交 → pending | 状态流转 |
| 11 | 审批通过 → approved | 状态流转 |
| 12 | 驳回 → rejected | 状态流转 |
| 13 | 取消 → cancelled | 状态流转 |

### 12.3 申请子项

| # | 用例 | 验证点 |
|---|------|--------|
| 14 | 添加子项重新计算总额 | 联动计算 |
| 15 | 更新子项重新计算 | 联动计算 |
| 16 | 删除子项重新计算 | 联动计算 |

### 12.4 采购订单 (Purchase Orders)

| # | 用例 | 验证点 |
|---|------|--------|
| 17 | 按过滤条件列出订单 | 列表查询 |
| 18 | 返回订单详情含关联 | include 查询 |
| 19 | 非审批申请不可转订单抛异常 | 前置条件 |
| 20 | 从审批通过申请创建订单 | 联动创建 |
| 21 | 使用自定义单价 | 价格覆盖 |
| 22 | 直接创建订单 | 独立创建 |

### 12.5 订单工作流

| # | 用例 | 验证点 |
|---|------|--------|
| 23 | 确认 → confirmed | 状态流转 |
| 24 | 收货更新收货数量 | 数量更新 |
| 25 | 未全部收货状态为 in_transit | 部分收货 |
| 26 | 关闭 → closed | 状态流转 |
| 27 | 取消 → cancelled | 状态流转 |

### 12.6 订单子项

| # | 用例 | 验证点 |
|---|------|--------|
| 28 | 添加子项重新计算总额 | 联动计算 |
| 29 | 更新子项重新计算 | 联动计算 |
| 30 | 删除子项重新计算 | 联动计算 |

### 12.7 供应商管理 (Suppliers)

| # | 用例 | 验证点 |
|---|------|--------|
| 31 | 按过滤条件列出供应商 | 列表查询 |
| 32 | 按关键词搜索 | 模糊匹配 |
| 33 | 返回供应商详情含关联 | include 查询 |
| 34 | 准入 → qualified | 状态流转 |
| 35 | 拉黑 → blacklisted | 状态流转 |
| 36 | 恢复 → probation | 状态流转 |

### 12.8 供应商评价 (Evaluations)

| # | 用例 | 验证点 |
|---|------|--------|
| 37 | 按过滤条件列出评价 | 列表查询 |
| 38 | 返回评价详情 | include 查询 |
| 39 | 加权评分 (质量40%+交付30%+成本20%+服务10%) | 加权算法 |
| 40 | 总分≥90 等级 A | 等级划分 |
| 41 | 总分≥70 等级 C | 等级划分 |
| 42 | 总分<70 等级 D | 等级划分 |

### 12.9 供应商审计 (Audits)

| # | 用例 | 验证点 |
|---|------|--------|
| 43 | 按过滤条件列出审计 | 列表查询 |
| 44 | 返回审计详情 | include 查询 |
| 45 | 创建审计含默认值 | 默认状态 |
| 46 | 创建审计含自定义结果 | 自定义字段 |
| 47 | 更新审计 | 更新操作 |

### 12.10 统计与绩效

| # | 用例 | 验证点 |
|---|------|--------|
| 48 | 概览统计含聚合 KPI | Promise.all 聚合 |
| 49 | 空聚合结果处理 | 边界条件 |
| 50 | 合格供应商绩效指标 | 绩效计算 |

---

## 13. 工程变更服务 (ChangeService)

**文件**: `apps/server/src/__tests__/change.service.spec.ts`  
**用例数**: 55

### 13.1 ECR 管理

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 按过滤条件列出 ECR | 列表查询 |
| 2 | 无过滤返回所有 ECR | 全量查询 |
| 3 | 返回 ECR 详情含关联 | include 查询 |
| 4 | 自动编号创建 ECR | ECR+日期+序号 |
| 5 | 更新草稿 ECR | 状态限制 |
| 6 | ECR 不存在抛异常 | 错误处理 |
| 7 | 非草稿不可更新抛异常 | 业务规则 |
| 8 | 删除草稿 ECR | 状态限制 |
| 9 | ECR 不存在抛异常 | 错误处理 |
| 10 | 非草稿不可删除抛异常 | 业务规则 |

### 13.2 ECR 工作流

| # | 用例 | 验证点 |
|---|------|--------|
| 11 | draft → submitted | 状态流转 |
| 12 | submitted → impact_analysis | 状态流转 |
| 13 | impact_analysis → ccb_review | 状态流转 |
| 14 | 非法转换抛异常 | 状态校验 |
| 15 | approved → closed | 状态流转 |
| 16 | ccb_review 审批通过并创建评审记录 | 联动创建 |
| 17 | ECR 不存在抛异常 | 错误处理 |
| 18 | 非 ccb_review 不可审批抛异常 | 前置条件 |
| 19 | ccb_review 驳回并创建评审记录 | 联动创建 |
| 20 | 非 ccb_review 不可驳回抛异常 | 前置条件 |

### 13.3 ECR 影响项 (Impact Items)

| # | 用例 | 验证点 |
|---|------|--------|
| 21 | 自动 sortOrder 创建影响项 | 排序计算 |
| 22 | ECR 不存在抛异常 | 错误处理 |
| 23 | 更新影响项 | 更新操作 |
| 24 | 删除影响项 | 删除操作 |

### 13.4 CCB 评审 (CCB Reviews)

| # | 用例 | 验证点 |
|---|------|--------|
| 25 | 按过滤条件列出评审 | 列表查询 |
| 26 | 创建评审记录 | 创建操作 |
| 27 | ECR 不存在抛异常 | 错误处理 |
| 28 | 更新评审记录 | 更新操作 |

### 13.5 ECN 管理

| # | 用例 | 验证点 |
|---|------|--------|
| 29 | 按过滤条件列出 ECN | 列表查询 |
| 30 | 返回 ECN 详情含关联 | include 查询 |
| 31 | 从审批通过 ECR 创建 ECN | 联动创建 |
| 32 | ECR 不存在抛异常 | 错误处理 |
| 33 | ECR 非审批状态不可创建抛异常 | 前置条件 |
| 34 | 更新 ECN | 更新操作 |
| 35 | ECN 不存在抛异常 | 错误处理 |

### 13.6 ECN 工作流

| # | 用例 | 验证点 |
|---|------|--------|
| 36 | planning → executing | 状态流转 |
| 37 | executing → verifying | 状态流转 |
| 38 | 非法转换抛异常 | 状态校验 |
| 39 | verifying 状态关闭 ECN（无待处理项） | 关闭条件 |
| 40 | ECN 不存在抛异常 | 错误处理 |
| 41 | 非 verifying 不可关闭抛异常 | 前置条件 |
| 42 | 有待处理行动项不可关闭抛异常 | 业务约束 |

### 13.7 ECN 行动项 (Action Items)

| # | 用例 | 验证点 |
|---|------|--------|
| 43 | 自动 sortOrder 创建行动项 | 排序计算 |
| 44 | ECN 不存在抛异常 | 错误处理 |
| 45 | 更新行动项 | 更新操作 |
| 46 | 删除行动项 | 删除操作 |
| 47 | 完成 pending 状态行动项 | 状态流转 |
| 48 | 完成 in_progress 状态行动项 | 状态流转 |
| 49 | 行动项不存在抛异常 | 错误处理 |
| 50 | 非 pending/in_progress 不可完成抛异常 | 前置条件 |
| 51 | 验证已完成行动项 | 状态流转 |
| 52 | 行动项不存在抛异常 | 错误处理 |
| 53 | 非 completed 不可验证抛异常 | 前置条件 |

### 13.8 统计

| # | 用例 | 验证点 |
|---|------|--------|
| 54 | 概览统计含聚合数据 | 聚合查询 |
| 55 | 无 ECN 时关闭率=0 | 边界条件 |

---

## 14. 仪表盘服务 (DashboardService)

**文件**: `apps/server/src/__tests__/dashboard.service.spec.ts`  
**用例数**: 11

### 14.1 概览 (getOverview)

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 22 个 Promise.all 查询返回完整统计 | 跨模块聚合 |

**覆盖指标**:
- 项目统计：总数/活跃/暂停/完成
- 我的任务：WBS/风险/ECR/ECN行动/问题/CAPA/DFMEA/PFMEA/流程待办
- 质量：开放问题/严重问题/开放CAPA
- 变更：开放ECR/活跃ECN
- FMEA：高AP计数（DFMEA+PFMEA链式 .then 聚合）
- 采购：待审批申请/在途订单
- 告警：未解决告警/未读通知

### 14.2 预警 (getWarnings)

| # | 用例 | 验证点 |
|---|------|--------|
| 2 | 返回 6 类预警数据 | 多类别查询 |
| 3 | 预算超支 >10% 阈值过滤 | `Number(actual) > Number(budget) * 1.1` |
| 4 | 逾期任务扁平化含项目信息 | schedule.project 展开 |

**预警类别**:
- 延期里程碑（plannedDate < now, 活跃项目）
- 严重风险（riskLevel=critical）
- 未解决告警（severity=critical/warning）
- 逾期任务（plannedEnd < now, 我的任务）
- 严重问题（severity=critical, 未关闭）
- 预算超支（超 10% 阈值，计算 varianceRate）

### 14.3 我的任务 (getMyTasks)

| # | 用例 | 验证点 |
|---|------|--------|
| 5 | 8 个模型聚合为统一任务格式 | 数据标准化 |
| 6 | 处理无截止日期的任务 | 空值排序 |
| 7 | 限制返回 30 条 | slice(0, 30) |
| 8 | 分配正确的模块路由 | moduleRoute 映射 |

**任务类型与路由映射**:

| 类型 | 模块路由 |
|------|----------|
| wbs_task | /projects |
| risk | /projects |
| ecr | /change-management |
| ecn_action | /change-management |
| problem | /quality |
| capa | /quality |
| fmea_item | /quality-engineering |

**排序规则**: 按 dueDate 升序（最近到期优先），无日期排末尾

### 14.4 趋势 (getTrends)

| # | 用例 | 验证点 |
|---|------|--------|
| 9 | 返回 4 类月度趋势数据 | 时间序列聚合 |
| 10 | 默认 6 个月 | 默认参数 |
| 11 | 费用按月汇总 | reduce 聚合 |

**趋势类别**:
- 项目趋势：创建数/完成数
- 质量趋势：新增数/关闭数/严重数
- 费用趋势：月度金额汇总
- 变更趋势：ECR创建数/ECN关闭数

**月份格式**: `YYYY-MM`（如 `2026-10`）

---

## 15. 运行测试

### 15.1 环境准备

```bash
# Node.js 路径（非标准安装路径）
export PATH="C:/Users/liuke/AppData/Roaming/DeOpenClaw/OpenClaw_for_node_2026.02.03:$PATH"

# 工作目录
cd D:/LKB-WORK/apqp-system/apps/server
```

### 15.2 运行全部测试

```bash
node <jest-path>/jest/bin/jest.js --config jest.config.ts --no-cache
```

### 15.3 运行单个测试文件

```bash
# 运行 dashboard 测试
node <jest-path>/jest/bin/jest.js --config jest.config.ts --testPathPattern=dashboard

# 运行 cost 测试
node <jest-path>/jest/bin/jest.js --config jest.config.ts --testPathPattern=cost
```

### 15.4 测试统计

| 测试套件 | 用例数 |
|----------|--------|
| auth.service.spec.ts | 13 |
| project.service.spec.ts | 7 |
| issue.service.spec.ts | 7 |
| config.service.spec.ts | 8 |
| user.service.spec.ts | 7 |
| csv.util.spec.ts | 13 |
| safety.service.spec.ts | 32 |
| quality.service.spec.ts | 27 |
| fmea.service.spec.ts | 30 |
| cost.service.spec.ts | 56 |
| procurement.service.spec.ts | 50 |
| change.service.spec.ts | 55 |
| dashboard.service.spec.ts | 11 |
| **合计** | **316** |

---

## 附录 A：关键测试模式

### A.1 MockDecimal 使用场景

当 service 代码中使用 `new Prisma.Decimal(value)` 或 `Number(decimalField)` 时，需要 MockDecimal：

```typescript
class MockDecimal {
  private val: number
  constructor(v: number | string | MockDecimal) {
    this.val = v instanceof MockDecimal ? v.val : Number(v)
  }
  add(other: MockDecimal | number) { return new MockDecimal(this.val + Number(other)) }
  sub(other: MockDecimal | number) { return new MockDecimal(this.val - Number(other)) }
  mul(other: MockDecimal | number) { return new MockDecimal(this.val * Number(other)) }
  div(other: MockDecimal | number) { return new MockDecimal(this.val / Number(other)) }
  toNumber() { return this.val }
  valueOf() { return this.val }  // 关键！Number(decimal) 隐式转换
  isZero() { return this.val === 0 }
  gte(other: MockDecimal | number) { return this.val >= Number(other) }
}

jest.mock('@prisma/client', () => {
  const original = jest.requireActual('@prisma/client')
  return { ...original, Prisma: { ...original.Prisma, Decimal: MockDecimal } }
})
```

### A.2 expect.objectContaining 嵌套使用

当 service 调用 `prisma.model.create({ data: {...}, include: {...} })` 时：

```typescript
expect(prisma.model.create).toHaveBeenCalledWith(
  expect.objectContaining({
    data: expect.objectContaining({ field: value })
  })
)
```

### A.3 aggregate mock 模式

用于自动 sortOrder 场景：

```typescript
prisma.model.aggregate.mockResolvedValue({ _max: { sortOrder: 5 } })
// service 计算: (5) + 1 = 6 → 新记录 sortOrder
```

### A.4 顺序 mock 返回值

同一模型多次调用不同条件时：

```typescript
prisma.prjProject.count
  .mockResolvedValueOnce(10)  // 第1次调用
  .mockResolvedValueOnce(5)   // 第2次调用
  .mockResolvedValueOnce(2)   // 第3次调用
```

---

## 附录 B：测试覆盖的业务规则

| 模块 | 规则 | 测试位置 |
|------|------|----------|
| 认证 | 密码 bcrypt 哈希 | auth #11 |
| 认证 | 权限去重 | auth #5 |
| 项目 | 自动编号 PRJ+YYYYMMDD+NNNN | project #7 |
| 安全 | ASIL 自动计算 (S×E×C 矩阵) | safety #5-7 |
| 安全 | FTA AND/OR 门概率公式 | safety #15-16 |
| 质量 | 8D 完成率计算 | quality #7 |
| 质量 | PPM = defectParts/totalParts × 1,000,000 | quality #21 |
| 质量 | PPM 状态阈值 (on_track/warning/exceeded) | quality #22-23 |
| 质量 | 检验不合格自动创建 NC | quality #16 |
| FMEA | AP 评级 S×O×D → H/M/L | fmea #6-7 |
| FMEA | SPC Cp/Cpk/Pp/Ppk 计算 | fmea #20 |
| FMEA | MSA GR&R (EV/AV/GRR/PV/TV/NDC) | fmea #24 |
| 成本 | 预算超支 10% 阈值 | cost #51-53 |
| 成本 | CPI = EV/AC | cost #38-39 |
| 采购 | 供应商加权评分 (Q40+D30+C20+S10) | procurement #39 |
| 采购 | 供应商等级 A(≥90)/B(≥80)/C(≥70)/D(<70) | procurement #40-42 |
| 变更 | ECR 工作流 6 状态流转 | change #11-20 |
| 变更 | ECN 关闭约束（所有行动项完成） | change #42 |
| 变更 | 自动 sortOrder 递增 | change #21, #43 |
| 仪表盘 | 预算超支 >10% 过滤 | dashboard #3 |
| 仪表盘 | 任务按 dueDate 排序 + 限 30 条 | dashboard #6-7 |
| 仪表盘 | 月度趋势 YYYY-MM 格式 | dashboard #9-11 |

---

**文档结束**
