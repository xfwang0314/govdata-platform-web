<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { ResourceNavigationFilter } from '../resource-navigation';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ID } from '#/api/common';
import type {
  AuthzOptionsView,
  ResourceDescriptor,
} from '#/api/platform/auth/model';

import { MenuUnfoldOutlined } from '@antdv-next/icons';
import { Button, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getResourcePageApi } from '#/api/platform/auth';

import { columns, querySchema } from '../data';

const props = defineProps<{
  activeNavigationLabel: string;
  departmentLabels: Record<string, string>;
  navigationFilter: ResourceNavigationFilter;
  options?: AuthzOptionsView | null;
  resourceDirectoryOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'openDirectory'): void;
  (e: 'resetNavigation'): void;
  (e: 'viewDetail', row: ResourceDescriptor): void;
}>();

const formOptions: VbenFormProps = {
  commonConfig: {
    componentProps: { allowClear: true },
    labelWidth: 80,
  },
  handleReset: async () => {
    emit('resetNavigation');
    const { formApi, reload } = tableApi;
    await formApi.resetForm();
    const formValues = formApi.form.values;
    formApi.setLatestSubmissionValues(formValues);
    await reload(formValues);
  },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

const gridOptions: VxeGridProps = {
  cellConfig: { height: 56 },
  columns,
  headerCellConfig: { height: 46 },
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return getResourcePageApi({
          ...formValues,
          ...props.navigationFilter,
          keyword: formValues.keyword || undefined,
          pageNum: page.currentPage,
          pageSize: page.pageSize,
        });
      },
    },
  },
  rowConfig: { keyField: 'resourceId' },
  treeConfig: {
    parentField: 'parentId',
    rowField: 'resourceId',
    transform: true,
  },
  id: 'platform-auth-resource-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({ formOptions, gridOptions });

function expandAllTree() {
  tableApi.grid?.setAllTreeExpand?.(true);
}

function collapseAllTree() {
  tableApi.grid?.clearTreeExpand?.();
}

function typeLabel(code: string) {
  return (
    props.options?.resourceTypes.find((item) => item.typeCode === code)
      ?.typeLabel ?? code
  );
}

function moduleLabel(code: string) {
  return (
    props.options?.resourceModules.find((item) => item.value === code)?.label ??
    code
  );
}

function classificationLabel(code?: string) {
  return (
    props.options?.classifications.find((item) => item.value === code)?.label ??
    code ??
    '-'
  );
}

function securityLevelLabel(level?: number) {
  if (level === undefined || level === null) return '-';
  return (
    props.options?.securityLevels.find(
      (item) => String(item.value) === String(level),
    )?.label ?? `安全等级 ${level}`
  );
}

function ownerDepartmentLabel(ownerDeptId?: ID) {
  if (ownerDeptId === undefined || ownerDeptId === null) return '-';
  return props.departmentLabels[String(ownerDeptId)] ?? '未知部门';
}

function statusLabel(code: string) {
  return (
    props.options?.resourceStatuses.find((item) => item.value === code)
      ?.label ?? code
  );
}

function statusColor(status: ResourceDescriptor['status']) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'DISABLED') return 'warning';
  return 'default';
}

function updateFormSchema(options: AuthzOptionsView) {
  tableApi.formApi.updateSchema([
    {
      componentProps: { options: options.classifications },
      fieldName: 'classification',
    },
    {
      componentProps: { options: options.resourceStatuses },
      fieldName: 'status',
    },
  ]);
}

function reload() {
  tableApi.reload();
}

function submitForm() {
  void tableApi.formApi.submitForm();
}

defineExpose({
  reload,
  submitForm,
  updateFormSchema,
});
</script>

<template>
  <BasicTable
    class="min-h-0 min-w-0 flex-1 overflow-hidden"
    :table-title="activeNavigationLabel"
  >
    <template #toolbar-tools>
      <div class="flex items-center gap-2">
        <Button
          v-if="!resourceDirectoryOpen"
          size="small"
          @click="emit('openDirectory')"
        >
          <template #icon><MenuUnfoldOutlined /></template>
          资源目录
        </Button>

        <Button size="small" @click="expandAllTree"> 全部展开 </Button>
        <Button size="small" @click="collapseAllTree"> 全部折叠 </Button>
      </div>
    </template>

    <template #resourceName="{ row }">
      <button
        class="group flex max-w-full flex-col items-start gap-1 text-left"
        type="button"
        @click="emit('viewDetail', row)"
      >
        <span
          class="max-w-full truncate font-medium text-foreground transition-colors group-hover:text-primary"
        >
          {{ row.resourceName }}
        </span>
        <span
          class="max-w-full truncate font-mono text-xs text-muted-foreground"
        >
          {{ row.resourceCode }}
        </span>
      </button>
    </template>

    <template #resourceContext="{ row }">
      <div class="flex flex-col gap-1 items-center w-full">
        <Tag :bordered="false" color="blue">
          {{ typeLabel(row.resourceType) }}
        </Tag>
        <span class="text-xs text-muted-foreground">
          {{ moduleLabel(row.sourceModule) }}
        </span>
      </div>
    </template>

    <template #ownership="{ row }">
      <div class="flex max-w-full flex-col gap-1">
        <span class="truncate text-sm">
          {{ ownerDepartmentLabel(row.ownerDeptId) }}
        </span>
        <span
          v-if="row.resourcePath"
          class="truncate text-xs text-muted-foreground"
          :title="row.resourcePath"
        >
          {{ row.resourcePath }}
        </span>
      </div>
    </template>

    <template #security="{ row }">
      <div class="flex flex-wrap items-center gap-1.5">
        <Tag>{{ classificationLabel(row.classification) }}</Tag>
        <Tag color="geekblue">
          {{ securityLevelLabel(row.securityLevel) }}
        </Tag>
      </div>
    </template>

    <template #status="{ row }">
      <Tag :color="statusColor(row.status)">
        {{ statusLabel(row.status) }}
      </Tag>
    </template>

    <template #action="{ row }">
      <Button size="small" type="link" @click="emit('viewDetail', row)">
        查看
      </Button>
    </template>
  </BasicTable>
</template>
