// APQP 检查表 / OTS 文档检查表 常量

export const APQP_PHASE = {
  phase1: '① 计划定义',
  phase2: '② 产品设计开发',
  phase3: '③ 过程设计开发',
  phase4: '④ 产品与过程确认',
  phase5: '⑤ 量产与反馈',
} as const;
export type ApqpPhase = keyof typeof APQP_PHASE;

export const CHECKLIST_STATUS = {
  open: '未开始',
  in_progress: '进行中',
  completed: '已完成',
} as const;

export const CHECKLIST_RESULT = {
  pending: '待检查',
  pass: '通过',
  fail: '不通过',
  na: '不适用 (N/A)',
} as const;
export type ChecklistResult = keyof typeof CHECKLIST_RESULT;

export const CHECK_DOMAIN = {
  plan: '计划定义',
  design: '产品设计开发',
  process: '过程设计开发',
  confirm: '产品与过程确认',
  production: '量产与反馈',
} as const;

// 03-APQP检查表 标准检查项模板（按 Excel 表单原封不动）
export const APQP_CHECKLIST_TEMPLATE = [
  // ① 计划定义
  { phase: 'phase1', domain: 'APQP', item: '客户需求与技术协议确认并评审', responsible: '项目经理' },
  { phase: 'phase1', domain: 'APQP', item: '立项申请书完成：GRD/L 综合等级评定、三大里程碑时间确定', responsible: '项目经理' },
  { phase: 'phase1', domain: '功能安全', item: 'HARA 完成并评审，ASIL 等级确定（P-FS1）', responsible: '功能安全经理' },
  { phase: 'phase1', domain: '信息安全', item: '产品联网属性确认，TARA 初版完成（P-CS1）', responsible: '信息安全经理' },
  { phase: 'phase1', domain: '外购外协', item: '自制/外购分析完成，外购外协清单及风险分级（S/A/B）确定', responsible: '采购/SQE' },
  { phase: 'phase1', domain: 'APQP', item: '项目里程碑计划（P1–P8+并行节点）编制并经评审发布', responsible: '项目经理' },
  // ② 产品设计开发
  { phase: 'phase2', domain: 'APQP', item: 'DFMEA 完成并经跨部门评审', responsible: '研发工程师' },
  { phase: 'phase2', domain: 'APQP', item: '设计验证计划（DVP&R）已批准', responsible: '试验负责人' },
  { phase: 'phase2', domain: '功能安全', item: '功能安全概念（FSC）与技术安全需求（TSR）完成并分配到系统/硬件/软件', responsible: '功能安全经理' },
  { phase: 'phase2', domain: '信息安全', item: '网络安全概念与 CS 需求完成（安全启动/加密/隔离等）', responsible: '信息安全经理' },
  { phase: 'phase2', domain: 'ASPICE', item: 'SYS.2/SYS.3 过程域证据（需求基线、追溯矩阵、架构说明）就绪', responsible: '系统工程师' },
  { phase: 'phase2', domain: '外购外协', item: '关键外购外协件已定点，技术协议已签（ASIL/CS 需求已传递）', responsible: 'SQE' },
  { phase: 'phase2', domain: 'APQP', item: '工程发布（P2）：图纸/规范/BOM 冻结', responsible: '研发工程师' },
  // ③ 过程设计开发
  { phase: 'phase3', domain: 'APQP', item: 'PFMEA 完成并经跨部门评审', responsible: '制造工程' },
  { phase: 'phase3', domain: 'APQP', item: '控制计划（试生产版）已发布', responsible: '质量工程师' },
  { phase: 'phase3', domain: '工装产线', item: '工装/夹具设计批准并制作完成（P-T1）', responsible: '工装/模具组' },
  { phase: 'phase3', domain: '工装产线', item: '生产线改造方案确定，节拍与产能测算完成', responsible: '制造工程' },
  { phase: 'phase3', domain: '功能安全', item: '系统/硬件/软件安全设计（DSC）与安全分析（FTA/FMEA）完成', responsible: '安全工程师' },
  { phase: 'phase3', domain: 'ASPICE', item: 'SWE.1–SWE.3 / HWE.1–3 过程域证据就绪', responsible: '软件/硬件经理' },
  { phase: 'phase3', domain: '外购外协', item: '供应商 PFMEA/控制计划已评审确认，质量协议已签订', responsible: 'SQE' },
  // ④ 产品与过程确认
  { phase: 'phase4', domain: 'APQP', item: 'DV/PV 试验按计划完成并合格（条件 A）', responsible: '试验负责人' },
  { phase: 'phase4', domain: '文档', item: '设计文档完成并归档，13A 文档齐套率 100%（条件 B）', responsible: '文档工程师' },
  { phase: 'phase4', domain: 'APQP', item: '按工装试制样件 100% 全尺寸/材质合格，过程能力满足控制计划（条件 C）', responsible: '质量工程师' },
  { phase: 'phase4', domain: 'APQP', item: 'OTS 认可完成（13 评审报告签署，四态结论）', responsible: '质量经理' },
  { phase: 'phase4', domain: '外购外协', item: '供应商 OTS 样件认可、供应商 PPAP 审核批准', responsible: 'SQE' },
  { phase: 'phase4', domain: '工装产线', item: '生产线改造/就绪确认完成（P-T2），MSA 与初始过程能力研究合格', responsible: '制造工程' },
  { phase: 'phase4', domain: '功能安全', item: '安全集成测试与安全确认评审通过（P-FS2）', responsible: '功能安全经理' },
  { phase: 'phase4', domain: '信息安全', item: '渗透测试/SBOM 完成，高危漏洞闭环（P-CS2）', responsible: '信息安全经理' },
  { phase: 'phase4', domain: 'ASPICE', item: 'ASPICE 内部评估通过（P-AS1），客户要求等级证据齐备', responsible: 'QA' },
  // ⑤ 量产与反馈
  { phase: 'phase5', domain: 'APQP', item: '试生产节拍与产能满足合同要求（P6 SOP）', responsible: '制造部' },
  { phase: 'phase5', domain: 'APQP', item: 'PPAP 提交并获客户批准，首批交付完成', responsible: '质量/销售' },
  { phase: 'phase5', domain: '功能安全', item: '现场监测与安全相关变更影响分析机制上线，Safety Case 保持更新', responsible: '功能安全经理' },
  { phase: 'phase5', domain: '信息安全', item: 'PSIRT 运营与漏洞监控响应机制上线', responsible: '运维负责人' },
  { phase: 'phase5', domain: '外购外协', item: '供应商绩效评价（PPM/交付/响应）与改进计划建立', responsible: 'SQE' },
] as const;

