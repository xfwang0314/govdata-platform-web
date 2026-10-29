import type { ResourceCategoryItem } from '#/api/platform/auth/model';

import { describe, expect, it } from 'vitest';

import {
  buildResourceNavigation,
  resolveResourceNavigationFilter,
} from './resource-navigation';

const resourceCategories: ResourceCategoryItem[] = [
  { code: 'TECHNICAL_DATA_ASSET', label: '技术数据资产', order: 10 },
];

describe('授权资源目录导航', () => {
  it('按后端定义的分类及顺序构建顶层导航', () => {
    expect(buildResourceNavigation(resourceCategories)).toEqual([
      {
        categoryCode: 'TECHNICAL_DATA_ASSET',
        isLeaf: false,
        key: 'category:TECHNICAL_DATA_ASSET',
        selectable: false,
        title: '技术数据资产',
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
