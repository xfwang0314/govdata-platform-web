import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(
    process.cwd(),
    'apps/web-antd/src/views/govdata/datasource/components/datasource-modal.vue',
  ),
  'utf8',
);

describe('数据源表单分组布局契约', () => {
  it('分组标题占满表单网格整行且不保留空标签列', () => {
    const shared = readFileSync(
      resolve(
        process.cwd(),
        'apps/web-antd/src/components/govdata/console-form.ts',
      ),
      'utf8',
    );
    expect(source).toContain('...consoleFormConfig()');
    expect(shared).toContain("formItemClass: 'col-span-full'");
    expect(shared).toContain('hideLabel: true');
    expect(source).not.toContain("class: 'col-span-full mb-1'");
  });

  it('连接目标只能由 Connector 模板生成并只读展示', () => {
    expect(source).toContain("fieldName: 'connectionTargetPreview'");
    expect(source).toContain('readonly: true');
    expect(source).toContain('descriptor?.connectionPreview');
    expect(source).toContain('preview.template');
    expect(source).not.toContain("fieldName: 'jdbcUrl'");
    expect(source).not.toContain('jdbcUrlTemplate');
  });

  it('编辑时使用详情快照中的乐观锁版本号', () => {
    expect(source).toContain('const editLockVersion = ref<number>();');
    expect(source).toContain('editLockVersion.value = record.lockVersion');
    expect(source).toContain(
      'lockVersion: isUpdate.value ? editLockVersion.value : undefined',
    );
    expect(source).not.toContain(
      'lockVersion: isUpdate.value ? values.lockVersion : undefined',
    );
  });

  it('适配后端选项类型和组件 change 事件后再回显', () => {
    expect(source).toContain(
      'securityLevels: normalizeSecurityLevelOptions(optionData.securityLevels)',
    );
    expect(source).toContain(
      'refreshConnectionPreview(field.code, unwrapFormChangeValue(value))',
    );
  });

  it('数字字段使用 Connector 声明的范围而不是固定端口范围', () => {
    expect(source).toContain('min: field.minValue ?? undefined');
    expect(source).toContain('max: field.maxValue ?? undefined');
    expect(source).not.toContain('max: 65_535');
  });

  it('仅在 Connector 声明支持时展示自定义连接属性', () => {
    expect(source).toContain('descriptor?.customPropertiesSupported');
  });

  it('redis 等多认证 Connector 可以切换认证方式并按详情回显', () => {
    expect(source).toContain('disabled: authProfiles.length <= 1');
    expect(source).toContain('handleAuthProfileChange(value)');
    expect(source).toContain('record.authProfileCode');
  });

  it('加载全部可用凭据但禁用与当前认证方式不匹配的凭据', () => {
    expect(source).toContain('await getSecretReferencesApi(connectorCode)');
    expect(source).toContain(
      'disabled: item.secretType !== selectedProfile?.secretType',
    );
    expect(source).toContain('不匹配当前认证方式');
  });
});
