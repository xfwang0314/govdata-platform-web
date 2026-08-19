import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { getPopupContainer } from '@vben/utils';

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    componentProps: { placeholder: '输入策略组名称或编码' },
    fieldName: 'keyword',
    label: '策略组',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: [],
      placeholder: '全部状态',
    },
    fieldName: 'status',
    label: '策略状态',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: [],
      placeholder: '全部风险',
    },
    fieldName: 'riskLevel',
    label: '风险等级',
  },
];

export const columns: VxeGridProps['columns'] = [
  {
    field: 'policyName',
    minWidth: 200,
    slots: { default: 'policyGroup' },
    title: '策略组',
  },
  {
    field: 'lifecycle',
    minWidth: 180,
    slots: { default: 'lifecycle' },
    title: '生命周期',
  },
  {
    field: 'scope',
    minWidth: 260,
    slots: { default: 'scope' },
    title: '授权范围',
  },
  {
    field: 'action',
    fixed: 'right',
    resizable: false,
    slots: { default: 'action' },
    title: '操作',
    width: 280,
  },
];
