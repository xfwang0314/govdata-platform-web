<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type {
  AuthzOptionsView,
  DecisionLogView,
} from '#/api/platform/auth/model';

import { onMounted, ref } from 'vue';

import { Button, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getAuthzOptionsApi,
  getDecisionLogsPageApi,
} from '#/api/platform/auth';

import {
  ACTION_CODE_LABELS,
  columns,
  PURPOSE_CODE_LABELS,
  querySchema,
  REASON_CODE_LABELS,
  RESOURCE_TYPE_LABELS,
  SUBJECT_TYPE_LABELS,
} from '../data';
import { useSubjectResolver } from '../use-subject-resolver';

const emit = defineEmits<{
  (e: 'detail', row: DecisionLogView): void;
}>();

const {
  getSubjectDisplayName,
  getSubjectSelectOptions,
  isResolvedToName,
  loadSubjectData,
} = useSubjectResolver();
const options = ref<AuthzOptionsView | null>(null);

const formOptions: VbenFormProps = {
  commonConfig: {
    componentProps: { allowClear: true },
    labelWidth: 80,
  },
  handleValuesChange: (values, fields) => {
    if (fields.includes('subjectType')) {
      const filteredOptions = getSubjectSelectOptions(values.subjectType);
      tableApi.formApi.updateSchema([
        {
          componentProps: { options: filteredOptions },
          fieldName: 'subjectId',
        },
      ]);
      tableApi.formApi.setValues({ subjectId: undefined });
    }
  },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

const gridOptions: VxeGridProps = {
  cellConfig: { height: 68 },
  columns,
  headerCellConfig: { height: 44 },
  height: 'auto',
  id: 'platform-auth-decision-log-table',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) =>
        await getDecisionLogsPageApi({
          decision: formValues.decision || undefined,
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          resourceCode: formValues.resourceCode || undefined,
          subjectId: formValues.subjectId || undefined,
          subjectType: formValues.subjectType || undefined,
          traceId: formValues.traceId || undefined,
        }),
    },
  },
  rowConfig: { keyField: 'decisionId' },
};

const [BasicTable, tableApi] = useVbenVxeGrid({ formOptions, gridOptions });

function subjectLabel(type?: string) {
  if (!type) return '-';
  const found = options.value?.subjectTypes.find((item) => item.value === type);
  return found?.label ?? SUBJECT_TYPE_LABELS[type] ?? type;
}

function subjectTagColor(type?: string) {
  switch (type) {
    case 'DEPARTMENT': {
      return 'cyan';
    }
    case 'HUMAN': {
      return 'blue';
    }
    case 'ROLE': {
      return 'purple';
    }
    case 'SUPER_ADMIN':
    case 'TENANT_ADMIN': {
      return 'red';
    }
    default: {
      return 'default';
    }
  }
}

function typeLabel(code?: string) {
  if (!code) return '-';
  const found = options.value?.resourceTypes.find(
    (item) => item.typeCode === code,
  );
  return found?.typeLabel ?? RESOURCE_TYPE_LABELS[code] ?? code;
}

function actionLabel(typeCode?: string, action?: string) {
  if (!action) return '-';
  if (typeCode && options.value?.resourceTypes) {
    const foundType = options.value.resourceTypes.find(
      (item) => item.typeCode === typeCode,
    );
    const foundAction = foundType?.actions.find(
      (item) => item.value === action,
    );
    if (foundAction?.label) {
      return foundAction.label;
    }
  }
  return ACTION_CODE_LABELS[action] ?? action;
}

function purposeLabel(typeCode?: string, purpose?: string) {
  if (!purpose) return '默认用途';
  if (typeCode && options.value?.resourceTypes) {
    const foundType = options.value.resourceTypes.find(
      (item) => item.typeCode === typeCode,
    );
    const foundPurpose = foundType?.purposes.find(
      (item) => item.value === purpose,
    );
    if (foundPurpose?.label) {
      return foundPurpose.label;
    }
  }
  return PURPOSE_CODE_LABELS[purpose] ?? purpose;
}

function decisionText(decision: 'DENY' | 'PERMIT') {
  return decision === 'PERMIT' ? '允许' : '拒绝';
}

function reasonLabel(reasonCode?: string) {
  if (!reasonCode) return '系统默认';
  return REASON_CODE_LABELS[reasonCode] ?? reasonCode;
}

function reload() {
  tableApi.reload();
}

