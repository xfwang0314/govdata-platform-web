import type { ResourceTypeItem } from '#/api/platform/auth/model';

import { describe, expect, it } from 'vitest';

import {
  buildPolicyResourceTypeOptions,
  buildPolicyResourceTypeTree,
} from './policy-resource-type-options';

function resourceType(
  typeCode: string,
  typeLabel: string,
  capability: 'CUSTOM_POLICY' | 'GRANT' | 'POLICY_TEMPLATE',
  sourceModule = 'govdata-datasource',
  moduleLabel = '数据源管理',
): ResourceTypeItem {
  return {
    actions: [],
    attributes: [],
    capabilities: [capability],
    categoryCode: 'TECHNICAL_DATA_ASSET',
    domainCode: 'test',
    domainLabel: '测试',
    moduleLabel,
    purposes: [],
    selectionModes: ['TYPE'],
    sourceModule,
    typeCode,
    typeLabel,
  };
}

describe('policy resource type options & tree', () => {
  it('统一策略组只展示 CUSTOM_POLICY 能力的资源类型', () => {
    const options = buildPolicyResourceTypeOptions([
      resourceType(
        'system:user',
        '用户数据',
        'POLICY_TEMPLATE',
        'ruoyi-system',
        '系统管理',
      ),
      resourceType(
        'govdata:datasource',
        '数据源',
        'CUSTOM_POLICY',
        'govdata-datasource',
        '数据源管理',
      ),
    ]);

    expect(options).toEqual([
      { label: '数据源管理 / 数据源', value: 'govdata:datasource' },
    ]);
  });

  it('buildPolicyResourceTypeTree 按模块分组构建树形结构', () => {
    const tree = buildPolicyResourceTypeTree([
      resourceType(
        'system:user',
        '用户数据',
        'CUSTOM_POLICY',
        'ruoyi-system',
        '系统管理',
      ),
      resourceType(
        'system:dept',
        '部门数据',
        'CUSTOM_POLICY',
        'ruoyi-system',
        '系统管理',
      ),
      resourceType(
        'govdata:datasource',
        '数据源',
        'CUSTOM_POLICY',
        'govdata-datasource',
        '数据源管理',
      ),
    ]);

    expect(tree).toHaveLength(2);
    expect(tree[0]).toMatchObject({
      disabled: true,
      label: '系统管理',
      selectable: false,
      value: 'module-ruoyi-system',
    });
    expect(tree[0]?.children).toEqual([
      { label: '用户数据', value: 'system:user' },
      { label: '部门数据', value: 'system:dept' },
    ]);
    expect(tree[1]).toMatchObject({
      disabled: true,
      label: '数据源管理',
      selectable: false,
      value: 'module-govdata-datasource',
    });
    expect(tree[1]?.children).toEqual([
      { label: '数据源', value: 'govdata:datasource' },
    ]);
  });
});
