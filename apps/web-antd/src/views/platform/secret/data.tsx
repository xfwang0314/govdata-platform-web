import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SecretOption } from '#/api/platform/secret/model';

export function querySchema(
  secretTypes: SecretOption[] = [],
  statuses: SecretOption[] = [],
  ownerModules: SecretOption[] = [],
): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入凭据名称' },
      fieldName: 'secretName',
      label: '凭据名称',
    },
    {
      component: 'Select',
      componentProps: { options: secretTypes, placeholder: '全部类型' },
      fieldName: 'secretType',
      label: '凭据类型',
    },
    {
      component: 'Select',
      componentProps: { options: ownerModules, placeholder: '全部模块' },
      fieldName: 'ownerModule',
      label: '所属模块',
    },
    {
      component: 'Select',
      componentProps: { options: statuses, placeholder: '全部状态' },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

export const columns: VxeGridProps['columns'] = [
  {
    align: 'center',
    title: '序号',
    type: 'seq',
    width: 60,
  },
  {
    align: 'left',
    field: 'secretName',
    minWidth: 240,
    slots: { default: 'secretName' },
    title: '凭据信息',
  },
  {
    field: 'secretType',
    minWidth: 130,
    slots: { default: 'secretType' },
    title: '类型',
  },
  {
    field: 'ownerModule',
    minWidth: 160,
    slots: { default: 'ownerModule' },
    title: '所属模块',
  },
  {
    field: 'purposeScope',
    minWidth: 230,
    slots: { default: 'purposeScope' },
    title: '用途范围',
  },
  {
    align: 'center',
    field: 'currentVersionNo',
    minWidth: 90,
    slots: { default: 'version' },
    title: '版本',
  },
  {
    align: 'center',
    field: 'status',
    minWidth: 125,
    slots: { default: 'status' },
    title: '状态',
  },
  {
    field: 'expireTime',
    minWidth: 170,
    slots: { default: 'expireTime' },
    title: '有效期',
  },
  {
    field: 'updateTime',
    minWidth: 165,
    title: '更新时间',
  },
  {
    field: 'action',
    fixed: 'right',
    resizable: false,
    slots: { default: 'action' },
    title: '操作',
    width: 180,
  },
];
