<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ID } from '#/api/common';
import type { DataSourceView } from '#/api/govdata/datasource/model';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DownOutlined, PlusOutlined } from '@antdv-next/icons';
import { Button, Dropdown, message, Modal, Space } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDataSourceApi,
  disableDataSourceApi,
  enableDataSourceApi,
  getConnectorsApi,
  getDataSourceOptionsApi,
  getDataSourcePageApi,
  reconcileDataSourceAuthorizationProjectionsApi,
  testDataSourceConnectionApi,
} from '#/api/govdata/datasource';
import ApiSwitch from '#/components/global/api-switch.vue';

import { columns, querySchema } from '../data';

const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'edit', row: DataSourceView): void;
  (
    e: 'summaryChange',
    summary: {
      connectorCategoriesCount: number;
      connectorCount: number;
    },
  ): void;
  (e: 'viewHistory', row: DataSourceView): void;
  (e: 'viewMetadata', row: DataSourceView): void;
}>();

const optionLabels = ref<Record<string, string>>({});
const connectorLabels = ref<Record<string, string>>({});
const reconcilingAuthorization = ref(false);
const testingDatasourceId = ref<ID>();
const router = useRouter();

const formOptions: VbenFormProps = {
  commonConfig: { componentProps: { allowClear: true }, labelWidth: 80 },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

const gridOptions: VxeGridProps = {
  cellConfig: { height: 48 },
  columns,
  headerAlign: 'center',
  headerCellConfig: { height: 44 },
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) =>
        await getDataSourcePageApi({
          ...formValues,
          pageNum: page.currentPage,
          pageSize: page.pageSize,
        }),
    },
  },
  rowConfig: { keyField: 'datasourceId' },
};

const [Grid, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
  showSearchForm: true,
});

function optionLabel(value?: string) {
  return value ? (optionLabels.value[value] ?? value) : '-';
}

function handleEdit(row: DataSourceView) {
  emit('edit', row);
}

function handleViewHistory(row: DataSourceView) {
  emit('viewHistory', row);
}

function handleViewMetadata(row: DataSourceView) {
  emit('viewMetadata', row);
}

function handleHarvestManagement(row: DataSourceView) {
  router.push({
    path: '/govdata/metadata-harvest',
    query: { datasourceId: String(row.datasourceId) },
  });
}

async function handleReconcileAuthorization() {
  reconcilingAuthorization.value = true;
  let afterId: ID = 0;
  let processed = 0;
  try {
    while (true) {
      const result = await reconcileDataSourceAuthorizationProjectionsApi(
        afterId,
        500,
      );
      processed += result.processed;
      if (!result.hasMore) {
        break;
      }
      if (
        result.nextAfterId === null ||
        String(result.nextAfterId) === String(afterId)
      ) {
        message.error('授权资源同步游标异常，请联系管理员检查服务日志');
        return;
      }
      afterId = result.nextAfterId;
    }
    message.success(`授权资源同步完成，共处理 ${processed} 个数据源`);
    await tableApi.reload();
  } finally {
    reconcilingAuthorization.value = false;
  }
}

async function handleDelete(row: DataSourceView) {
  if (row.status !== 'DISABLED') {
    message.warning('请先停用数据源，再执行删除');
    return;
  }
  await deleteDataSourceApi(row.datasourceId);
  message.success('数据源已删除');
  await tableApi.reload();
}

async function handleStatusChange(enabled: boolean, row: DataSourceView) {
  await (enabled
    ? enableDataSourceApi(row.datasourceId)
    : disableDataSourceApi(row.datasourceId));
  await tableApi.reload();
}

async function handleTest(row: DataSourceView) {
  testingDatasourceId.value = row.datasourceId;
  message.loading({ content: '正在测试连接…', key: 'datasource-test' });
  try {
    const result = await testDataSourceConnectionApi(row.datasourceId);
    if (result.result === 'SUCCESS') {
      message.success({
        content: `连接成功，耗时 ${result.latencyMs} ms`,
        key: 'datasource-test',
      });
    } else {
      message.error({
        content: `连接失败：${result.message || result.reasonCode}`,
        duration: 6,
        key: 'datasource-test',
      });
    }
    await tableApi.reload();
  } catch {
    message.destroy('datasource-test');
  } finally {
    testingDatasourceId.value = undefined;
  }
}

function confirmDelete(row: DataSourceView) {
  Modal.confirm({
    content: '删除后将无法继续采集或查询该数据源。',
    okButtonProps: { danger: true },
    okText: '确认删除',
    onOk: () => handleDelete(row),
    title: `删除“${row.datasourceName}”？`,
  });
}

function handleMoreAction(action: string, row: DataSourceView) {
  if (action === 'metadata') handleViewMetadata(row);
  if (action === 'history') handleViewHistory(row);
  if (action === 'delete') confirmDelete(row);
}

