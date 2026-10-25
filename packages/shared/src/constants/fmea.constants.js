"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DETECTION_TABLE = exports.OCCURRENCE_TABLE = exports.SEVERITY_TABLE = exports.AP_MATRIX = exports.FMEA_TYPE = exports.KB_ENTRY_TYPE = exports.FMEA_ACTION_STATUS = exports.MSA_ACCEPTANCE = exports.MSA_STUDY_TYPE = exports.SPC_CAPABILITY_RESULT = exports.SPC_CHART_TYPE = exports.SPEC_CHAR_SOURCE = exports.SPECIAL_CHAR_TYPE = exports.AP_RATING = exports.CP_TYPE = exports.PFMEA_OPERATION_TYPE = exports.DFMEA_ITEM_LEVEL = exports.FMEA_STATUS = void 0;
exports.calculateAP = calculateAP;
exports.FMEA_STATUS = {
    draft: '草稿',
    in_progress: '编制中',
    reviewed: '已评审',
    approved: '已批准',
    released: '已发布',
};
exports.DFMEA_ITEM_LEVEL = {
    system: '系统',
    subsystem: '子系统',
    component: '组件',
    function: '功能',
};
exports.PFMEA_OPERATION_TYPE = {
    receiving: '接收',
    machining: '加工',
    assembly: '装配',
    testing: '测试',
    packaging: '包装',
    shipping: '发运',
    inspection: '检验',
    storage: '存储',
    other: '其他',
};
exports.CP_TYPE = {
    prototype: '样件控制计划',
    trial_production: '试生产控制计划',
    mass_production: '量产控制计划',
};
exports.AP_RATING = {
    H: '高',
    M: '中',
    L: '低',
};
exports.SPECIAL_CHAR_TYPE = {
    CC: '关键特性(Critical)',
    SC: '重要特性(Significant)',
};
exports.SPEC_CHAR_SOURCE = {
    customer: '客户要求',
    internal: '内部识别',
    regulatory: '法规要求',
    design: '设计要求',
};
exports.SPC_CHART_TYPE = {
    xbar_r: 'Xbar-R',
    xbar_s: 'Xbar-S',
    p: 'p图',
    np: 'np图',
    c: 'c图',
    u: 'u图',
    i_mr: 'I-MR',
};
exports.SPC_CAPABILITY_RESULT = {
    capable: '充分',
    marginal: '边缘',
    incapable: '不足',
};
exports.MSA_STUDY_TYPE = {
    grr: 'GR&R',
    bias: '偏倚',
    linearity: '线性',
    stability: '稳定性',
    attribute: '计数型',
};
exports.MSA_ACCEPTANCE = {
    acceptable: '可接受',
    marginal: '边缘',
    unacceptable: '不可接受',
};
exports.FMEA_ACTION_STATUS = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    deferred: '延期',
};
exports.KB_ENTRY_TYPE = {
    failure_mode: '失效模式',
    cause: '原因',
    control: '控制措施',
    severity_ref: '严重度参考',
    occurrence_ref: '频度参考',
    detection_ref: '探测度参考',
};
exports.FMEA_TYPE = {
    dfmea: 'DFMEA',
    pfmea: 'PFMEA',
    both: '通用',
};
// AIAG-VDA Action Priority Matrix: AP_MATRIX[severity][occurrence][detection] -> H/M/L
// Simplified: For each S level, define O thresholds for H/M/L based on D
exports.AP_MATRIX = {
    1: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L', 7: 'L', 8: 'L', 9: 'L', 10: 'M' }, 2: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L', 7: 'L', 8: 'M', 9: 'M', 10: 'M' }, 3: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'M', 7: 'M', 8: 'M', 9: 'M', 10: 'H' }, 4: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'M', 6: 'M', 7: 'M', 8: 'M', 9: 'H', 10: 'H' }, 5: { 1: 'L', 2: 'L', 3: 'L', 4: 'M', 5: 'M', 6: 'M', 7: 'M', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'L', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
    2: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L', 7: 'L', 8: 'L', 9: 'M', 10: 'M' }, 2: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L', 7: 'M', 8: 'M', 9: 'M', 10: 'M' }, 3: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'M', 6: 'M', 7: 'M', 8: 'M', 9: 'H', 10: 'H' }, 4: { 1: 'L', 2: 'L', 3: 'L', 4: 'M', 5: 'M', 6: 'M', 7: 'M', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'L', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
    3: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L', 7: 'M', 8: 'M', 9: 'M', 10: 'M' }, 2: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'M', 7: 'M', 8: 'M', 9: 'M', 10: 'H' }, 3: { 1: 'L', 2: 'L', 3: 'L', 4: 'M', 5: 'M', 6: 'M', 7: 'M', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'L', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
    4: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'M', 7: 'M', 8: 'M', 9: 'M', 10: 'M' }, 2: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'M', 6: 'M', 7: 'M', 8: 'M', 9: 'H', 10: 'H' }, 3: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'M', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'M', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
    5: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'M', 6: 'M', 7: 'M', 8: 'M', 9: 'M', 10: 'H' }, 2: { 1: 'L', 2: 'L', 3: 'L', 4: 'M', 5: 'M', 6: 'M', 7: 'M', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'L', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
    6: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'M', 5: 'M', 6: 'M', 7: 'M', 8: 'M', 9: 'H', 10: 'H' }, 2: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'M', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
    7: { 1: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 2: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'M', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
    8: { 1: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 2: { 1: 'M', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
    9: { 1: { 1: 'M', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 2: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
    10: { 1: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 2: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
};
function calculateAP(severity, occurrence, detection) {
    const s = Math.max(1, Math.min(10, severity));
    const o = Math.max(1, Math.min(10, occurrence));
    const d = Math.max(1, Math.min(10, detection));
    return exports.AP_MATRIX[s]?.[o]?.[d] || 'L';
}
exports.SEVERITY_TABLE = [
    { rating: 1, criteria: '无影响', description: '无可辨别的影响' },
    { rating: 2, criteria: '轻微', description: '外观/噪音/振动等轻微不便，大多数客户不在意' },
    { rating: 3, criteria: '较低', description: '外观/噪音/振动等不便，多数客户能感觉到' },
    { rating: 4, criteria: '低', description: '外观/噪音/振动等不便，多数客户不满意' },
    { rating: 5, criteria: '中等', description: '舒适性/便利性受损，部分客户不满意' },
    { rating: 6, criteria: '较高', description: '舒适性/便利性严重受损，大多数客户不满意' },
    { rating: 7, criteria: '高', description: '产品功能降级，多数客户不满意' },
    { rating: 8, criteria: '很高', description: '产品功能丧失，客户非常不满意' },
    { rating: 9, criteria: '严重', description: '不符合法规要求，可能涉及安全（无预警）' },
    { rating: 10, criteria: '极严重', description: '不符合法规要求，可能涉及安全（有预警）' },
];
exports.OCCURRENCE_TABLE = [
    { rating: 1, criteria: '极低', description: '每百万件 < 1 件失效' },
    { rating: 2, criteria: '低', description: '每百万件约 10 件失效' },
    { rating: 3, criteria: '较低', description: '每百万件约 100 件失效' },
    { rating: 4, criteria: '偶尔', description: '每百万件约 500 件失效' },
    { rating: 5, criteria: '中等', description: '每百万件约 2,000 件失效' },
    { rating: 6, criteria: '较高', description: '每百万件约 5,000 件失效' },
    { rating: 7, criteria: '高', description: '每百万件约 10,000 件失效' },
    { rating: 8, criteria: '很高', description: '每百万件约 25,000 件失效' },
    { rating: 9, criteria: '极高', description: '每百万件约 50,000 件失效' },
    { rating: 10, criteria: '极高', description: '每百万件 >= 100,000 件失效' },
];
exports.DETECTION_TABLE = [
    { rating: 1, criteria: '几乎确定', description: '现有控制措施几乎肯定能探测到' },
    { rating: 2, criteria: '很高', description: '现有控制措施有很高的探测能力' },
    { rating: 3, criteria: '高', description: '现有控制措施有较高的探测能力' },
    { rating: 4, criteria: '中高', description: '现有控制措施有中高的探测能力' },
    { rating: 5, criteria: '中等', description: '现有控制措施有中等的探测能力' },
    { rating: 6, criteria: '中低', description: '现有控制措施探测能力偏低' },
    { rating: 7, criteria: '低', description: '现有控制措施探测能力低' },
    { rating: 8, criteria: '很低', description: '现有控制措施探测能力很低' },
    { rating: 9, criteria: '极低', description: '现有控制措施几乎无法探测' },
    { rating: 10, criteria: '不可探测', description: '无有效探测手段' },
];
//# sourceMappingURL=fmea.constants.js.map