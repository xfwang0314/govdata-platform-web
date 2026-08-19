import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ACTION_CODE_LABELS,
  columns,
  PURPOSE_CODE_LABELS,
  REASON_CODE_LABELS,
  RESOURCE_TYPE_LABELS,
  SUBJECT_TYPE_LABELS,
} from './data';

const indexSource = readFileSync(
  resolve(process.cwd(), 'apps/web-antd/src/views/platform/auth/log/index.vue'),
  'utf8',
);
const tableSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/log/components/decision-log-table.vue',
  ),
  'utf8',
);
const drawerSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/log/components/decision-detail-drawer.vue',
  ),
  'utf8',
);

describe('决策日志优化与布局契约', () => {
  it('请求主体与决策结果在表格列配置中居中展示', () => {
    const subjectCol = columns?.find(
      (c) => 'field' in c && c.field === 'subject',
    );
    const decisionCol = columns?.find(
      (c) => 'field' in c && c.field === 'decision',
    );
    const actionCol = columns?.find(
      (c) => 'field' in c && c.field === 'action',
    );

    expect(subjectCol).toBeDefined();
    expect(subjectCol?.align).toBe('center');
    expect(subjectCol?.headerAlign).toBe('center');

    expect(decisionCol).toBeDefined();
    expect(decisionCol?.align).toBe('center');
    expect(decisionCol?.headerAlign).toBe('center');

    expect(actionCol?.align).toBe('center');
  });

  it('表格插槽内使用垂直居中和水平居中布局', () => {
    expect(tableSource).toContain('flex flex-col items-center justify-center');
    expect(tableSource).toContain('text-center');
  });

  it('提供了完善的中文映射字典', () => {
    expect(REASON_CODE_LABELS.AUTHZ_POLICY_PERMIT).toBe('策略放行');
    expect(REASON_CODE_LABELS.AUTHZ_GRANT_PERMIT).toBe('共享授权放行');
    expect(REASON_CODE_LABELS.AUTHZ_DEFAULT_DENY).toBe('默认拒绝(无匹配规则)');
    expect(REASON_CODE_LABELS.AUTHZ_ADMIN_BYPASS).toBe('管理员管理动作直通');
    expect(SUBJECT_TYPE_LABELS.HUMAN).toBe('用户');
    expect(SUBJECT_TYPE_LABELS.DEPARTMENT).toBe('部门');
    expect(SUBJECT_TYPE_LABELS.ROLE).toBe('角色');
    expect(RESOURCE_TYPE_LABELS.DATA_SOURCE).toBe('数据源');
    expect(ACTION_CODE_LABELS.QUERY_DATA).toBe('查询数据');
    expect(PURPOSE_CODE_LABELS.DAILY_ANALYSIS).toBe('日常分析');
  });

  it('页面完成组件化封装拆分', () => {
    expect(indexSource).toContain('<DecisionLogTable');
    expect(indexSource).toContain('<DecisionDetailDrawer');
    expect(tableSource).toContain('useVbenVxeGrid');
    expect(drawerSource).toContain('Drawer');
  });

  it('支持请求主体名称中文智能解析与表单下拉筛选', () => {
    expect(tableSource).toContain('useSubjectResolver');
    expect(tableSource).toContain('getSubjectDisplayName');
    expect(tableSource).toContain('getSubjectSelectOptions');
    expect(tableSource).toContain('handleValuesChange');
    expect(drawerSource).toContain('getSubjectDisplayName');
  });
});
