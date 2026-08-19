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

describe('abac 策略访问目的目录契约', () => {
  it('访问目的跟随当前资源类型，不直接绑定全局 Grant 用途', () => {
    expect(drawerSource).not.toContain(
      'const purposeOptions = computed(() => options.value?.grantPurposes ?? [])',
    );
    expect(drawerSource).toContain('purposeOptions(rule)');
    expect(drawerSource).not.toContain(':options="purposeOptions"');
  });
});
