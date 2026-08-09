<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { DataSourceView } from '#/api/govdata/datasource/model';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, message, Popconfirm, Space, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDataSourceApi,
  disableDataSourceApi,
  enableDataSourceApi,
  getConnectorsApi,
  getDataSourceOptionsApi,
  getDataSourcePageApi,
  testDataSourceConnectionApi,
} from '#/api/govdata/datasource';
import ApiSwitch from '#/components/global/api-switch.vue';

import DatasourceModal from './components/datasource-modal.vue';
import MetadataModal from './components/metadata-modal.vue';
import TestHistoryModal from './components/test-history-modal.vue';
import { columns, querySchema } from './data';

const [DatasourceModalComponent, datasourceModalApi] = useVbenModal({
  connectedComponent: DatasourceModal,
});
const [HistoryModal, historyModalApi] = useVbenModal({
  connectedComponent: TestHistoryModal,
});
const [MetadataModalComponent, metadataModalApi] = useVbenModal({
  connectedComponent: MetadataModal,
});
const optionLabels = ref<Record<string, string>>({});
const connectorLabels = ref<Record<string, string>>({});

const formOptions: VbenFormProps = {
  commonConfig: { componentProps: { allowClear: true }, labelWidth: 90 },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4',
};

const gridOptions: VxeGridProps = {
  checkboxConfig: { highlight: true, reserve: true, trigger: 'default' },
  columns,
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
};

const [Grid, tableApi] = useVbenVxeGrid({ formOptions, gridOptions });

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

function optionLabel(value?: string) {
  return value ? (optionLabels.value[value] ?? value) : '-';
}

function handleAdd() {
  datasourceModalApi.setData({});
  datasourceModalApi.open();
}

function handleEdit(row: DataSourceView) {
  datasourceModalApi.setData({ id: row.datasourceId });
  datasourceModalApi.open();
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
  }
}

function handleViewHistory(row: DataSourceView) {
  historyModalApi.setData({ id: row.datasourceId });
  historyModalApi.open();
}

function handleViewMetadata(row: DataSourceView) {
  metadataModalApi.setData({
    id: row.datasourceId,
    name: row.datasourceName,
  });
  metadataModalApi.open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button type="primary" @click="handleAdd">新建数据源</Button>
      </template>

      <template #datasourceName="{ row }">
        <div class="flex flex-col gap-1">
          <span class="font-medium">{{ row.datasourceName }}</span>
          <span class="font-mono text-xs text-muted-foreground">
            {{ row.datasourceCode }}
          </span>
        </div>
      </template>

      <template #connectorCode="{ row }">
        <Tag>{{ connectorLabels[row.connectorCode] ?? row.connectorCode }}</Tag>
      </template>

      <template #environment="{ row }">
        {{ optionLabel(row.environment) }}
      </template>

      <template #status="{ row }">
        <ApiSwitch
          :api="(enabled) => handleStatusChange(Boolean(enabled), row)"
          :value="row.status === 'ACTIVE'"
        />
      </template>

      <template #lastTestStatus="{ row }">
        <Tag
          :color="
            row.lastTestStatus === 'SUCCESS'
              ? 'success'
              : row.lastTestStatus === 'FAILED'
                ? 'error'
                : 'default'
          "
        >
          {{ optionLabel(row.lastTestStatus) }}
        </Tag>
        <div v-if="row.lastTestTime" class="mt-1 text-xs text-muted-foreground">
          {{ row.lastTestTime.replace('T', ' ') }}
        </div>
      </template>

      <template #action="{ row }">
        <Space :size="4">
          <Button size="small" type="link" @click="handleEdit(row)">
            编辑
          </Button>
          <Button size="small" type="link" @click="handleTest(row)">
            测试
          </Button>
          <Button size="small" type="link" @click="handleViewMetadata(row)">
            元数据
          </Button>
          <Button size="small" type="link" @click="handleViewHistory(row)">
            历史
          </Button>
          <Popconfirm
            placement="left"
            title="确定删除这个已停用的数据源吗？"
            @confirm="handleDelete(row)"
          >
            <Button
              danger
              :disabled="row.status !== 'DISABLED'"
              size="small"
              type="link"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      </template>
    </Grid>
    <DatasourceModalComponent @success="tableApi.reload()" />
    <HistoryModal />
    <MetadataModalComponent />
  </Page>
</template>
