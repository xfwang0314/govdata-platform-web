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

describe('aBAC 策略部门树与条件宏契约', () => {
  it('部门选择器显式映射部门树字段，父部门可以展开子部门', () => {
    expect(drawerSource).toContain('const departmentTreeFieldNames');
    expect(drawerSource).toContain("children: 'children'");
    expect(drawerSource).toContain("label: 'label'");
    expect(drawerSource).toContain("value: 'id'");
    expect(
      drawerSource.match(/:field-names="departmentTreeFieldNames"/g)?.length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('统一策略组包含常用部门条件快捷预设及自定义部门选择弹窗', () => {
    expect(drawerSource).toContain('const DEPT_PRESETS');
    expect(drawerSource).toContain('applyDeptPreset');
    expect(drawerSource).toContain('deptPickerVisible');
    expect(drawerSource).toContain('confirmDeptPicker');
    expect(drawerSource).toContain('⚡ 套用部门条件');
    expect(drawerSource).not.toContain('form.creationSource');
  });
});
