import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const harvest = source(
  'apps/web-antd/src/views/govdata/metadata-harvest/index.vue',
);
const planWorkspace = source(
  'apps/web-antd/src/views/govdata/metadata-harvest/components/harvest-plan-workspace.vue',
);

describe('元数据采集工作台', () => {
  it('计划配置与运行记录使用两个独立模态框', () => {
    expect(harvest).toContain('wrap-class-name="gov-harvest-plan-modal"');
    expect(harvest).toContain('wrap-class-name="gov-harvest-runs-modal"');
    expect(harvest).toContain('<HarvestPlanWorkspace');
    expect(harvest).toContain('<HarvestPlanRunsPanel');
    expect(planWorkspace).not.toContain('<Tabs');
    expect(planWorkspace).not.toContain('HarvestPlanRunsPanel');
  });

  it('计划状态与数据源状态统一使用ApiSwitch', () => {
    expect(harvest).toContain('<ApiSwitch');
    expect(harvest).toContain('handlePlanStatusChange');
    expect(harvest).toContain("planStatus: enabled ? 'ACTIVE' : 'DISABLED'");
  });

  it('返回数据源管理位于新建采集计划左侧的同一工具栏', () => {
    expect(harvest).toContain('<Space>');
    expect(harvest.indexOf('返回数据源管理')).toBeGreaterThan(-1);
    expect(harvest.indexOf('返回数据源管理')).toBeLessThan(
      harvest.indexOf('新建采集计划'),
    );
    expect(harvest).not.toContain('gov-harvest-context-bar');
  });

  it('列表展示采集概览且不再提供查看详情操作', () => {
    expect(harvest).toContain('<HarvestSummaryCard');
    expect(harvest).not.toContain("key: 'detail'");
    expect(harvest).not.toContain('查看详情');
  });

  it('采集范围从数据源读取数据库和Schema选项', () => {
    expect(planWorkspace).toContain('getDataSourceDatabasesApi');
    expect(planWorkspace).toContain('getDataSourceTablesApi');
    expect(planWorkspace).toContain('label="限定数据库"');
    expect(planWorkspace).toContain('v-if="supportsSchema"');
    expect(planWorkspace).toContain('label="限定 Schema"');
    expect(planWorkspace).not.toContain(
      '<Input\n                v-model:value="model.catalogName"',
    );
  });

  it('数据库、Schema和数据表规则分区配置并使用受控匹配方式', () => {
    expect(planWorkspace).toContain("scope: 'CATALOG'");
    expect(planWorkspace).toContain("scope: 'SCHEMA'");
    expect(planWorkspace).toContain("scope: 'TABLE'");
    expect(planWorkspace).toContain('addRule(group.scope)');
    expect(planWorkspace).not.toContain('v-model:value="rule.ruleScope"');
    expect(planWorkspace).toContain(':options="options?.matchTypes"');
    expect(planWorkspace).toContain("rule.matchType === 'REGEX'");
    expect(planWorkspace).toContain('regexError(rule)');
  });

  it('采集表单复用统一标签、网格及底部操作规格', () => {
    expect(planWorkspace).toContain('v-bind="consoleFormLayout.nativeProps"');
    expect(planWorkspace).toContain(':class="consoleFormLayout.gridClass"');
    expect(planWorkspace).toContain(
      '<footer class="gov-console-form-actions">',
    );
    expect(harvest).toContain(':width="consoleFormLayout.modalWidth"');
    expect(planWorkspace).not.toContain("flex: '120px'");
  });

  it('权属部门树与数据源表单统一使用局部节点和完整选中路径', () => {
    expect(planWorkspace).toContain("addFullName(deptResult, 'label', ' / ')");
    expect(planWorkspace).toContain('tree-node-filter-prop="fullName"');
    expect(planWorkspace).toContain('tree-node-label-prop="fullName"');
  });
});
