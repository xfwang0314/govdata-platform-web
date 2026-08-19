import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const drawerSource = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/platform/auth/policy/components/policy-drawer.vue',
  ),
  'utf8',
);

describe('策略角色主体候选契约', () => {
  it('角色主体使用系统角色接口实时拉取最新列表，与 options 元数据解耦', () => {
    expect(drawerSource).toContain(
      "import { roleList } from '#/api/system/role'",
    );
    expect(drawerSource).toContain('roleList({');
    expect(drawerSource).toContain('roles.value.map(');
    expect(drawerSource).not.toContain('options.value?.roleSubjects');
  });
});
