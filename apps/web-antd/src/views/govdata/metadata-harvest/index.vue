<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ID } from '#/api/common';
import type { DataSourceView } from '#/api/govdata/datasource/model';
import type {
  HarvestOptionsView,
  HarvestPlanCommand,
  HarvestPlanView,
} from '#/api/govdata/metadata-harvest/model';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ArrowLeftOutlined } from '@antdv-next/icons';
import { Button, message, Modal, Space } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDataSourcePageApi } from '#/api/govdata/datasource';
import {
  deleteHarvestPlanApi,
  executeHarvestPlanApi,
  getHarvestOptionsApi,
  getHarvestPlanPageApi,
  updateHarvestPlanApi,
} from '#/api/govdata/metadata-harvest';
import ApiSwitch from '#/components/global/api-switch.vue';

import HarvestPlanRunsPanel from './components/harvest-plan-runs-panel.vue';
import HarvestPlanWorkspace from './components/harvest-plan-workspace.vue';
import HarvestSummaryCard from './components/harvest-summary-card.vue';
import { columns, querySchema, withOptions } from './data';

type WorkspaceMode = 'create' | 'edit' | 'view';
interface WorkspaceState {
  datasourceId?: ID;
  mode: WorkspaceMode;
  plan?: HarvestPlanView;
}

const route = useRoute();
const router = useRouter();
const workspace = ref<WorkspaceState>();
const runPlan = ref<HarvestPlanView>();
const options = ref<HarvestOptionsView>();
const datasources = ref<DataSourceView[]>([]);
const executingId = ref<string>();
const planTotal = ref(0);
const contextDatasourceId = computed<ID | undefined>(() => {
  const value = route.query.datasourceId;
  return typeof value === 'string' && value ? value : undefined;
});

const datasourceLabels = computed<Record<string, string>>(() =>
  Object.fromEntries(
    datasources.value.map((item) => [
      String(item.datasourceId),
      item.datasourceName,
    ]),
  ),
);
const contextDatasource = computed(() =>
  datasources.value.find(
    (item) => String(item.datasourceId) === String(contextDatasourceId.value),
  ),
);
const workspaceKey = computed(() =>
  workspace.value?.plan
    ? `${workspace.value.mode}-${workspace.value.plan.harvestPlanId}`
    : `${workspace.value?.mode}-${workspace.value?.datasourceId ?? 'new'}`,
);

const formOptions: VbenFormProps = {
  commonConfig: { componentProps: { allowClear: true }, labelWidth: 80 },
  schema: querySchema().filter(
    (item) => !contextDatasourceId.value || item.fieldName !== 'datasourceId',
  ),
  wrapperClass: contextDatasourceId.value
    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};
const gridOptions: VxeGridProps = {
  cellConfig: { height: 48 },
  columns: columns(!contextDatasourceId.value),
  headerAlign: 'center',
  headerCellConfig: { height: 44 },
  height: 'auto',
  pagerConfig: {},
  rowConfig: { keyField: 'harvestPlanId' },
  proxyConfig: {
    ajax: {
      query: async ({ page }, values = {}) => {
        const query = {
          ...values,
          pageNum: page.currentPage,
          pageSize: page.pageSize,
        };
        if (contextDatasourceId.value) {
          query.datasourceId = contextDatasourceId.value;
        }
        const result = await getHarvestPlanPageApi(query);
        planTotal.value = result.total;
        return result;
      },
    },
  },
};
const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function optionLabel(
  items: undefined | { label: string; value: string }[],
  value: string,
) {
  return items?.find((item) => item.value === value)?.label ?? value;
}

function datasourceName(id: ID) {
  return datasourceLabels.value[String(id)] ?? `数据源 ${id}`;
}

function openWorkspace(
  plan: HarvestPlanView | undefined,
  mode: WorkspaceMode,
  datasourceId?: ID,
) {
  workspace.value = { datasourceId, mode, plan };
}

function openRunRecords(plan: HarvestPlanView) {
  runPlan.value = plan;
}

