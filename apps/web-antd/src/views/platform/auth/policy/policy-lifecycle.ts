import type { PolicyGroupView } from '#/api/platform/auth/model';

export type PolicyPrimaryAction =
  | { kind: 'CREATE_VERSION'; label: string }
  | { kind: 'EDIT_PENDING'; label: string };

export function nextVersionNo(row: PolicyGroupView) {
  return (row.currentVersionNo ?? 0) + 1;
}

function hasPublishedVersion(row: PolicyGroupView) {
  return (
    !!row.currentVersionNo &&
    (!row.hasDraft || row.currentVersionNo !== row.draftVersionNo)
  );
}

function hasPendingVersion(row: PolicyGroupView) {
  return (
    row.hasDraft &&
    (!row.draftVersion || row.draftVersion.versionStatus === 'DRAFT')
  );
}

export function policyLifecycleAction(
  row: PolicyGroupView,
): PolicyPrimaryAction | undefined {
  if (
    hasPendingVersion(row) &&
    row.draftVersionNo &&
    (row.status === 'DRAFT' || row.status === 'DISABLED')
  ) {
    return {
      kind: 'EDIT_PENDING',
      label: `编辑 V${row.draftVersionNo} 待发布版本`,
    };
  }
  if (row.status === 'DISABLED' && row.currentVersionNo) {
    return {
      kind: 'CREATE_VERSION',
      label: `创建 V${nextVersionNo(row)} 待发布版本`,
    };
  }
  return undefined;
}

export function policyLifecycleSummary(row: PolicyGroupView) {
  if (hasPublishedVersion(row) && row.draftVersionNo) {
    return row.status === 'ACTIVE'
      ? `V${row.currentVersionNo} 运行中 · V${row.draftVersionNo} 待发布（请先停用）`
      : `V${row.currentVersionNo} 已停用 · V${row.draftVersionNo} 待发布`;
  }
  if (hasPublishedVersion(row)) {
    return row.status === 'ACTIVE'
      ? `V${row.currentVersionNo} 运行中 · 已发布版本只读`
      : `V${row.currentVersionNo} 已停用 · 可创建 V${nextVersionNo(row)}`;
  }
  return row.draftVersionNo
    ? `V${row.draftVersionNo} 待发布 · 可继续编辑`
    : '无可用版本';
}

export function canPublishPolicy(row: PolicyGroupView) {
  return (
    hasPendingVersion(row) &&
    (row.status === 'DRAFT' || row.status === 'DISABLED')
  );
}

export function canDisablePolicy(row: PolicyGroupView) {
  return row.status === 'ACTIVE';
}

export function canEnablePolicy(row: PolicyGroupView) {
  return row.status === 'DISABLED' && !row.hasDraft;
}

export function canAbandonChanges(row: PolicyGroupView) {
  return (
    row.status === 'DISABLED' &&
    hasPendingVersion(row) &&
    hasPublishedVersion(row)
  );
}

export function canDeleteUnpublishedPolicy(row: PolicyGroupView) {
  return (
    hasPendingVersion(row) &&
    !hasPublishedVersion(row) &&
    (row.status === 'DRAFT' || row.status === 'DISABLED')
  );
}

export function canDeletePolicyGroup(row: PolicyGroupView) {
  return row.status === 'DISABLED' && !row.hasDraft;
}

export function policyPublishPrompt(row: PolicyGroupView) {
  const version = `V${row.draftVersionNo}`;
  if (!hasPublishedVersion(row)) {
    return `发布 ${version} 后策略组将立即启用，且该版本不可原地修改，确认发布？`;
  }
  if (row.status === 'DISABLED') {
    return `发布 ${version} 将替换当前版本并重新启用策略组，确认发布？`;
  }
  if (row.currentVersionNo) {
    return `发布 ${version} 将替换 V${row.currentVersionNo}，历史版本保留且不可修改，确认发布？`;
  }
  return `发布 ${version}，确认继续？`;
}
