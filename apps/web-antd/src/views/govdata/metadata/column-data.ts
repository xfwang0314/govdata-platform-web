import type { MetadataColumnView } from '#/api/govdata/metadata/model';

export type ColumnDisplay = Pick<
  MetadataColumnView,
  | 'assetId'
  | 'commentText'
  | 'dataType'
  | 'defaultExpression'
  | 'displayName'
  | 'lengthValue'
  | 'nullableFlag'
  | 'ordinalPosition'
  | 'originalName'
  | 'precisionValue'
  | 'primaryKeyFlag'
  | 'scaleValue'
>;

export const columnColumns = [
  {
    dataIndex: 'ordinalPosition',
    title: '#',
    width: 56,
    align: 'center' as const,
  },
  { dataIndex: 'originalName', title: '物理列名', width: 180 },
  { dataIndex: 'displayName', title: '字段名称', width: 160 },
  { dataIndex: 'dataType', title: '数据类型', width: 150 },
  { dataIndex: 'constraints', title: '约束', width: 130 },
  { dataIndex: 'commentText', title: '字段说明', ellipsis: true },
];

export function columnType(column: ColumnDisplay): string {
  const type = column.dataType || '未提供';
  if (typeof column.lengthValue === 'number')
    return `${type}(${column.lengthValue})`;
  if (typeof column.precisionValue === 'number') {
    const scale =
      typeof column.scaleValue === 'number' ? `,${column.scaleValue}` : '';
    return `${type}(${column.precisionValue}${scale})`;
  }
  return type;
}

export function filterColumns(columns: ColumnDisplay[], keyword: string) {
  const search = keyword.trim().toLocaleLowerCase();
  if (!search) return columns;
  return columns.filter((column) =>
    [
      column.originalName,
      column.displayName,
      column.commentText,
      column.dataType,
    ].some((value) => value?.toLocaleLowerCase().includes(search)),
  );
}