onMounted(async () => {
  await loadSubjectData();
  const subjectGroups = getSubjectSelectOptions();
  if (subjectGroups.length > 0) {
    tableApi.formApi.updateSchema([
      {
        componentProps: { options: subjectGroups },
        fieldName: 'subjectId',
      },
    ]);
  }

  try {
    const authzOptions = await getAuthzOptionsApi();
    options.value = authzOptions;
    const schemaUpdates: Array<{
      componentProps: Record<string, unknown>;
      fieldName: string;
    }> = [];
    if (authzOptions.subjectTypes?.length) {
      schemaUpdates.push({
        componentProps: { options: authzOptions.subjectTypes },
        fieldName: 'subjectType',
      });
    }
    if (authzOptions.policyEffects?.length) {
      schemaUpdates.push({
        componentProps: { options: authzOptions.policyEffects },
        fieldName: 'decision',
      });
    }
    if (schemaUpdates.length > 0) {
      tableApi.formApi.updateSchema(schemaUpdates);
    }
  } catch {
    // 静默兜底
  }
});

defineExpose({ reload });
</script>

<template>
  <BasicTable table-title="授权决策审计">
    <!-- 请求主体（居中展示，显示中文名称） -->
    <template #subject="{ row }">
      <div
        class="flex flex-col items-center justify-center space-y-1 text-xs text-center"
      >
        <Tag
          class="!m-0 text-[11px] px-1.5 py-0.5"
          :color="subjectTagColor(row.subjectType)"
        >
          {{ subjectLabel(row.subjectType) }}
        </Tag>
        <div
          class="font-medium text-foreground truncate max-w-[160px] leading-tight"
          :title="`${subjectLabel(row.subjectType)}: ${getSubjectDisplayName(row.subjectType, row.subjectId)} (ID: ${row.subjectId})`"
        >
          {{ getSubjectDisplayName(row.subjectType, row.subjectId) }}
        </div>
        <div
          v-if="isResolvedToName(row.subjectType, row.subjectId)"
          class="font-mono text-[10px] text-muted-foreground truncate max-w-[150px] leading-none"
        >
          ID: {{ row.subjectId }}
        </div>
      </div>
    </template>

    <!-- 目标资源 -->
    <template #resource="{ row }">
      <div class="space-y-0.5 text-xs">
        <div class="font-medium text-foreground">
          {{ typeLabel(row.resourceType) }}
        </div>
        <div
          class="font-mono text-muted-foreground truncate"
          :title="row.resourceCode"
        >
          {{ row.resourceCode }}
        </div>
      </div>
    </template>

    <!-- 动作与用途 -->
    <template #request="{ row }">
      <div class="space-y-0.5 text-xs">
        <div>
          <Tag color="cyan">
            {{ actionLabel(row.resourceType, row.actionCode) }}
          </Tag>
        </div>
        <div
          class="text-[11px] text-muted-foreground truncate max-w-[150px]"
          :title="purposeLabel(row.resourceType, row.purpose)"
        >
          {{ purposeLabel(row.resourceType, row.purpose) }}
        </div>
      </div>
    </template>

    <!-- 决策结果（居中展示） -->
    <template #decision="{ row }">
      <div
        class="flex flex-col items-center justify-center space-y-1 text-xs text-center"
      >
        <Tag
          :color="row.decision === 'PERMIT' ? 'success' : 'error'"
          class="!m-0 font-medium px-2 py-0.5"
        >
          {{ decisionText(row.decision) }}
        </Tag>
        <div
          class="text-[11px] text-muted-foreground truncate max-w-[170px]"
          :title="reasonLabel(row.reasonCode)"
        >
          {{ reasonLabel(row.reasonCode) }}
        </div>
      </div>
    </template>

    <!-- 链路标识与耗时 -->
    <template #trace="{ row }">
      <div class="space-y-0.5 text-xs">
        <div
          class="font-mono text-muted-foreground truncate max-w-[200px]"
          :title="row.traceId"
        >
          {{ row.traceId }}
        </div>
        <div class="font-mono text-[11px] text-muted-foreground">
          耗时 <b class="text-foreground">{{ row.durationMs }}</b> ms
        </div>
      </div>
    </template>

    <!-- 操作 -->
    <template #action="{ row }">
      <Button size="small" type="link" @click="emit('detail', row as any)">
        详情
      </Button>
    </template>
  </BasicTable>
</template>
