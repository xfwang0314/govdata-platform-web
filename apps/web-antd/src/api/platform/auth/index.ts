import type {
  AccessDecision,
  AuthorizationCheckCommand,
  AuthzOptionsView,
  DecisionLogQueryParam,
  DecisionLogView,
  GrantDraftCommand,
  GrantRevokeCommand,
  GrantView,
  PolicyGroupDraftCommand,
  PolicyGroupDraftUpdateCommand,
  PolicyGroupView,
  PolicyOperationLogView,
  PolicyVersionView,
  ResourceDescriptor,
  ResourceQueryParam,
  ResourceTreeNode,
} from './model';

import type { ID, PageResult } from '#/api/common';

import { alovaInstance } from '#/utils/http';

export function getAuthzOptionsApi() {
  return alovaInstance.get<AuthzOptionsView>('/platform/auth/options');
}

// ── 1. Resource 授权资源管理 ──
export function getResourceApi(resourceId: ID) {
  return alovaInstance.get<ResourceDescriptor>(
    `/platform/auth/resources/${resourceId}`,
  );
}

export function getResourcePageApi(params?: ResourceQueryParam) {
  return alovaInstance.get<PageResult<ResourceDescriptor>>(
    '/platform/auth/resources/page',
    { params },
  );
}

export function getResourceTreeApi(resourceType: string, status?: string) {
  return alovaInstance.get<ResourceTreeNode[]>(
    '/platform/auth/resources/tree',
    { params: { resourceType, status: status ?? 'ACTIVE' } },
  );
}

// ── 2. Policy 策略组与不可变版本 ──
export function createPolicyGroupApi(data: PolicyGroupDraftCommand) {
  return alovaInstance.post<PolicyGroupView>(
    '/platform/auth/policy-groups',
    data,
  );
}

export function updatePolicyGroupDraftApi(
  policyGroupCode: string,
  data: PolicyGroupDraftUpdateCommand,
) {
  return alovaInstance.put<PolicyGroupView>(
    `/platform/auth/policy-groups/${policyGroupCode}/draft`,
    data,
  );
}

export function getPolicyGroupPageApi(params?: Record<string, unknown>) {
  return alovaInstance.get<PageResult<PolicyGroupView>>(
    '/platform/auth/policy-groups/page',
    { params },
  );
}

export function getPolicyGroupApi(policyGroupCode: string) {
  return alovaInstance.get<PolicyGroupView>(
    `/platform/auth/policy-groups/${policyGroupCode}`,
  );
}

export function createPolicyGroupVersionApi(policyGroupCode: string) {
  return alovaInstance.post<PolicyGroupView>(
    `/platform/auth/policy-groups/${policyGroupCode}/versions`,
  );
}

export function publishPolicyGroupApi(policyGroupCode: string) {
  return alovaInstance.put<PolicyGroupView>(
    `/platform/auth/policy-groups/${policyGroupCode}/publish`,
  );
}

export function disablePolicyGroupApi(policyGroupCode: string) {
  return alovaInstance.put<PolicyGroupView>(
    `/platform/auth/policy-groups/${policyGroupCode}/disable`,
    { reason: '管理员从策略组列表停用' },
  );
}

export function enablePolicyGroupApi(policyGroupCode: string) {
  return alovaInstance.put<PolicyGroupView>(
    `/platform/auth/policy-groups/${policyGroupCode}/enable`,
  );
}

export function discardPolicyGroupDraftApi(policyGroupCode: string) {
  return alovaInstance.delete<PolicyGroupView>(
    `/platform/auth/policy-groups/${policyGroupCode}/draft`,
  );
}

export function deletePolicyGroupApi(policyGroupCode: string, reason: string) {
  return alovaInstance.delete<void>(
    `/platform/auth/policy-groups/${policyGroupCode}`,
    { reason },
  );
}

export function restorePolicyGroupApi(policyGroupCode: string) {
  return alovaInstance.put<PolicyGroupView>(
    `/platform/auth/policy-groups/${policyGroupCode}/restore`,
  );
}

export function getPolicyGroupVersionsApi(policyGroupCode: string) {
  return alovaInstance.get<PolicyVersionView[]>(
    `/platform/auth/policy-groups/${policyGroupCode}/versions`,
  );
}

export function createPolicyDraftFromVersionApi(
  policyGroupCode: string,
  versionId: ID,
) {
  return alovaInstance.post<PolicyGroupView>(
    `/platform/auth/policy-groups/${policyGroupCode}/versions/${versionId}/draft`,
  );
}

export function getPolicyGroupOperationsApi(policyGroupCode: string) {
  return alovaInstance.get<PolicyOperationLogView[]>(
    `/platform/auth/policy-groups/${policyGroupCode}/operations`,
  );
}

// ── 3. Grant 运行时授权凭据管理 ──
export function createGrantDraftApi(data: GrantDraftCommand) {
  return alovaInstance.post<GrantView>('/platform/auth/grants', data);
}

export function updateGrantDraftApi(grantId: ID, data: GrantDraftCommand) {
  return alovaInstance.put<GrantView>(
    `/platform/auth/grants/${grantId}/draft`,
    data,
  );
}

export function activateGrantApi(grantId: ID) {
  return alovaInstance.put<GrantView>(
    `/platform/auth/grants/${grantId}/activate`,
  );
}

export function revokeGrantApi(grantId: ID, data: GrantRevokeCommand) {
  return alovaInstance.put<GrantView>(
    `/platform/auth/grants/${grantId}/revoke`,
    data,
  );
}

export function getGrantApi(grantId: ID) {
  return alovaInstance.get<GrantView>(`/platform/auth/grants/${grantId}`);
}

export function getGrantPageApi(params?: Record<string, unknown>) {
  return alovaInstance.get<PageResult<GrantView>>(
    '/platform/auth/grants/page',
    { params },
  );
}

export function deleteGrantApi(grantId: ID, reason?: string) {
  return alovaInstance.delete<void>(
    `/platform/auth/grants/${grantId}`,
    undefined,
    { params: { reason } },
  );
}

export function restoreGrantApi(grantId: ID) {
  return alovaInstance.put<GrantView>(
    `/platform/auth/grants/${grantId}/restore`,
  );
}

// ── 4. Decision & Log 授权排障与决策审计 ──
export function evaluateAuthorizationApi(data: AuthorizationCheckCommand) {
  return alovaInstance.post<AccessDecision>(
    '/platform/auth/decisions/evaluate',
    data,
  );
}

export function getDecisionLogsPageApi(params?: DecisionLogQueryParam) {
  return alovaInstance.get<PageResult<DecisionLogView>>(
    '/platform/auth/decisions/logs/page',
    {
      params,
    },
  );
}
