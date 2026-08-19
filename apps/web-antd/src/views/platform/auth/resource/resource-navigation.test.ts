import type { ResourceTypeItem } from '#/api/platform/auth/model';

import { describe, expect, it } from 'vitest';

import {
  buildResourceNavigation,
  resolveResourceNavigationFilter,
} from './resource-navigation';

const resourceTypes: ResourceTypeItem[] = [
  {
    actions: [],
    attributes: [],
    capabilities: ['RESOURCE_CATALOG'],
    domainCode: 'CONNECTION',
    domainLabel: '连接资源',
    moduleLabel: '数据源管理',
    purposes: [],
    selectionModes: ['TYPE', 'INSTANCE'],
    sourceModule: 'govdata-datasource',
    typeCode: 'govdata:datasource',
    typeLabel: '数据源',
  },
];

describe('授权资源目录导航', () => {
  it('按来源模块组织资源类型而不是拼接领域与类型名称', () => {
    expect(buildResourceNavigation(resourceTypes)).toEqual([
      {
        children: [
          {
            key: 'type:govdata-datasource:govdata:datasource',
            title: '数据源',
          },
        ],
        key: 'module:govdata-datasource',
        title: '数据源管理',
      },
    ]);
  });

  it('模块节点和资源类型节点生成不同精度的查询条件', () => {
    expect(
      resolveResourceNavigationFilter('module:govdata-datasource'),
    ).toEqual({
      resourceType: undefined,
      sourceModule: 'govdata-datasource',
    });
    expect(
      resolveResourceNavigationFilter(
        'type:govdata-datasource:govdata:datasource',
      ),
    ).toEqual({
      resourceType: 'govdata:datasource',
      sourceModule: 'govdata-datasource',
    });
  });
});
