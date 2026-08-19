import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { getPopupContainer } from '@vben/utils';

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    componentProps: {
      placeholder: '输入名称、编码或业务标识',
    },
    fieldName: 'keyword',
    label: '资源搜索',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: [],
      placeholder: '全部分类',
    },
    fieldName: 'classification',
    label: '安全分类',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: [],
      placeholder: '全部状态',
    },
    fieldName: 'status',
    label: '投影状态',
  },
];

export const columns: VxeGridProps['columns'] = [
  {
    field: 'resourceName',
    minWidth: 240,
    slots: { default: 'resourceName' },
    title: '资源',
    treeNode: true,
  },
  {
    field: 'resourceContext',
    minWidth: 100,
    slots: { default: 'resourceContext' },
    title: '类型与来源',
  },
  {
    field: 'ownership',
    minWidth: 190,
    slots: { default: 'ownership' },
    title: '权属与路径',
  },
  {
    field: 'security',
    minWidth: 170,
    slots: { default: 'security' },
    title: '安全属性',
  },
  {
    field: 'status',
    minWidth: 90,
    slots: { default: 'status' },
    title: '投影状态',
  },
  {
    field: 'action',
    fixed: 'right',
    resizable: false,
    slots: { default: 'action' },
    title: '操作',
    width: 80,
  },
];
