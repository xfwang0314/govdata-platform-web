<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ID } from '#/api/common';
import type { DataSourceView } from '#/api/govdata/datasource/model';

import { onMounted, ref } from 'vue';

import { Button, message, Popconfirm, Space, Tag } from 'antdv-next';

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
    e: 'loaded',
    payload: {
      connectorCategories: string[];
      connectorLabels: Record<string, string>;
    },
  ): void;
  (e: 'viewHistory', row: DataSourceView): void;
  (e: 'viewMetadata', row: DataSourceView): void;
}>();

const optionLabels = ref<Record<string, string>>({});
const connectorLabels = ref<Record<string, string>>({});
const reconcilingAuthorization = ref(false);

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

function optionLabel(value?: string) {
  return value ? (optionLabels.value[value] ?? value) : '-';
}

function handleAdd() {
  emit('add');
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
  emit('loaded', {
    connectorCategories: connectors.map((item) => item.category),
    connectorLabels: connectorLabels.value,
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
  <Grid class="min-h-0 flex-1 overflow-hidden" table-title="数据源目录">
    <template #toolbar-tools>
      <Space>
        <Button
          v-access:code="['govdata:datasource:edit']"
          :loading="reconcilingAuthorization"
          @click="handleReconcileAuthorization"
        >
          同步授权资源
        </Button>
        <Button type="primary" @click="handleAdd">新建数据源</Button>
      </Space>
    </template>

    <template #datasourceName="{ row }">
      <div class="flex min-w-0 flex-col gap-1 py-1">
        <span class="truncate font-medium">{{ row.datasourceName }}</span>
        <span class="truncate font-mono text-xs text-muted-foreground">
          {{ row.datasourceCode }}
        </span>
      </div>
    </template>

    <template #connectorCode="{ row }">
      <Tag :bordered="false" color="blue">
        {{ connectorLabels[row.connectorCode] ?? row.connectorCode }}
      </Tag>
    </template>

    <template #environment="{ row }">
      <Tag :color="row.environment === 'PROD' ? 'volcano' : 'default'">
        {{ optionLabel(row.environment) }}
      </Tag>
    </template>

    <template #status="{ row }">
      <div class="flex items-center gap-2">
        <ApiSwitch
          :api="(enabled) => handleStatusChange(Boolean(enabled), row)"
          :value="row.status === 'ACTIVE'"
        />
        <span class="text-xs text-muted-foreground">
          {{ optionLabel(row.status) }}
        </span>
      </div>
    </template>

    <template #lastTestStatus="{ row }">
      <div class="flex flex-col items-start gap-1">
        <Tag
          :bordered="false"
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
        <span v-if="row.lastTestTime" class="text-xs text-muted-foreground">
          {{ row.lastTestTime.replace('T', ' ') }}
        </span>
      </div>
    </template>

    <template #action="{ row }">
      <Space :size="2">
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
</template>
