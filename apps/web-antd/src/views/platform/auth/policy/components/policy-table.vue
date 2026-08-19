<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type {
  AuthzOptionsView,
  PolicyGroupView,
} from '#/api/platform/auth/model';

import { onMounted, ref, watch } from 'vue';

import { Button, message, Popconfirm, Space, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createPolicyGroupVersionApi,
  deletePolicyGroupApi,
  disablePolicyGroupApi,
  discardPolicyGroupDraftApi,
  enablePolicyGroupApi,
  getAuthzOptionsApi,
  getPolicyGroupPageApi,
  publishPolicyGroupApi,
  restorePolicyGroupApi,
} from '#/api/platform/auth';

import { columns, querySchema } from '../data';
import {
  canDeletePolicyGroup,
  canDeleteUnpublishedPolicy,
  canDisablePolicy,
  canEnablePolicy,
  canPublishPolicy,
  nextVersionNo,
  policyLifecycleAction,
  policyLifecycleSummary,
  policyPublishPrompt,
} from '../policy-lifecycle';

const props = withDefaults(
  defineProps<{
    deleted?: boolean;
  }>(),
  {
    deleted: false,
  },
);

const emit = defineEmits<{
  create: [];
  detail: [code: string];
  edit: [code: string];
  log: [row: PolicyGroupView];
}>();

const options = ref<AuthzOptionsView | null>(null);

const formOptions: VbenFormProps = {
  commonConfig: { componentProps: { allowClear: true }, labelWidth: 80 },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

const gridOptions: VxeGridProps = {
  cellConfig: { height: 68 },
  columns,
  headerCellConfig: { height: 44 },
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, values = {}) =>
        await getPolicyGroupPageApi({
          ...values,
          deleted: props.deleted,
          keyword: values.keyword || undefined,
          pageNum: page.currentPage,
          pageSize: page.pageSize,
        }),
    },
  },
  rowConfig: { keyField: 'policyGroupCode' },
  id: 'platform-auth-policy-group-index-v2',
};

const [BasicTable, tableApi] = useVbenVxeGrid({ formOptions, gridOptions });

function documentOf(row: PolicyGroupView) {
  return row.draftVersion?.document ?? row.currentVersion?.document;
}

function optionLabel(
  items: Array<{ label: string; value: string }> | undefined,
  value?: string,
) {
  return items?.find((item) => item.value === value)?.label ?? value ?? '-';
}

function subjectSummary(row: PolicyGroupView) {
  const items = documentOf(row)?.subjects.items ?? [];
  if (items.some((item) => item.subjectType === 'ANY')) return '所有主体';
  const grouped = new Map<string, number>();
  for (const item of items)
    grouped.set(item.subjectType, (grouped.get(item.subjectType) ?? 0) + 1);
  return (
    [...grouped.entries()]
      .map(
        ([type, count]) =>
          `${optionLabel(options.value?.subjectTypes, type)} ${count} 个`,
      )
      .join('、') || '-'
  );
}

function ruleSummary(row: PolicyGroupView) {
  const rules = documentOf(row)?.rules ?? [];
  const types = new Set(
    rules.map((item) =>
      optionLabel(
        options.value?.resourceTypes.map((type) => ({
          label: type.typeLabel,
          value: type.typeCode,
        })),
        item.resourceType,
      ),
    ),
  );
  return `${types.size} 类资源 · ${rules.length} 条规则`;
}

function actionSummary(row: PolicyGroupView) {
  const actions = new Set(
    (documentOf(row)?.rules ?? []).flatMap((item) => item.actions),
  );
  return `${actions.size} 个动作`;
}

async function reload() {
  await tableApi.reload();
}

async function createVersion(row: PolicyGroupView) {
  const versionNo = nextVersionNo(row);
  await createPolicyGroupVersionApi(row.policyGroupCode);
  message.success(`已创建 V${versionNo} 待发布版本`);
  await reload();
  emit('edit', row.policyGroupCode);
}

async function publish(row: PolicyGroupView) {
  await publishPolicyGroupApi(row.policyGroupCode);
  message.success(
    row.status === 'DISABLED'
      ? `V${row.draftVersionNo} 已发布，策略组已重新启用`
      : `V${row.draftVersionNo} 已发布并启用`,
  );
  await reload();
}

async function disable(row: PolicyGroupView) {
  await disablePolicyGroupApi(row.policyGroupCode);
  message.success('策略组已停用并退出运行时决策');
  await reload();
}

async function enable(row: PolicyGroupView) {
  await enablePolicyGroupApi(row.policyGroupCode);
  message.success('策略组已重新启用');
  await reload();
}

async function deleteUnpublished(row: PolicyGroupView) {
  await discardPolicyGroupDraftApi(row.policyGroupCode);
  message.success('未发布策略已移入已删除列表');
  await reload();
}

async function remove(row: PolicyGroupView) {
  await deletePolicyGroupApi(row.policyGroupCode, '管理员从策略组列表删除');
  message.success('策略组已移入已删除列表');
  await reload();
}

async function restore(row: PolicyGroupView) {
  await restorePolicyGroupApi(row.policyGroupCode);
  message.success('策略组已恢复为停用状态');
  await reload();
}

async function executePrimaryAction(row: PolicyGroupView) {
  const action = policyLifecycleAction(row);
  if (action?.kind === 'EDIT_PENDING') {
    emit('edit', row.policyGroupCode);
  } else if (action?.kind === 'CREATE_VERSION') {
    await createVersion(row);
  }
}