// 13A-OTS 文档检查表标准模板
export const OTS_DOC_CATEGORY = {
  structural: '结构设计',
  hardware: '硬件设计',
  software: '软件设计',
  test: '试验报告',
  material: '材质/规格',
  process: '工艺文件',
  quality: '质量文件',
  safety: '安全文档',
  security: '信息安全文档',
} as const;

export const OTS_DOC_CHECK_STATUS = {
  missing: '缺失',
  uploaded: '已上传',
  reviewed: '已审核',
  approved: '已批准',
} as const;

export const OTS_DOC_CHECKLIST_TEMPLATE = [
  { category: 'structural', docName: '零件图纸 / 3D 模型（含公差标注）' },
  { category: 'structural', docName: '公差分析与堆叠报告（GD&T）' },
  { category: 'structural', docName: '材料清单（结构部分）与材料规格书' },
  { category: 'structural', docName: '结构 DFMEA' },
  { category: 'hardware', docName: '原理图 / Schema' },
  { category: 'hardware', docName: 'PCB Layout 文件' },
  { category: 'hardware', docName: '硬件 DFMEA' },
  { category: 'hardware', docName: '硬件 BOM' },
  { category: 'software', docName: '软件架构文档' },
  { category: 'software', docName: '软件详细设计文档' },
  { category: 'software', docName: '软件版本说明 / Release Notes' },
  { category: 'test', docName: 'DV 试验计划（DVP&R）' },
  { category: 'test', docName: 'DV 试验报告' },
  { category: 'test', docName: '全尺寸检验报告' },
  { category: 'material', docName: '材质证明 / 材料合格证' },
  { category: 'material', docName: '材料规格书（Material Specification）' },
  { category: 'process', docName: '过程流程图' },
  { category: 'process', docName: 'PFMEA' },
  { category: 'process', docName: '控制计划（Control Plan）' },
  { category: 'quality', docName: 'MSA 研究报告' },
  { category: 'quality', docName: '初始过程能力研究（Ppk/Cpk）' },
  { category: 'safety', docName: '功能安全文档包（Safety Case / FSC / TSR）' },
  { category: 'security', docName: 'TARA 报告 / 网络安全概念' },
  { category: 'security', docName: 'SBOM（软件物料清单）' },
] as const;