function reload() {
  tableApi.reload();
}

defineExpose({
  reload,
});

onMounted(async () => {
  const [connectors, options] = await Promise.all([
    getConnectorsApi(),
    getDataSourceOptionsApi(),
  ]);
  const labels: Record<string, string> = {};
  for (const item of [
    ...options.environments,
    ...options.statuses,
    ...options.testStatuses,
  ]) {
    labels[String(item.value)] = item.label;
  }
  optionLabels.value = labels;
  connectorLabels.value = Object.fromEntries(
    connectors.map((item) => [item.connectorCode, item.connectorName]),
  );
  emit('summaryChange', {
    connectorCategoriesCount: new Set(
      connectors.map((item) => item.category).filter(Boolean),
    ).size,
    connectorCount: connectors.length,
  });
  tableApi.formApi.updateSchema([
    {
      componentProps: {
        options: connectors.map((item) => ({
          label: item.connectorName,
          value: item.connectorCode,
        })),
      },
      fieldName: 'connectorCode',
    },
    { componentProps: { options: options.statuses }, fieldName: 'status' },
  ]);
});
</script>

<template>
  <Grid class="min-h-0 flex-1 overflow-hidden" table-title="数据源列表">
    <template #toolbar-tools>
      <Space>
        <Button type="primary" @click="emit('add')">
          <template #icon><PlusOutlined /></template>
          新建数据源
        </Button>
        <Button
          v-access:code="['govdata:datasource:edit']"
          :loading="reconcilingAuthorization"
          @click="handleReconcileAuthorization"
        >
          同步授权资源
        </Button>
      </Space>
    </template>

    <template #datasourceName="{ row }">
      <button
        class="max-w-full truncate hover:text-primary"
        type="button"
        @click="handleEdit(row)"
      >
        {{ row.datasourceName }}
      </button>
    </template>

    <template #datasourceCode="{ row }">
      <span class="block max-w-full truncate" :title="row.datasourceCode">
        {{ row.datasourceCode }}
      </span>
    </template>

    <template #connectorCode="{ row }">
      <span>
        {{ connectorLabels[row.connectorCode] ?? row.connectorCode }}
      </span>
    </template>

    <template #environment="{ row }">
      <span>
        {{ optionLabel(row.environment) }}
      </span>
    </template>

    <template #connectionTarget="{ row }">
      <span
        class="block max-w-full truncate"
        :title="row.endpointConfig.connectionTarget || '-'"
      >
        {{ row.endpointConfig.connectionTarget || '—' }}
      </span>
    </template>

    <template #status="{ row }">
      <div class="flex items-center justify-center">
        <ApiSwitch
          :api="(enabled) => handleStatusChange(Boolean(enabled), row)"
          :value="row.status === 'ACTIVE'"
        />
      </div>
    </template>

    <template #lastTestStatus="{ row }">
      <div class="flex items-center justify-center gap-2 whitespace-nowrap">
        <span class="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            class="size-1.5 rounded-full"
            :style="{
              backgroundColor:
                row.lastTestStatus === 'SUCCESS'
                  ? 'hsl(var(--success))'
                  : row.lastTestStatus === 'FAILED'
                    ? 'hsl(var(--destructive))'
                    : 'hsl(var(--muted-foreground) / 55%)',
            }"
          ></span>
          <span>{{ optionLabel(row.lastTestStatus) }}</span>
        </span>
        <span>
          {{ row.lastTestTime?.replace('T', ' ') || '—' }}
        </span>
      </div>
    </template>

    <template #action="{ row }">
      <div class="flex items-center justify-center gap-1">
        <Button size="small" type="link" @click="handleEdit(row)">
          编辑
        </Button>
        <Button
          :loading="String(testingDatasourceId) === String(row.datasourceId)"
          :disabled="
            testingDatasourceId !== undefined &&
            String(testingDatasourceId) !== String(row.datasourceId)
          "
          size="small"
          type="link"
          @click="handleTest(row)"
        >
          测试连接
        </Button>
        <Button
          v-access:code="['govdata:metadata:harvest:list']"
          size="small"
          type="link"
          @click="handleHarvestManagement(row)"
        >
          采集管理
        </Button>
        <Dropdown
          placement="bottomRight"
          :trigger="['click']"
          :menu="{
            items: [
              { key: 'metadata', label: '查看元数据' },
              { key: 'history', label: '测试历史' },
              { type: 'divider' },
              {
                danger: true,
                disabled: row.status !== 'DISABLED',
                key: 'delete',
                label: '删除数据源',
              },
            ],
            onClick: ({ key }) => handleMoreAction(String(key), row),
          }"
        >
          <Button size="small" type="text">
            更多
            <DownOutlined class="text-[10px]" />
          </Button>
        </Dropdown>
      </div>
    </template>
  </Grid>
</template>