async function closeWorkspace() {
  workspace.value = undefined;
  if (route.query.planId) {
    await router.replace({
      path: route.path,
      query: contextDatasourceId.value
        ? { datasourceId: String(contextDatasourceId.value) }
        : {},
    });
  }
  await gridApi.reload();
}

async function handleSaved() {
  workspace.value = undefined;
  await gridApi.reload();
}

function toPlanCommand(row: HarvestPlanView): HarvestPlanCommand {
  return {
    catalogName: row.catalogName ?? undefined,
    cronExpression: row.cronExpression ?? undefined,
    datasourceId: row.datasourceId,
    harvestPlanName: row.harvestPlanName,
    lockVersion: row.lockVersion,
    maxTableCount: row.maxTableCount,
    ownerDeptId: row.ownerDeptId,
    planStatus: row.planStatus,
    rawArchiveFlag: row.rawArchiveFlag,
    rules: row.rules.map(({ harvestRuleId: _id, ...rule }) => rule),
    scheduleType: row.scheduleType,
    schemaName: row.schemaName ?? undefined,
  };
}

async function handlePlanStatusChange(enabled: boolean, row: HarvestPlanView) {
  await updateHarvestPlanApi(row.harvestPlanId, {
    ...toPlanCommand(row),
    planStatus: enabled ? 'ACTIVE' : 'DISABLED',
  });
  await gridApi.reload();
}

async function execute(row: HarvestPlanView) {
  executingId.value = String(row.harvestPlanId);
  try {
    const run = await executeHarvestPlanApi(row.harvestPlanId);
    message.success(
      `采集结束：发现 ${run.discoveredTableCount} 张表，修订 ${run.changedTableCount} 张，失败 ${run.failedTableCount} 张`,
    );
    openRunRecords(row);
  } finally {
    executingId.value = undefined;
  }
}

function confirmRemove(row: HarvestPlanView) {
  Modal.confirm({
    content: '删除后将停止调度并移除该采集计划，历史运行记录不用于继续调度。',
    okButtonProps: { danger: true },
    okText: '确认删除',
    async onOk() {
      await deleteHarvestPlanApi(row.harvestPlanId);
      message.success('采集计划已删除');
      await gridApi.reload();
    },
    title: `删除“${row.harvestPlanName}”？`,
  });
}

async function returnToDatasourceManagement() {
  await router.push('/govdata/datasource');
}

onMounted(async () => {
  const [optionResult, datasourceResult] = await Promise.all([
    getHarvestOptionsApi(),
    getDataSourcePageApi({ pageNum: 1, pageSize: 1000 }),
  ]);
  options.value = optionResult;
  datasources.value = datasourceResult.rows;
  gridApi.formApi.updateSchema(
    withOptions(
      optionResult.scheduleTypes,
      optionResult.planStatuses,
      datasourceResult.rows.map((item) => ({
        label: item.datasourceName,
        value: String(item.datasourceId),
      })),
      !contextDatasourceId.value,
    ),
  );
});
</script>

