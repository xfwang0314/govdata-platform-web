import { describe, expect, it } from 'vitest';

import {
  normalizeSecurityLevelOptions,
  unwrapFormChangeValue,
} from './datasource-form.utils';

describe('数据源表单值适配', () => {
  it('将后端安全等级字符串转换为与详情一致的数字', () => {
    expect(
      normalizeSecurityLevelOptions([
        { label: '安全等级 1', value: '1' },
        { label: '安全等级 2', value: '2' },
      ]),
    ).toEqual([
      { label: '安全等级 1', value: 1 },
      { label: '安全等级 2', value: 2 },
    ]);
  });

  it('从输入框 change 事件中提取服务名而不是对象字符串', () => {
    expect(unwrapFormChangeValue({ target: { value: 'ORCL' } })).toBe('ORCL');
    expect(
      String(unwrapFormChangeValue({ target: { value: 'ORCL' } })),
    ).not.toBe('[object Object]');
  });

  it('保留 Select、InputNumber 和 Switch 直接返回的原始值', () => {
    expect(unwrapFormChangeValue('https')).toBe('https');
    expect(unwrapFormChangeValue(3306)).toBe(3306);
    expect(unwrapFormChangeValue(true)).toBe(true);
  });
});
