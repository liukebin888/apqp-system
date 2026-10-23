-- CreateTable
CREATE TABLE `sys_departments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `parentId` INTEGER UNSIGNED NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `leaderId` INTEGER UNSIGNED NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_departments_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_positions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `departmentId` INTEGER UNSIGNED NULL,
    `category` VARCHAR(20) NOT NULL DEFAULT 'general',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `realName` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `avatar` VARCHAR(255) NULL,
    `departmentId` INTEGER UNSIGNED NULL,
    `positionId` INTEGER UNSIGNED NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_roles` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sys_roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_permissions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `module` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `sys_permissions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_user_roles` (
    `userId` INTEGER UNSIGNED NOT NULL,
    `roleId` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`userId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role_permissions` (
    `roleId` INTEGER UNSIGNED NOT NULL,
    `permissionId` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_sequences` (
    `seqName` VARCHAR(50) NOT NULL,
    `currentVal` INTEGER NOT NULL DEFAULT 0,
    `prefix` VARCHAR(10) NOT NULL DEFAULT '',
    `dateFormat` VARCHAR(20) NULL,

    PRIMARY KEY (`seqName`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_configs` (
    `configKey` VARCHAR(100) NOT NULL,
    `configValue` TEXT NULL,
    `description` VARCHAR(255) NULL,

    PRIMARY KEY (`configKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_audit_logs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `resourceType` VARCHAR(50) NOT NULL,
    `resourceId` VARCHAR(50) NULL,
    `beforeSnapshot` JSON NULL,
    `afterSnapshot` JSON NULL,
    `ipAddress` VARCHAR(50) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sys_audit_logs_module_resourceType_resourceId_idx`(`module`, `resourceType`, `resourceId`),
    INDEX `sys_audit_logs_userId_idx`(`userId`),
    INDEX `sys_audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `md_customers` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `customerCode` VARCHAR(50) NOT NULL,
    `customerName` VARCHAR(200) NOT NULL,
    `contactName` VARCHAR(50) NULL,
    `contactPhone` VARCHAR(20) NULL,
    `contactEmail` VARCHAR(100) NULL,
    `industry` VARCHAR(50) NULL,
    `oemType` VARCHAR(50) NULL,
    `address` VARCHAR(500) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `md_customers_customerCode_key`(`customerCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `md_product_categories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `parentId` INTEGER UNSIGNED NULL,
    `level` TINYINT NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `md_products` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `productCode` VARCHAR(50) NOT NULL,
    `productName` VARCHAR(200) NOT NULL,
    `categoryId` INTEGER UNSIGNED NULL,
    `customerId` INTEGER UNSIGNED NULL,
    `productForm` VARCHAR(20) NOT NULL DEFAULT 'hardware',
    `specs` VARCHAR(500) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `md_products_productCode_key`(`productCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `md_suppliers` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `supplierCode` VARCHAR(50) NOT NULL,
    `supplierName` VARCHAR(200) NOT NULL,
    `creditCode` VARCHAR(50) NULL,
    `contactName` VARCHAR(50) NULL,
    `contactPhone` VARCHAR(20) NULL,
    `contactEmail` VARCHAR(100) NULL,
    `address` VARCHAR(500) NULL,
    `qualificationStatus` VARCHAR(20) NULL,
    `rating` VARCHAR(10) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `md_suppliers_supplierCode_key`(`supplierCode`),
    UNIQUE INDEX `md_suppliers_creditCode_key`(`creditCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `md_supplier_documents` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `supplierId` INTEGER UNSIGNED NOT NULL,
    `docType` VARCHAR(50) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `filePath` VARCHAR(500) NOT NULL,
    `expireDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `md_supplier_ratings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `supplierId` INTEGER UNSIGNED NOT NULL,
    `qualityScore` DECIMAL(5, 2) NOT NULL,
    `deliveryScore` DECIMAL(5, 2) NOT NULL,
    `serviceScore` DECIMAL(5, 2) NOT NULL,
    `priceScore` DECIMAL(5, 2) NOT NULL,
    `period` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wf_definitions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `bizType` VARCHAR(50) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `definitionJson` JSON NULL,
    `createdById` INTEGER UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wf_definitions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wf_node_definitions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `definitionId` INTEGER UNSIGNED NOT NULL,
    `nodeKey` VARCHAR(50) NOT NULL,
    `nodeName` VARCHAR(100) NOT NULL,
    `nodeType` VARCHAR(20) NOT NULL,
    `assigneeType` VARCHAR(20) NULL,
    `assigneeValue` JSON NULL,
    `propertiesJson` JSON NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `wf_node_definitions_definitionId_nodeKey_key`(`definitionId`, `nodeKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wf_transitions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `definitionId` INTEGER UNSIGNED NOT NULL,
    `fromNodeKey` VARCHAR(50) NOT NULL,
    `toNodeKey` VARCHAR(50) NOT NULL,
    `conditionExpression` VARCHAR(500) NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wf_instances` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `definitionId` INTEGER UNSIGNED NOT NULL,
    `bizType` VARCHAR(50) NOT NULL,
    `bizId` INTEGER UNSIGNED NOT NULL,
    `bizNo` VARCHAR(50) NULL,
    `title` VARCHAR(200) NOT NULL,
    `initiatorId` INTEGER UNSIGNED NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'running',
    `currentNodesJson` JSON NULL,
    `variablesJson` JSON NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `wf_instances_bizType_bizId_idx`(`bizType`, `bizId`),
    INDEX `wf_instances_initiatorId_idx`(`initiatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wf_node_instances` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `instanceId` INTEGER UNSIGNED NOT NULL,
    `nodeKey` VARCHAR(50) NOT NULL,
    `nodeName` VARCHAR(100) NOT NULL,
    `nodeType` VARCHAR(20) NOT NULL,
    `assigneeUserId` INTEGER UNSIGNED NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `opinion` TEXT NULL,
    `actedBy` INTEGER UNSIGNED NULL,
    `actedAt` DATETIME(3) NULL,
    `countersignTotal` INTEGER NOT NULL DEFAULT 0,
    `countersignDone` INTEGER NOT NULL DEFAULT 0,
    `parentNodeInstId` INTEGER UNSIGNED NULL,

    INDEX `wf_node_instances_instanceId_idx`(`instanceId`),
    INDEX `wf_node_instances_assigneeUserId_status_idx`(`assigneeUserId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wf_logs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `instanceId` INTEGER UNSIGNED NOT NULL,
    `nodeInstanceId` INTEGER UNSIGNED NULL,
    `action` VARCHAR(30) NOT NULL,
    `operatorId` INTEGER UNSIGNED NOT NULL,
    `opinion` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wf_logs_instanceId_idx`(`instanceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wf_rollbacks` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `instanceId` INTEGER UNSIGNED NOT NULL,
    `fromNodeKey` VARCHAR(50) NOT NULL,
    `toNodeKey` VARCHAR(50) NOT NULL,
    `reason` TEXT NULL,
    `operatorId` INTEGER UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `msg_notifications` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NULL,
    `bizType` VARCHAR(50) NULL,
    `bizId` INTEGER UNSIGNED NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `msg_notifications_userId_isRead_idx`(`userId`, `isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `msg_alert_rules` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `triggerType` VARCHAR(30) NOT NULL,
    `conditionJson` JSON NULL,
    `severity` VARCHAR(20) NOT NULL DEFAULT 'warning',
    `notifyChannelsJson` JSON NULL,
    `notifyTargetsJson` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `msg_alert_records` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `ruleId` INTEGER UNSIGNED NULL,
    `targetBizType` VARCHAR(50) NULL,
    `targetBizId` INTEGER UNSIGNED NULL,
    `severity` VARCHAR(20) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'triggered',
    `triggeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acknowledgedBy` INTEGER UNSIGNED NULL,
    `acknowledgedAt` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,

    INDEX `msg_alert_records_status_severity_idx`(`status`, `severity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `msg_email_queue` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `toAddress` VARCHAR(200) NOT NULL,
    `subject` VARCHAR(500) NOT NULL,
    `bodyHtml` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `msg_email_queue_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_projects` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `projectCode` VARCHAR(50) NOT NULL,
    `projectName` VARCHAR(200) NOT NULL,
    `customerId` INTEGER UNSIGNED NULL,
    `productId` INTEGER UNSIGNED NULL,
    `projectLevel` VARCHAR(10) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `managerId` INTEGER UNSIGNED NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `apqpPhase` TINYINT NOT NULL DEFAULT 1,
    `description` TEXT NULL,
    `workflowInstanceId` INTEGER UNSIGNED NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prj_projects_projectCode_key`(`projectCode`),
    INDEX `prj_projects_status_idx`(`status`),
    INDEX `prj_projects_managerId_idx`(`managerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_project_teams` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER UNSIGNED NOT NULL,
    `userId` INTEGER UNSIGNED NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `prj_project_teams_projectId_userId_key`(`projectId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_schedules` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER UNSIGNED NOT NULL,
    `baselineVersion` INTEGER NOT NULL DEFAULT 1,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_wbs_tasks` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `scheduleId` INTEGER UNSIGNED NOT NULL,
    `parentId` INTEGER UNSIGNED NULL,
    `taskCode` VARCHAR(50) NOT NULL,
    `taskName` VARCHAR(200) NOT NULL,
    `responsibleId` INTEGER UNSIGNED NULL,
    `plannedStart` DATETIME(3) NULL,
    `plannedEnd` DATETIME(3) NULL,
    `actualStart` DATETIME(3) NULL,
    `actualEnd` DATETIME(3) NULL,
    `progressPct` TINYINT NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `milestoneFlag` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `prj_wbs_tasks_scheduleId_idx`(`scheduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_task_dependencies` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `predecessorId` INTEGER UNSIGNED NOT NULL,
    `successorId` INTEGER UNSIGNED NOT NULL,
    `dependencyType` VARCHAR(5) NOT NULL DEFAULT 'FS',
    `lagDays` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_milestones` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER UNSIGNED NOT NULL,
    `milestoneType` VARCHAR(20) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `plannedDate` DATETIME(3) NULL,
    `actualDate` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'planned',
    `gateReviewId` INTEGER UNSIGNED NULL,

    INDEX `prj_milestones_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_risks` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER UNSIGNED NOT NULL,
    `riskCode` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `probability` TINYINT NOT NULL,
    `impact` TINYINT NOT NULL,
    `riskLevel` VARCHAR(10) NOT NULL,
    `ownerUserId` INTEGER UNSIGNED NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'open',
    `responseStrategy` VARCHAR(20) NULL,
    `identifiedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedAt` DATETIME(3) NULL,

    INDEX `prj_risks_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_risk_responses` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `riskId` INTEGER UNSIGNED NOT NULL,
    `actionDesc` TEXT NOT NULL,
    `responsibleId` INTEGER UNSIGNED NULL,
    `dueDate` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_costs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER UNSIGNED NOT NULL,
    `budgetCategory` VARCHAR(50) NOT NULL,
    `budgetAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `actualAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `forecastAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_cost_entries` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `costId` INTEGER UNSIGNED NOT NULL,
    `entryDate` DATE NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `description` VARCHAR(500) NULL,
    `sourceType` VARCHAR(30) NULL,
    `sourceId` INTEGER UNSIGNED NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_resources` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER UNSIGNED NOT NULL,
    `userId` INTEGER UNSIGNED NOT NULL,
    `allocationPct` TINYINT NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,

    UNIQUE INDEX `prj_resources_projectId_userId_key`(`projectId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prj_work_hours` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER UNSIGNED NOT NULL,
    `userId` INTEGER UNSIGNED NOT NULL,
    `workDate` DATE NOT NULL,
    `hours` DECIMAL(4, 1) NOT NULL,
    `taskId` INTEGER UNSIGNED NULL,
    `description` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `prj_work_hours_projectId_userId_workDate_idx`(`projectId`, `userId`, `workDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `docCode` VARCHAR(50) NOT NULL,
    `docName` VARCHAR(255) NOT NULL,
    `docType` VARCHAR(50) NOT NULL,
    `bizType` VARCHAR(50) NULL,
    `bizId` INTEGER UNSIGNED NULL,
    `projectId` INTEGER UNSIGNED NULL,
    `version` VARCHAR(10) NOT NULL DEFAULT 'A',
    `revision` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `storagePath` VARCHAR(500) NULL,
    `fileSize` INTEGER UNSIGNED NULL,
    `mimeType` VARCHAR(100) NULL,
    `checksumSha` VARCHAR(64) NULL,
    `isControlled` BOOLEAN NOT NULL DEFAULT false,
    `uploadedById` INTEGER UNSIGNED NOT NULL,
    `approvedById` INTEGER UNSIGNED NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `documents_docCode_key`(`docCode`),
    INDEX `documents_projectId_idx`(`projectId`),
    INDEX `documents_bizType_bizId_idx`(`bizType`, `bizId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_versions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER UNSIGNED NOT NULL,
    `version` VARCHAR(10) NOT NULL,
    `revision` INTEGER NOT NULL DEFAULT 1,
    `storagePath` VARCHAR(500) NOT NULL,
    `changeDescription` VARCHAR(500) NULL,
    `createdById` INTEGER UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_permissions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER UNSIGNED NOT NULL,
    `granteeType` VARCHAR(20) NOT NULL,
    `granteeId` INTEGER UNSIGNED NOT NULL,
    `permissionLevel` VARCHAR(10) NOT NULL,

    UNIQUE INDEX `document_permissions_documentId_granteeType_granteeId_key`(`documentId`, `granteeType`, `granteeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_departments` ADD CONSTRAINT `sys_departments_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `sys_departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_departments` ADD CONSTRAINT `sys_departments_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `sys_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_positions` ADD CONSTRAINT `sys_positions_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `sys_departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_users` ADD CONSTRAINT `sys_users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `sys_departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_users` ADD CONSTRAINT `sys_users_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `sys_positions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_user_roles` ADD CONSTRAINT `sys_user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sys_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_user_roles` ADD CONSTRAINT `sys_user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `sys_roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_role_permissions` ADD CONSTRAINT `sys_role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `sys_roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_role_permissions` ADD CONSTRAINT `sys_role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `sys_permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_audit_logs` ADD CONSTRAINT `sys_audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sys_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `md_product_categories` ADD CONSTRAINT `md_product_categories_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `md_product_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `md_products` ADD CONSTRAINT `md_products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `md_product_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `md_products` ADD CONSTRAINT `md_products_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `md_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `md_supplier_documents` ADD CONSTRAINT `md_supplier_documents_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `md_suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `md_supplier_ratings` ADD CONSTRAINT `md_supplier_ratings_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `md_suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wf_node_definitions` ADD CONSTRAINT `wf_node_definitions_definitionId_fkey` FOREIGN KEY (`definitionId`) REFERENCES `wf_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wf_transitions` ADD CONSTRAINT `wf_transitions_definitionId_fkey` FOREIGN KEY (`definitionId`) REFERENCES `wf_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wf_instances` ADD CONSTRAINT `wf_instances_definitionId_fkey` FOREIGN KEY (`definitionId`) REFERENCES `wf_definitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wf_node_instances` ADD CONSTRAINT `wf_node_instances_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `wf_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wf_logs` ADD CONSTRAINT `wf_logs_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `wf_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wf_rollbacks` ADD CONSTRAINT `wf_rollbacks_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `wf_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_projects` ADD CONSTRAINT `prj_projects_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `md_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_projects` ADD CONSTRAINT `prj_projects_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `md_products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_projects` ADD CONSTRAINT `prj_projects_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `sys_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_project_teams` ADD CONSTRAINT `prj_project_teams_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `prj_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_project_teams` ADD CONSTRAINT `prj_project_teams_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sys_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_schedules` ADD CONSTRAINT `prj_schedules_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `prj_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_wbs_tasks` ADD CONSTRAINT `prj_wbs_tasks_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `prj_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_wbs_tasks` ADD CONSTRAINT `prj_wbs_tasks_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `prj_wbs_tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_task_dependencies` ADD CONSTRAINT `prj_task_dependencies_predecessorId_fkey` FOREIGN KEY (`predecessorId`) REFERENCES `prj_wbs_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_task_dependencies` ADD CONSTRAINT `prj_task_dependencies_successorId_fkey` FOREIGN KEY (`successorId`) REFERENCES `prj_wbs_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_milestones` ADD CONSTRAINT `prj_milestones_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `prj_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_risks` ADD CONSTRAINT `prj_risks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `prj_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_risks` ADD CONSTRAINT `prj_risks_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `sys_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_risk_responses` ADD CONSTRAINT `prj_risk_responses_riskId_fkey` FOREIGN KEY (`riskId`) REFERENCES `prj_risks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_risk_responses` ADD CONSTRAINT `prj_risk_responses_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `sys_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_costs` ADD CONSTRAINT `prj_costs_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `prj_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_cost_entries` ADD CONSTRAINT `prj_cost_entries_costId_fkey` FOREIGN KEY (`costId`) REFERENCES `prj_costs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prj_resources` ADD CONSTRAINT `prj_resources_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `prj_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_versions` ADD CONSTRAINT `document_versions_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_permissions` ADD CONSTRAINT `document_permissions_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
