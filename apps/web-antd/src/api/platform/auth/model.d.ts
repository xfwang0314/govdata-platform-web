import type { ID } from '#/api/common';

export interface OptionItem {
  label: string;
  value: string;
}

export interface AuthorizationAttributeItem {
  label: string;
  operandRole: 'BOTH' | 'LEFT' | 'RIGHT';
  operators: string[];
  path: string;
  valueOptions: OptionItem[];
  valueType: string;
  visibility: 'ADVANCED' | 'BASIC' | 'TEMPLATE_ONLY';
}

export interface ResourceTypeItem {
  actions: OptionItem[];
  attributes: AuthorizationAttributeItem[];
  capabilities: ResourceAuthorizationCapability[];
  categoryCode: string;
  domainCode: string;
  domainLabel: string;
  moduleLabel: string;
  purposes: OptionItem[];
  selectionModes: ResourceSelectionMode[];
  sourceModule: string;
  typeCode: string;
  typeLabel: string;
}

export interface ResourceCategoryItem {
  code: string;
  label: string;
  order: number;
}

export type ResourceSelectionMode = 'INSTANCE' | 'TYPE';
export type ResourceAuthorizationCapability =
  | 'CUSTOM_POLICY'
  | 'GRANT'
  | 'INSTANCE_DECISION'
  | 'POLICY_TEMPLATE'
  | 'QUERY_SCOPE'
  | 'RESOURCE_CATALOG'
  | 'TYPE_CONTEXT_DECISION';

export interface AuthzOptionsView {
  classifications: OptionItem[];
  grantPurposes: OptionItem[];
  grantSourceTypes: OptionItem[];
  grantStatuses: OptionItem[];
  operators: OptionItem[];
  policyEffects: OptionItem[];
  policyRiskLevels: OptionItem[];
  policyStatuses: OptionItem[];
  policyVersionStatuses: OptionItem[];
  resourceDomains: OptionItem[];
  resourceCategories: ResourceCategoryItem[];
  resourceModules: OptionItem[];
  resourceStatuses: OptionItem[];
  resourceTypes: ResourceTypeItem[];
  securityLevels: OptionItem[];
  subjectTypes: OptionItem[];
}

export interface ResourceDescriptor {
  attributes?: Record<string, unknown>;
  businessId?: string;
  classification?: string;
  ownerDeptId?: ID;
  ownerDeptPathIds?: ID[];
  ownerUserId?: ID;
  parentId?: ID;
  regionCode?: string;
  resourceCode: string;
  resourceId: ID;
  resourceName: string;
  resourcePath?: string;
  resourceType: string;
  securityLevel?: number;
  sourceModule: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DISABLED';
  tenantId?: string;
}

export interface ResourceQueryParam {
  classification?: string;
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
  resourceId?: ID;
  resourceType?: string;
  sourceModule?: string;
  status?: string;
}

export interface ResourceDirectoryNode {
  code: string;
  id: ID;
  label: string;
  leaf: boolean;
  parentId?: ID;
  resourceType: string;
  sourceModule: string;
  status: string;
}

export interface ResourceTreeNode {
  children?: ResourceTreeNode[];
  code: string;
  id: ID;
  label: string;
  parentId?: ID;
  status: string;
}

export type PolicyEffect = 'DENY' | 'PERMIT';
export type PolicyAggregateStatus = 'ACTIVE' | 'DISABLED' | 'DRAFT';
export type PolicyVersionStatus =
  | 'DISCARDED'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'SUPERSEDED';
export type SubjectType =
  | 'AGENT'
  | 'ANY'
  | 'DEPARTMENT'
  | 'HUMAN'
  | 'ROLE'
  | 'SERVICE';

export interface PolicySubjectCommand {
  includeChildren: boolean;
  subjectId: string;
  subjectType: SubjectType;
}

export interface PolicyResourceTargetCommand {
  includeChildren: boolean;
  resourceId: ID;
}

export interface PolicyRuleCommand {
  actions: string[];
  conditionJson?: string;
  obligationJson?: string;
  purposes: string[];
  resourceScope: 'INSTANCE' | 'TYPE';
  resourceType: string;
  ruleCode?: string;
  targets: PolicyResourceTargetCommand[];
}

