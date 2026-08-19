import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { getPopupContainer } from '@vben/utils';

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    componentProps: { placeholder: '输入编码、主体或来源' },
    fieldName: 'keyword',
    label: '授权搜索',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: [],
      placeholder: '全部来源类型',
    },
    fieldName: 'sourceType',
    label: '来源类型',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: [],
      placeholder: '全部主体类型',
    },
    fieldName: 'granteeType',
    label: '主体类型',
  },
  {
    component: 'TreeSelect',
    componentProps: {
      allowClear: true,
      getPopupContainer,
      placeholder: '全部用途',
      showSearch: true,
      treeData: [],
      treeDefaultExpandAll: true,
      treeNodeFilterProp: 'label',
    },
    fieldName: 'purpose',
    label: '授权用途',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: [],
      placeholder: '全部状态',
    },
    fieldName: 'status',
    label: '授权状态',
  },
];

export const columns: VxeGridProps['columns'] = [
  {
    field: 'grant',
    minWidth: 220,
    slots: { default: 'grant' },
    title: '共享授权',
  },
  {
    field: 'grantee',
    minWidth: 200,
    slots: { default: 'grantee' },
    title: '被授权主体',
  },
  {
    align: 'center',
    field: 'validity',
    minWidth: 240,
    slots: { default: 'validity' },
    title: '用途 / 有效期',
  },
  {
    field: 'status',
    minWidth: 100,
    slots: { default: 'status' },
    title: '授权状态',
  },
  {
    field: 'action',
    fixed: 'right',
    resizable: false,
    slots: { default: 'action' },
    title: '操作',
    width: 200,
  },
];
