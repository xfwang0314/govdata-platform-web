import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { getPopupContainer } from '@vben/utils';

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    componentProps: { placeholder: '输入链路标识' },
    fieldName: 'traceId',
    label: 'Trace ID',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '输入主体稳定标识' },
    fieldName: 'subjectId',
    label: '主体标识',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '输入资源稳定编码' },
    fieldName: 'resourceCode',
    label: '资源编码',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: [],
      placeholder: '全部结果',
    },
    fieldName: 'decision',
    label: '决策结果',
  },
];

export const columns: VxeGridProps['columns'] = [
  {
    field: 'occurredTime',
    minWidth: 170,
    title: '决策时间',
  },
  {
    field: 'subject',
    minWidth: 210,
    slots: { default: 'subject' },
    title: '请求主体',
  },
  {
    field: 'resource',
    minWidth: 300,
    slots: { default: 'resource' },
    title: '目标资源',
  },
  {
    field: 'request',
    minWidth: 190,
    slots: { default: 'request' },
    title: '动作 / 用途',
  },
  {
    field: 'decision',
    minWidth: 190,
    slots: { default: 'decision' },
    title: '决策结果',
  },
  {
    field: 'trace',
    minWidth: 250,
    slots: { default: 'trace' },
    title: '链路 / 耗时',
  },
  {
    field: 'action',
    fixed: 'right',
    resizable: false,
    slots: { default: 'action' },
    title: '操作',
    width: 90,
  },
];
