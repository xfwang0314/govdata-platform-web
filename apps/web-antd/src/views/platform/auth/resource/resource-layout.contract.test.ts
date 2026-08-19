import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/resource/index.vue',
  ),
  'utf8',
);
const sidebarSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/resource/components/resource-directory-sidebar.vue',
  ),
  'utf8',
);
const detailDrawerSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/resource/components/resource-detail-drawer.vue',
  ),
  'utf8',
);
const tableComponentSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/resource/components/resource-table.vue',
  ),
  'utf8',
);
const tableDefinitionSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/resource/data.tsx',
  ),
  'utf8',
);
const datasourceModalSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/govdata/datasource/components/datasource-modal.vue',
  ),
  'utf8',
);

describe('授权资源页面布局契约', () => {
  it('使用固定高度的资源台账与目录双栏骨架', () => {
    expect(source).toContain('<Page :auto-content-height="true">');
    expect(source).toContain('class="flex h-full min-h-0 flex-col gap-3"');
    expect(sidebarSource).toContain(
      'class="resource-directory w-[272px] shrink-0"',
    );
    expect(tableComponentSource).toContain(
      ':table-title="activeNavigationLabel"',
    );
  });

  it('使用项目统一 VXE 列表承接内部滚动和分页', () => {
    expect(tableComponentSource).toContain('useVbenVxeGrid');
    expect(tableComponentSource).toContain("height: 'auto'");
    expect(tableComponentSource).toContain('pagerConfig: {}');
    expect(tableComponentSource).not.toContain('resource-ledger');
    expect(tableComponentSource).not.toContain('<Table');
  });

  it('资源类型与来源模块、安全分类与安全等级分别归组展示', () => {
    expect(tableComponentSource).toContain(
      '<template #resourceContext="{ row }">',
    );
    expect(tableComponentSource).toContain('<template #security="{ row }">');
    expect(tableDefinitionSource).toContain("title: '类型与来源'");
    expect(tableDefinitionSource).toContain("title: '权属与路径'");
    expect(tableDefinitionSource).toContain("title: '安全属性'");
  });

  it('资源目录默认展开并允许用户手动收起', () => {
    expect(source).toContain('const resourceDirectoryOpen = ref(true)');
    expect(source).toContain('v-if="resourceDirectoryOpen"');
    expect(source).toContain('@collapse="resourceDirectoryOpen = false"');
    expect(source).toContain('@open-directory="resourceDirectoryOpen = true"');
    expect(sidebarSource).toContain('default-expand-all');
  });

  it('跨模块统一使用安全分类和安全等级语义', () => {
    expect(tableDefinitionSource).toContain("label: '安全分类'");
    expect(tableDefinitionSource).not.toContain("title: '分类 / 等级'");
    expect(datasourceModalSource).toContain("label: '安全分类'");
    expect(detailDrawerSource).toContain(
      'classificationLabel(current.classification)',
    );
    expect(detailDrawerSource).toContain(
      'securityLevelLabel(current.securityLevel)',
    );
  });

  it('详情通过部门树显示权属部门名称而不是原始ID', () => {
    expect(source).toMatch(
      /import\s*\{\s*getDeptTree\s*\}\s*from '#\/api\/system\/user'/,
    );
    expect(detailDrawerSource).toContain('function ownerDepartmentLabel(');
    expect(detailDrawerSource).toContain(
      'ownerDepartmentLabel(current.ownerDeptId)',
    );
    expect(detailDrawerSource).not.toContain("current.ownerDeptId ?? '-'");
  });

  it('资源详情将授权属性以格式化 JSON 清晰展示', () => {
    expect(detailDrawerSource).toContain('<h4>授权属性</h4>');
    expect(detailDrawerSource).toContain('formattedAttributesJson');
    expect(detailDrawerSource).toContain('class="json-viewer');
  });

  it('详情加载完整资源并保留列表中的祖先路径', () => {
    expect(detailDrawerSource).toContain('getResourceApi(row.resourceId)');
    expect(detailDrawerSource).toContain(
      'resourcePath: detail.resourcePath ?? row.resourcePath',
    );
  });
});
