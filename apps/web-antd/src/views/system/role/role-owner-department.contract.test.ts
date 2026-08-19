import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const dataSource = readFileSync(
  resolve(process.cwd(), 'apps/web-antd/src/views/system/role/data.tsx'),
  'utf8',
);
const drawerSource = readFileSync(
  resolve(process.cwd(), 'apps/web-antd/src/views/system/role/role-drawer.vue'),
  'utf8',
);
const modelSource = readFileSync(
  resolve(process.cwd(), 'apps/web-antd/src/api/system/role/model.d.ts'),
  'utf8',
);

describe('角色权属部门契约', () => {
  it('列表、编辑器和接口模型都使用明确的 ownerDeptId', () => {
    expect(modelSource).toContain('ownerDeptId: number');
    expect(dataSource).toContain("field: 'ownerDeptName'");
    expect(dataSource).toContain("fieldName: 'ownerDeptId'");
    expect(dataSource).toContain("rules: 'selectRequired'");
    expect(drawerSource).toContain('async function setupOwnerDeptSelect()');
    expect(drawerSource).toContain('await setupOwnerDeptSelect()');
    expect(modelSource).not.toContain('dataScope:');
    expect(dataSource).not.toContain("field: 'dataScope'");
  });
});
