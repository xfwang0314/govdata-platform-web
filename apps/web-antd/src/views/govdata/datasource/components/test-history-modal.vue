<script setup lang="ts">
import type { ID } from '#/api/common';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getDataSourceOptionsApi,
  getDataSourceTestHistoryApi,
} from '#/api/govdata/datasource';

const datasourceId = ref<ID>();
const reasonLabels = ref<Record<string, string>>({});

function reasonLabel(code: string) {
  return reasonLabels.value[code] ?? code;
}

const [Grid, tableApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        field: 'occurredTime',
        formatter: ({ cellValue }) => cellValue?.replace('T', ' ') ?? '-',
        minWidth: 170,
        title: '执行时间',
      },
      {
        field: 'result',
        minWidth: 100,
        slots: { default: 'result' },
        title: '结果',
      },
      {
        field: 'reasonCode',
        minWidth: 190,
        slots: { default: 'reasonCode' },
        title: '失败原因',
      },
      {
        field: 'latencyMs',
        minWidth: 120,
        slots: { default: 'latencyMs' },
        title: '耗时',
      },
      {
        field: 'message',
        minWidth: 220,
        slots: { default: 'message' },
        title: '结果说明',
      },
    ],
    height: 450,
    pagerConfig: {},
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (datasourceId.value === undefined) return { rows: [], total: 0 };
          return await getDataSourceTestHistoryApi(datasourceId.value, {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
          });
        },
      },
    },
  },
});

const [Modal, modalApi] = useVbenModal({
  footer: false,
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { id } = modalApi.getData() as { id?: ID };
    datasourceId.value = id;
    const options = await getDataSourceOptionsApi();
    reasonLabels.value = Object.fromEntries(
      options.connectionTestReasons.map((item) => [
        String(item.value),
        item.label,
      ]),
    );
    tableApi.reload();
  },
  title: '连接测试历史',
});
</script>

<template>
  <Modal class="w-[850px]">
    <div class="px-2 pb-4 pt-1">
      <Grid>
        <template #result="{ row }">
          <span
            class="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium"
            :class="
              row.result === 'SUCCESS'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                : 'border-rose-200 bg-rose-50 text-rose-600'
            "
          >
            {{ row.result === 'SUCCESS' ? '成功' : '失败' }}
          </span>
        </template>

        <template #latencyMs="{ row }">
          <span
            class="font-mono text-sm font-semibold"
            :class="{
              'text-amber-500': row.latencyMs > 1000 && row.latencyMs <= 3000,
              'text-emerald-500': row.latencyMs <= 1000,
              'text-red-500': row.latencyMs > 3000,
            }"
          >
            {{ row.latencyMs }} ms
          </span>
        </template>

        <template #reasonCode="{ row }">
          <span :title="row.reasonCode">{{ reasonLabel(row.reasonCode) }}</span>
        </template>

        <template #message="{ row }">
          <div
            v-if="row.message"
            class="w-full truncate rounded bg-gray-50 p-1.5 text-xs text-gray-600"
            :title="row.message"
          >
            {{ row.message }}
          </div>
          <span v-else class="text-xs text-gray-400">{{ row.reasonCode }}</span>
        </template>
      </Grid>
    </div>
  </Modal>
</template>
