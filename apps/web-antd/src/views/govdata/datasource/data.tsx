import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { getPopupContainer } from '@vben/utils';

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    fieldName: 'datasourceCode',
    label: '数据源编码',
  },
  {
    component: 'Input',
    fieldName: 'datasourceName',
    label: '数据源名称',
  },
  {
    component: 'Select',
    fieldName: 'connectorCode',
    label: '连接器类型',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: [],
    },
    fieldName: 'status',
    label: '状态',
  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    field: 'datasourceName',
    title: '名称 / 编码',
    minWidth: 180,
    slots: { default: 'datasourceName' },
  },
  {
    field: 'connectorCode',
    title: '数据源类型',
    minWidth: 120,
    slots: { default: 'connectorCode' },
  },
  {
    field: 'environment',
    title: '环境',
    minWidth: 90,
    slots: { default: 'environment' },
  },
  {
    field: 'status',
    title: '状态',
    slots: { default: 'status' },
    minWidth: 100,
  },
  {
    field: 'lastTestStatus',
    title: '连通性测试',
    slots: { default: 'lastTestStatus' },
    minWidth: 140,
  },
  {
    field: 'createTime',
    title: '创建时间',
    minWidth: 160,
    formatter: ({ cellValue }) => cellValue?.replace('T', ' ') ?? '-',
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    resizable: false,
    width: 250,
  },
];
