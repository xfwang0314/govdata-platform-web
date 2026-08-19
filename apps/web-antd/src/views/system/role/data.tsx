import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';
import { getPopupContainer } from '@vben/utils';

import { Tag } from 'antdv-next';

import { getDictOptions } from '#/utils/dict';

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    fieldName: 'roleName',
    label: '角色名称',
  },
  {
    component: 'Input',
    fieldName: 'roleKey',
    label: '权限字符',
  },
  {
    component: 'Select',
    componentProps: {
      options: getDictOptions(DictEnum.SYS_NORMAL_DISABLE),
    },
    fieldName: 'status',
    label: '状态',
  },
  {
    component: 'RangePicker',
    fieldName: 'createTime',
    label: '创建时间',
  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '角色名称',
    field: 'roleName',
  },
  {
    title: '权限字符',
    field: 'roleKey',
    slots: {
      default: ({ row }) => {
        return <Tag color="processing">{row.roleKey}</Tag>;
      },
    },
  },
  {
    title: '权属部门',
    field: 'ownerDeptName',
  },
  {
    title: '排序',
    field: 'roleSort',
  },
  {
    title: '状态',
    field: 'status',
    slots: { default: 'status' },
  },
  {
    title: '创建时间',
    field: 'createTime',
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    resizable: false,
    width: 'auto',
  },
];

export const drawerSchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
    fieldName: 'roleId',
    label: '角色ID',
  },
  {
    component: 'Input',
    fieldName: 'roleName',
    label: '角色名称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'roleKey',
    help: '如: test simpleUser等',
    label: '权限标识',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'roleSort',
    label: '角色排序',
    rules: 'required',
    defaultValue: 1,
    componentProps: {
      rootClass: 'flex-1',
    },
  },
  {
    component: 'TreeSelect',
    componentProps: {
      getPopupContainer,
    },
    fieldName: 'ownerDeptId',
    label: '权属部门',
    rules: 'selectRequired',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: false,
      options: getDictOptions(DictEnum.SYS_NORMAL_DISABLE),
      getPopupContainer,
    },
    defaultValue: '0',
    fieldName: 'status',
    help: '修改后, 拥有该角色的用户将自动下线.',
    label: '角色状态',
    rules: 'required',
  },
  {
    component: 'Radio',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
    fieldName: 'menuCheckStrictly',
    label: '菜单权限',
  },
  {
    component: 'Input',
    defaultValue: [],
    fieldName: 'menuIds',
    label: '菜单权限',
    formItemClass: 'col-span-2',
  },
  {
    component: 'Textarea',
    defaultValue: '',
    fieldName: 'remark',
    formItemClass: 'col-span-2',
    label: '备注',
  },
];
