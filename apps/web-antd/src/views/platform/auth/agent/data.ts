import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { AgentTokenView, McpOptionsView } from '#/api/platform/mcp/model';

export const CATEGORY_THEMES: Record<
  string,
  { badge: string; color: string; desc: string; icon: string }
> = {
  DATASOURCE: {
    badge: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
    color: 'blue',
    desc: '外部数据库连接、表结构探测与安全数据查询',
    icon: 'lucide:database',
  },
  EXCHANGE: {
    badge:
      'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
    color: 'warning',
    desc: 'SeaTunnel 跨库批量交换与离线传输作业',
    icon: 'lucide:arrow-left-right',
  },
  METADATA: {
    badge:
      'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
    color: 'green',
    desc: '统一数据资产目录、分类分级与字段字典',
    icon: 'lucide:folder-tree',
  },
  ONTOLOGY: {
    badge: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800',
    color: 'magenta',
    desc: '政务领域业务实体、语义关系与图谱探查',
    icon: 'lucide:network',
  },
  QUALITY: {
    badge:
      'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-800',
    color: 'purple',
    desc: '数据质量规则校验、探查评分与异常巡检',
    icon: 'lucide:shield-check',
  },
  SHARING: {
    badge: 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-800',
    color: 'cyan',
    desc: '共享资源申请、跨委办局审批与授权发放',
    icon: 'lucide:share-2',
  },
  STANDARD: {
    badge:
      'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800',
    color: 'geekblue',
    desc: '政务数据标准代码集、元数据规范与映射表',
    icon: 'lucide:bookmark-check',
  },
};

export function querySchema(
  options?: McpOptionsView | null,
): VbenFormProps['schema'] {
  return [
    {
      component: 'Input',
      fieldName: 'agentName',
      label: 'Agent 名称',
      componentProps: {
        placeholder: '输入 Agent 名称搜索',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        allowClear: true,
        options: options?.statuses ?? [],
        placeholder: '全部状态',
      },
    },
  ];
}

export function createColumns(): VxeGridProps<AgentTokenView>['columns'] {
  return [
    { type: 'seq', width: 50, title: '序号' },
    {
      field: 'agentName',
      title: 'Agent 名称',
      minWidth: 150,
      slots: { default: 'agentName' },
    },
    {
      field: 'userName',
      title: '所属用户',
      width: 100,
      formatter: ({ row }) => row.userName || row.userId || '-',
    },
    {
      field: 'allowedCategories',
      title: '授权模块',
      width: 210,
      slots: { default: 'allowedCategories' },
    },
    {
      field: 'usedRequestsToday',
      title: '今日调用 / 配额',
      width: 145,
      slots: { default: 'quota' },
    },
    {
      field: 'status',
      title: '状态',
      width: 85,
      slots: { default: 'status' },
    },
    {
      field: 'expireTime',
      title: '过期时间',
      width: 110,
      formatter: ({ cellValue }) => cellValue || '长期有效',
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 160,
    },
    {
      title: '操作',
      width: 300,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ];
}
