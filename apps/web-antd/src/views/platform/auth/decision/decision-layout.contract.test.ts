import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const decisionSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/decision/index.vue',
  ),
  'utf8',
);
const formSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/decision/components/decision-form.vue',
  ),
  'utf8',
);
const resultSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/decision/components/decision-result.vue',
  ),
  'utf8',
);
const logSource = readFileSync(
  resolve(process.cwd(), 'apps/web-antd/src/views/platform/auth/log/index.vue'),
  'utf8',
);
const logTableSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/log/components/decision-log-table.vue',
  ),
  'utf8',
);
const logDataSource = readFileSync(
  resolve(process.cwd(), 'apps/web-antd/src/views/platform/auth/log/data.tsx'),
  'utf8',
);
const drawerSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/log/components/decision-detail-drawer.vue',
  ),
  'utf8',
);

describe('授权验证与审计页面布局契约', () => {
  it('按模块、资源类型、多选实体和动作执行真实授权验证', () => {
    expect(formSource).toContain('v-model:value="form.sourceModule"');
    expect(formSource).toContain('v-model:value="form.resourceType"');
    expect(formSource).toContain('v-model:value="form.resourceIds"');
    expect(formSource).toContain('v-model:value="form.actions"');
    expect(decisionSource).toContain('evaluateAuthorizationApi');
  });

  it('持续展示决策结果矩阵和命中依据，不只弹临时消息', () => {
    expect(resultSource).toContain('决策验证结果矩阵');
    expect(resultSource).toContain(
      'currentDetail.decision.matchedPolicyIds.length',
    );
    expect(resultSource).toContain(
      'currentDetail.decision.matchedGrantIds.length',
    );
    expect(resultSource).not.toContain('message[result.decision');
  });

  it('验证页使用规范的分区步骤与组件化结构', () => {
    expect(decisionSource).toContain('<DecisionForm');
    expect(decisionSource).toContain('<DecisionResult');
    expect(formSource).toContain('01');
    expect(formSource).toContain('02');
    expect(formSource).toContain('03');
  });

  it('审计台账页使用 VXE 自适应列表与规范过滤字段', () => {
    expect(logSource).toContain('<DecisionLogTable');
    expect(logTableSource).toContain('useVbenVxeGrid');
    expect(logTableSource).toContain('table-title="授权决策审计"');
    expect(logTableSource).toContain("height: 'auto'");
    expect(logTableSource).not.toContain('<Table');
    expect(logDataSource).toContain("fieldName: 'traceId'");
    expect(logDataSource).toContain("fieldName: 'decision'");
    expect(logTableSource).toContain(
      "return decision === 'PERMIT' ? '允许' : '拒绝'",
    );
    expect(logDataSource).toContain("title: '决策结果'");
  });

  it('详情将命中策略、共享授权和执行约束分区展示', () => {
    expect(drawerSource).toContain('命中策略版本');
    expect(drawerSource).toContain('命中共享授权');
    expect(drawerSource).toContain('执行约束');
  });
});
