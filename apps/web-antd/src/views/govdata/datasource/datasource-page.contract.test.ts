import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const page = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/govdata/datasource/index.vue',
  ),
  'utf8',
);
const summaryCard = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/govdata/datasource/components/datasource-summary-card.vue',
  ),
  'utf8',
);
const tableComponent = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/govdata/datasource/components/datasource-table.vue',
  ),
  'utf8',
);

describe('数据源管理页面契约', () => {
  it('使用目录式概览但仍由 Connector Catalog 提供统计事实', () => {
    expect(summaryCard).toContain('数据连接目录');
    expect(page).toContain('connectorCount');
    expect(page).toContain('connectorCategoriesCount');
    expect(tableComponent).toContain('connectors.map((item) => item.category)');
  });

  it('保留固定高度列表和全部既有业务操作', () => {
    expect(page).toContain('auto-content-height');
    expect(tableComponent).toContain('class="min-h-0 flex-1 overflow-hidden"');
    expect(tableComponent).toContain('handleReconcileAuthorization');
    expect(tableComponent).toContain("emit('add')");
    expect(tableComponent).toContain('handleEdit(row)');
    expect(tableComponent).toContain('handleTest(row)');
    expect(tableComponent).toContain('handleViewMetadata(row)');
    expect(tableComponent).toContain('handleViewHistory(row)');
    expect(tableComponent).toContain('handleDelete(row)');
  });

  it('保留创建编辑、测试历史和元数据弹窗', () => {
    expect(page).toContain('<DatasourceModalComponent');
    expect(page).toContain('<HistoryModal />');
    expect(page).toContain('<MetadataModalComponent />');
  });

  it('状态开关和授权资源同步继续使用原权限及 API', () => {
    expect(tableComponent).toContain(
      'v-access:code="[\'govdata:datasource:edit\']"',
    );
    expect(tableComponent).toContain(
      'handleStatusChange(Boolean(enabled), row)',
    );
    expect(tableComponent).toContain(
      'reconcileDataSourceAuthorizationProjectionsApi',
    );
  });
});
