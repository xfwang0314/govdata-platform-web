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
  {
    field: 'datasourceName',
    title: '数据源名称',
    minWidth: 160,
    slots: { default: 'datasourceName' },
  },
  {
    field: 'datasourceCode',
    title: '数据源编码',
    minWidth: 160,
    slots: { default: 'datasourceCode' },
  },
  {
    field: 'connectorCode',
    align: 'center',
    title: '数据源类型',
    minWidth: 130,
    slots: { default: 'connectorCode' },
  },
  {
    field: 'endpointConfig.connectionTarget',
    minWidth: 210,
    slots: { default: 'connectionTarget' },
    title: '连接目标',
  },
  {
    field: 'environment',
    align: 'center',
    title: '环境',
    minWidth: 100,
    slots: { default: 'environment' },
  },
  {
    field: 'status',
    align: 'center',
    title: '状态',
    slots: { default: 'status' },
    minWidth: 120,
  },
  {
    field: 'lastTestStatus',
    align: 'center',
    title: '连通性测试',
    slots: { default: 'lastTestStatus' },
    minWidth: 220,
  },
  {
    field: 'updateTime',
    align: 'center',
    title: '最近更新',
    minWidth: 160,
    formatter: ({ cellValue }) => cellValue?.replace('T', ' ') ?? '-',
  },
  {
    field: 'action',
    align: 'center',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    resizable: false,
    showOverflow: false,
    width: 280,
  },
];
