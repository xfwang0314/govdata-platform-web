import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { OptionView } from '#/api/govdata/metadata-harvest/model';

import { getPopupContainer } from '@vben/utils';

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Select',
    componentProps: { getPopupContainer, options: [] },
    fieldName: 'runStatus',
    label: '运行状态',
  },
];

export function withStatuses(statuses: OptionView[]) {
  return querySchema().map((item) =>
    item.fieldName === 'runStatus'
      ? { ...item, componentProps: { getPopupContainer, options: statuses } }
      : item,
  );
}

export const columns: VxeGridProps['columns'] = [
  {
    field: 'harvestRunNo',
    minWidth: 180,
    slots: { default: 'number' },
    title: '运行流水号',
  },
  {
    field: 'triggerType',
    slots: { default: 'trigger' },
    title: '触发方式',
    width: 100,
  },
  {
    field: 'runStatus',
    slots: { default: 'status' },
    title: '执行状态',
    width: 110,
  },
  {
    field: 'progress',
    slots: { default: 'progress' },
    title: '发现 / 失败',
    width: 180,
  },
  {
    field: 'changedTableCount',
    slots: { default: 'changed' },
    title: '产生修订',
    width: 110,
  },
  {
    field: 'startedTime',
    title: '启动时间',
    width: 165,
  },
  {
    field: 'completedTime',
    title: '完成时间',
    width: 165,
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 160,
  },
];
