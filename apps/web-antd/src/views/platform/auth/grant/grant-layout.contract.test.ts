import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const pageSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/grant/components/grant-table.vue',
  ),
  'utf8',
);
const modalSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/grant/components/grant-modal.vue',
  ),
  'utf8',
);
const tableDefinitionSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/grant/data.tsx',
  ),
  'utf8',
);

describe('共享授权页面布局契约', () => {
  it('grant 生命周期状态消费后端选项目录', () => {
    expect(pageSource).toContain('options.value?.grantStatuses');
    expect(pageSource).not.toContain("{ label: '草稿', value: 'DRAFT' }");
  });

  it('列表按共享授权、主体和有效期组织信息', () => {
    expect(tableDefinitionSource).toContain("title: '共享授权'");
    expect(tableDefinitionSource).toContain("title: '被授权主体'");
    expect(tableDefinitionSource).toContain("title: '用途 / 有效期'");
    expect(pageSource).toContain('useVbenVxeGrid');
    expect(pageSource).toContain("height: 'auto'");
    expect(pageSource).toContain(
      ":table-title=\"deleted ? '已删除授权列表' : '共享授权列表'\"",
    );
  });

  it('主体从部门、用户或角色目录选择，不再手填稳定标识', () => {
    expect(modalSource).toContain('<TreeSelect');
    expect(modalSource).toContain('subjectOptions');
    expect(modalSource).toContain('loadSubjectReferences');
    expect(modalSource).not.toContain('placeholder="部门 ID"');
    expect(modalSource).not.toContain('用户 ID 或角色 ID/Key');
  });

  it('共享范围按资源类型和授权资源逐级选择', () => {
    expect(modalSource).toContain('label="资源类型"');
    expect(modalSource).toContain('label="授权资源"');
    expect(modalSource).toContain('grantResourceTypeTree');
  });

  it('创建窗口按对象、资源范围和有效期分区', () => {
    expect(modalSource).toContain('<Drawer');
    expect(modalSource).toContain('按共享授权顺序配置');
    expect(modalSource).toContain('授权对象与用途');
    expect(modalSource).toContain('共享资源范围');
    expect(modalSource).toContain('授权有效期');
    expect(modalSource).toContain('lg:grid-cols-[190px_minmax(0,1fr)]');
  });

  it('一条共享授权只绑定一个主体，多人使用角色归组', () => {
    expect(modalSource).toContain('每条授权只绑定一个主体');
    expect(modalSource).toContain('多人共享请先使用角色归组');
    expect(modalSource).not.toContain(
      'v-model:value="form.granteeId"\n                  mode="multiple"',
    );
    expect(modalSource).toContain('v-model:value="form.actionCodes"');
    expect(modalSource).toContain('mode="multiple"');
  });
});