<template>
  <Page
    auto-content-height
    class="gov-console-page"
    content-class="gov-console-page-content"
  >
    <div class="flex h-full min-h-0 flex-col gap-3">
      <HarvestSummaryCard
        :datasource-count="datasources.length"
        :datasource-name="contextDatasource?.datasourceName"
        :plan-count="planTotal"
      />
      <div class="gov-harvest-workspace">
        <Grid
          class="gov-harvest-grid"
          :table-title="
            contextDatasourceId
              ? `${contextDatasource?.datasourceName || '数据源'} · 采集计划`
              : '元数据采集'
          "
        >
          <template #toolbar-tools>
            <Space>
              <Button
                v-if="contextDatasourceId"
                @click="returnToDatasourceManagement"
              >
                <template #icon><ArrowLeftOutlined /></template>
                返回数据源管理
              </Button>
              <Button
                v-access:code="['govdata:metadata:harvest:add']"
                type="primary"
                @click="openWorkspace(undefined, 'create', contextDatasourceId)"
              >
                新建采集计划
              </Button>
            </Space>
          </template>

          <template #datasource="{ row }">
            <span
              class="block max-w-full truncate"
              :title="datasourceName(row.datasourceId)"
            >
              {{ datasourceName(row.datasourceId) }}
            </span>
          </template>

          <template #name="{ row }">
            <span class="gov-harvest-name">
              {{ row.harvestPlanName }}
            </span>
          </template>

          <template #code="{ row }">
            <span
              class="block max-w-full truncate"
              :title="row.harvestPlanCode"
            >
              {{ row.harvestPlanCode }}
            </span>
          </template>

          <template #scope="{ row }">
            <span>
              {{ row.catalogName || '全部数据库' }}
              <template v-if="row.schemaName"> / {{ row.schemaName }}</template>
            </span>
          </template>

          <template #schedule="{ row }">
            <div class="gov-harvest-schedule">
              <span>{{
                optionLabel(options?.scheduleTypes, row.scheduleType)
              }}</span>
              <span v-if="row.cronExpression" class="gov-harvest-muted">
                {{ row.cronExpression }}
              </span>
            </div>
          </template>

          <template #status="{ row }">
            <div class="flex items-center justify-center">
              <ApiSwitch
                :api="
                  (enabled) =>
                    handlePlanStatusChange(
                      Boolean(enabled),
                      row as HarvestPlanView,
                    )
                "
                :value="row.planStatus === 'ACTIVE'"
              />
            </div>
          </template>

          <template #action="{ row }">
            <div class="gov-harvest-actions">
              <Button
                v-access:code="['govdata:metadata:harvest:edit']"
                size="small"
                type="link"
                @click="openWorkspace(row as HarvestPlanView, 'edit')"
              >
                编辑
              </Button>
              <Button
                v-access:code="['govdata:metadata:harvest:execute']"
                :loading="executingId === String(row.harvestPlanId)"
                size="small"
                type="link"
                @click="execute(row as HarvestPlanView)"
              >
                立即采集
              </Button>
              <Button
                v-access:code="['govdata:metadata:harvest:run:list']"
                size="small"
                type="link"
                @click="openRunRecords(row as HarvestPlanView)"
              >
                运行记录
              </Button>
              <Button
                v-access:code="['govdata:metadata:harvest:remove']"
                danger
                size="small"
                type="link"
                @click="confirmRemove(row as HarvestPlanView)"
              >
                删除
              </Button>
            </div>
          </template>
        </Grid>
      </div>
    </div>

    <Modal
      :footer="null"
      :mask-closable="false"
      :open="Boolean(workspace)"
      :width="1000"
      centered
      destroy-on-close
      wrap-class-name="gov-harvest-plan-modal"
      @cancel="closeWorkspace"
    >
      <HarvestPlanWorkspace
        v-if="workspace"
        :key="workspaceKey"
        embedded
        :initial-datasource-id="workspace.datasourceId"
        :mode="workspace.mode"
        :plan="workspace.plan"
        @back="closeWorkspace"
        @saved="handleSaved"
      />
    </Modal>

    <Modal
      :footer="null"
      :mask-closable="false"
      :open="Boolean(runPlan)"
      :width="1180"
      centered
      destroy-on-close
      wrap-class-name="gov-harvest-runs-modal"
      @cancel="runPlan = undefined"
    >
      <section v-if="runPlan" class="gov-harvest-runs-workspace">
        <header class="gov-harvest-workspace-header">
          <div class="min-w-0">
            <h2 class="truncate text-lg font-semibold">运行记录</h2>
            <p class="mt-0.5 truncate text-xs text-muted-foreground">
              {{ runPlan.harvestPlanName }} · {{ runPlan.harvestPlanCode }}
            </p>
          </div>
        </header>
        <HarvestPlanRunsPanel
          :key="String(runPlan.harvestPlanId)"
          :plan="runPlan"
        />
      </section>
    </Modal>
  </Page>
</template>