export interface PolicyDocument {
  catalogSnapshots: Record<
    string,
    { code: string; definitionVersion: string; label: string }
  >;
  description?: string;
  effect: PolicyEffect;
  policyName: string;
  priority: number;
  riskLevel: string;
  rules: PolicyRuleCommand[];
  schemaVersion: number;
  subjects: {
    items: PolicySubjectCommand[];
    operator: 'ANY';
  };
}

export interface PolicyVersionView {
  contentHash: string;
  createdBy?: ID;
  createdTime?: string;
  document: PolicyDocument;
  lockVersion: number;
  policyGroupVersionId: ID;
  publishedBy?: ID;
  publishedTime?: string;
  schemaVersion: number;
  versionNo: number;
  versionStatus: PolicyVersionStatus;
}

export interface PolicyGroupView {
  createTime?: string;
  currentVersion?: PolicyVersionView;
  currentVersionNo?: number;
  deleteReason?: string;
  deleted: boolean;
  deletedBy?: ID;
  deletedTime?: string;
  description?: string;
  draftVersion?: PolicyVersionView;
  draftVersionNo?: number;
  groupLockVersion: number;
  hasDraft: boolean;
  policyGroupCode: string;
  policyGroupId: ID;
  policyName: string;
  priority: number;
  riskLevel: string;
  status: PolicyAggregateStatus;
  updateTime?: string;
}

export interface PolicyOperationLogView {
  fromStatus?: PolicyAggregateStatus;
  occurredTime: string;
  operationDetailJson?: string;
  operationLabel: string;
  operationLogId: ID;
  operationReason?: string;
  operationType: string;
  operatorId: string;
  operatorType: string;
  policyVersionId?: ID;
  toStatus?: PolicyAggregateStatus;
  traceId?: string;
}

export interface PolicyGroupDraftCommand {
  description?: string;
  effect: PolicyEffect;
  policyName: string;
  priority: number;
  riskLevel: string;
  rules: PolicyRuleCommand[];
  subjectOperator: 'ANY';
  subjects: PolicySubjectCommand[];
}

export interface PolicyGroupDraftUpdateCommand extends PolicyGroupDraftCommand {
  versionLockVersion: number;
}

export interface GrantScopeView {
  actionCode: string;
  includeChildren: boolean;
  obligationJson?: string;
  resourceCode?: string;
  resourceId: ID;
  resourceName?: string;
  scopeId: ID;
}

export interface GrantView {
  conditionJson?: string;
  createTime?: string;
  effectiveTime: string;
  expireTime?: string;
  grantCode: string;
  grantId: ID;
  grantorId: string;
  grantorType: string;
  granteeId: string;
  granteeType: SubjectType;
  purpose: string;
  revokeReason?: string;
  scopes: GrantScopeView[];
  sourceId: string;
  sourceType: string;
  status: 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'PENDING' | 'REVOKED';
  updateTime?: string;
}

export interface GrantDraftCommand {
  conditionJson?: string;
  effectiveTime: string;
  expireTime?: string;
  granteeId: string;
  granteeType: SubjectType;
  purpose: string;
  scopes: Array<{
    actionCode: string;
    includeChildren: boolean;
    obligationJson?: string;
    resourceId: ID;
  }>;
}

export interface GrantRevokeCommand {
  reason: string;
}

export interface AccessDecision {
  decision: 'DENY' | 'PERMIT';
  matchedGrantIds: ID[];
  matchedPolicyIds: ID[];
  obligation?: Record<string, unknown>;
  reason: string;
  reasonCode: string;
}

export interface AuthorizationCheckCommand {
  action: string;
  purpose: string;
  resourceId: ID;
  resourceType: string;
  subjectId?: string;
  subjectType?: 'DEPARTMENT' | 'HUMAN' | 'ROLE';
  userId?: ID;
}

export interface DecisionLogView {
  actionCode: string;
  decision: 'DENY' | 'PERMIT';
  decisionId: ID;
  durationMs: number;
  grantIdsJson: string;
  obligationSummaryJson: string;
  occurredTime: string;
  policyVersionIdsJson: string;
  purpose?: string;
  reasonCode: string;
  resourceCode: string;
  resourceId: ID;
  resourceType: string;
  subjectId: string;
  subjectType: string;
  traceId: string;
}

export interface DecisionLogQueryParam {
  actionCode?: string;
  decision?: 'DENY' | 'PERMIT';
  pageNum?: number;
  pageSize?: number;
  resourceCode?: string;
  subjectId?: string;
  subjectType?: string;
  traceId?: string;
}
