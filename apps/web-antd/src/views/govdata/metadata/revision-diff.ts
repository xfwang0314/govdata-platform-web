import type { ColumnDisplay } from './column-data';

import type { MetadataRevisionColumnView } from '#/api/govdata/metadata/model';

export interface RevisionDifference {
  key: string;
  columnId: string;
  columnName: string;
  changeType: 'ADDED' | 'CHANGED' | 'REMOVED';
  property: string;
  beforeValue: string;
  afterValue: string;
}
export function summaryText(raw: string) {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return '摘要不可用';
    const summary = value as Record<string, unknown>;
    const count = (key: string) =>
      typeof summary[key] === 'number' &&
      Number.isInteger(summary[key]) &&
      Number(summary[key]) >= 0
        ? Number(summary[key])
        : undefined;
    const added = count('addedColumns');
    const removed = count('removedColumns');
    const changed = count('changedColumns');
    if (summary.initial === true)
      return added === undefined ? '首次采集' : `首次采集 · ${added} 个字段`;
    if ([added, removed, changed].every((value) => value === undefined))
      return '暂无结构化摘要';
    const parts = [
      added ? `新增 ${added}` : '',
      removed ? `删除 ${removed}` : '',
      changed ? `变更 ${changed}` : '',
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : '表属性或注释调整';
  } catch {
    return '摘要不可用';
  }
}
function valueText(value: unknown): string {
  if (value === null || value === undefined) return '未提供';
  if (value === '') return '空字符串';
  if (typeof value === 'boolean') return value ? '是' : '否';
  return String(value);
}
export function revisionDefinition(column: MetadataRevisionColumnView) {
  const size =
    typeof column.lengthValue === 'number'
      ? `(${column.lengthValue})`
      : (typeof column.precisionValue === 'number'
        ? `(${column.precisionValue}${typeof column.scaleValue === 'number' ? `,${column.scaleValue}` : ''})`
        : '');
  return `${column.originalName} · ${column.dataType}${size} · ${column.nullableFlag ? '可空' : '非空'}${column.primaryKeyFlag ? ' · 主键' : ''}
默认值：${valueText(column.defaultExpression)}
说明：${valueText(column.commentText)}`;
}
export function compareRevisionColumns(
  beforeColumns: MetadataRevisionColumnView[],
  afterColumns: MetadataRevisionColumnView[],
): RevisionDifference[] {
  const beforeById = new Map(
    beforeColumns.map((column) => [String(column.columnAssetId), column]),
  );
  const afterById = new Map(
    afterColumns.map((column) => [String(column.columnAssetId), column]),
  );
  const differences: RevisionDifference[] = [];
  const properties: [keyof MetadataRevisionColumnView, string][] = [
    ['originalName', '列名'],
    ['dataType', '数据类型'],
    ['nativeType', '原生类型'],
    ['lengthValue', '长度'],
    ['precisionValue', '精度'],
    ['scaleValue', '小数位'],
    ['nullableFlag', '允许为空'],
    ['primaryKeyFlag', '主键'],
    ['defaultExpression', '默认值'],
    ['commentText', '字段说明'],
    ['ordinalPosition', '字段顺序'],
  ];
  for (const id of new Set([...beforeById.keys(), ...afterById.keys()])) {
    const after = afterById.get(id);
    const before = beforeById.get(id);
    if (!before && after)
      differences.push({
        key: `${id}:added`,
        columnId: id,
        columnName: after.originalName,
        changeType: 'ADDED',
        property: '字段定义',
        beforeValue: '—',
        afterValue: revisionDefinition(after),
      });
    else if (before && !after)
      differences.push({
        key: `${id}:removed`,
        columnId: id,
        columnName: before.originalName,
        changeType: 'REMOVED',
        property: '字段定义',
        beforeValue: revisionDefinition(before),
        afterValue: '—',
      });
    else if (before && after)
      for (const [property, label] of properties) {
        if (before[property] !== after[property])
          differences.push({
            key: `${id}:${property}`,
            columnId: id,
            columnName: after.originalName,
            changeType: 'CHANGED',
            property: label,
            beforeValue: valueText(before[property]),
            afterValue: valueText(after[property]),
          });
      }
  }
  return differences;
}
export function revisionDisplayColumns(
  columns: MetadataRevisionColumnView[],
): ColumnDisplay[] {
  return columns.map((column) => ({
    assetId: column.columnAssetId,
    originalName: column.originalName,
    displayName: null,
    ordinalPosition: column.ordinalPosition,
    dataType: column.dataType,
    lengthValue: column.lengthValue,
    precisionValue: column.precisionValue,
    scaleValue: column.scaleValue,
    nullableFlag: column.nullableFlag,
    primaryKeyFlag: column.primaryKeyFlag,
    defaultExpression: column.defaultExpression,
    commentText: column.commentText,
  }));
}
