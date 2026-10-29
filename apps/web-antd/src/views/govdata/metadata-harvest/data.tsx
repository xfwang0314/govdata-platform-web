import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { OptionView } from '#/api/govdata/metadata-harvest/model';

import { getPopupContainer } from '@vben/utils';

export const querySchema: FormSchemaGetter = () => [
  { component: 'Input', fieldName: 'keyword', label: '计划名称' },
  {
    component: 'Select',
    componentProps: { getPopupContainer, options: [], showSearch: true },
    fieldName: 'datasourceId',
    label: '数据源',
  },
  {
    component: 'Select',
    componentProps: { getPopupContainer, options: [] },
    fieldName: 'scheduleType',
    label: '调度方式',
  },
  {
    component: 'Select',
    componentProps: { getPopupContainer, options: [] },
    fieldName: 'planStatus',
    label: '计划状态',
  },
];

export function withOptions(
  scheduleTypes: OptionView[],
  statuses: OptionView[],
  datasources: OptionView[] = [],
  includeDatasource = true,
) {
  return querySchema()
    .filter((item) => includeDatasource || item.fieldName !== 'datasourceId')
    .map((item) => {
      if (item.fieldName === 'datasourceId')
        return {
          ...item,
          componentProps: {
            getPopupContainer,
            options: datasources,
            showSearch: true,
          },
        };
      if (item.fieldName === 'scheduleType')
        return {
          ...item,
          componentProps: { getPopupContainer, options: scheduleTypes },
        };
      if (item.fieldName === 'planStatus')
        return {
          ...item,
          componentProps: { getPopupContainer, options: statuses },
        };
      return item;
    });
}

const planColumns: NonNullable<VxeGridProps['columns']> = [
  {
    field: 'datasourceId',
    minWidth: 170,
    slots: { default: 'datasource' },
    title: '数据源',
  },
  {
    field: 'harvestPlanName',
    minWidth: 170,
    slots: { default: 'name' },
    title: '计划名称',
  },
  {
    field: 'harvestPlanCode',
    minWidth: 160,
    slots: { default: 'code' },
    title: '计划编码',
  },
  {
    field: 'scope',
    slots: { default: 'scope' },
    title: '采集范围',
    width: 180,
  },
  {
    field: 'scheduleType',
    slots: { default: 'schedule' },
    title: '调度方式 / 周期',
    width: 145,
  },
  {
    align: 'center',
    field: 'planStatus',
    minWidth: 120,
    slots: { default: 'status' },
    title: '状态',
  },
  {
    field: 'updateTime',
    title: '最近更新时间',
    width: 165,
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 230,
  },
];

export function columns(includeDatasource = true) {
  return includeDatasource
    ? planColumns
    : planColumns.filter((column) => column.field !== 'datasourceId');
}
