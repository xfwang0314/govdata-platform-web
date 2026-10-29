import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const styles = source('apps/web-antd/src/styles/govdata-console.css');
const datasourcePage = source(
  'apps/web-antd/src/views/govdata/datasource/index.vue',
);
const datasourceTable = source(
  'apps/web-antd/src/views/govdata/datasource/components/datasource-table.vue',
);
const datasourceModal = source(
  'apps/web-antd/src/views/govdata/datasource/components/datasource-modal.vue',
);
const datasourceData = source(
  'apps/web-antd/src/views/govdata/datasource/data.tsx',
);
const metadataPage = source(
  'apps/web-antd/src/views/govdata/metadata/index.vue',
);
const metadataList = source(
  'apps/web-antd/src/views/govdata/metadata/components/metadata-asset-list.vue',
);
const antdDesignTokens = source(
  'packages/effects/hooks/src/use-design-tokens.ts',
);

describe('政务数据中台控制台设计基线', () => {
  it('集中定义页面、控件、表格、树和状态 Token', () => {
    expect(styles).toContain('--gov-console-page-padding');
    expect(styles).toContain('--gov-console-table-row-height');
    expect(styles).toContain('--gov-console-tree-row-height');
    expect(styles).toContain('--gov-console-selected');
    expect(styles).toContain('--gov-console-success');
    expect(styles).toContain('--gov-console-warning');
    expect(styles).toContain('--gov-console-danger');
  });

  it('将字号和表单控件尺寸交给全局主题，而不是页面样式', () => {
    expect(antdDesignTokens).toContain('tokens.fontSize = baseFontSize');
    expect(antdDesignTokens).toContain('tokens.controlHeight = controlHeight');
    expect(antdDesignTokens).toContain('preferences.app.compact');
    expect(styles).not.toContain(
      '.gov-metadata-filterbar__control.ant-input-affix-wrapper',
    );
  });

  it('资源管理使用标准表格，资产发现复用分页和表格样式', () => {
    expect(datasourcePage).toContain('gov-console-page');
    expect(metadataPage).toContain('gov-console-page');
    expect(datasourceTable).toContain('useVbenVxeGrid');
    expect(datasourcePage).toContain('<DatasourceSummaryCard');
    expect(metadataList).toContain('useMetadataResults');
    expect(datasourceTable).toContain(
      "wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'",
    );
    expect(metadataList).toContain('metadata-results__query');
    expect(datasourceTable).toContain('size-1.5 rounded-full');
    expect(metadataList).toContain('<Pagination');
  });

  it('将表格表头和行高作为资源页的统一基线', () => {
    expect(metadataList).toContain('gov-console-table');
    expect(metadataList).toContain('metadata-result-card');
    expect(datasourceTable).toContain("headerAlign: 'center'");
    expect(datasourceTable).toContain('headerCellConfig: { height: 44 }');
  });

  it('权属部门下拉展示局部名称且选中后展示完整路径', () => {
    expect(datasourceModal).toContain("label: 'label'");
    expect(datasourceModal).toContain("treeNodeFilterProp: 'fullName'");
    expect(datasourceModal).toContain("treeNodeLabelProp: 'fullName'");
  });

  it('操作列关闭溢出提示避免路由切换后浮层残留', () => {
    expect(datasourceData).toContain('showOverflow: false');
  });
});
