import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { getPopupContainer } from '@vben/utils';

/** 决策结果原因编码中文映射表 */
export const REASON_CODE_LABELS: Record<string, string> = {
  AUTHZ_ADMIN_BYPASS: '管理员管理动作直通',
  AUTHZ_DEFAULT_DENY: '默认拒绝(无匹配规则)',
  AUTHZ_EXPLICIT_DENY: '显式拒绝策略',
  AUTHZ_GRANT_PERMIT: '共享授权放行',
  AUTHZ_POLICY_AND_GRANT_PERMIT: '策略与授权同时放行',
  AUTHZ_POLICY_PERMIT: '策略放行',
  AUTHZ_PURPOSE_NOT_APPLICABLE: '访问目的不适用',
  AUTHZ_REQUEST_INVALID: '请求参数无效',
  AUTHZ_RESOURCE_DISABLED: '授权资源已停用',
  AUTHZ_RESOURCE_NOT_FOUND: '授权资源不存在',
  AUTHZ_RESOURCE_TYPE_MISMATCH: '资源类型不匹配',
  AUTHZ_TENANT_MISMATCH: '禁止跨租户访问',
  DEFAULT: '系统默认',
};

/** 主体类型中文兜底映射表 */
export const SUBJECT_TYPE_LABELS: Record<string, string> = {
  ANY: '任意主体',
  DEPARTMENT: '部门',
  HUMAN: '用户',
  ROLE: '角色',
  SERVICE: '服务账号',
  SERVICE_ACCOUNT: '服务账号',
  SUPER_ADMIN: '超级管理员',
  TENANT_ADMIN: '租户管理员',
};

/** 资源类型中文兜底映射表 */
export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  API_SERVICE: 'API接口',
  DATA_RESOURCE: '数据资源',
  DATA_SOURCE: '数据源',
};

/** 常用动作中文兜底映射表 */
export const ACTION_CODE_LABELS: Record<string, string> = {
  AUTHORIZE: '授权',
  DECRYPT_SECRET: '解密凭据',
  DELEGATE: '委托',
  DOWNLOAD: '下载',
  EXECUTE: '执行',
  EXPORT: '导出',
  MANAGE: '管理',
  QUERY: '查询',
  QUERY_DATA: '查询数据',
  READ: '读取',
  SHARE: '共享',
  USE_AS_SOURCE: '作为来源',
  USE_AS_TARGET: '作为目标',
  WRITE: '写入',
};

/** 常用用途中文兜底映射表 */
export const PURPOSE_CODE_LABELS: Record<string, string> = {
  AUDIT_CHECK: '审计核查',
  BUSINESS_DEV: '业务开发',
  DAILY_ANALYSIS: '日常分析',
  DATA_EXCHANGE: '数据交换',
  DEFAULT: '默认用途',
  REPORT_STAT: '统计报表',
};

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    componentProps: { placeholder: '输入链路标识 (Trace ID)' },
    fieldName: 'traceId',
    label: 'Trace ID',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      getPopupContainer,
      options: [],
      placeholder: '全部主体类型',
    },
    fieldName: 'subjectType',
    label: '主体类型',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      getPopupContainer,
      options: [],
      placeholder: '选择或搜索请求主体',
      showSearch: true,
    },
    fieldName: 'subjectId',
    label: '请求主体',
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
      options: [
        { label: '允许 (PERMIT)', value: 'PERMIT' },
        { label: '拒绝 (DENY)', value: 'DENY' },
      ],
      placeholder: '全部结果',
    },
    fieldName: 'decision',
    label: '决策结果',
  },
];

export const columns: VxeGridProps['columns'] = [
  {
    field: 'occurredTime',
    minWidth: 160,
    title: '决策时间',
  },
  {
    align: 'center',
    field: 'subject',
    headerAlign: 'center',
    minWidth: 180,
    slots: { default: 'subject' },
    title: '请求主体',
  },
  {
    field: 'resource',
    minWidth: 240,
    slots: { default: 'resource' },
    title: '目标资源',
  },
  {
    field: 'request',
    minWidth: 160,
    slots: { default: 'request' },
    title: '动作 / 用途',
  },
  {
    align: 'center',
    field: 'decision',
    headerAlign: 'center',
    minWidth: 190,
    slots: { default: 'decision' },
    title: '决策结果',
  },
  {
    field: 'trace',
    minWidth: 220,
    slots: { default: 'trace' },
    title: '链路 / 耗时',
  },
  {
    align: 'center',
    field: 'action',
    fixed: 'right',
    headerAlign: 'center',
    resizable: false,
    slots: { default: 'action' },
    title: '操作',
    width: 80,
  },
];
