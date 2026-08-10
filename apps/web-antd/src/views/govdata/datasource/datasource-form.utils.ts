import type { OptionView } from '#/api/govdata/datasource/model';

export function normalizeSecurityLevelOptions(
  options: OptionView[],
): OptionView[] {
  return options.map((option) => {
    const value = Number(option.value);
    if (!Number.isInteger(value)) {
      throw new TypeError(`无效的安全等级选项：${String(option.value)}`);
    }
    return { ...option, value };
  });
}

export function unwrapFormChangeValue(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || !('target' in value)) {
    return value;
  }
  const target = value.target;
  if (typeof target !== 'object' || target === null || !('value' in target)) {
    return value;
  }
  return target.value;
}
