import type { PolicyGroupView } from '#/api/platform/auth/model';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  canAbandonChanges,
  canDeleteUnpublishedPolicy,
  canEnablePolicy,
  canPublishPolicy,
  nextVersionNo,
  policyLifecycleAction,
  policyPublishPrompt,
} from './policy-lifecycle';

const pageSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/policy/components/policy-table.vue',
  ),
  'utf8',
);

describe('policy lifecycle flow contract', () => {
  it('策略列表只突出当前状态允许的唯一下一步操作按钮', () => {
    expect(pageSource).toContain('policyLifecycleAction(row)');
  });

  it('下一版本号由当前发布版本计算，不在模板中散落判断', () => {
    expect(pageSource).toContain('nextVersionNo(row)');
    expect(pageSource).not.toContain('row.currentVersionNo && !row.hasDraft');
  });

  it('运行中的已发布版本只能查看和停用，不允许直接创建新版本', () => {
    const row = {
      currentVersionNo: 1,
      hasDraft: false,
      status: 'ACTIVE',
    } as PolicyGroupView;

    expect(nextVersionNo(row)).toBe(2);
    expect(policyLifecycleAction(row)).toBeUndefined();
  });

  it('停用后才允许创建递增的待发布版本', () => {
    const row = {
      currentVersionNo: 1,
      hasDraft: false,
      status: 'DISABLED',
    } as PolicyGroupView;

    expect(policyLifecycleAction(row)).toEqual({
      kind: 'CREATE_VERSION',
      label: '创建 V2 待发布版本',
    });
  });

  it('停用状态存在待发布版本时唯一下一步是继续编辑', () => {
    const row = {
      currentVersionNo: 1,
      draftVersionNo: 2,
      hasDraft: true,
      status: 'DISABLED',
    } as PolicyGroupView;

    expect(policyLifecycleAction(row)).toEqual({
      kind: 'EDIT_PENDING',
      label: '编辑 V2 待发布版本',
    });
  });

  it('历史遗留的运行中加待发布版本必须先停用', () => {
    const row = {
      currentVersionNo: 1,
      draftVersionNo: 2,
      hasDraft: true,
      status: 'ACTIVE',
    } as PolicyGroupView;

    expect(policyLifecycleAction(row)).toBeUndefined();
    expect(canPublishPolicy(row)).toBe(false);
  });

  it('停用状态发布新版本必须明确提示会重新启用', () => {
    const row = {
      currentVersionNo: 1,
      draftVersionNo: 2,
      hasDraft: true,
      status: 'DISABLED',
    } as PolicyGroupView;

    expect(policyPublishPrompt(row)).toContain('重新启用策略组');
  });

  it('存在待发布版本时不能启用旧版本，优先发布新版本', () => {
    const row = {
      currentVersionNo: 1,
      draftVersionNo: 2,
      hasDraft: true,
      status: 'DISABLED',
    } as PolicyGroupView;

    expect(canEnablePolicy(row)).toBe(false);
    expect(canPublishPolicy(row)).toBe(true);
  });

  it('同一个 V1 被旧数据同时标记为当前版本和待发布版本时按未发布策略处理', () => {
    const row = {
      currentVersionNo: 1,
      draftVersionNo: 1,
      hasDraft: true,
      status: 'DISABLED',
    } as PolicyGroupView;

    expect(canAbandonChanges(row)).toBe(false);
    expect(canDeleteUnpublishedPolicy(row)).toBe(true);
  });

  it('已放弃版本即使残留待发布指针也不能再次编辑或发布', () => {
    const row = {
      currentVersionNo: undefined,
      draftVersion: {
        versionNo: 1,
        versionStatus: 'DISCARDED',
      },
      draftVersionNo: 1,
      hasDraft: true,
      status: 'DRAFT',
    } as PolicyGroupView;

    expect(policyLifecycleAction(row)).toBeUndefined();
    expect(canPublishPolicy(row)).toBe(false);
  });
});
