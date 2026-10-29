<script setup lang="ts">
import type { HarvestRunView } from '#/api/govdata/metadata-harvest/model';

import { onMounted, ref } from 'vue';

import { ArrowLeftOutlined } from '@antdv-next/icons';
import {
  Button,
  Descriptions,
  DescriptionsItem,
  Empty,
  Table,
} from 'antdv-next';

import { getHarvestRunApi } from '#/api/govdata/metadata-harvest';

const props = defineProps<{ run: HarvestRunView }>();
const emit = defineEmits<{ back: [] }>();
const loading = ref(false);
const detail = ref<HarvestRunView>(props.run);

const failureColumns = [
  { dataIndex: 'failureScope', title: '范围', width: 100 },
  { dataIndex: 'objectKey', ellipsis: true, title: '对象定位键' },
  { dataIndex: 'failureCode', title: '错误编码', width: 180 },
  { dataIndex: 'failureSummary', ellipsis: true, title: '排查摘要' },
  { dataIndex: 'occurredTime', title: '发生时间', width: 170 },
];

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    ANOMALOUS: '异常完成',
    CANCELLED: '已取消',
    FAILED: '失败',
    PENDING: '等待执行',
    RUNNING: '执行中',
    SUCCESS: '成功',
  };
  return labels[value] ?? value;
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

onMounted(async () => {
  loading.value = true;
  try {
    detail.value = await getHarvestRunApi(props.run.harvestRunId);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-loading="loading" class="gov-harvest-detail">
    <header class="gov-harvest-detail__header">
      <div class="flex min-w-0 items-center gap-3">
        <Button type="text" @click="emit('back')">
          <template #icon><ArrowLeftOutlined /></template>
          返回运行记录
        </Button>
        <span class="gov-console-divider" aria-hidden="true"></span>
        <div class="min-w-0">
          <h3 class="truncate text-base font-semibold">
            {{ detail.harvestRunNo }}
          </h3>
          <p class="mt-0.5 text-xs text-muted-foreground">
            配置修订 ID：{{ detail.planRevisionId }}
          </p>
        </div>
      </div>
      <span
        class="gov-console-status"
        :data-tone="statusTone(detail.runStatus)"
      >
        <i class="gov-console-status__dot"></i>
        {{ statusLabel(detail.runStatus) }}
      </span>
    </header>

    <div class="gov-harvest-detail__body">
      <Descriptions bordered :column="2" size="small">
        <DescriptionsItem label="触发方式">
          {{ triggerLabel(detail.triggerType) }}
        </DescriptionsItem>
        <DescriptionsItem label="完整采集">
          {{ detail.completeRunFlag ? '是' : '否' }}
        </DescriptionsItem>
        <DescriptionsItem label="发现表数">
          {{ detail.discoveredTableCount }}
        </DescriptionsItem>
        <DescriptionsItem label="产生修订">
          {{ detail.changedTableCount }}
        </DescriptionsItem>
        <DescriptionsItem label="失败表数">
          {{ detail.failedTableCount }}
        </DescriptionsItem>
        <DescriptionsItem label="活动表基线">
          {{ detail.activeTableCount }}
        </DescriptionsItem>
        <DescriptionsItem label="候选消失表">
          {{ detail.missingCandidateCount }}
        </DescriptionsItem>
        <DescriptionsItem label="已标记消失">
          {{ detail.missingMarkedCount }}
        </DescriptionsItem>
        <DescriptionsItem label="缺失安全保护">
          {{ detail.missingSuppressedFlag ? '已暂停缺失生效' : '正常' }}
        </DescriptionsItem>
        <DescriptionsItem label="执行主体">
          {{ detail.actorType }} / {{ detail.actorId }}
        </DescriptionsItem>
        <DescriptionsItem label="开始时间">
          {{ detail.startedTime?.replace('T', ' ') }}
        </DescriptionsItem>
        <DescriptionsItem label="完成时间">
          {{ detail.completedTime?.replace('T', ' ') || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="Trace ID" :span="2">
          {{ detail.traceId || '—' }}
        </DescriptionsItem>
        <DescriptionsItem
          v-if="detail.failureSummary"
          label="运行摘要"
          :span="2"
        >
          {{ detail.failureCode ? `[${detail.failureCode}] ` : ''
          }}{{ detail.failureSummary }}
        </DescriptionsItem>
      </Descriptions>

      <section class="mt-5">
        <div class="gov-console-section-toolbar px-0">
          <div>
            <span class="gov-console-section-toolbar__title">失败明细</span>
            <span class="gov-console-section-toolbar__meta">
              · 共 {{ detail.failures.length }} 项
            </span>
          </div>
        </div>
        <Table
          v-if="detail.failures.length > 0"
          bordered
          :columns="failureColumns"
          :data-source="detail.failures"
          :pagination="false"
          row-key="runFailureId"
          size="small"
        />
        <Empty v-else description="本次运行没有失败明细" />
      </section>
    </div>
  </div>
</template>
