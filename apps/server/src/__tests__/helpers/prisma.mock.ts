function mockModel(extra: Record<string, jest.Mock> = {}) {
  return {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
    ...extra,
  }
}

export function createMockPrismaService() {
  return {
    sysUser: mockModel(),
    sysConfig: mockModel(),
    sysRole: mockModel(),
    sysDepartment: mockModel(),
    prjProject: mockModel(),
    qualityIssue: mockModel(),
    qualityLesson: mockModel(),
    sysSequence: mockModel(),

    // Quality models
    qualityProblem: mockModel(),
    quality8DReport: mockModel(),
    qualityNonconformance: mockModel(),
    qualityCAPA: mockModel(),
    qualityInspection: mockModel(),
    qualityEscalationHistory: mockModel(),
    qualityPpmRecord: mockModel(),

    // Safety models
    safetyHazardAnalysis: mockModel(),
    safetyGoal: mockModel(),
    safetyFtaEvent: mockModel(),
    safetyCase: mockModel(),
    safetyCaseArgument: mockModel(),
    safetyCaseEvidence: mockModel(),
    safetyReview: mockModel(),
    safetyConcept: mockModel(),
    safetyRequirement: mockModel(),
    fmedaRecord: mockModel(),
    hardwareSafetyMetric: mockModel(),
    dfaRecord: mockModel(),
    asilDecomposition: mockModel(),
    toolQualification: mockModel(),
    confirmationMeasure: mockModel(),

    // FMEA models
    fmeaDfmea: mockModel(),
    fmeaDfmeaItem: mockModel(),
    fmeaProcessFlow: mockModel(),
    fmeaProcessFlowStep: mockModel(),
    fmeaPfmea: mockModel(),
    fmeaPfmeaItem: mockModel(),
    fmeaControlPlan: mockModel(),
    fmeaControlPlanItem: mockModel(),
    fmeaSpecialCharacteristic: mockModel(),
    qeSpcStudy: mockModel(),
    qeSpcDataPoint: mockModel(),
    qeMsaStudy: mockModel(),
    qeMsaMeasurement: mockModel(),
    fmeaKnowledgeBase: mockModel(),

    // Cost models
    costEstimate: mockModel(),
    costEstimateItem: mockModel(),
    prjCost: mockModel(),
    costBudgetAdjustment: mockModel(),
    prjCostEntry: mockModel(),
    costAlert: mockModel(),

    // Procurement models
    purchaseRequest: mockModel(),
    purchaseRequestItem: mockModel(),
    purchaseOrder: mockModel(),
    purchaseOrderItem: mockModel(),
    mdSupplier: mockModel(),
    supplierEvaluation: mockModel(),
    supplierAudit: mockModel(),

    // Change management models
    chgEcr: mockModel(),
    chgEcrImpactItem: mockModel(),
    chgCcbReview: mockModel(),
    chgEcn: mockModel(),
    chgEcnActionItem: mockModel(),

    // Project management models
    prjWbsTask: mockModel(),
    prjRisk: mockModel(),
    prjMilestone: mockModel(),

    // Workflow models
    wfNodeInstance: mockModel(),

    // Notification models
    msgAlertRecord: mockModel(),
    msgNotification: mockModel(),

    $transaction: jest.fn((fn: any) => fn({
      sysSequence: mockModel(),
    })),
  }
}
