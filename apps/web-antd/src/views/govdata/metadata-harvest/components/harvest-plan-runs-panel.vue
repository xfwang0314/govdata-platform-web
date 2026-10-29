<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type {
  HarvestPlanView,
  HarvestRunView,
  OptionView,
} from '#/api/govdata/metadata-harvest/model';

import { onMounted, ref } from 'vue';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getHarvestOptionsApi,
  getHarvestRunPageApi,
  retryHarvestRunApi,
} from '#/api/govdata/metadata-harvest';

import { columns, querySchema, withStatuses } from './harvest-plan-runs-data';
import HarvestRunDetail from './harvest-run-detail.vue';

const props = defineProps<{ plan: HarvestPlanView }>();
const statuses = ref<OptionView[]>([]);
const selectedRun = ref<HarvestRunView>();
const retryingId = ref<string>();

const formOptions: VbenFormProps = {
  commonConfig: { componentProps: { allowClear: true }, labelWidth: 80 },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};
const gridOptions: VxeGridProps = {
  cellConfig: { height: 48 },
  columns,
  headerAlign: 'center',
  headerCellConfig: { height: 44 },
  height: 'auto',
  pagerConfig: {},
  rowConfig: { keyField: 'harvestRunId' },
  proxyConfig: {
    ajax: {
      query: ({ page }, values = {}) =>
        getHarvestRunPageApi(props.plan.harvestPlanId, {
          ...values,
          pageNum: page.currentPage,
          pageSize: page.pageSize,
        }),
    },
  },
};
const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function statusLabel(value: string) {
  return statuses.value.find((item) => item.value === value)?.label ?? value;
}

function statusTone(value: string) {
  if (value === 'SUCCESS') return 'success';
  if (value === 'FAILED') return 'danger';
  if (value === 'RUNNING') return 'info';
  return 'warning';
}

function triggerLabel(value: string) {
  if (value === 'MANUAL') return '手工触发';
  if (value === 'CRON') return '定时调度';
  return '重新执行';
}

async function retry(row: HarvestRunView) {
  retryingId.value = String(row.harvestRunId);
  try {
    await retryHarvestRunApi(row.harvestRunId);
    message.success('已按当前采集配置重新执行');
    await gridApi.reload();
  } finally {
    retryingId.value = undefined;
  }
}

function reload() {
  selectedRun.value = undefined;
  return gridApi.reload();
}

defineExpose({ reload });

onMounted(async () => {
  const options = await getHarvestOptionsApi();
  statuses.value = options.runStatuses;
  gridApi.formApi.updateSchema(withStatuses(statuses.value));
});
</script>

<template>
  <HarvestRunDetail
    v-if="selectedRun"
    :key="String(selectedRun.harvestRunId)"
    :run="selectedRun"
    @back="selectedRun = undefined"
  />
  <Grid v-else class="gov-harvest-grid" table-title="运行记录">
    <template #number="{ row }">
      <button
        class="gov-harvest-name"
        type="button"
        @click="selectedRun = row as HarvestRunView"
      >
        {{ row.harvestRunNo }}
      </button>
    </template>
    <template #trigger="{ row }">
      <span>{{ triggerLabel(row.triggerType) }}</span>
    </template>
    <template #status="{ row }">
      <span class="gov-console-status" :data-tone="statusTone(row.runStatus)">
        <i class="gov-console-status__dot"></i>
        {{ statusLabel(row.runStatus) }}
      </span>
    </template>
    <template #progress="{ row }">
      <span>
        {{ row.discoveredTableCount }} 张发现 /
        {{ row.failedTableCount }} 张失败
      </span>
    </template>
    <template #changed="{ row }">
      <span>{{ row.changedTableCount }} 张表</span>
    </template>
    <template #action="{ row }">
      <div class="gov-harvest-actions">
        <Button
          v-access:code="['govdata:metadata:harvest:run:query']"
          size="small"
          type="link"
          @click="selectedRun = row as HarvestRunView"
        >
          查看详情
        </Button>
        <Button
          v-if="['ANOMALOUS', 'CANCELLED', 'FAILED'].includes(row.runStatus)"
          v-access:code="['govdata:metadata:harvest:execute']"
          :loading="retryingId === String(row.harvestRunId)"
          size="small"
          type="link"
          @click="retry(row as HarvestRunView)"
        >
          重新执行
        </Button>
      </div>
    </template>
  </Grid>
</template>