async function updateFormSchema() {
  options.value = await getAuthzOptionsApi();
  if (!options.value) return;
  tableApi.formApi.updateSchema([
    {
      componentProps: { options: options.value.policyStatuses },
      fieldName: 'status',
    },
    {
      componentProps: { options: options.value.policyRiskLevels },
      fieldName: 'riskLevel',
    },
  ]);
}

watch(() => props.deleted, reload);

onMounted(updateFormSchema);

defineExpose({ reload });
</script>

<template>
  <BasicTable :table-title="deleted ? '已删除策略组' : 'ABAC 策略组'">
    <template #toolbar-tools>
      <Button
        v-if="!deleted"
        v-access:code="['platform:auth:policy:add']"
        type="primary"
        @click="emit('create')"
      >
        新建策略组
      </Button>
    </template>

    <template #policyGroup="{ row }">
      <button
        class="min-w-0 text-left"
        type="button"
        @click="emit('detail', row.policyGroupCode)"
      >
        <span class="truncate font-medium hover:text-primary">{{
          row.policyName
        }}</span>
        <span
          class="mt-1 block truncate font-mono text-xs text-muted-foreground"
        >
          {{ row.policyGroupCode }}
        </span>
      </button>
    </template>

    <template #lifecycle="{ row }">
      <div class="space-y-1">
        <Space :size="4">
          <Tag
            :color="
              row.status === 'ACTIVE'
                ? 'success'
                : row.status === 'DISABLED'
                  ? 'warning'
                  : 'default'
            "
          >
            {{ optionLabel(options?.policyStatuses, row.status) }}
          </Tag>
          <Tag>
            {{ optionLabel(options?.policyRiskLevels, row.riskLevel) }}
          </Tag>
        </Space>
        <div class="text-xs text-muted-foreground">
          {{ policyLifecycleSummary(row) }}
        </div>
      </div>
    </template>

    <template #scope="{ row }">
      <div class="scope-cell">
        <div class="scope-row">
          <span class="scope-tag">主体</span>
          <span class="scope-val" :title="subjectSummary(row)">
            {{ subjectSummary(row) }}
          </span>
        </div>
        <div class="scope-row scope-sub">
          <span class="scope-label">资源</span>
          <span class="scope-val">{{ ruleSummary(row) }}</span>
          <span class="scope-dot">·</span>
          <span class="scope-label">动作</span>
          <span class="scope-val">{{ actionSummary(row) }}</span>
        </div>
      </div>
    </template>

    <template #action="{ row }">
      <Space :size="3" wrap class="lifecycle-actions">
        <action-button @click="emit('detail', row.policyGroupCode)">
          详情
        </action-button>
        <action-button @click="emit('log', row)">日志</action-button>
        <template v-if="!deleted">
          <Button
            v-if="policyLifecycleAction(row)"
            v-access:code="[
              'platform:auth:policy:edit',
              'platform:auth:policy:version',
            ]"
            size="small"
            type="primary"
            @click="executePrimaryAction(row)"
          >
            {{ policyLifecycleAction(row)?.label }}
          </Button>
          <Popconfirm
            v-if="canPublishPolicy(row)"
            :title="policyPublishPrompt(row)"
            @confirm="publish(row)"
          >
            <action-button v-access:code="['platform:auth:policy:publish']">
              发布 V{{ row.draftVersionNo }}
            </action-button>
          </Popconfirm>
          <Popconfirm
            v-if="canDisablePolicy(row)"
            title="停用后当前版本立即退出授权决策，确认停用？"
            @confirm="disable(row)"
          >
            <action-button v-access:code="['platform:auth:policy:disable']">
              停用 V{{ row.currentVersionNo }}
            </action-button>
          </Popconfirm>
          <Popconfirm
            v-if="canEnablePolicy(row)"
            title="确认让当前发布版本重新参与授权决策？"
            @confirm="enable(row)"
          >
            <action-button v-access:code="['platform:auth:policy:publish']">
              启用 V{{ row.currentVersionNo }}
            </action-button>
          </Popconfirm>
          <Popconfirm
            v-if="canDeleteUnpublishedPolicy(row)"
            title="该策略从未发布，删除后将进入已删除列表，确认继续？"
            @confirm="deleteUnpublished(row)"
          >
            <action-button v-access:code="['platform:auth:policy:edit']" danger>
              删除未发布策略
            </action-button>
          </Popconfirm>
          <Popconfirm
            v-if="canDeletePolicyGroup(row)"
            title="删除后可在“已删除策略”中恢复，确认删除？"
            @confirm="remove(row)"
          >
            <action-button
              v-access:code="['platform:auth:policy:remove']"
              danger
            >
              删除
            </action-button>
          </Popconfirm>
        </template>
        <Popconfirm
          v-else
          title="恢复后状态为停用，确认恢复？"
          @confirm="restore(row)"
        >
          <action-button v-access:code="['platform:auth:policy:remove']">
            恢复
          </action-button>
        </Popconfirm>
      </Space>
    </template>
  </BasicTable>
</template>

<style scoped>
.scope-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  font-size: 12px;
}

.scope-row {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.scope-tag {
  flex-shrink: 0;
  padding: 0 4px;
  font-size: 11px;
  line-height: 18px;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
  border-radius: 4px;
}

.scope-label {
  flex-shrink: 0;
  color: hsl(var(--muted-foreground));
}

.scope-val {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.scope-sub {
  font-size: 11px;
}

.scope-sub .scope-val {
  font-weight: normal;
  color: hsl(var(--muted-foreground));
}

.scope-dot {
  color: hsl(var(--muted-foreground));
  opacity: 0.5;
}
</style>
